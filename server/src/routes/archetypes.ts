/**
 * Archetype routes for Huzzology API
 */

import { Router } from 'express';
import type { ArchetypeNode } from '@huzzology/shared';

const router = Router();

// Temporary in-memory storage (will be replaced with database)
const archetypes: ArchetypeNode[] = [];

// GET /api/archetypes - Get all archetypes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: archetypes,
    count: archetypes.length,
  });
});

// GET /api/archetypes/:id - Get specific archetype
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const archetype = archetypes.find((a) => a.id === id);
  
  if (!archetype) {
    return res.status(404).json({
      success: false,
      error: 'Archetype not found',
    });
  }
  
  res.json({
    success: true,
    data: archetype,
  });
});

// POST /api/archetypes - Create new archetype
router.post('/', (req, res) => {
  try {
    const archetypeData: ArchetypeNode = req.body;
    
    // Basic validation
    if (!archetypeData.id || !archetypeData.label) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, label',
      });
    }
    
    // Check if archetype already exists
    if (archetypes.find((a) => a.id === archetypeData.id)) {
      return res.status(409).json({
        success: false,
        error: 'Archetype with this ID already exists',
      });
    }
    
    archetypes.push(archetypeData);
    
    res.status(201).json({
      success: true,
      data: archetypeData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create archetype',
    });
  }
});

// PUT /api/archetypes/:id - Update archetype
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const index = archetypes.findIndex((a) => a.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Archetype not found',
      });
    }
    
    archetypes[index] = { ...archetypes[index], ...updates };
    
    res.json({
      success: true,
      data: archetypes[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update archetype',
    });
  }
});

// DELETE /api/archetypes/:id - Delete archetype
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = archetypes.findIndex((a) => a.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Archetype not found',
      });
    }
    
    const deleted = archetypes.splice(index, 1)[0];
    
    res.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete archetype',
    });
  }
});

export default router; 