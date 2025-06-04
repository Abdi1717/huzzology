/**
 * Embedding Service for Huzzology
 * 
 * Handles generation and management of embeddings for content items and archetypes.
 */

import axios from 'axios';
import { 
  ArchetypeNode,
  ClassifiableContent,
  ContentEmbedding,
  EmbeddingConfig,
  EmbeddingModel
} from '../../../shared/src/types';
import logger from '../utils/logger';

class EmbeddingService {
  private openaiApiKey: string;
  private cohereApiKey: string;
  private defaultEmbeddingConfig: EmbeddingConfig;
  
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.cohereApiKey = process.env.COHERE_API_KEY || '';
    
    this.defaultEmbeddingConfig = {
      model: 'openai',
      dimensions: 1536, // Default for OpenAI embeddings
      batchSize: 100
    };
  }
  
  /**
   * Generate embeddings for a batch of content items
   */
  async generateEmbeddings(
    contents: ClassifiableContent[], 
    config: Partial<EmbeddingConfig> = {}
  ): Promise<ContentEmbedding[]> {
    const embeddingConfig: EmbeddingConfig = { ...this.defaultEmbeddingConfig, ...config };
    const log = logger.scope('EmbeddingService:generateEmbeddings');
    
    log.info(`Generating embeddings for ${contents.length} content items using ${embeddingConfig.model} model`);
    
    try {
      // Process in batches
      const batchSize = embeddingConfig.batchSize || 100;
      const batches = [];
      for (let i = 0; i < contents.length; i += batchSize) {
        batches.push(contents.slice(i, i + batchSize));
      }
      
      const embeddings: ContentEmbedding[] = [];
      
      for (const batch of batches) {
        const batchTexts = batch.map(content => this.prepareContentText(content));
        
        if (embeddingConfig.model === 'openai') {
          const batchEmbeddings = await this.generateOpenAIEmbeddings(batchTexts);
          
          // Map embeddings back to content IDs
          for (let i = 0; i < batch.length; i++) {
            embeddings.push({
              contentId: batch[i].id,
              vector: batchEmbeddings[i],
              model: 'openai:text-embedding-ada-002',
              timestamp: new Date().toISOString()
            });
          }
        } else if (embeddingConfig.model === 'cohere') {
          const batchEmbeddings = await this.generateCohereEmbeddings(batchTexts);
          
          // Map embeddings back to content IDs
          for (let i = 0; i < batch.length; i++) {
            embeddings.push({
              contentId: batch[i].id,
              vector: batchEmbeddings[i],
              model: 'cohere:embed-english-v2.0',
              timestamp: new Date().toISOString()
            });
          }
        } else {
          throw new Error(`Unsupported embedding model: ${embeddingConfig.model}`);
        }
      }
      
      log.info(`Generated ${embeddings.length} embeddings successfully`);
      return embeddings;
    } catch (error) {
      log.error(`Error generating embeddings: ${error}`);
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }
  
  /**
   * Get embeddings for a set of archetypes
   */
  async getArchetypeEmbeddings(
    archetypes: ArchetypeNode[]
  ): Promise<Map<string, number[]>> {
    // In a real implementation, you might cache these or store them in a database
    const archetypeTexts = archetypes.map(archetype => {
      return [
        archetype.label,
        archetype.description,
        archetype.keywords.join(' ')
      ].join(' ');
    });
    
    const embeddings = await this.generateOpenAIEmbeddings(archetypeTexts);
    const archetypeEmbeddingsMap = new Map<string, number[]>();
    
    for (let i = 0; i < archetypes.length; i++) {
      archetypeEmbeddingsMap.set(archetypes[i].id, embeddings[i]);
    }
    
    return archetypeEmbeddingsMap;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  static calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  private prepareContentText(content: ClassifiableContent): string {
    // Combine all text fields for embedding
    const textParts = [
      content.text || '',
      content.caption || '',
      (content.hashtags || []).join(' ')
    ];
    
    return textParts.filter(Boolean).join(' ').trim();
  }
  
  private async generateOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    const log = logger.scope('EmbeddingService:generateOpenAIEmbeddings');
    
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: texts,
          model: 'text-embedding-ada-002'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data.map((item: any) => item.embedding);
    } catch (error) {
      log.error(`OpenAI API error: ${error}`);
      throw new Error(`Failed to generate OpenAI embeddings: ${error}`);
    }
  }
  
  private async generateCohereEmbeddings(texts: string[]): Promise<number[][]> {
    const log = logger.scope('EmbeddingService:generateCohereEmbeddings');
    
    if (!this.cohereApiKey) {
      throw new Error('Cohere API key is not configured');
    }
    
    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/embed',
        {
          texts: texts,
          model: 'embed-english-v2.0'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.cohereApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.embeddings;
    } catch (error) {
      log.error(`Cohere API error: ${error}`);
      throw new Error(`Failed to generate Cohere embeddings: ${error}`);
    }
  }
}

export default new EmbeddingService(); 