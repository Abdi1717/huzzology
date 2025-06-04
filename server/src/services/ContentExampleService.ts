/**
 * ContentExample Service
 * Handles business logic for content examples from various platforms
 */

import { eq, and, desc, sql, inArray, gte, lte } from 'drizzle-orm';
import { db } from '../database/connection';
import { contentExamples } from '../database/schema';
import type { 
  ContentExample, 
  NewContentExample,
  ContentSearchQuery,
  Platform,
  ModerationStatus 
} from '../../shared/src/types/database';

export class ContentExampleService {
  /**
   * Create a new content example
   */
  async create(data: NewContentExample): Promise<ContentExample> {
    const [contentExample] = await db
      .insert(contentExamples)
      .values(data)
      .returning();
    
    return contentExample;
  }

  /**
   * Get content example by ID
   */
  async getById(id: string): Promise<ContentExample | null> {
    const [contentExample] = await db
      .select()
      .from(contentExamples)
      .where(eq(contentExamples.id, id))
      .limit(1);
    
    return contentExample || null;
  }

  /**
   * Get content examples by archetype ID
   */
  async getByArchetypeId(
    archetypeId: string, 
    options: {
      limit?: number;
      offset?: number;
      moderationStatus?: ModerationStatus[];
      platforms?: Platform[];
    } = {}
  ): Promise<ContentExample[]> {
    const { limit = 50, offset = 0, moderationStatus, platforms } = options;
    
    let query = db
      .select()
      .from(contentExamples)
      .where(eq(contentExamples.archetype_id, archetypeId));

    // Add filters
    if (moderationStatus && moderationStatus.length > 0) {
      query = query.where(
        and(
          eq(contentExamples.archetype_id, archetypeId),
          inArray(contentExamples.moderation_status, moderationStatus)
        )
      );
    }

    if (platforms && platforms.length > 0) {
      query = query.where(
        and(
          eq(contentExamples.archetype_id, archetypeId),
          inArray(contentExamples.platform, platforms)
        )
      );
    }

    return await query
      .orderBy(desc(contentExamples.content_created_at))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Search content examples with advanced filtering
   */
  async search(searchQuery: ContentSearchQuery): Promise<{
    data: ContentExample[];
    total: number;
  }> {
    const {
      archetype_id,
      platforms,
      media_types,
      moderation_status,
      is_featured,
      min_engagement,
      created_after,
      created_before,
      limit = 50,
      offset = 0
    } = searchQuery;

    // Build where conditions
    const conditions = [];

    if (archetype_id) {
      conditions.push(eq(contentExamples.archetype_id, archetype_id));
    }

    if (platforms && platforms.length > 0) {
      conditions.push(inArray(contentExamples.platform, platforms));
    }

    if (media_types && media_types.length > 0) {
      conditions.push(inArray(contentExamples.media_type, media_types));
    }

    if (moderation_status && moderation_status.length > 0) {
      conditions.push(inArray(contentExamples.moderation_status, moderation_status));
    }

    if (is_featured !== undefined) {
      conditions.push(eq(contentExamples.is_featured, is_featured));
    }

    if (created_after) {
      conditions.push(gte(contentExamples.content_created_at, created_after));
    }

    if (created_before) {
      conditions.push(lte(contentExamples.content_created_at, created_before));
    }

    // Handle minimum engagement filter (requires JSONB query)
    if (min_engagement) {
      conditions.push(
        sql`(
          COALESCE((${contentExamples.engagement_metrics}->>'likes')::int, 0) +
          COALESCE((${contentExamples.engagement_metrics}->>'shares')::int, 0) +
          COALESCE((${contentExamples.engagement_metrics}->>'comments')::int, 0)
        ) >= ${min_engagement}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentExamples)
      .where(whereClause);

    // Get data
    const data = await db
      .select()
      .from(contentExamples)
      .where(whereClause)
      .orderBy(desc(contentExamples.content_created_at))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: count
    };
  }

  /**
   * Update content example
   */
  async update(id: string, data: Partial<NewContentExample>): Promise<ContentExample | null> {
    const [updated] = await db
      .update(contentExamples)
      .set({ ...data, updated_at: new Date() })
      .where(eq(contentExamples.id, id))
      .returning();
    
    return updated || null;
  }

  /**
   * Update moderation status
   */
  async updateModerationStatus(
    id: string, 
    status: ModerationStatus
  ): Promise<ContentExample | null> {
    return this.update(id, { moderation_status: status });
  }

  /**
   * Set featured status
   */
  async setFeatured(id: string, featured: boolean): Promise<ContentExample | null> {
    return this.update(id, { is_featured: featured });
  }

  /**
   * Delete content example
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(contentExamples)
      .where(eq(contentExamples.id, id));
    
    return result.rowCount > 0;
  }

  /**
   * Get featured content examples
   */
  async getFeatured(limit: number = 20): Promise<ContentExample[]> {
    return await db
      .select()
      .from(contentExamples)
      .where(
        and(
          eq(contentExamples.is_featured, true),
          eq(contentExamples.moderation_status, 'approved')
        )
      )
      .orderBy(desc(contentExamples.content_created_at))
      .limit(limit);
  }

  /**
   * Get content examples by platform
   */
  async getByPlatform(
    platform: Platform,
    options: {
      limit?: number;
      offset?: number;
      moderationStatus?: ModerationStatus;
    } = {}
  ): Promise<ContentExample[]> {
    const { limit = 50, offset = 0, moderationStatus = 'approved' } = options;
    
    return await db
      .select()
      .from(contentExamples)
      .where(
        and(
          eq(contentExamples.platform, platform),
          eq(contentExamples.moderation_status, moderationStatus)
        )
      )
      .orderBy(desc(contentExamples.content_created_at))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get content examples with archetype information
   */
  async getWithArchetypes(
    options: {
      limit?: number;
      offset?: number;
      moderationStatus?: ModerationStatus;
    } = {}
  ): Promise<Array<ContentExample & { archetype: { id: string; name: string; slug: string } }>> {
    const { limit = 50, offset = 0, moderationStatus = 'approved' } = options;
    
    return await db
      .select({
        ...contentExamples,
        archetype: {
          id: archetypes.id,
          name: archetypes.name,
          slug: archetypes.slug
        }
      })
      .from(contentExamples)
      .innerJoin(archetypes, eq(contentExamples.archetype_id, archetypes.id))
      .where(eq(contentExamples.moderation_status, moderationStatus))
      .orderBy(desc(contentExamples.content_created_at))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get engagement statistics for content examples
   */
  async getEngagementStats(archetypeId?: string): Promise<{
    total_content: number;
    avg_likes: number;
    avg_shares: number;
    avg_comments: number;
    platform_breakdown: Array<{
      platform: Platform;
      count: number;
      avg_engagement: number;
    }>;
  }> {
    const whereClause = archetypeId 
      ? and(
          eq(contentExamples.archetype_id, archetypeId),
          eq(contentExamples.moderation_status, 'approved')
        )
      : eq(contentExamples.moderation_status, 'approved');

    // Get overall stats
    const [overallStats] = await db
      .select({
        total_content: sql<number>`count(*)`,
        avg_likes: sql<number>`avg(COALESCE((${contentExamples.engagement_metrics}->>'likes')::int, 0))`,
        avg_shares: sql<number>`avg(COALESCE((${contentExamples.engagement_metrics}->>'shares')::int, 0))`,
        avg_comments: sql<number>`avg(COALESCE((${contentExamples.engagement_metrics}->>'comments')::int, 0))`
      })
      .from(contentExamples)
      .where(whereClause);

    // Get platform breakdown
    const platformStats = await db
      .select({
        platform: contentExamples.platform,
        count: sql<number>`count(*)`,
        avg_engagement: sql<number>`avg(
          COALESCE((${contentExamples.engagement_metrics}->>'likes')::int, 0) +
          COALESCE((${contentExamples.engagement_metrics}->>'shares')::int, 0) +
          COALESCE((${contentExamples.engagement_metrics}->>'comments')::int, 0)
        )`
      })
      .from(contentExamples)
      .where(whereClause)
      .groupBy(contentExamples.platform)
      .orderBy(desc(sql`count(*)`));

    return {
      ...overallStats,
      platform_breakdown: platformStats
    };
  }

  /**
   * Bulk update moderation status
   */
  async bulkUpdateModerationStatus(
    ids: string[],
    status: ModerationStatus
  ): Promise<number> {
    const result = await db
      .update(contentExamples)
      .set({ 
        moderation_status: status,
        updated_at: new Date()
      })
      .where(inArray(contentExamples.id, ids));
    
    return result.rowCount;
  }
}

export const contentExampleService = new ContentExampleService(); 