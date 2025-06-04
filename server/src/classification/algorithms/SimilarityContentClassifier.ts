/**
 * Similarity-based implementation of the ContentClassifier interface
 */

import { 
  ArchetypeNode,
  BatchClassificationResult,
  ClassifiableContent,
  ClassificationConfidence,
  ContentClassificationResult
} from '../../../../shared/src/types';
import { ContentClassifier } from '../interfaces';
import { OpenAIEmbeddingGenerator } from './OpenAIEmbeddingGenerator';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SimilarityContentClassifier implements ContentClassifier {
  private embeddingGenerator: OpenAIEmbeddingGenerator;
  private similarityThreshold: number;
  private createNewArchetypeThreshold: number;
  
  constructor(
    apiKey: string = process.env.OPENAI_API_KEY || '',
    similarityThreshold: number = 0.75,
    createNewArchetypeThreshold: number = 0.65
  ) {
    this.embeddingGenerator = new OpenAIEmbeddingGenerator(apiKey);
    this.similarityThreshold = similarityThreshold;
    this.createNewArchetypeThreshold = createNewArchetypeThreshold;
  }
  
  /**
   * Classify a batch of content into archetypes
   */
  async classifyContent(
    contents: ClassifiableContent[],
    archetypes: ArchetypeNode[]
  ): Promise<BatchClassificationResult> {
    const log = logger.scope('SimilarityContentClassifier:classifyContent');
    
    log.info(`Classifying ${contents.length} content items against ${archetypes.length} archetypes`);
    
    try {
      // Generate embeddings for the archetypes
      const archetypeEmbeddings = await this.generateArchetypeEmbeddings(archetypes);
      
      // Classify each content item
      const results: ContentClassificationResult[] = [];
      const unclassified: string[] = [];
      const newArchetypes: Set<string> = new Set();
      
      for (const content of contents) {
        const result = await this.classifySingleContentWithEmbeddings(
          content,
          archetypes,
          archetypeEmbeddings
        );
        
        results.push(result);
        
        if (result.isNewArchetype) {
          newArchetypes.add(result.suggestedArchetypeName || '');
        }
        
        if (!result.archetypeId) {
          unclassified.push(content.id);
        }
      }
      
      log.info(`Classification complete: ${results.length - unclassified.length} classified, ${unclassified.length} unclassified, ${newArchetypes.size} potential new archetypes`);
      
      return {
        results,
        unclassified,
        newArchetypes: Array.from(newArchetypes).map(name => ({
          label: name,
          description: `New archetype identified from content: ${name}`,
          keywords: []
        })),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error(`Error classifying content: ${error}`);
      throw new Error(`Content classification failed: ${error}`);
    }
  }
  
  /**
   * Classify a single content item
   */
  async classifySingleContent(
    content: ClassifiableContent,
    archetypes: ArchetypeNode[]
  ): Promise<ContentClassificationResult> {
    const log = logger.scope('SimilarityContentClassifier:classifySingleContent');
    
    try {
      // Generate embeddings for the archetypes
      const archetypeEmbeddings = await this.generateArchetypeEmbeddings(archetypes);
      
      // Classify the content item
      return await this.classifySingleContentWithEmbeddings(
        content,
        archetypes,
        archetypeEmbeddings
      );
    } catch (error) {
      log.error(`Error classifying content: ${error}`);
      throw new Error(`Content classification failed: ${error}`);
    }
  }
  
  /**
   * Classify a single content item using pre-generated archetype embeddings
   */
  private async classifySingleContentWithEmbeddings(
    content: ClassifiableContent,
    archetypes: ArchetypeNode[],
    archetypeEmbeddings: Map<string, number[]>
  ): Promise<ContentClassificationResult> {
    const log = logger.scope('SimilarityContentClassifier:classifySingleContentWithEmbeddings');
    
    try {
      // Generate embedding for the content
      const contentText = this.prepareContentText(content);
      const contentEmbedding = await this.embeddingGenerator.generateEmbeddingForText(contentText);
      
      // Find closest archetype
      let bestMatchId = '';
      let bestMatchSimilarity = -1;
      let bestMatchConfidence: ClassificationConfidence = {
        score: 0,
        factors: {
          textualMatch: 0,
          hashtagMatch: 0,
          contextualRelevance: 0
        }
      };
      
      for (const archetype of archetypes) {
        const archetypeEmbedding = archetypeEmbeddings.get(archetype.id);
        
        if (!archetypeEmbedding) {
          continue;
        }
        
        // Calculate similarity
        const similarity = this.calculateCosineSimilarity(contentEmbedding, archetypeEmbedding);
        
        // Calculate additional confidence factors
        const hashtagMatch = this.calculateHashtagMatch(content.hashtags || [], archetype.keywords);
        const textualMatch = this.calculateTextualMatch(contentText, archetype.description);
        
        // Combine factors for overall confidence
        const confidence: ClassificationConfidence = {
          score: similarity * 0.6 + hashtagMatch * 0.3 + textualMatch * 0.1,
          factors: {
            textualMatch,
            hashtagMatch,
            contextualRelevance: similarity
          }
        };
        
        if (similarity > bestMatchSimilarity) {
          bestMatchSimilarity = similarity;
          bestMatchId = archetype.id;
          bestMatchConfidence = confidence;
        }
      }
      
      // Determine if this is a potential new archetype
      const isNewArchetype = bestMatchSimilarity < this.createNewArchetypeThreshold;
      
      // If below threshold, mark as unclassified
      if (bestMatchSimilarity < this.similarityThreshold) {
        bestMatchId = '';
      }
      
      let suggestedName: string | undefined;
      
      if (isNewArchetype) {
        // Generate a suggested name based on content
        suggestedName = this.generateSuggestedName(content);
      }
      
      return {
        contentId: content.id,
        archetypeId: bestMatchId,
        confidence: bestMatchConfidence,
        timestamp: new Date().toISOString(),
        isNewArchetype,
        suggestedArchetypeName: suggestedName
      };
    } catch (error) {
      log.error(`Error in classification: ${error}`);
      
      // Return a default result on error
      return {
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
        isNewArchetype: false
      };
    }
  }
  
  /**
   * Generate embeddings for archetypes
   */
  private async generateArchetypeEmbeddings(
    archetypes: ArchetypeNode[]
  ): Promise<Map<string, number[]>> {
    const archetypeEmbeddings = new Map<string, number[]>();
    
    for (const archetype of archetypes) {
      const archetypeText = this.prepareArchetypeText(archetype);
      const embedding = await this.embeddingGenerator.generateEmbeddingForText(archetypeText);
      archetypeEmbeddings.set(archetype.id, embedding);
    }
    
    return archetypeEmbeddings;
  }
  
  /**
   * Prepare text from content for embedding
   */
  private prepareContentText(content: ClassifiableContent): string {
    const textParts = [
      content.text || '',
      content.caption || '',
      (content.hashtags || []).join(' ')
    ];
    
    return textParts.filter(Boolean).join(' ').trim();
  }
  
  /**
   * Prepare text from archetype for embedding
   */
  private prepareArchetypeText(archetype: ArchetypeNode): string {
    const textParts = [
      archetype.label,
      archetype.description,
      archetype.keywords.join(' ')
    ];
    
    return textParts.filter(Boolean).join(' ').trim();
  }
  
  /**
   * Calculate cosine similarity between vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
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
  
  /**
   * Calculate match between content hashtags and archetype keywords
   */
  private calculateHashtagMatch(
    contentHashtags: string[],
    archetypeKeywords: string[]
  ): number {
    if (contentHashtags.length === 0 || archetypeKeywords.length === 0) {
      return 0;
    }
    
    const contentHashtagsLower = contentHashtags.map(tag => tag.toLowerCase());
    const archetypeKeywordsLower = archetypeKeywords.map(keyword => keyword.toLowerCase());
    
    let matchCount = 0;
    
    for (const tag of contentHashtagsLower) {
      for (const keyword of archetypeKeywordsLower) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          matchCount++;
          break;
        }
      }
    }
    
    return Math.min(1.0, matchCount / contentHashtagsLower.length);
  }
  
  /**
   * Calculate simple textual match
   */
  private calculateTextualMatch(contentText: string, archetypeDescription: string): number {
    const contentWords = new Set(
      contentText.toLowerCase().split(/\W+/).filter(word => word.length > 3)
    );
    
    const archetypeWords = new Set(
      archetypeDescription.toLowerCase().split(/\W+/).filter(word => word.length > 3)
    );
    
    if (contentWords.size === 0 || archetypeWords.size === 0) {
      return 0;
    }
    
    let matchCount = 0;
    
    for (const word of contentWords) {
      if (archetypeWords.has(word)) {
        matchCount++;
      }
    }
    
    return Math.min(1.0, matchCount / Math.min(contentWords.size, 10));
  }
  
  /**
   * Generate a suggested name for a potential new archetype
   */
  private generateSuggestedName(content: ClassifiableContent): string {
    // Extract hashtags if available
    if (content.hashtags && content.hashtags.length > 0) {
      // Find the longest hashtag as it might be most descriptive
      const sortedTags = [...content.hashtags].sort((a, b) => b.length - a.length);
      const candidateTag = sortedTags[0].replace(/^#/, '');
      
      // Convert to title case
      return candidateTag
        .split(/[_\-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Fallback to generic name
    return `Potential Trend ${Math.floor(Math.random() * 1000)}`;
  }
} 