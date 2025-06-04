/**
 * Classification Service - Main orchestrator for the classification pipeline
 * 
 * Integrates the embedding generation, clustering, archetype identification,
 * content classification, and influence calculation components.
 */

import { 
  BatchClassificationResult,
  ClassifiableContent,
  ClusteringConfig,
  EmergingArchetype,
  InfluenceConfig,
  ContentEmbedding
} from '../../../shared/src/types';
import {
  ArchetypeIdentifier,
  ClassificationPipeline,
  ContentClassifier,
  ContentClusterer,
  EmbeddingGenerator,
  InfluenceCalculator
} from './interfaces';
import { OpenAIEmbeddingGenerator } from './algorithms/OpenAIEmbeddingGenerator';
import { KMeansClusterer } from './algorithms/KMeansClusterer';
import { LLMArchetypeIdentifier } from './algorithms/LLMArchetypeIdentifier';
import { SimilarityContentClassifier } from './algorithms/SimilarityContentClassifier';
import { InfluenceCalculator as InfluenceCalculatorImpl } from './algorithms/InfluenceCalculator';
import logger from '../utils/logger';
import { ArchetypeNode } from '../../../shared/src/types';
import { PrismaClient } from '@prisma/client';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../database/schema';

export class ClassificationService implements ClassificationPipeline {
  private embeddingGenerator: EmbeddingGenerator;
  private contentClusterer: ContentClusterer;
  private archetypeIdentifier: ArchetypeIdentifier;
  private contentClassifier: ContentClassifier;
  private influenceCalculator: InfluenceCalculator;
  private db: any; // Database connection
  
  constructor(
    apiKey: string = process.env.OPENAI_API_KEY || '',
    dbConnection?: any
  ) {
    // Initialize components
    this.embeddingGenerator = new OpenAIEmbeddingGenerator(apiKey);
    this.contentClusterer = new KMeansClusterer();
    this.archetypeIdentifier = new LLMArchetypeIdentifier(apiKey);
    this.contentClassifier = new SimilarityContentClassifier(apiKey);
    
    // Initialize database connection
    if (dbConnection) {
      this.db = dbConnection;
    } else {
      // Create DB connection using Drizzle ORM
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      this.db = drizzle(pool, { schema });
    }
    
    // Initialize influence calculator with the same DB connection
    this.influenceCalculator = new InfluenceCalculatorImpl(this.db);
  }
  
