/**
 * Classification API routes for Huzzology
 */

import express from 'express';
import { 
  ClassificationService, 
  EmbeddingService, 
  ClusteringService 
} from '../services';
import { 
  ArchetypeNode, 
  ClassifiableContent,
  ClusteringConfig,
  EmbeddingConfig
} from '../../../shared/src/types';
import logger from '../utils/logger';

const router = express.Router();
const log = logger.scope('ClassificationRoutes');

/**
 * Classify content against existing archetypes
 * POST /api/classification/classify
 */
router.post('/classify', async (req, res) => {
  try {
    const { contents, archetypes, generateEmbeddings = true } = req.body;
    
    if (!contents || !Array.isArray(contents) || !archetypes || !Array.isArray(archetypes)) {
      return res.status(400).json({ 
        error: 'Invalid request. Contents and archetypes arrays are required.' 
      });
    }
    
    log.info(`Classifying ${contents.length} content items against ${archetypes.length} archetypes`);
    
    // Generate embeddings if needed
    let embeddings = undefined;
    if (generateEmbeddings) {
      embeddings = await EmbeddingService.generateEmbeddings(contents);
    }
    
    const result = await ClassificationService.classifyContent(
      contents, 
      archetypes,
      embeddings
    );
    
    return res.json(result);
  } catch (error: any) {
    log.error(`Error in /classify endpoint: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Generate embeddings for content
 * POST /api/classification/embeddings
 */
router.post('/embeddings', async (req, res) => {
  try {
    const { contents, config } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid request. Contents array is required.' });
    }
    
    log.info(`Generating embeddings for ${contents.length} content items`);
    
    const embeddings = await EmbeddingService.generateEmbeddings(
      contents,
      config as Partial<EmbeddingConfig>
    );
    
    return res.json(embeddings);
  } catch (error: any) {
    log.error(`Error in /embeddings endpoint: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Cluster content embeddings
 * POST /api/classification/cluster
 */
router.post('/cluster', async (req, res) => {
  try {
    const { embeddings, config } = req.body;
    
    if (!embeddings || !Array.isArray(embeddings)) {
      return res.status(400).json({ error: 'Invalid request. Embeddings array is required.' });
    }
    
    log.info(`Clustering ${embeddings.length} embeddings`);
    
    const clusters = await ClusteringService.clusterEmbeddings(
      embeddings,
      config as Partial<ClusteringConfig>
    );
    
    return res.json(clusters);
  } catch (error: any) {
    log.error(`Error in /cluster endpoint: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Detect emerging archetypes
 * POST /api/classification/detect-emerging
 */
router.post('/detect-emerging', async (req, res) => {
  try {
    const { contents, existingArchetypes } = req.body;
    
    if (!contents || !Array.isArray(contents) || !existingArchetypes || !Array.isArray(existingArchetypes)) {
      return res.status(400).json({ 
        error: 'Invalid request. Contents and existingArchetypes arrays are required.' 
      });
    }
    
    log.info(`Detecting emerging archetypes from ${contents.length} content items`);
    
    const emergingArchetypes = await ClassificationService.detectEmergingArchetypes(
      contents,
      existingArchetypes
    );
    
    return res.json(emergingArchetypes);
  } catch (error: any) {
    log.error(`Error in /detect-emerging endpoint: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate influence scores for archetypes
 * POST /api/classification/influence-scores
 */
router.post('/influence-scores', async (req, res) => {
  try {
    const { archetypes, recentContents, config } = req.body;
    
    if (!archetypes || !Array.isArray(archetypes) || !recentContents || !Array.isArray(recentContents)) {
      return res.status(400).json({ 
        error: 'Invalid request. Archetypes and recentContents arrays are required.' 
      });
    }
    
    log.info(`Calculating influence scores for ${archetypes.length} archetypes`);
    
    const influenceScores = await ClassificationService.calculateInfluenceScores(
      archetypes,
      recentContents,
      config
    );
    
    // Convert Map to Object for JSON response
    const result = Object.fromEntries(influenceScores);
    
    return res.json(result);
  } catch (error: any) {
    log.error(`Error in /influence-scores endpoint: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

export default router; 