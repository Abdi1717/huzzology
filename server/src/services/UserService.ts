/**
 * UserService - Handles user management, preferences, and interactions
 */

import { eq, and, desc, asc, inArray, gte, lte } from 'drizzle-orm';
import { db } from '../database/connection';
import { users, userArchetypeInteractions } from '../database/schema';
import type { 
  User, 
  NewUser, 
  UserArchetypeInteraction, 
  NewUserArchetypeInteraction,
  UserPreferences,
  UserRole,
  InteractionType
} from '../../../shared/src/types/database';

export interface UserSearchOptions {
  role?: UserRole[];
  is_active?: boolean;
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
  sort_by?: 'username' | 'display_name' | 'created_at' | 'last_login_at';
  sort_order?: 'asc' | 'desc';
}

export interface UserInteractionOptions {
  interaction_types?: InteractionType[];
  archetype_id?: string;
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
}

export interface UserStats {
  total_interactions: number;
  interactions_by_type: Record<InteractionType, number>;
  favorite_archetypes: Array<{
    archetype_id: string;
    interaction_count: number;
  }>;
  activity_timeline: Array<{
    date: string;
    interaction_count: number;
  }>;
}

export class UserService {
  /**
   * Create a new user
   */
  async create(userData: NewUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        preferences: userData.preferences || {},
        profile_data: userData.profile_data || {},
      })
      .returning();
    
    return user;
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user || null;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return user || null;
  }

  /**
   * Get user by username
   */
  async getByUsername(username: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    return user || null;
  }

  /**
   * Update user information
   */
  async update(id: string, updates: Partial<NewUser>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return user || null;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(id: string, preferences: Partial<UserPreferences>): Promise<User | null> {
    // Get current preferences
    const currentUser = await this.getById(id);
    if (!currentUser) return null;

    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences,
    };

    return this.update(id, { preferences: updatedPreferences });
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(id: string, role: UserRole): Promise<User | null> {
    return this.update(id, { role });
  }

  /**
   * Deactivate user account
   */
  async deactivate(id: string): Promise<User | null> {
    return this.update(id, { is_active: false });
  }

  /**
   * Reactivate user account
   */
  async reactivate(id: string): Promise<User | null> {
    return this.update(id, { is_active: true });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<User | null> {
    return this.update(id, { last_login_at: new Date() });
  }

  /**
   * Search users with filters
   */
  async search(options: UserSearchOptions = {}): Promise<User[]> {
    let query = db.select().from(users);

    // Apply filters
    const conditions = [];

    if (options.role && options.role.length > 0) {
      conditions.push(inArray(users.role, options.role));
    }

    if (options.is_active !== undefined) {
      conditions.push(eq(users.is_active, options.is_active));
    }

    if (options.created_after) {
      conditions.push(gte(users.created_at, options.created_after));
    }

    if (options.created_before) {
      conditions.push(lte(users.created_at, options.created_before));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = options.sort_by || 'created_at';
    const sortOrder = options.sort_order || 'desc';
    
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(users[sortField]));
    } else {
      query = query.orderBy(desc(users[sortField]));
    }

    // Apply pagination
    if (options.offset) {
      query = query.offset(options.offset);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query;
  }

  /**
   * Record user interaction with archetype
   */
  async recordInteraction(interactionData: NewUserArchetypeInteraction): Promise<UserArchetypeInteraction> {
    const [interaction] = await db
      .insert(userArchetypeInteractions)
      .values({
        ...interactionData,
        interaction_data: interactionData.interaction_data || {},
      })
      .returning();
    
    return interaction;
  }

  /**
   * Get user interactions
   */
  async getUserInteractions(userId: string, options: UserInteractionOptions = {}): Promise<UserArchetypeInteraction[]> {
    let query = db
      .select()
      .from(userArchetypeInteractions)
      .where(eq(userArchetypeInteractions.user_id, userId));

    // Apply filters
    const conditions = [eq(userArchetypeInteractions.user_id, userId)];

    if (options.interaction_types && options.interaction_types.length > 0) {
      conditions.push(inArray(userArchetypeInteractions.interaction_type, options.interaction_types));
    }

    if (options.archetype_id) {
      conditions.push(eq(userArchetypeInteractions.archetype_id, options.archetype_id));
    }

    if (options.created_after) {
      conditions.push(gte(userArchetypeInteractions.created_at, options.created_after));
    }

    if (options.created_before) {
      conditions.push(lte(userArchetypeInteractions.created_at, options.created_before));
    }

    query = query.where(and(...conditions));

    // Apply sorting (most recent first)
    query = query.orderBy(desc(userArchetypeInteractions.created_at));

    // Apply pagination
    if (options.offset) {
      query = query.offset(options.offset);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query;
  }

  /**
   * Get user activity statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    // Total interactions
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userArchetypeInteractions)
      .where(eq(userArchetypeInteractions.user_id, userId));

    // Interactions by type
    const interactionsByType = await db
      .select({
        interaction_type: userArchetypeInteractions.interaction_type,
        count: sql<number>`count(*)`
      })
      .from(userArchetypeInteractions)
      .where(eq(userArchetypeInteractions.user_id, userId))
      .groupBy(userArchetypeInteractions.interaction_type);

    // Favorite archetypes (most interacted with)
    const favoriteArchetypes = await db
      .select({
        archetype_id: userArchetypeInteractions.archetype_id,
        interaction_count: sql<number>`count(*)`
      })
      .from(userArchetypeInteractions)
      .where(eq(userArchetypeInteractions.user_id, userId))
      .groupBy(userArchetypeInteractions.archetype_id)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Activity timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityTimeline = await db
      .select({
        date: sql<string>`date(created_at)`,
        interaction_count: sql<number>`count(*)`
      })
      .from(userArchetypeInteractions)
      .where(
        and(
          eq(userArchetypeInteractions.user_id, userId),
          gte(userArchetypeInteractions.created_at, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(created_at)`)
      .orderBy(asc(sql`date(created_at)`));

    // Format interactions by type
    const interactionTypeMap: Record<InteractionType, number> = {
      view: 0,
      like: 0,
      save: 0,
      share: 0,
      comment: 0,
      report: 0,
      contribute: 0,
    };

    interactionsByType.forEach(item => {
      interactionTypeMap[item.interaction_type as InteractionType] = item.count;
    });

    return {
      total_interactions: totalResult.count,
      interactions_by_type: interactionTypeMap,
      favorite_archetypes: favoriteArchetypes,
      activity_timeline: activityTimeline,
    };
  }

  /**
   * Delete user and all associated data
   */
  async delete(id: string): Promise<boolean> {
    try {
      // User interactions will be cascade deleted due to foreign key constraints
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return !!deletedUser;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(
        eq(users.role, role),
        eq(users.is_active, true)
      ))
      .orderBy(asc(users.username));
  }

  /**
   * Get active moderators
   */
  async getModerators(): Promise<User[]> {
    return this.getUsersByRole('moderator');
  }

  /**
   * Get active admins
   */
  async getAdmins(): Promise<User[]> {
    return this.getUsersByRole('admin');
  }

  /**
   * Check if user has permission for action
   */
  hasPermission(user: User, action: string): boolean {
    switch (action) {
      case 'moderate_content':
        return ['moderator', 'admin'].includes(user.role);
      case 'manage_users':
        return user.role === 'admin';
      case 'curate_content':
        return ['curator', 'moderator', 'admin'].includes(user.role);
      case 'view_analytics':
        return ['moderator', 'admin'].includes(user.role);
      default:
        return false;
    }
  }
} 