/**
 * Classification Service for Huzzology
 * 
 * Handles content classification into archetypes and new archetype detection.
 */

import axios from 'axios';
import { 
  ArchetypeNode, 
  BatchClassificationResult,
  ClassifiableContent,
  ClassificationConfidence,
  ContentClassificationResult,
  ContentEmbedding,
  EmergingArchetype,
  InfluenceConfig
} from '../../../shared/src/types';
import logger from '../utils/logger';
import EmbeddingService from './EmbeddingService';
import ClusteringService from './ClusteringService';

class ClassificationService {
  private openaiApiKey: string;
  private defaultInfluenceConfig: InfluenceConfig;
  
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    
    this.defaultInfluenceConfig = {
      method: 'hybrid',
      timeWindow: 30, // 30 days
      engagementWeight: 0.4,
      growthWeight: 0.3,
      spreadWeight: 0.3
    };
  }
  
  /**
   * Classify content against existing archetypes
   */
  async classifyContent(
    contents: ClassifiableContent[],
    archetypes: ArchetypeNode[],
    embeddings?: ContentEmbedding[]
  ): Promise<BatchClassificationResult> {
    const log = logger.scope('ClassificationService:classifyContent');
    log.info(`Classifying ${contents.length} content items against ${archetypes.length} archetypes`);
    
    try {
      // Generate embeddings if not provided
      const contentEmbeddings = embeddings || await EmbeddingService.generateEmbeddings(contents);
      
      // Get archetype embeddings (could be cached/stored in a real implementation)
      const archetypeEmbeddings = await EmbeddingService.getArchetypeEmbeddings(archetypes);
      
      const results: ContentClassificationResult[] = [];
      const unclassified: string[] = [];
      const newArchetypes: Partial<ArchetypeNode>[] = [];
      
      // Classify each content item
      for (const content of contents) {
        const contentEmbedding = contentEmbeddings.find(e => e.contentId === content.id);
        
        if (!contentEmbedding) {
          unclassified.push(content.id);
          continue;
        }
        
        // Find the closest archetype
        const { archetypeId, confidence } = this.findClosestArchetype(
          contentEmbedding,
          archetypes,
          archetypeEmbeddings,
          content
        );
        
        if (archetypeId && confidence.score > 0.6) {
          // Classified as existing archetype
          results.push({
            contentId: content.id,
            archetypeId,
            confidence,
            timestamp: new Date().toISOString(),
            isNewArchetype: false
          });
        } else if (confidence.score > 0.3) {
          // Might be a new archetype
          const suggestedName = await this.suggestArchetypeName(content);
          
          results.push({
            contentId: content.id,
            archetypeId: 'new', // Placeholder
            confidence: {
              ...confidence,
              score: Math.min(confidence.score + 0.1, 1.0) // Boost confidence slightly for new archetypes
            },
            timestamp: new Date().toISOString(),
            isNewArchetype: true,
            suggestedArchetypeName: suggestedName
          });
          
          // Add to potential new archetypes if not already there
          if (!newArchetypes.some(a => a.label === suggestedName)) {
            newArchetypes.push({
              id: `temp-${Date.now()}-${suggestedName.toLowerCase().replace(/\s+/g, '-')}`,
              label: suggestedName,
              description: `Emerging archetype based on recent content trends.`,
              keywords: this.extractKeywords(content),
              examples: [],
              color: this.generateRandomColor(),
              metadata: {
                influence_score: 0.5,
                platforms: [content.platform]
              }
            });
          }
        } else {
          // Couldn't classify
          unclassified.push(content.id);
        }
      }
      
      log.info(`Classified ${results.length} items, ${unclassified.length} unclassified, detected ${newArchetypes.length} potential new archetypes`);
      
      return {
        results,
        unclassified,
        newArchetypes,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error(`Error classifying content: ${error}`);
      throw new Error(`Failed to classify content: ${error}`);
    }
  }
  
  /**
   * Detect emerging archetypes from content that doesn't match existing ones
   */
  async detectEmergingArchetypes(
    contents: ClassifiableContent[],
    existingArchetypes: ArchetypeNode[]
  ): Promise<EmergingArchetype[]> {
    const log = logger.scope('ClassificationService:detectEmergingArchetypes');
    log.info(`Analyzing ${contents.length} content items for emerging archetypes`);
    
    try {
      // Generate embeddings
      const embeddings = await EmbeddingService.generateEmbeddings(contents);
      
      // First, try to classify content against existing archetypes
      const classificationResult = await this.classifyContent(
        contents, 
        existingArchetypes,
        embeddings
      );
      
      // Get unclassified content
      const unclassifiedContentIds = new Set(classificationResult.unclassified);
      const unclassifiedContents = contents.filter(c => unclassifiedContentIds.has(c.id));
      const unclassifiedEmbeddings = embeddings.filter(e => unclassifiedContentIds.has(e.contentId));
      
      if (unclassifiedContents.length < 5) {
        log.info('Not enough unclassified content to detect new archetypes');
        return [];
      }
      
      // Cluster the unclassified content
      const clusters = await ClusteringService.clusterEmbeddings(unclassifiedEmbeddings, {
        minClusterSize: 3,
        method: 'kmeans'
      });
      
      // Filter significant clusters (good coherence and enough items)
      const significantClusters = clusters.filter(
        c => c.coherence > 0.7 && c.contentIds.length >= 3
      );
      
      if (significantClusters.length === 0) {
        log.info('No significant clusters found for emerging archetypes');
        return [];
      }
      
      // Generate archetype suggestions for each significant cluster
      const emergingArchetypes: EmergingArchetype[] = [];
      
      for (const cluster of significantClusters) {
        const clusterContents = contents.filter(c => 
          cluster.contentIds.includes(c.id)
        );
        
        const suggestedLabel = await this.suggestArchetypeName(clusterContents[0]);
        const keywordCandidates = this.extractKeywordsFromCluster(clusterContents);
        
        const archetype: EmergingArchetype = {
          id: `emerging-${Date.now()}-${suggestedLabel.toLowerCase().replace(/\s+/g, '-')}`,
          suggestedLabel,
          suggestedDescription: await this.generateArchetypeDescription(clusterContents),
          keywordCandidates,
          contentExamples: clusterContents.map(c => c.id),
          confidence: Math.min(0.5 + (cluster.coherence * 0.5), 0.95), // Scale confidence based on cluster coherence
          firstDetected: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        emergingArchetypes.push(archetype);
      }
      
      log.info(`Detected ${emergingArchetypes.length} emerging archetypes`);
      return emergingArchetypes;
    } catch (error) {
      log.error(`Error detecting emerging archetypes: ${error}`);
      throw new Error(`Failed to detect emerging archetypes: ${error}`);
    }
  }

  /**
   * Calculate influence scores for archetypes
   */
  async calculateInfluenceScores(
    archetypes: ArchetypeNode[],
    recentContents: ClassifiableContent[],
    config: Partial<InfluenceConfig> = {}
  ): Promise<Map<string, number>> {
    const influenceConfig = { ...this.defaultInfluenceConfig, ...config };
    const log = logger.scope('ClassificationService:calculateInfluenceScores');
    
    log.info(`Calculating influence scores for ${archetypes.length} archetypes`);
    
    try {
      // Classify recent content
      const classificationResult = await this.classifyContent(recentContents, archetypes);
      
      // Map of archetype ID to classified content
      const archetypeContentMap = new Map<string, ContentClassificationResult[]>();
      
      for (const result of classificationResult.results) {
        if (!result.isNewArchetype) {
          const contents = archetypeContentMap.get(result.archetypeId) || [];
          contents.push(result);
          archetypeContentMap.set(result.archetypeId, contents);
        }
      }
      
      // Calculate scores for each archetype
      const influenceScores = new Map<string, number>();
      
      for (const archetype of archetypes) {
        const archetypeContents = archetypeContentMap.get(archetype.id) || [];
        let score = 0;
        
        if (archetypeContents.length === 0) {
          // No recent content for this archetype
          score = Math.max((archetype.metadata.influence_score || 0) - 0.1, 0);
        } else {
          // Calculate based on the specified method
          if (influenceConfig.method === 'engagement' || influenceConfig.method === 'hybrid') {
            const engagementScore = this.calculateEngagementScore(archetypeContents, recentContents);
            score += (influenceConfig.engagementWeight || 0.4) * engagementScore;
          }
          
          if (influenceConfig.method === 'spread' || influenceConfig.method === 'hybrid') {
            const spreadScore = this.calculateSpreadScore(archetypeContents, recentContents);
            score += (influenceConfig.spreadWeight || 0.3) * spreadScore;
          }
          
          if (influenceConfig.method === 'growth' || influenceConfig.method === 'hybrid') {
            const growthScore = this.calculateGrowthScore(archetypeContents, archetype);
            score += (influenceConfig.growthWeight || 0.3) * growthScore;
          }
        }
        
        // Ensure score is in 0-1 range
        score = Math.max(0, Math.min(1, score));
        influenceScores.set(archetype.id, score);
      }
      
      log.info(`Calculated influence scores for ${influenceScores.size} archetypes`);
      return influenceScores;
    } catch (error) {
      log.error(`Error calculating influence scores: ${error}`);
      throw new Error(`Failed to calculate influence scores: ${error}`);
    }
  }
  
  private findClosestArchetype(
    contentEmbedding: ContentEmbedding,
    archetypes: ArchetypeNode[],
    archetypeEmbeddings: Map<string, number[]>,
    content: ClassifiableContent
  ): { archetypeId: string | null; confidence: ClassificationConfidence } {
    let bestMatch: string | null = null;
    let highestSimilarity = -1;
    let textualMatchScore = 0;
    let hashtagMatchScore = 0;
    
    for (const archetype of archetypes) {
      const archetypeEmbedding = archetypeEmbeddings.get(archetype.id);
      
      if (!archetypeEmbedding) {
        continue;
      }
      
      // Calculate cosine similarity
      const similarity = EmbeddingService.calculateCosineSimilarity(
        contentEmbedding.vector,
        archetypeEmbedding
      );
      
      // Calculate textual match based on keywords
      const contentText = this.prepareContentText(content).toLowerCase();
      const keywordMatches = archetype.keywords.filter(
        keyword => contentText.includes(keyword.toLowerCase())
      );
      
      textualMatchScore = keywordMatches.length / archetype.keywords.length;
      
      // Calculate hashtag match
      if (content.hashtags && content.hashtags.length > 0) {
        const hashtagMatches = archetype.keywords.filter(keyword =>
          content.hashtags!.some(tag => 
            tag.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        
        hashtagMatchScore = hashtagMatches.length / archetype.keywords.length;
      }
      
      // Combined score with weights
      const combinedScore = (
        similarity * 0.6 + 
        textualMatchScore * 0.2 + 
        hashtagMatchScore * 0.2
      );
      
      if (combinedScore > highestSimilarity) {
        highestSimilarity = combinedScore;
        bestMatch = archetype.id;
      }
    }
    
    return {
      archetypeId: bestMatch,
      confidence: {
        score: highestSimilarity,
        factors: {
          textualMatch: textualMatchScore,
          hashtagMatch: hashtagMatchScore,
          contextualRelevance: highestSimilarity // Using similarity as contextual relevance
        }
      }
    };
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
  
  private async suggestArchetypeName(content: ClassifiableContent): Promise<string> {
    // In a real implementation, this would use an LLM to generate a name
    // For now, just return a placeholder
    return `Trending Style ${Math.floor(Math.random() * 100)}`;
  }
  
  private extractKeywords(content: ClassifiableContent): string[] {
    // In a real implementation, this would use NLP to extract keywords
    // For now, just return any hashtags or a placeholder
    return content.hashtags || ['trend', 'style', 'fashion'];
  }
  
  private extractKeywordsFromCluster(contents: ClassifiableContent[]): string[] {
    // Combine all hashtags and return unique ones
    const allHashtags = contents
      .flatMap(content => content.hashtags || [])
      .filter(Boolean);
    
    return [...new Set(allHashtags)];
  }
  
  private async generateArchetypeDescription(contents: ClassifiableContent[]): Promise<string> {
    // In a real implementation, this would use an LLM to generate a description
    // For now, just return a placeholder
    return `An emerging trend based on ${contents.length} content examples`;
  }
  
  private generateRandomColor(): string {
    // Generate a random pastel color
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }
  
  private calculateEngagementScore(
    archetypeContents: ContentClassificationResult[],
    allContents: ClassifiableContent[]
  ): number {
    // Get the content items for this archetype
    const contentMap = new Map(
      allContents.map(content => [content.id, content])
    );
    
    const contents = archetypeContents
      .map(result => contentMap.get(result.contentId))
      .filter(Boolean) as ClassifiableContent[];
    
    // Calculate total engagement
    let totalEngagement = 0;
    let contentCount = 0;
    
    for (const content of contents) {
      if (content.engagement_metrics) {
        const engagement = (
          (content.engagement_metrics.likes || 0) +
          (content.engagement_metrics.shares || 0) * 2 +
          (content.engagement_metrics.comments || 0) * 3
        );
        
        totalEngagement += engagement;
        contentCount++;
      }
    }
    
    if (contentCount === 0) {
      return 0;
    }
    
    // Normalize to 0-1 scale (this would need calibration in a real system)
    const avgEngagement = totalEngagement / contentCount;
    return Math.min(avgEngagement / 1000, 1);
  }
  
  private calculateSpreadScore(
    archetypeContents: ContentClassificationResult[],
    allContents: ClassifiableContent[]
  ): number {
    // Get the content items for this archetype
    const contentMap = new Map(
      allContents.map(content => [content.id, content])
    );
    
    const contents = archetypeContents
      .map(result => contentMap.get(result.contentId))
      .filter(Boolean) as ClassifiableContent[];
    
    // Calculate spread across platforms
    const platforms = new Set(contents.map(content => content.platform));
    const platformSpread = platforms.size / 4; // 4 possible platforms
    
    // Calculate creator diversity
    const creators = new Set(
      contents
        .filter(content => content.creator?.username)
        .map(content => content.creator!.username)
    );
    
    const creatorDiversity = Math.min(creators.size / contents.length, 1);
    
    // Combined spread score
    return (platformSpread * 0.5) + (creatorDiversity * 0.5);
  }
  
  private calculateGrowthScore(
    archetypeContents: ContentClassificationResult[],
    archetype: ArchetypeNode
  ): number {
    // Sort by timestamp
    const sortedResults = [...archetypeContents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    if (sortedResults.length < 2) {
      return 0.5; // Neutral score if not enough data
    }
    
    // Split into first half and second half
    const midpoint = Math.floor(sortedResults.length / 2);
    const firstHalf = sortedResults.slice(0, midpoint);
    const secondHalf = sortedResults.slice(midpoint);
    
    // Calculate growth rate
    const growthRate = (secondHalf.length / firstHalf.length) - 1;
    
    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, (growthRate + 1) / 2));
  }
}

export default new ClassificationService(); 