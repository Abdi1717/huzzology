/**
 * ArchetypeService - Handles archetype management, relationships, and graph traversal
 * Optimized for performance with caching and efficient query patterns
 */

import { eq, and, desc, sql, inArray, gte, lte, or } from 'drizzle-orm';
import { db } from '../database/connection';
import { archetypes, archetypeRelationships } from '../database/schema';
import type { 
  ArchetypeNode, 
  NewArchetypeNode, 
  ArchetypeRelationship, 
  NewArchetypeRelationship,
  ArchetypeSearchQuery,
  ModerationStatus,
  RelationshipType
} from '../../../shared/src/types/database';

export interface ArchetypeWithStats extends ArchetypeNode {
  outgoing_relationships: number;
  incoming_relationships: number;
  content_examples_count: number;
  total_interactions: number;
  combined_score?: number;
}

export interface GraphTraversalOptions {
  max_depth?: number;
  relationship_types?: RelationshipType[];
  min_weight?: number;
  include_stats?: boolean;
  limit_per_level?: number;
}

export interface ArchetypeAnalytics {
  total_archetypes: number;
  active_archetypes: number;
  pending_moderation: number;
  total_relationships: number;
  avg_relationships_per_archetype: number;
  top_categories: Array<{ category: string; count: number }>;
  trending_archetypes: ArchetypeWithStats[];
  most_connected: ArchetypeWithStats[];
}

export class ArchetypeService {
  
  /**
   * Create a new archetype
   */
  async create(archetypeData: NewArchetypeNode): Promise<ArchetypeNode> {
    const [archetype] = await db
      .insert(archetypes)
      .values(archetypeData)
      .returning();
    
    return archetype;
  }

  /**
   * Get archetype by ID with optional stats
   */
  async getById(id: string, includeStats = false): Promise<ArchetypeWithStats | null> {
    if (includeStats) {
      // Use the materialized view for performance
      const [result] = await db
        .select()
        .from(sql`archetype_summary`)
        .where(sql`id = ${id}`);
      
      return result as ArchetypeWithStats || null;
    }

    const [archetype] = await db
      .select()
      .from(archetypes)
      .where(eq(archetypes.id, id));
    
    return archetype || null;
  }

  /**
   * Get archetype by slug
   */
  async getBySlug(slug: string): Promise<ArchetypeNode | null> {
    const [archetype] = await db
      .select()
      .from(archetypes)
      .where(eq(archetypes.slug, slug));
    
    return archetype || null;
  }

  /**
   * Update archetype
   */
  async update(id: string, updates: Partial<ArchetypeNode>): Promise<ArchetypeNode | null> {
    const [archetype] = await db
      .update(archetypes)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(archetypes.id, id))
      .returning();
    