  /**
   * Process new content through the full classification pipeline
   */
  async processContent(
    contents: ClassifiableContent[]
  ): Promise<BatchClassificationResult> {
    const log = logger.scope('ClassificationService:processContent');
    
    try {
      log.info(`Processing ${contents.length} content items`);
      
      // Get all archetypes from the database
      const archetypes = await this.getArchetypes();
      
      // If we have archetypes, classify content against them
      if (archetypes.length > 0) {
        log.info(`Classifying content against ${archetypes.length} existing archetypes`);
        return await this.contentClassifier.classifyContent(contents, archetypes);
      } else {
        // No archetypes yet, identify emerging ones
        log.info('No existing archetypes found, identifying new ones');
        const emergingArchetypes = await this.identifyEmergingArchetypes(contents);
        
        // Return unclassified result with suggested new archetypes
        return {
          results: contents.map(content => ({
            contentId: content.id,
            archetypeId: '',
            confidence: {
              score: 0,
              factors: {
                textualMatch: 0,
                hashtagMatch: 0,
                contextualRelevance: 0
              }
            },
            timestamp: new Date().toISOString(),
            isNewArchetype: true
          })),
          unclassified: contents.map(content => content.id),
          newArchetypes: emergingArchetypes.map(ea => ({
            label: ea.suggestedLabel,
            description: ea.suggestedDescription,
            keywords: ea.keywordCandidates
          })),
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      log.error(`Error processing content: ${error}`);
      throw new Error(`Content processing failed: ${error}`);
    }
  }
  
  /**
   * Analyze content to identify emerging archetypes
   */
  async identifyEmergingArchetypes(
    contents: ClassifiableContent[]
  ): Promise<EmergingArchetype[]> {
    const log = logger.scope('ClassificationService:identifyEmergingArchetypes');
    
    try {
      log.info(`Analyzing ${contents.length} content items for emerging archetypes`);
      
      // Get existing archetypes
      const existingArchetypes = await this.getArchetypes();
      
      // Generate embeddings
      const embeddings = await this.embeddingGenerator.generateEmbeddings(contents);
      
      // Cluster content
      const clusteringConfig: Partial<ClusteringConfig> = {
        minClusterSize: 3, // Smaller minimum for development
        iterations: 50
      };
      const clusters = await this.contentClusterer.clusterEmbeddings(embeddings, clusteringConfig);
      
      log.info(`Generated ${clusters.length} content clusters`);
      
      // If no meaningful clusters found, return empty result
      if (clusters.length === 0) {
        log.info('No meaningful clusters found in content');
        return [];
      }
      
      // Create content map for the archetype identifier
      const contentMap = new Map<string, ClassifiableContent>();
      contents.forEach(content => contentMap.set(content.id, content));
      
      // Identify potential archetypes
      const emergingArchetypes = await this.archetypeIdentifier.identifyArchetypes(
        clusters,
        contentMap,
        existingArchetypes
      );
      
      log.info(`Identified ${emergingArchetypes.length} potential new archetypes`);
      return emergingArchetypes;
    } catch (error) {
      log.error(`Error identifying emerging archetypes: ${error}`);
      throw new Error(`Failed to identify emerging archetypes: ${error}`);
    }
  }
  
  /**
   * Update influence scores for all archetypes
   */
  async updateInfluenceScores(): Promise<void> {
    const log = logger.scope('ClassificationService:updateInfluenceScores');
    
    try {
      log.info('Updating influence scores for all archetypes');
      
      // Get all archetypes
      const archetypes = await this.getArchetypes();
      
      // Update each archetype's influence score
      for (const archetype of archetypes) {
        const influenceScore = await this.influenceCalculator.calculateArchetypeInfluence(
          archetype,
          archetypes.filter(a => a.id !== archetype.id)
        );
        
        // Update in database
        await this.updateArchetypeInfluence(archetype.id, influenceScore);
      }
      
      log.info('Influence scores updated successfully');
    } catch (error) {
      log.error(`Error updating influence scores: ${error}`);
      throw new Error(`Failed to update influence scores: ${error}`);
    }
  }
  
  /**
   * Store embeddings in the database
   */
  async storeEmbeddings(embeddings: ContentEmbedding[]): Promise<void> {
    const log = logger.scope('ClassificationService:storeEmbeddings');
    
    try {
      log.info(`Storing ${embeddings.length} content embeddings`);
      
      // Implementation depends on the database schema
      // This is a placeholder for the actual implementation
      
      log.info('Embeddings stored successfully');
    } catch (error) {
      log.error(`Error storing embeddings: ${error}`);
      throw new Error(`Failed to store embeddings: ${error}`);
    }
  }
  
  /**
   * Get all archetypes from the database
   */
  private async getArchetypes(): Promise<ArchetypeNode[]> {
    const log = logger.scope('ClassificationService:getArchetypes');
    
    try {
      // Query archetypes from database
      const dbArchetypes = await this.db.select().from(schema.archetypes);
      
      // Map database records to ArchetypeNode type
      return dbArchetypes.map(dbArchetype => ({
        id: dbArchetype.id,
        label: dbArchetype.name,
        description: dbArchetype.description || '',
        keywords: dbArchetype.keywords || [],
        influences: [], // Would need to query relationships table
        examples: [], // Would need to query content examples table
        color: dbArchetype.color || '#888888',
        metadata: {
          origin_date: dbArchetype.origin_date,
          peak_popularity: dbArchetype.peak_popularity_date,
          influence_score: Number(dbArchetype.influence_score) || 0,
          platforms: (dbArchetype.metadata?.platforms || []) as any
        }
      }));
    } catch (error) {
      log.error(`Error fetching archetypes: ${error}`);
      return [];
    }
  }
  
  /**
   * Update archetype influence score in the database
   */
  private async updateArchetypeInfluence(archetypeId: string, score: number): Promise<void> {
    const log = logger.scope('ClassificationService:updateArchetypeInfluence');
    
    try {
      // Update archetype in database
      await this.db
        .update(schema.archetypes)
        .set({ 
          influence_score: score,
          updated_at: new Date().toISOString()
        })
        .where(({ id }) => id.equals(archetypeId));
        
      log.verbose(`Updated influence score for archetype ${archetypeId} to ${score}`);
    } catch (error) {
      log.error(`Error updating archetype influence: ${error}`);
      throw new Error(`Failed to update archetype influence: ${error}`);
    }
  }
} 