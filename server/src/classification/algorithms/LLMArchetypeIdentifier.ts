/**
 * LLM-based implementation of the ArchetypeIdentifier interface
 */

import axios from 'axios';
import { 
  ArchetypeNode,
  ClassifiableContent,
  ClusterResult,
  EmergingArchetype
} from '../../../../shared/src/types';
import { ArchetypeIdentifier } from '../interfaces';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { KMeansClusterer } from './KMeansClusterer';

export class LLMArchetypeIdentifier implements ArchetypeIdentifier {
  private openaiApiKey: string;
  private similarityThreshold: number;
  private clusterSizeThreshold: number;
  
  constructor(
    openaiApiKey: string = process.env.OPENAI_API_KEY || '',
    similarityThreshold: number = 0.85,
    clusterSizeThreshold: number = 10
  ) {
    this.openaiApiKey = openaiApiKey;
    this.similarityThreshold = similarityThreshold;
    this.clusterSizeThreshold = clusterSizeThreshold;
    
    if (!this.openaiApiKey) {
      logger.warn('LLMArchetypeIdentifier initialized without API key');
    }
  }
  
  /**
   * Identify potential archetypes from content clusters
   */
  async identifyArchetypes(
    clusters: ClusterResult[],
    contents: Map<string, ClassifiableContent>,
    existingArchetypes: ArchetypeNode[] = []
  ): Promise<EmergingArchetype[]> {
    const log = logger.scope('LLMArchetypeIdentifier:identifyArchetypes');
    
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    log.info(`Analyzing ${clusters.length} clusters for potential archetypes`);
    
    try {
      const emergingArchetypes: EmergingArchetype[] = [];
      const now = new Date().toISOString();
      
      for (const cluster of clusters) {
        // Skip small clusters
        if (cluster.contentIds.length < this.clusterSizeThreshold) {
          log.verbose(`Skipping cluster ${cluster.id} - too small (${cluster.contentIds.length} < ${this.clusterSizeThreshold})`);
          continue;
        }
        
        // Check if cluster forms a new archetype
        const shouldForm = await this.shouldFormNewArchetype(
          cluster,
          contents,
          existingArchetypes
        );
        
        if (shouldForm) {
          log.info(`Cluster ${cluster.id} identified as potential new archetype`);
          
          // Generate archetype label
          const { label, description, keywords } = await this.generateArchetypeLabel(
            cluster,
            contents
          );
          
          emergingArchetypes.push({
            id: `emerging-${uuidv4().slice(0, 8)}`,
            suggestedLabel: label,
            suggestedDescription: description,
            keywordCandidates: keywords,
            contentExamples: cluster.contentIds.slice(0, 5), // Top 5 examples
            confidence: cluster.coherence,
            firstDetected: now,
            lastUpdated: now
          });
        } else {
          log.verbose(`Cluster ${cluster.id} does not form a new archetype`);
        }
      }
      
      log.info(`Identified ${emergingArchetypes.length} potential new archetypes`);
      return emergingArchetypes;
    } catch (error) {
      log.error(`Error identifying archetypes: ${error}`);
      throw new Error(`Failed to identify archetypes: ${error}`);
    }
  }
  
  /**
   * Check if a cluster should form a new archetype
   */
  async shouldFormNewArchetype(
    cluster: ClusterResult,
    contents: Map<string, ClassifiableContent>,
    existingArchetypes: ArchetypeNode[]
  ): Promise<boolean> {
    // If no existing archetypes, always form new ones
    if (existingArchetypes.length === 0) {
      return true;
    }
    
    // Get sample content from cluster
    const clusterContentSample = this.getSampleContent(cluster, contents);
    
    // If cluster has high coherence
    if (cluster.coherence > 0.7) {
      // Check similarity to existing archetypes
      for (const archetype of existingArchetypes) {
        const similarity = await this.checkArchetypeSimilarity(
          clusterContentSample,
          archetype
        );
        
        // If similar to an existing archetype, don't form new
        if (similarity >= this.similarityThreshold) {
          return false;
        }
      }
      
      // No similar archetypes found
      return true;
    }
    
    // Not coherent enough
    return false;
  }
  
