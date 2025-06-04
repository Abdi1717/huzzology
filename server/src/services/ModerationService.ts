/**
 * ModerationService - Handles moderation actions, logs, and workflows
 */

import { eq, and, desc, asc, sql, inArray, gte, lte } from 'drizzle-orm';
import { db } from '../database/connection';
import { moderationLogs, users, contentExamples } from '../database/schema';
import type { 
  ModerationLog, 
  NewModerationLog,
  ModerationAction,
  ModerationStatus,
  User
} from '../../../shared/src/types/database';

export interface ModerationSearchOptions {
  moderator_id?: string;
  target_type?: string;
  target_id?: string;
  action?: ModerationAction[];
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'action';
  sort_order?: 'asc' | 'desc';
}

export interface ModerationStats {
  total_actions: number;
  actions_by_type: Record<ModerationAction, number>;
  moderator_activity: Array<{
    moderator_id: string;
    moderator_username: string;
    action_count: number;
  }>;
  recent_activity: Array<{
    date: string;
    action_count: number;
  }>;
}

export interface ContentModerationRequest {
  target_type: string;
  target_id: string;
  action: ModerationAction;
  reason?: string;
  notes?: string;
  moderator_id: string;
}

export class ModerationService {
  /**
   * Log a moderation action
   */
  async logAction(actionData: NewModerationLog): Promise<ModerationLog> {
    const [log] = await db
      .insert(moderationLogs)
      .values({
        ...actionData,
        metadata: actionData.metadata || {},
      })
      .returning();
    
    return log;
  }

  /**
   * Get moderation log by ID
   */
  async getLogById(id: string): Promise<ModerationLog | null> {
    const [log] = await db
      .select()
      .from(moderationLogs)
      .where(eq(moderationLogs.id, id));
    
    return log || null;
  }

  /**
   * Get moderation logs for a specific target
   */
  async getLogsForTarget(targetType: string, targetId: string): Promise<ModerationLog[]> {
    return db
      .select()
      .from(moderationLogs)
      .where(
        and(
          eq(moderationLogs.target_type, targetType),
          eq(moderationLogs.target_id, targetId)
        )
      )
      .orderBy(desc(moderationLogs.created_at));
  }

  /**
   * Get moderation logs by moderator
   */
  async getLogsByModerator(moderatorId: string, limit = 50): Promise<ModerationLog[]> {
    return db
      .select()
      .from(moderationLogs)
      .where(eq(moderationLogs.moderator_id, moderatorId))
      .orderBy(desc(moderationLogs.created_at))
      .limit(limit);
  }

  /**
   * Search moderation logs with filters
   */
  async searchLogs(options: ModerationSearchOptions = {}): Promise<ModerationLog[]> {
    let query = db.select().from(moderationLogs);

    // Apply filters
    const conditions = [];

    if (options.moderator_id) {
      conditions.push(eq(moderationLogs.moderator_id, options.moderator_id));
    }

    if (options.target_type) {
      conditions.push(eq(moderationLogs.target_type, options.target_type));
    }

    if (options.target_id) {
      conditions.push(eq(moderationLogs.target_id, options.target_id));
    }

    if (options.action && options.action.length > 0) {
      conditions.push(inArray(moderationLogs.action, options.action));
    }

    if (options.created_after) {
      conditions.push(gte(moderationLogs.created_at, options.created_after));
    }

    if (options.created_before) {
      conditions.push(lte(moderationLogs.created_at, options.created_before));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = options.sort_by || 'created_at';
    const sortOrder = options.sort_order || 'desc';
    
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(moderationLogs[sortField]));
    } else {
      query = query.orderBy(desc(moderationLogs[sortField]));
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return query;
  }

  /**
   * Moderate content (content examples, users, etc.)
   */
  async moderateContent(request: ContentModerationRequest): Promise<{
    log: ModerationLog;
    updated: boolean;
  }> {
    // Log the moderation action
    const log = await this.logAction({
      moderator_id: request.moderator_id,
      target_type: request.target_type,
      target_id: request.target_id,
      action: request.action,
      reason: request.reason,
      notes: request.notes,
      metadata: {},
    });

    let updated = false;

    // Apply the moderation action based on target type
    if (request.target_type === 'content_example') {
      updated = await this.moderateContentExample(request.target_id, request.action);
    } else if (request.target_type === 'user') {
      updated = await this.moderateUser(request.target_id, request.action);
    }

    return { log, updated };
  }

  /**
   * Moderate a content example
   */
  private async moderateContentExample(contentId: string, action: ModerationAction): Promise<boolean> {
    try {
      let status: ModerationStatus;
      
      switch (action) {
        case 'approve':
          status = 'approved';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 'flag':
          status = 'flagged';
          break;
        case 'remove':
          status = 'removed';
          break;
        case 'restore':
          status = 'approved';
          break;
        default:
          return false;
      }

      const [updated] = await db
        .update(contentExamples)
        .set({ 
          moderation_status: status,
          updated_at: new Date(),
        })
        .where(eq(contentExamples.id, contentId))
        .returning();

      return !!updated;
    } catch (error) {
      console.error('Error moderating content example:', error);
      return false;
    }
  }

