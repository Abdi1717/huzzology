/**
 * Implementation of the InfluenceCalculator interface
 * 
 * Calculates influence scores for content within archetypes and overall archetype influence
 */

import { 
  ArchetypeNode,
  InfluenceConfig,
  InfluenceMethod
} from '../../../../shared/src/types';
import { InfluenceCalculator as IInfluenceCalculator } from '../interfaces';
import logger from '../../utils/logger';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../database/schema';

export class InfluenceCalculator implements IInfluenceCalculator {
  private db: any; // Database connection
  private defaultConfig: InfluenceConfig;
  
  constructor(dbConnection?: any) {
    // Default configuration
    this.defaultConfig = {
      method: 'hybrid',
      timeWindow: 90, // 90 days
      engagementWeight: 0.4,
      spreadWeight: 0.3,
      growthWeight: 0.3
    };
    
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
  }
  
  /**
   * Calculate influence scores for content within archetypes
   */
  async calculateInfluenceScores(
    archetypeId: string,
    contentIds: string[],
    config?: Partial<InfluenceConfig>
  ): Promise<Map<string, number>> {
    const log = logger.scope('InfluenceCalculator:calculateInfluenceScores');
    
    try {
      log.info(`Calculating influence scores for ${contentIds.length} content items in archetype ${archetypeId}`);
      
      // Merge with default config
      const fullConfig = { ...this.defaultConfig, ...config };
      
      // Create result map
      const influenceScores = new Map<string, number>();
      
      // Get content examples from database
      const contentExamples = await this.getContentExamples(contentIds);
      
      if (contentExamples.length === 0) {
        log.warn('No content examples found for influence calculation');
        return influenceScores;
      }
      
      // Calculate influence based on method
      switch (fullConfig.method) {
        case 'engagement':
          this.calculateEngagementBasedInfluence(contentExamples, influenceScores);
          break;
        case 'spread':
          this.calculateSpreadBasedInfluence(contentExamples, influenceScores);
          break;
        case 'growth':
          this.calculateGrowthBasedInfluence(contentExamples, influenceScores, fullConfig.timeWindow || 90);
          break;
        case 'hybrid':
        default:
          this.calculateHybridInfluence(
            contentExamples, 
            influenceScores, 
            fullConfig.timeWindow || 90,
            fullConfig.engagementWeight || 0.4,
            fullConfig.spreadWeight || 0.3,
            fullConfig.growthWeight || 0.3
          );
          break;
      }
      
      log.info(`Calculated influence scores for ${influenceScores.size} content items`);
      return influenceScores;
    } catch (error) {
      log.error(`Error calculating influence scores: ${error}`);
      throw new Error(`Failed to calculate influence scores: ${error}`);
    }
  }
  
  /**
   * Calculate the overall influence score for an archetype
   */
  async calculateArchetypeInfluence(
    archetype: ArchetypeNode,
    relatedArchetypes: ArchetypeNode[]
  ): Promise<number> {
    const log = logger.scope('InfluenceCalculator:calculateArchetypeInfluence');
    
    try {
      log.info(`Calculating influence score for archetype ${archetype.id}`);
      
      // Calculate based on multiple factors:
      // 1. Number of content examples
      const contentCount = await this.getArchetypeContentCount(archetype.id);
      const contentFactor = Math.min(1.0, contentCount / 100); // Cap at 100 examples
      
      // 2. Average engagement of content
      const avgEngagement = await this.getAverageEngagement(archetype.id);
      const engagementFactor = Math.min(1.0, avgEngagement / 1000); // Cap at 1000 average engagement
      
      // 3. Number of influencing relationships
      const relationshipCount = await this.getRelationshipCount(archetype.id);
      const relationshipFactor = Math.min(1.0, relationshipCount / 10); // Cap at 10 relationships
      
      // Combine factors with weights
      const score = 
        contentFactor * 0.4 +
        engagementFactor * 0.4 +
        relationshipFactor * 0.2;
      
      log.info(`Calculated influence score ${score.toFixed(2)} for archetype ${archetype.id}`);
      
      return score;
    } catch (error) {
      log.error(`Error calculating archetype influence: ${error}`);
      return 0.5; // Default to medium influence on error
    }
  }
  
  /**
   * Calculate influence based on engagement metrics
   */
  private calculateEngagementBasedInfluence(
    contentExamples: any[],
    influenceScores: Map<string, number>
  ): void {
    // Find max engagement to normalize scores
    let maxEngagement = 0;
    
    for (const content of contentExamples) {
      const engagement = this.calculateTotalEngagement(content);
      if (engagement > maxEngagement) {
        maxEngagement = engagement;
      }
    }
    
    // Set normalized scores
    for (const content of contentExamples) {
      const engagement = this.calculateTotalEngagement(content);
      const score = maxEngagement > 0 ? engagement / maxEngagement : 0;
      influenceScores.set(content.id, score);
    }
  }
  
  /**
   * Calculate influence based on content spread
   */
  private calculateSpreadBasedInfluence(
    contentExamples: any[],
    influenceScores: Map<string, number>
  ): void {
    // Group by creator to find content with widest spread
    const creatorCounts = new Map<string, number>();
    
    for (const content of contentExamples) {
      const creator = this.getCreatorUsername(content);
      if (creator) {
        creatorCounts.set(creator, (creatorCounts.get(creator) || 0) + 1);
      }
    }
    
    // Calculate spread score (higher for content from creators with fewer posts)
    for (const content of contentExamples) {
      const creator = this.getCreatorUsername(content);
      if (creator && creatorCounts.has(creator)) {
        const creatorCount = creatorCounts.get(creator) || 1;
        const spreadFactor = 1 / creatorCount;
        const engagementFactor = this.calculateTotalEngagement(content) / 1000;
        
        // Combine spread and engagement
        const score = spreadFactor * 0.7 + engagementFactor * 0.3;
        influenceScores.set(content.id, Math.min(1.0, score));
      } else {
        influenceScores.set(content.id, 0.1); // Default low score if no creator
      }
    }
  }
  
