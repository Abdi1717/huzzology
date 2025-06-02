/**
 * Main routes index for Huzzology API
 */

import { Router } from 'express';
import archetypeRoutes from './archetypes.js';
import scrapeRoutes from './scrape.js';
import trendsRoutes from './trends.js';

const router = Router();

// API routes
router.use('/archetypes', archetypeRoutes);
router.use('/scrape', scrapeRoutes);
router.use('/trends', trendsRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Huzzology API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      archetypes: '/api/archetypes',
      scrape: '/api/scrape',
      trends: '/api/trends',
    },
  });
});

export default router; 