  /**
   * Generate a label for a potential new archetype
   */
  async generateArchetypeLabel(
    cluster: ClusterResult,
    contents: Map<string, ClassifiableContent>
  ): Promise<{
    label: string;
    description: string;
    keywords: string[];
  }> {
    const log = logger.scope('LLMArchetypeIdentifier:generateArchetypeLabel');
    
    // Get sample content
    const contentSample = this.getSampleContent(cluster, contents);
    
    try {
      // Call OpenAI to generate label
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert in identifying and naming emerging cultural trends, aesthetics, and archetypes in women's pop culture. 
              Analyze the provided content samples and identify the underlying archetype or aesthetic trend they represent. 
              Focus on visual elements, language patterns, themes, and cultural context.`
            },
            {
              role: 'user',
              content: `Based on these content examples, identify and name the cultural archetype or aesthetic they represent:
              
              ${contentSample.map(c => 
                `CONTENT: ${c.text || ''}
                 CAPTION: ${c.caption || ''}
                 HASHTAGS: ${(c.hashtags || []).join(', ')}
                `
              ).join('\n\n')}
              
              Generate a concise name for this archetype, a paragraph description, and 5-10 keywords or hashtags that define it.
              Format your response as JSON with fields "label", "description", and "keywords".`
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = response.data.choices[0].message.content;
      const parsedResult = JSON.parse(result);
      
      return {
        label: parsedResult.label,
        description: parsedResult.description,
        keywords: parsedResult.keywords
      };
    } catch (error) {
      log.error(`Error generating archetype label: ${error}`);
      
      // Fallback with generic label
      return {
        label: `Emerging Trend ${Math.floor(Math.random() * 1000)}`,
        description: 'A potential new cultural archetype or aesthetic trend',
        keywords: ['trend', 'aesthetic', 'emerging']
      };
    }
  }
  
  /**
   * Get a representative sample of content from a cluster
   */
  private getSampleContent(
    cluster: ClusterResult,
    contents: Map<string, ClassifiableContent>
  ): ClassifiableContent[] {
    // Get content for cluster
    const clusterContent = cluster.contentIds
      .map(id => contents.get(id))
      .filter((content): content is ClassifiableContent => !!content);
    
    // Select a representative sample (up to 5 items)
    return clusterContent.slice(0, 5);
  }
  
  /**
   * Check similarity between content and existing archetype
   */
  private async checkArchetypeSimilarity(
    content: ClassifiableContent[],
    archetype: ArchetypeNode
  ): Promise<number> {
    try {
      // Use LLM to check similarity
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert in analyzing cultural trends and aesthetics. Your task is to determine if content samples match an existing archetype.`
            },
            {
              role: 'user',
              content: `Analyze these content samples:
              
              ${content.map(c => 
                `CONTENT: ${c.text || ''}
                 CAPTION: ${c.caption || ''}
                 HASHTAGS: ${(c.hashtags || []).join(', ')}
                `
              ).join('\n\n')}
              
              Compare them to this existing archetype:
              NAME: ${archetype.label}
              DESCRIPTION: ${archetype.description}
              KEYWORDS: ${archetype.keywords.join(', ')}
              
              Determine the similarity score (0.0 to 1.0) where:
              - 1.0 means they perfectly match the existing archetype
              - 0.0 means they're completely unrelated
              
              Provide only the numerical score as a decimal between 0 and 1.`
            }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = response.data.choices[0].message.content.trim();
      const score = parseFloat(result);
      
      if (isNaN(score) || score < 0 || score > 1) {
        // Fallback to moderate similarity if parsing fails
        return 0.5;
      }
      
      return score;
    } catch (error) {
      // On error, assume moderate similarity
      logger.error(`Error checking archetype similarity: ${error}`);
      return 0.5;
    }
  }
} 