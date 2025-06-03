/**
 * Archetype API Routes - Handles archetype management, relationships, and graph traversal
 */

import { Router } from 'express';
import { ArchetypeService } from '../services/ArchetypeService';
import { 
  authenticateToken, 
  requireRole, 
  optionalAuth,
  validators,
  asyncHandler,
  rateLimit
} from '../middleware/index.js';
import type { 
  ArchetypeSearchQuery,
  NewArchetypeNode,
  NewArchetypeRelationship,
  RelationshipType
} from '../../../shared/src/types/database';

const router = Router();
const archetypeService = new ArchetypeService();

/**
 * @swagger
 * /api/archetypes/search:
 *   get:
 *     summary: Advanced archetype search
 *     description: Search for archetypes using various filters and criteria
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated list of statuses to filter by
 *       - in: query
 *         name: moderation_status
 *         schema:
 *           type: string
 *         description: Comma-separated list of moderation statuses
 *       - in: query
 *         name: min_popularity_score
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum popularity score
 *       - in: query
 *         name: min_influence_score
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum influence score
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter archetypes created after this date
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter archetypes created before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [popularity_score, influence_score, created_at, updated_at]
 *           default: popularity_score
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Archetype'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/search', 
  rateLimit.search,
  optionalAuth,
  validators.archetypeSearch,
  asyncHandler(async (req, res) => {
  try {
    const searchQuery: ArchetypeSearchQuery = {
      query: req.query.q as string,
      categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
      status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
      moderation_status: req.query.moderation_status ? (req.query.moderation_status as string).split(',') as any : undefined,
      min_popularity_score: req.query.min_popularity_score ? parseFloat(req.query.min_popularity_score as string) : undefined,
      min_influence_score: req.query.min_influence_score ? parseFloat(req.query.min_influence_score as string) : undefined,
      created_after: req.query.created_after ? new Date(req.query.created_after as string) : undefined,
      created_before: req.query.created_before ? new Date(req.query.created_before as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sort_by: req.query.sort_by as any || 'popularity_score',
      sort_order: req.query.sort_order as any || 'desc'
    };

    const result = await archetypeService.search(searchQuery);
    res.json({
      success: true,
      data: result,
      pagination: {
        limit: searchQuery.limit || 50,
        offset: searchQuery.offset || 0,
        total: result.length
      }
    });
  }));

/**
 * @swagger
 * /api/archetypes/trending:
 *   get:
 *     summary: Get trending archetypes
 *     description: Retrieve the most trending archetypes based on recent activity and engagement
 *     tags: [Archetypes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of trending archetypes to return
 *     responses:
 *       200:
 *         description: List of trending archetypes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Archetype'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const archetypes = await archetypeService.getTrending(limit);
    res.json(archetypes);
  } catch (error) {
    console.error('Error getting trending archetypes:', error);
    res.status(500).json({ error: 'Failed to get trending archetypes' });
  }
});

/**
 * @swagger
 * /api/archetypes/analytics:
 *   get:
 *     summary: Get archetype analytics
 *     description: Retrieve comprehensive analytics data for archetypes
 *     tags: [Archetypes]
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_archetypes:
 *                   type: integer
 *                   description: Total number of archetypes
 *                 active_archetypes:
 *                   type: integer
 *                   description: Number of active archetypes
 *                 trending_count:
 *                   type: integer
 *                   description: Number of trending archetypes
 *                 average_popularity:
 *                   type: number
 *                   format: float
 *                   description: Average popularity score
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       count:
 *                         type: integer
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await archetypeService.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error getting archetype analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * @swagger
 * /api/archetypes/refresh-views:
 *   post:
 *     summary: Refresh materialized views
 *     description: Refresh database materialized views for archetype analytics and performance
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Views refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Materialized views refreshed successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh-views', async (req, res) => {
  try {
    await archetypeService.refreshMaterializedViews();
    res.json({ message: 'Materialized views refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing materialized views:', error);
    res.status(500).json({ error: 'Failed to refresh materialized views' });
  }
});

/**
 * @swagger
 * /api/archetypes/{id}:
 *   get:
 *     summary: Get archetype by ID
 *     description: Retrieve a specific archetype by its unique identifier
 *     tags: [Archetypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the archetype
 *       - in: query
 *         name: include_stats
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include engagement and popularity statistics
 *     responses:
 *       200:
 *         description: Archetype details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Archetype'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const includeStats = req.query.include_stats === 'true';
    
    const archetype = await archetypeService.getById(id, includeStats);
    
    if (!archetype) {
      return res.status(404).json({ error: 'Archetype not found' });
    }
    
    res.json(archetype);
  } catch (error) {
    console.error('Error getting archetype:', error);
    res.status(500).json({ error: 'Failed to get archetype' });
  }
});

/**
 * @swagger
 * /api/archetypes/slug/{slug}:
 *   get:
 *     summary: Get archetype by slug
 *     description: Retrieve a specific archetype by its URL-friendly slug
 *     tags: [Archetypes]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: URL-friendly slug of the archetype
 *     responses:
 *       200:
 *         description: Archetype details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Archetype'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const archetype = await archetypeService.getBySlug(slug);
    
    if (!archetype) {
      return res.status(404).json({ error: 'Archetype not found' });
    }
    
    res.json(archetype);
  } catch (error) {
    console.error('Error getting archetype by slug:', error);
    res.status(500).json({ error: 'Failed to get archetype' });
  }
});

/**
 * @swagger
 * /api/archetypes:
 *   post:
 *     summary: Create new archetype
 *     description: Create a new archetype node in the system
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewArchetypeRequest'
 *     responses:
 *       201:
 *         description: Archetype created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Archetype'
 *                 message:
 *                   type: string
 *                   example: "Archetype created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', 
  rateLimit.modification,
  authenticateToken,
  requireRole(['curator', 'admin']),
  validators.archetypeCreate,
  asyncHandler(async (req, res) => {
  try {
    const archetypeData: NewArchetypeNode = req.body;
    
    // Basic validation
    if (!archetypeData.name || !archetypeData.slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }
    
    const archetype = await archetypeService.create(archetypeData);
    res.status(201).json({
      success: true,
      data: archetype,
      message: 'Archetype created successfully'
    });
  }));

/**
 * @swagger
 * /api/archetypes/{id}:
 *   put:
 *     summary: Update archetype
 *     description: Update an existing archetype's information
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the archetype to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateArchetypeRequest'
 *     responses:
 *       200:
 *         description: Archetype updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Archetype'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const archetype = await archetypeService.update(id, updates);
    
    if (!archetype) {
      return res.status(404).json({ error: 'Archetype not found' });
    }
    
    res.json(archetype);
  } catch (error) {
    console.error('Error updating archetype:', error);
    res.status(500).json({ error: 'Failed to update archetype' });
  }
});

/**
 * @swagger
 * /api/archetypes/{id}:
 *   delete:
 *     summary: Delete archetype
 *     description: Soft delete an archetype (marks as inactive rather than removing)
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the archetype to delete
 *     responses:
 *       200:
 *         description: Archetype deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Archetype deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await archetypeService.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Archetype not found' });
    }
    
    res.json({ message: 'Archetype deleted successfully' });
  } catch (error) {
    console.error('Error deleting archetype:', error);
    res.status(500).json({ error: 'Failed to delete archetype' });
  }
});

/**
 * @swagger
 * /api/archetypes/{id}/related:
 *   get:
 *     summary: Get related archetypes
 *     description: Retrieve archetypes related to the specified archetype through graph traversal
 *     tags: [Archetypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the archetype
 *       - in: query
 *         name: max_depth
 *         schema:
 *           type: integer
 *           default: 3
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum depth for graph traversal
 *       - in: query
 *         name: relationship_types
 *         schema:
 *           type: string
 *         description: Comma-separated list of relationship types to follow
 *       - in: query
 *         name: min_weight
 *         schema:
 *           type: number
 *           format: float
 *           default: 0.0
 *         description: Minimum relationship weight threshold
 *       - in: query
 *         name: include_stats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include statistics in the response
 *       - in: query
 *         name: limit_per_level
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of results per traversal level
 *     responses:
 *       200:
 *         description: Related archetypes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Archetype'
 *                 relationships:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ArchetypeRelationship'
 *                 depth:
 *                   type: integer
 *                   description: Maximum depth traversed
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    
    const options = {
      max_depth: req.query.max_depth ? parseInt(req.query.max_depth as string) : 3,
      relationship_types: req.query.relationship_types ? (req.query.relationship_types as string).split(',') as RelationshipType[] : undefined,
      min_weight: req.query.min_weight ? parseFloat(req.query.min_weight as string) : 0.0,
      include_stats: req.query.include_stats !== 'false',
      limit_per_level: req.query.limit_per_level ? parseInt(req.query.limit_per_level as string) : 10
    };
    
    const result = await archetypeService.getRelatedArchetypes(id, options);
    res.json(result);
  } catch (error) {
    console.error('Error getting related archetypes:', error);
    res.status(500).json({ error: 'Failed to get related archetypes' });
  }
});

/**
 * @swagger
 * /api/archetypes/{id}/relationships:
 *   get:
 *     summary: Get archetype relationships
 *     description: Retrieve all relationships for a specific archetype
 *     tags: [Archetypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the archetype
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [evolution, similarity, opposition, influence, subcategory, parent_category]
 *         description: Filter by specific relationship type
 *     responses:
 *       200:
 *         description: List of relationships
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArchetypeRelationship'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const relationshipType = req.query.type as RelationshipType;
    
    const relationships = await archetypeService.getRelationships(id, relationshipType);
    res.json(relationships);
  } catch (error) {
    console.error('Error getting archetype relationships:', error);
    res.status(500).json({ error: 'Failed to get relationships' });
  }
});

/**
 * @swagger
 * /api/archetypes/{id}/relationships:
 *   post:
 *     summary: Create relationship
 *     description: Create a new relationship between two archetypes
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Source archetype ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewRelationshipRequest'
 *     responses:
 *       201:
 *         description: Relationship created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArchetypeRelationship'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Relationship already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const relationshipData: NewArchetypeRelationship = {
      source_id: id,
      ...req.body
    };
    
    // Basic validation
    if (!relationshipData.target_id || !relationshipData.relationship_type) {
      return res.status(400).json({ error: 'Target ID and relationship type are required' });
    }
    
    const relationship = await archetypeService.createRelationship(relationshipData);
    res.status(201).json(relationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Relationship already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create relationship' });
    }
  }
});

/**
 * @swagger
 * /api/archetypes/relationships/{relationshipId}:
 *   put:
 *     summary: Update relationship
 *     description: Update an existing archetype relationship
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: relationshipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the relationship
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRelationshipRequest'
 *     responses:
 *       200:
 *         description: Relationship updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArchetypeRelationship'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/relationships/:relationshipId', async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const updates = req.body;
    
    const relationship = await archetypeService.updateRelationship(relationshipId, updates);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    res.json(relationship);
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ error: 'Failed to update relationship' });
  }
});

/**
 * @swagger
 * /api/archetypes/relationships/{relationshipId}:
 *   delete:
 *     summary: Delete relationship
 *     description: Delete an archetype relationship
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: relationshipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the relationship
 *     responses:
 *       200:
 *         description: Relationship deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Relationship deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/relationships/:relationshipId', async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const success = await archetypeService.deleteRelationship(relationshipId);
    
    if (!success) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

/**
 * @swagger
 * /api/archetypes/bulk/create:
 *   post:
 *     summary: Bulk create archetypes
 *     description: Create multiple archetypes in a single operation
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/NewArchetypeRequest'
 *             minItems: 1
 *             maxItems: 100
 *     responses:
 *       201:
 *         description: Archetypes created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Archetype'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/bulk/create', async (req, res) => {
  try {
    const archetypes: NewArchetypeNode[] = req.body;
    
    if (!Array.isArray(archetypes) || archetypes.length === 0) {
      return res.status(400).json({ error: 'Array of archetypes is required' });
    }
    
    const createdArchetypes = await archetypeService.bulkCreate(archetypes);
    res.status(201).json(createdArchetypes);
  } catch (error) {
    console.error('Error bulk creating archetypes:', error);
    res.status(500).json({ error: 'Failed to bulk create archetypes' });
  }
});

/**
 * @swagger
 * /api/archetypes/bulk/status:
 *   put:
 *     summary: Bulk update status
 *     description: Update the status of multiple archetypes
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of archetype IDs to update
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft, archived]
 *                 description: New status to apply
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Archetype'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!Array.isArray(ids) || !status) {
      return res.status(400).json({ error: 'Array of IDs and status are required' });
    }
    
    const updatedArchetypes = await archetypeService.bulkUpdateStatus(ids, status);
    res.json(updatedArchetypes);
  } catch (error) {
    console.error('Error bulk updating status:', error);
    res.status(500).json({ error: 'Failed to bulk update status' });
  }
});

/**
 * @swagger
 * /api/archetypes/bulk/moderation-status:
 *   put:
 *     summary: Bulk update moderation status
 *     description: Update the moderation status of multiple archetypes
 *     tags: [Archetypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - moderation_status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of archetype IDs to update
 *               moderation_status:
 *                 $ref: '#/components/schemas/ModerationStatus'
 *     responses:
 *       200:
 *         description: Moderation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Archetype'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/bulk/moderation-status', async (req, res) => {
  try {
    const { ids, moderation_status } = req.body;
    
    if (!Array.isArray(ids) || !moderation_status) {
      return res.status(400).json({ error: 'Array of IDs and moderation status are required' });
    }
    
    const updatedArchetypes = await archetypeService.bulkUpdateModerationStatus(ids, moderation_status);
    res.json(updatedArchetypes);
  } catch (error) {
    console.error('Error bulk updating moderation status:', error);
    res.status(500).json({ error: 'Failed to bulk update moderation status' });
  }
});

export default router; 