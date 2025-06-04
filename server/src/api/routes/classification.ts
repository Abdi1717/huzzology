/**
 * Classification API Routes
 * 
 * Endpoints for content classification, archetype management,
 * and emerging trend detection
 */

import express from 'express';
import { ClassificationService } from '../../classification/ClassificationService';
import { InfluenceCalculator } from '../../classification/algorithms/InfluenceCalculator';
import { ClassifiableContent, ArchetypeNode } from '../../../../shared/src/types';
import logger from '../../utils/logger';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../database/schema';
import { isAuthenticated, isAdmin } from '../middleware/auth';

// Create router
const router = express.Router();
const log = logger.scope('API:Classification');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

// Create classification service instance
const classificationService = new ClassificationService(
  process.env.OPENAI_API_KEY,
  db
);

// Initialize influence calculator
const influenceCalculator = new InfluenceCalculator(db);

// Validation schemas
const classifyContentSchema = z.object({
  contents: z.array(
    z.object({
      id: z.string(),
      platform: z.enum(['tiktok', 'twitter', 'instagram', 'reddit']),
      text: z.string(),
      media_urls: z.array(z.string()).optional(),
      hashtags: z.array(z.string()).optional(),
      caption: z.string().optional(),
      timestamp: z.string(),
      creator: z
        .object({
          username: z.string(),
          follower_count: z.number().optional(),
        })
        .optional(),
      engagement_metrics: z
        .object({
          likes: z.number(),
          shares: z.number(),
          comments: z.number(),
        })
        .optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
});

const createArchetypeSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  keywords: z.array(z.string()),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  metadata: z.object({
    origin_date: z.string().optional(),
    peak_popularity: z.string().optional(),
    platforms: z.array(z.enum(['tiktok', 'twitter', 'instagram', 'reddit'])),
  }).optional(),
});

const updateArchetypeSchema = createArchetypeSchema.partial();

const archetypeRelationshipSchema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  relationship_type: z.enum([
    'parent', 
    'child', 
    'related', 
    'conflicting', 
    'evolved_from', 
    'evolved_to', 
    'similar', 
    'opposite', 
    'influenced_by', 
    'influences'
  ]),
  weight: z.number().min(0).max(1).optional(),
});

/**
 * @route POST /api/classification/classify
 * @desc Classify content items into archetypes
 * @access Private
 */