  /**
   * Moderate a user
   */
  private async moderateUser(userId: string, action: ModerationAction): Promise<boolean> {
    try {
      const updates: Partial<{ is_active: boolean; updated_at: Date }> = {
        updated_at: new Date(),
      };

      switch (action) {
        case 'suspend':
        case 'ban':
          updates.is_active = false;
          break;
        case 'restore':
          updates.is_active = true;
          break;
        case 'warn':
          // Warning doesn't change user status, just logs the action
          return true;
        default:
          return false;
      }

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();

      return !!updated;
    } catch (error) {
      console.error('Error moderating user:', error);
      return false;
    }
  }

  /**
   * Get moderation statistics
   */
  async getStats(timeframe?: { start: Date; end: Date }): Promise<ModerationStats> {
    let query = db.select().from(moderationLogs);

    if (timeframe) {
      query = query.where(
        and(
          gte(moderationLogs.created_at, timeframe.start),
          lte(moderationLogs.created_at, timeframe.end)
        )
      );
    }

    const logs = await query;

    // Calculate total actions
    const total_actions = logs.length;

    // Calculate actions by type
    const actions_by_type = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<ModerationAction, number>);

    // Get moderator activity
    const moderatorActivity = await db
      .select({
        moderator_id: moderationLogs.moderator_id,
        moderator_username: users.username,
        action_count: sql<number>`count(*)`,
      })
      .from(moderationLogs)
      .leftJoin(users, eq(moderationLogs.moderator_id, users.id))
      .groupBy(moderationLogs.moderator_id, users.username)
      .orderBy(desc(sql`count(*)`));

    // Get recent activity (last 30 days by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await db
      .select({
        date: sql<string>`date(${moderationLogs.created_at})`,
        action_count: sql<number>`count(*)`,
      })
      .from(moderationLogs)
      .where(gte(moderationLogs.created_at, thirtyDaysAgo))
      .groupBy(sql`date(${moderationLogs.created_at})`)
      .orderBy(asc(sql`date(${moderationLogs.created_at})`));

    return {
      total_actions,
      actions_by_type,
      moderator_activity: moderatorActivity,
      recent_activity: recentActivity,
    };
  }

  /**
   * Get pending moderation items
   */
  async getPendingItems(): Promise<{
    content_examples: Array<{ id: string; title: string; platform: string; created_at: Date }>;
    flagged_content: Array<{ id: string; title: string; platform: string; flagged_at: Date }>;
  }> {
    // Get pending content examples
    const pendingContent = await db
      .select({
        id: contentExamples.id,
        title: contentExamples.title,
        platform: contentExamples.platform,
        created_at: contentExamples.created_at,
      })
      .from(contentExamples)
      .where(eq(contentExamples.moderation_status, 'pending'))
      .orderBy(desc(contentExamples.created_at));

    // Get flagged content
    const flaggedContent = await db
      .select({
        id: contentExamples.id,
        title: contentExamples.title,
        platform: contentExamples.platform,
        flagged_at: contentExamples.updated_at,
      })
      .from(contentExamples)
      .where(eq(contentExamples.moderation_status, 'flagged'))
      .orderBy(desc(contentExamples.updated_at));

    return {
      content_examples: pendingContent,
      flagged_content: flaggedContent,
    };
  }

  /**
   * Bulk approve content
   */
  async bulkApprove(contentIds: string[], moderatorId: string): Promise<{
    approved: number;
    logs: ModerationLog[];
  }> {
    const logs: ModerationLog[] = [];
    let approved = 0;

    for (const contentId of contentIds) {
      try {
        const result = await this.moderateContent({
          target_type: 'content_example',
          target_id: contentId,
          action: 'approve',
          moderator_id: moderatorId,
          reason: 'Bulk approval',
        });

        if (result.updated) {
          approved++;
          logs.push(result.log);
        }
      } catch (error) {
        console.error(`Error approving content ${contentId}:`, error);
      }
    }

    return { approved, logs };
  }

  /**
   * Bulk reject content
   */
  async bulkReject(contentIds: string[], moderatorId: string, reason?: string): Promise<{
    rejected: number;
    logs: ModerationLog[];
  }> {
    const logs: ModerationLog[] = [];
    let rejected = 0;

    for (const contentId of contentIds) {
      try {
        const result = await this.moderateContent({
          target_type: 'content_example',
          target_id: contentId,
          action: 'reject',
          moderator_id: moderatorId,
          reason: reason || 'Bulk rejection',
        });

        if (result.updated) {
          rejected++;
          logs.push(result.log);
        }
      } catch (error) {
        console.error(`Error rejecting content ${contentId}:`, error);
      }
    }

    return { rejected, logs };
  }

  /**
   * Get moderation history for a user
   */
  async getUserModerationHistory(userId: string): Promise<ModerationLog[]> {
    return this.getLogsForTarget('user', userId);
  }

  /**
   * Get moderation history for content
   */
  async getContentModerationHistory(contentId: string): Promise<ModerationLog[]> {
    return this.getLogsForTarget('content_example', contentId);
  }

  /**
   * Check if user can perform moderation action
   */
  canModerate(user: User): boolean {
    return user.role === 'admin' || user.role === 'moderator';
  }

  /**
   * Check if user can perform admin-level moderation
   */
  canAdminModerate(user: User): boolean {
    return user.role === 'admin';
  }
} 