    return archetype || null;
  }

  /**
   * Delete archetype (soft delete by setting status to archived)
   */
  async delete(id: string): Promise<boolean> {
    const [result] = await db
      .update(archetypes)
      .set({ status: 'archived', updated_at: new Date() })
      .where(eq(archetypes.id, id))
      .returning();
    
    return !!result;
  }

  /**
   * Advanced search with full-text search and filtering
   */
  async search(searchQuery: ArchetypeSearchQuery): Promise<{
    data: ArchetypeWithStats[];
    total: number;
  }> {
    const {
      query,
      status,
      moderation_status,
      min_popularity_score,
      min_influence_score,
      created_after,
      created_before,
      limit = 50,
      offset = 0,
      sort_by = 'popularity_score',
      sort_order = 'desc'
    } = searchQuery;

    // Build where conditions
    const conditions = [];

    // Text search using full-text search index
    if (query) {
      conditions.push(
        sql`to_tsvector('english', COALESCE(${archetypes.name}, '') || ' ' || COALESCE(${archetypes.description}, '') || ' ' || array_to_string(${archetypes.keywords}, ' ')) @@ plainto_tsquery('english', ${query})`
      );
    }

    if (status && status.length > 0) {
      conditions.push(inArray(archetypes.status, status));
    }

    if (moderation_status && moderation_status.length > 0) {
      conditions.push(inArray(archetypes.moderation_status, moderation_status));
    }

    if (min_popularity_score !== undefined) {
      conditions.push(gte(archetypes.popularity_score, min_popularity_score));
    }

    if (min_influence_score !== undefined) {
      conditions.push(gte(archetypes.influence_score, min_influence_score));
    }

    if (created_after) {
      conditions.push(gte(archetypes.created_at, created_after));
    }

    if (created_before) {
      conditions.push(lte(archetypes.created_at, created_before));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(archetypes)
      .where(whereClause);

    // Get data with stats using the materialized view
    let query_sql = sql`
      SELECT * FROM archetype_summary
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
    `;

    // Apply sorting
    if (sort_by === 'combined_score') {
      query_sql = sql`${query_sql} ORDER BY combined_score ${sort_order === 'asc' ? sql`ASC` : sql`DESC`}`;
    } else {
      const sortField = archetypes[sort_by as keyof typeof archetypes];
      query_sql = sql`${query_sql} ORDER BY ${sortField} ${sort_order === 'asc' ? sql`ASC` : sql`DESC`}`;
    }

    // Apply pagination
    query_sql = sql`${query_sql} LIMIT ${limit} OFFSET ${offset}`;

    const data = await db.execute(query_sql);

    return {
      data: data.rows as ArchetypeWithStats[],
      total: count
    };
  }

  /**
   * Get trending archetypes using the materialized view
   */
  async getTrending(limit = 20): Promise<ArchetypeWithStats[]> {
    const results = await db
      .select()
      .from(sql`trending_archetypes`)
      .limit(limit);
    
    return results as ArchetypeWithStats[];
  }

  /**
   * Graph traversal - find related archetypes with depth control
   */
  async getRelatedArchetypes(
    archetypeId: string, 
    options: GraphTraversalOptions = {}
  ): Promise<{
    nodes: ArchetypeWithStats[];
    relationships: ArchetypeRelationship[];
    levels: Record<number, string[]>;
  }> {
    const {
      max_depth = 3,
      relationship_types,
      min_weight = 0.0,
      include_stats = true,
      limit_per_level = 10
    } = options;

    const visited = new Set<string>();
    const nodes: ArchetypeWithStats[] = [];
    const relationships: ArchetypeRelationship[] = [];
    const levels: Record<number, string[]> = {};

    // Start with the root archetype
    const rootArchetype = await this.getById(archetypeId, include_stats);
    if (!rootArchetype) {
      return { nodes: [], relationships: [], levels: {} };
    }

    nodes.push(rootArchetype);
    visited.add(archetypeId);
    levels[0] = [archetypeId];

    // Breadth-first traversal
    for (let depth = 0; depth < max_depth; depth++) {
      const currentLevel = levels[depth] || [];
      const nextLevel: string[] = [];

      for (const currentId of currentLevel) {
        // Build relationship query conditions
        const relationshipConditions = [
          or(
            eq(archetypeRelationships.source_id, currentId),
            eq(archetypeRelationships.target_id, currentId)
          )
        ];

        if (relationship_types && relationship_types.length > 0) {
          relationshipConditions.push(inArray(archetypeRelationships.relationship_type, relationship_types));
        }

        if (min_weight > 0) {
          relationshipConditions.push(gte(archetypeRelationships.weight, min_weight));
        }

        // Get relationships for current node
        const nodeRelationships = await db
          .select()
          .from(archetypeRelationships)
          .where(and(...relationshipConditions))
          .orderBy(desc(archetypeRelationships.weight))
          .limit(limit_per_level);

        for (const rel of nodeRelationships) {
          relationships.push(rel);

          // Determine the connected archetype ID
          const connectedId = rel.source_id === currentId ? rel.target_id : rel.source_id;

          if (!visited.has(connectedId) && nextLevel.length < limit_per_level) {
            visited.add(connectedId);
            nextLevel.push(connectedId);

            // Get the connected archetype
            const connectedArchetype = await this.getById(connectedId, include_stats);
            if (connectedArchetype) {
              nodes.push(connectedArchetype);
            }
          }
        }
      }

      if (nextLevel.length > 0) {
        levels[depth + 1] = nextLevel;
      } else {
        break; // No more connections found
      }
    }

    return { nodes, relationships, levels };
  }

  /**
   * Create relationship between archetypes
   */
  async createRelationship(relationshipData: NewArchetypeRelationship): Promise<ArchetypeRelationship> {
    const [relationship] = await db
      .insert(archetypeRelationships)
      .values(relationshipData)
      .returning();
    
    return relationship;
  }

  /**
   * Get relationships for an archetype
   */
  async getRelationships(
    archetypeId: string,
    relationshipType?: RelationshipType
  ): Promise<ArchetypeRelationship[]> {
    let query = db
      .select()
      .from(archetypeRelationships)
      .where(
        or(
          eq(archetypeRelationships.source_id, archetypeId),
          eq(archetypeRelationships.target_id, archetypeId)
        )
      );

    if (relationshipType) {
      query = query.where(
        and(
          or(
            eq(archetypeRelationships.source_id, archetypeId),
            eq(archetypeRelationships.target_id, archetypeId)
          ),
          eq(archetypeRelationships.relationship_type, relationshipType)
        )
      );
    }

    return query.orderBy(desc(archetypeRelationships.weight));
  }

  /**
   * Update relationship
   */
  async updateRelationship(
    id: string, 
    updates: Partial<ArchetypeRelationship>
  ): Promise<ArchetypeRelationship | null> {
    const [relationship] = await db
      .update(archetypeRelationships)
      .set(updates)
      .where(eq(archetypeRelationships.id, id))
      .returning();
    
    return relationship || null;
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(id: string): Promise<boolean> {
    const [result] = await db
      .delete(archetypeRelationships)
      .where(eq(archetypeRelationships.id, id))
      .returning();
    
    return !!result;
  }

  /**
   * Get archetype analytics and statistics
   */
  async getAnalytics(): Promise<ArchetypeAnalytics> {
    // Total counts
    const [totalArchetypes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(archetypes);

    const [activeArchetypes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(archetypes)
      .where(eq(archetypes.status, 'active'));

    const [pendingModeration] = await db
      .select({ count: sql<number>`count(*)` })
      .from(archetypes)
      .where(eq(archetypes.moderation_status, 'pending'));

    const [totalRelationships] = await db
      .select({ count: sql<number>`count(*)` })
      .from(archetypeRelationships);

    // Average relationships per archetype
    const avgRelationships = totalArchetypes.count > 0 
      ? totalRelationships.count / totalArchetypes.count 
      : 0;

    // Get trending archetypes
    const trending = await this.getTrending(10);

    // Most connected archetypes
    const mostConnected = await db
      .select()
      .from(sql`archetype_summary`)
      .orderBy(sql`(outgoing_relationships + incoming_relationships) DESC`)
      .limit(10);

    return {
      total_archetypes: totalArchetypes.count,
      active_archetypes: activeArchetypes.count,
      pending_moderation: pendingModeration.count,
      total_relationships: totalRelationships.count,
      avg_relationships_per_archetype: avgRelationships,
      top_categories: [], // TODO: Implement when categories are added
      trending_archetypes: trending,
      most_connected: mostConnected as ArchetypeWithStats[]
    };
  }

  /**
   * Bulk operations for performance
   */
  async bulkCreate(archetypes: NewArchetypeNode[]): Promise<ArchetypeNode[]> {
    return db
      .insert(archetypes)
      .values(archetypes)
      .returning();
  }

  async bulkUpdateStatus(
    ids: string[], 
    status: ArchetypeNode['status']
  ): Promise<ArchetypeNode[]> {
    return db
      .update(archetypes)
      .set({ status, updated_at: new Date() })
      .where(inArray(archetypes.id, ids))
      .returning();
  }

  async bulkUpdateModerationStatus(
    ids: string[], 
    moderationStatus: ModerationStatus
  ): Promise<ArchetypeNode[]> {
    return db
      .update(archetypes)
      .set({ moderation_status: moderationStatus, updated_at: new Date() })
      .where(inArray(archetypes.id, ids))
      .returning();
  }

  /**
   * Refresh materialized views for performance
   */
  async refreshMaterializedViews(): Promise<void> {
    await db.execute(sql`REFRESH MATERIALIZED VIEW archetype_summary`);
    await db.execute(sql`REFRESH MATERIALIZED VIEW trending_archetypes`);
  }
} 