router.post(
  '/classify',
  isAuthenticated,
  validateRequest(classifyContentSchema),
  async (req, res) => {
    try {
      const { contents } = req.body;
      log.info(`Received ${contents.length} content items for classification`);
      
      // Process content through classification pipeline
      const result = await classificationService.processContent(contents);
      
      // Return classification results
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      log.error(`Classification error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Classification failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/classification/identify-trends
 * @desc Identify emerging trends and archetypes from content
 * @access Private (Admin)
 */
router.post(
  '/identify-trends',
  isAdmin,
  validateRequest(classifyContentSchema),
  async (req, res) => {
    try {
      const { contents } = req.body;
      log.info(`Analyzing ${contents.length} content items for emerging archetypes`);
      
      // Identify emerging archetypes
      const emergingArchetypes = await classificationService.identifyEmergingArchetypes(contents);
      
      // Return emerging archetypes
      return res.json({
        success: true,
        data: {
          emergingArchetypes,
          count: emergingArchetypes.length,
        },
      });
    } catch (error) {
      log.error(`Trend identification error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Trend identification failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route PUT /api/classification/update-influence
 * @desc Update influence scores for all archetypes
 * @access Private (Admin)
 */
router.put(
  '/update-influence',
  isAdmin,
  async (req, res) => {
    try {
      log.info('Updating influence scores for all archetypes');
      
      // Update influence scores
      await classificationService.updateInfluenceScores();
      
      return res.json({
        success: true,
        message: 'Influence scores updated successfully',
      });
    } catch (error) {
      log.error(`Influence update error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Influence score update failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/classification/archetypes
 * @desc Create a new archetype
 * @access Private (Admin)
 */
router.post(
  '/archetypes',
  isAdmin,
  validateRequest(createArchetypeSchema),
  async (req, res) => {
    try {
      const { name, description, keywords, color, metadata } = req.body;
      log.info(`Creating new archetype: ${name}`);
      
      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // Insert into database
      const newArchetype = await db
        .insert(schema.archetypes)
        .values({
          name,
          slug,
          description,
          keywords,
          color: color || '#888888',
          metadata: metadata || {},
          created_by: req.user?.id,
          updated_by: req.user?.id,
        })
        .returning();
      
      log.info(`Created archetype: ${newArchetype[0].id}`);
      
      return res.status(201).json({
        success: true,
        data: newArchetype[0],
      });
    } catch (error) {
      log.error(`Archetype creation error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to create archetype',
        message: error.message,
      });
    }
  }
);

/**
 * @route PUT /api/classification/archetypes/:id
 * @desc Update an existing archetype
 * @access Private (Admin)
 */
router.put(
  '/archetypes/:id',
  isAdmin,
  validateRequest(updateArchetypeSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      log.info(`Updating archetype: ${id}`);
      
      // Generate slug if name is provided
      if (updateData.name) {
        updateData.slug = updateData.name
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-');
      }
      
      // Add updated timestamp and user
      updateData.updated_at = new Date().toISOString();
      updateData.updated_by = req.user?.id;
      
      // Update in database
      const updatedArchetype = await db
        .update(schema.archetypes)
        .set(updateData)
        .where(({ id: archetypeId }) => archetypeId.equals(id))
        .returning();
      
      if (updatedArchetype.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Archetype not found',
        });
      }
      
      log.info(`Updated archetype: ${id}`);
      
      return res.json({
        success: true,
        data: updatedArchetype[0],
      });
    } catch (error) {
      log.error(`Archetype update error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to update archetype',
        message: error.message,
      });
    }
  }
);

/**
 * @route DELETE /api/classification/archetypes/:id
 * @desc Delete an archetype
 * @access Private (Admin)
 */
router.delete(
  '/archetypes/:id',
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      log.info(`Deleting archetype: ${id}`);
      
      // Delete from database
      const deletedArchetype = await db
        .delete(schema.archetypes)
        .where(({ id: archetypeId }) => archetypeId.equals(id))
        .returning();
      
      if (deletedArchetype.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Archetype not found',
        });
      }
      
      log.info(`Deleted archetype: ${id}`);
      
      return res.json({
        success: true,
        message: 'Archetype deleted successfully',
      });
    } catch (error) {
      log.error(`Archetype deletion error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete archetype',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /api/classification/archetypes
 * @desc Get all archetypes
 * @access Public
 */
router.get('/archetypes', async (req, res) => {
  try {
    log.info('Fetching all archetypes');
    
    // Query archetypes from database
    const archetypes = await db.select().from(schema.archetypes);
    
    // Map to ArchetypeNode type
    const archetypeNodes = await Promise.all(
      archetypes.map(async (archetype) => {
        // Get content examples
        const examples = await db
          .select()
          .from(schema.contentExamples)
          .where(({ archetype_id }) => archetype_id.equals(archetype.id))
          .limit(5);
        
        // Get relationships
        const relationships = await db
          .select()
          .from(schema.archetypeRelationships)
          .where(({ source_id }) => source_id.equals(archetype.id));
        
        // Map to ArchetypeNode format
        return {
          id: archetype.id,
          label: archetype.name,
          description: archetype.description || '',
          keywords: archetype.keywords || [],
          influences: relationships.map(r => r.target_id),
          examples: examples.map(e => ({
            platform: e.platform,
            url: e.url,
            caption: e.caption,
            timestamp: e.content_created_at || e.created_at,
            engagement_metrics: e.engagement_metrics || {},
            creator: e.creator_data || {},
          })),
          color: archetype.color || '#888888',
          metadata: {
            origin_date: archetype.origin_date,
            peak_popularity: archetype.peak_popularity_date,
            influence_score: Number(archetype.influence_score) || 0,
            platforms: (archetype.metadata?.platforms || []),
          },
        };
      })
    );
    
    return res.json({
      success: true,
      data: archetypeNodes,
    });
  } catch (error) {
    log.error(`Archetype fetch error: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch archetypes',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/classification/archetypes/:id
 * @desc Get a specific archetype by ID
 * @access Public
 */
router.get('/archetypes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    log.info(`Fetching archetype: ${id}`);
    
    // Query archetype from database
    const archetype = await db
      .select()
      .from(schema.archetypes)
      .where(({ id: archetypeId }) => archetypeId.equals(id));
    
    if (archetype.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Archetype not found',
      });
    }
    
    // Get content examples
    const examples = await db
      .select()
      .from(schema.contentExamples)
      .where(({ archetype_id }) => archetype_id.equals(id))
      .limit(10);
    
    // Get relationships
    const relationships = await db
      .select()
      .from(schema.archetypeRelationships)
      .where(({ source_id }) => source_id.equals(id));
    
    // Map to ArchetypeNode format
    const archetypeNode: ArchetypeNode = {
      id: archetype[0].id,
      label: archetype[0].name,
      description: archetype[0].description || '',
      keywords: archetype[0].keywords || [],
      influences: relationships.map(r => r.target_id),
      examples: examples.map(e => ({
        platform: e.platform,
        url: e.url,
        caption: e.caption,
        timestamp: e.content_created_at || e.created_at,
        engagement_metrics: e.engagement_metrics || {},
        creator: e.creator_data || {},
      })),
      color: archetype[0].color || '#888888',
      metadata: {
        origin_date: archetype[0].origin_date,
        peak_popularity: archetype[0].peak_popularity_date,
        influence_score: Number(archetype[0].influence_score) || 0,
        platforms: (archetype[0].metadata?.platforms || []),
      },
    };
    
    return res.json({
      success: true,
      data: archetypeNode,
    });
  } catch (error) {
    log.error(`Archetype fetch error: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch archetype',
      message: error.message,
    });
  }
});

/**
 * @route POST /api/classification/relationships
 * @desc Create a relationship between archetypes
 * @access Private (Admin)
 */
router.post(
  '/relationships',
  isAdmin,
  validateRequest(archetypeRelationshipSchema),
  async (req, res) => {
    try {
      const { source_id, target_id, relationship_type, weight } = req.body;
      log.info(`Creating relationship from ${source_id} to ${target_id}`);
      
      // Check if archetypes exist
      const sourceArchetype = await db
        .select()
        .from(schema.archetypes)
        .where(({ id }) => id.equals(source_id));
      
      const targetArchetype = await db
        .select()
        .from(schema.archetypes)
        .where(({ id }) => id.equals(target_id));
      
      if (sourceArchetype.length === 0 || targetArchetype.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'One or both archetypes not found',
        });
      }
      
      // Insert relationship
      const newRelationship = await db
        .insert(schema.archetypeRelationships)
        .values({
          source_id,
          target_id,
          relationship_type,
          weight: weight || 0.5,
          created_by: req.user?.id,
        })
        .returning();
      
      log.info(`Created relationship: ${newRelationship[0].id}`);
      
      return res.status(201).json({
        success: true,
        data: newRelationship[0],
      });
    } catch (error) {
      log.error(`Relationship creation error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to create relationship',
        message: error.message,
      });
    }
  }
);

/**
 * @route DELETE /api/classification/relationships/:id
 * @desc Delete a relationship
 * @access Private (Admin)
 */
router.delete(
  '/relationships/:id',
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      log.info(`Deleting relationship: ${id}`);
      
      // Delete from database
      const deletedRelationship = await db
        .delete(schema.archetypeRelationships)
        .where(({ id: relationshipId }) => relationshipId.equals(id))
        .returning();
      
      if (deletedRelationship.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Relationship not found',
        });
      }
      
      log.info(`Deleted relationship: ${id}`);
      
      return res.json({
        success: true,
        message: 'Relationship deleted successfully',
      });
    } catch (error) {
      log.error(`Relationship deletion error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete relationship',
        message: error.message,
      });
    }
  }
);

export default router; 