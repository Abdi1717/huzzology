/**
 * Main routes index for Huzzology API
 */

import { Router } from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import archetypeRoutes from './archetypes.js';
import scrapeRoutes from './scrape.js';
import trendsRoutes from './trends.js';
import contentExampleRoutes from './content-examples.js';
import userRoutes from './users.js';
import moderationRoutes from './moderation.js';
import docsRoutes from './docs.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/archetypes', archetypeRoutes);
router.use('/content-examples', contentExampleRoutes);
router.use('/users', userRoutes);
router.use('/moderation', moderationRoutes);
router.use('/scrape', scrapeRoutes);
router.use('/trends', trendsRoutes);
router.use('/docs', docsRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Huzzology API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      archetypes: '/api/archetypes',
      content_examples: '/api/content-examples',
      users: '/api/users',
      moderation: '/api/moderation',
      scrape: '/api/scrape',
      trends: '/api/trends',
      docs: '/api/docs',
    },
    documentation: {
      swagger: '/api/docs',
      redoc: '/api/docs/redoc',
      openapi_json: '/api/docs/json',
      openapi_yaml: '/api/docs/yaml',
      postman_collection: '/api/docs/postman',
    },
  });
});

export default router; 