  /**
   * Calculate influence based on growth over time
   */
  private calculateGrowthBasedInfluence(
    contentExamples: any[],
    influenceScores: Map<string, number>,
    timeWindow: number
  ): void {
    // Sort by date
    contentExamples.sort((a, b) => {
      const dateA = this.getContentDate(a);
      const dateB = this.getContentDate(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Calculate recency and growth rate
    const now = new Date();
    const oldestDate = timeWindow ? new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000) : new Date(0);
    
    for (const content of contentExamples) {
      const contentDate = this.getContentDate(content);
      
      // Skip content outside time window
      if (contentDate < oldestDate) {
        influenceScores.set(content.id, 0);
        continue;
      }
      
      // Calculate recency (1.0 = now, 0.0 = oldest date in window)
      const ageInWindow = (contentDate.getTime() - oldestDate.getTime()) / 
                          (now.getTime() - oldestDate.getTime());
      
      // Calculate engagement factor
      const engagementFactor = Math.min(1.0, this.calculateTotalEngagement(content) / 1000);
      
      // Combine recency and engagement
      const score = ageInWindow * 0.6 + engagementFactor * 0.4;
      influenceScores.set(content.id, score);
    }
  }
  
  /**
   * Calculate influence using a hybrid approach
   */
  private calculateHybridInfluence(
    contentExamples: any[],
    influenceScores: Map<string, number>,
    timeWindow: number,
    engagementWeight: number,
    spreadWeight: number,
    growthWeight: number
  ): void {
    // Create separate maps for each calculation
    const engagementScores = new Map<string, number>();
    const spreadScores = new Map<string, number>();
    const growthScores = new Map<string, number>();
    
    // Calculate individual scores
    this.calculateEngagementBasedInfluence(contentExamples, engagementScores);
    this.calculateSpreadBasedInfluence(contentExamples, spreadScores);
    this.calculateGrowthBasedInfluence(contentExamples, growthScores, timeWindow);
    
    // Combine scores
    for (const content of contentExamples) {
      const id = content.id;
      const engagementScore = engagementScores.get(id) || 0;
      const spreadScore = spreadScores.get(id) || 0;
      const growthScore = growthScores.get(id) || 0;
      
      const hybridScore = 
        engagementScore * engagementWeight +
        spreadScore * spreadWeight +
        growthScore * growthWeight;
      
      influenceScores.set(id, hybridScore);
    }
  }
  
  /**
   * Get content examples from database
   */
  private async getContentExamples(contentIds: string[]): Promise<any[]> {
    try {
      // Query content examples table
      const contentExamples = await this.db
        .select()
        .from(schema.contentExamples)
        .where(({ id }) => id.in(contentIds));
      
      return contentExamples;
    } catch (error) {
      logger.error(`Error fetching content examples: ${error}`);
      return [];
    }
  }
  
  /**
   * Get count of content for an archetype
   */
  private async getArchetypeContentCount(archetypeId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: ({ count }) => count() })
        .from(schema.contentExamples)
        .where(({ archetype_id }) => archetype_id.equals(archetypeId));
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error(`Error getting content count: ${error}`);
      return 0;
    }
  }
  
  /**
   * Get average engagement for an archetype's content
   */
  private async getAverageEngagement(archetypeId: string): Promise<number> {
    try {
      const contentExamples = await this.db
        .select()
        .from(schema.contentExamples)
        .where(({ archetype_id }) => archetype_id.equals(archetypeId));
      
      if (contentExamples.length === 0) {
        return 0;
      }
      
      // Calculate total engagement
      let totalEngagement = 0;
      
      for (const content of contentExamples) {
        totalEngagement += this.calculateTotalEngagement(content);
      }
      
      return totalEngagement / contentExamples.length;
    } catch (error) {
      logger.error(`Error calculating average engagement: ${error}`);
      return 0;
    }
  }
  
  /**
   * Get count of relationships for an archetype
   */
  private async getRelationshipCount(archetypeId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: ({ count }) => count() })
        .from(schema.archetypeRelationships)
        .where(({ source_id, target_id }) => 
          source_id.equals(archetypeId).or(target_id.equals(archetypeId))
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error(`Error getting relationship count: ${error}`);
      return 0;
    }
  }
  
  /**
   * Helper to calculate total engagement for content
   */
  private calculateTotalEngagement(content: any): number {
    // Extract engagement metrics
    const metrics = content.engagement_metrics || {};
    
    // Sum up engagement metrics
    return (
      (metrics.likes || 0) + 
      (metrics.shares || 0) * 3 + // Shares weighted higher
      (metrics.comments || 0) * 2  // Comments weighted higher
    );
  }
  
  /**
   * Helper to get creator username
   */
  private getCreatorUsername(content: any): string | null {
    const creatorData = content.creator_data || {};
    return creatorData.username || null;
  }
  
  /**
   * Helper to get content date
   */
  private getContentDate(content: any): Date {
    // Try content_created_at first, fall back to created_at
    const dateStr = content.content_created_at || content.created_at;
    return dateStr ? new Date(dateStr) : new Date();
  }
} 