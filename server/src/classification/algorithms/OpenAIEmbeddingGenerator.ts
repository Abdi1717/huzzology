/**
 * OpenAI-based implementation of the EmbeddingGenerator interface
 */

import axios from 'axios';
import { 
  ClassifiableContent, 
  ContentEmbedding,
  EmbeddingConfig 
} from '../../../../shared/src/types';
import { EmbeddingGenerator } from '../interfaces';
import logger from '../../utils/logger';

export class OpenAIEmbeddingGenerator implements EmbeddingGenerator {
  private apiKey: string;
  private model: string;
  private batchSize: number;
  
  constructor(
    apiKey: string = process.env.OPENAI_API_KEY || '',
    model: string = 'text-embedding-ada-002',
    batchSize: number = 100
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.batchSize = batchSize;
    
    if (!this.apiKey) {
      logger.warn('OpenAIEmbeddingGenerator initialized without API key');
    }
  }
  
  /**
   * Generate embeddings for a batch of content
   */
  async generateEmbeddings(
    contents: ClassifiableContent[],
    config?: Partial<EmbeddingConfig>
  ): Promise<ContentEmbedding[]> {
    const log = logger.scope('OpenAIEmbeddingGenerator:generateEmbeddings');
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    log.info(`Generating embeddings for ${contents.length} content items`);
    
    try {
      // Process in batches to avoid API limits
      const batchSize = config?.batchSize || this.batchSize;
      const batches = [];
      
      for (let i = 0; i < contents.length; i += batchSize) {
        batches.push(contents.slice(i, i + batchSize));
      }
      
      const embeddings: ContentEmbedding[] = [];
      
      for (const batch of batches) {
        const batchTexts = batch.map(content => this.prepareContentText(content));
        const batchEmbeddings = await this.callOpenAIAPI(batchTexts);
        
        // Map embeddings back to content IDs
        for (let i = 0; i < batch.length; i++) {
          embeddings.push({
            contentId: batch[i].id,
            vector: batchEmbeddings[i],
            model: `openai:${this.model}`,
            timestamp: new Date().toISOString()
          });
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
   * Generate a single embedding for text
   */
  async generateEmbeddingForText(
    text: string,
    config?: Partial<EmbeddingConfig>
  ): Promise<number[]> {
    const log = logger.scope('OpenAIEmbeddingGenerator:generateEmbeddingForText');
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const embeddings = await this.callOpenAIAPI([text]);
      return embeddings[0];
    } catch (error) {
      log.error(`Error generating embedding for text: ${error}`);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }
  
  /**
   * Call OpenAI API to generate embeddings
   */
  private async callOpenAIAPI(texts: string[]): Promise<number[][]> {
    const log = logger.scope('OpenAIEmbeddingGenerator:callOpenAIAPI');
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: texts,
          model: this.model
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data.map((item: any) => item.embedding);
    } catch (error) {
      log.error(`OpenAI API error: ${error}`);
      throw new Error(`Failed to call OpenAI API: ${error}`);
    }
  }
  
  /**
   * Prepare content text for embedding
   */
  private prepareContentText(content: ClassifiableContent): string {
    // Combine all text fields for embedding
    const textParts = [
      content.text || '',
      content.caption || '',
      (content.hashtags || []).join(' ')
    ];
    
    return textParts.filter(Boolean).join(' ').trim();
  }
} 