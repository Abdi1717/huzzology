/**
 * Database types for Huzzology
 * Corresponds to PostgreSQL schema with JSONB support
 */

// ============================================================================
// CORE ARCHETYPE TYPES
// ============================================================================

export interface ArchetypeNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  keywords: string[];
  color?: string;
  
  // Metadata stored as JSONB
  metadata: Record<string, any>;
  
  // Popularity and influence metrics
  influence_score: number; // 0.0 to 1.0
  popularity_score: number;
  trending_score: number;
  
  // Temporal data
  origin_date?: Date;
  peak_popularity_date?: Date;
  
  // Status and moderation
  status: 'active' | 'archived' | 'pending' | 'rejected';
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  
  // Audit fields
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface ArchetypeRelationship {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  weight: number; // 0.0 to 1.0
  metadata: Record<string, any>;
  created_at: Date;
  created_by?: string;
}

export type RelationshipType = 
  | 'parent' 
  | 'child' 
  | 'related' 
  | 'conflicting' 
  | 'evolved_from' 
  | 'evolved_to'
  | 'similar' 
  | 'opposite' 
  | 'influenced_by' 
  | 'influences';

export interface ArchetypeCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parent_id?: string;
  created_at: Date;
}

export interface ArchetypeCategoryMapping {
  archetype_id: string;
  category_id: string;
  created_at: Date;
}

// ============================================================================
// CONTENT EXAMPLE TYPES
// ============================================================================

export interface ContentExample {
  id: string;
  archetype_id: string;
  platform: Platform;
  platform_id?: string;
  url: string;
  content_data: Record<string, any>; // Platform-specific data
  caption?: string;
  media_type?: MediaType;
  engagement_metrics: EngagementMetrics;
  creator_data: CreatorData;
  classification_results: ClassificationResults;
  confidence_score?: number; // 0.0 to 1.0
  moderation_status: ModerationStatus;
  is_featured: boolean;
  content_created_at?: Date;
  scraped_at: Date;
  created_at: Date;
  updated_at: Date;
}

export type Platform = 'tiktok' | 'instagram' | 'twitter' | 'reddit' | 'youtube';

export type MediaType = 'image' | 'video' | 'text' | 'audio' | 'carousel';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

// Platform-specific engagement metrics
export interface EngagementMetrics {
  likes?: number;
  shares?: number;
  comments?: number;
  views?: number;
  saves?: number;
  retweets?: number; // Twitter
  upvotes?: number; // Reddit
  downvotes?: number; // Reddit
  [key: string]: any; // Allow additional platform-specific metrics
}

export interface CreatorData {
  username?: string;
  display_name?: string;
  follower_count?: number;
  verified?: boolean;
  profile_url?: string;
  [key: string]: any; // Allow additional creator info
}

export interface ClassificationResults {
  archetype_matches: Array<{
    archetype_id: string;
    confidence: number;
    reasoning?: string;
  }>;
  keywords_extracted: string[];
  sentiment_score?: number;
  aesthetic_tags?: string[];
  ai_model_used?: string;
  processed_at: Date;
  [key: string]: any; // Allow additional AI results
}

// ============================================================================
// USER AND INTERACTION TYPES
// ============================================================================

export interface User {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  preferences: UserPreferences;
  role: UserRole;
  is_active: boolean;
  profile_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export type UserRole = 'user' | 'moderator' | 'admin' | 'curator';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: {
    email: boolean;
    push: boolean;
    trending_archetypes: boolean;
    new_content: boolean;
  };
  privacy?: {
    profile_visibility: 'public' | 'private';
    interaction_history: 'public' | 'private';
  };
  content_filters?: {
    platforms: Platform[];
    content_types: MediaType[];
    min_engagement_threshold?: number;
  };
  [key: string]: any; // Allow additional preferences
}

export interface UserArchetypeInteraction {
  id: string;
  user_id: string;
  archetype_id: string;
  interaction_type: InteractionType;
  interaction_data: Record<string, any>;
  created_at: Date;
}

export type InteractionType = 
  | 'view' 
  | 'like' 
  | 'save' 
  | 'share' 
  | 'comment' 
  | 'report' 
  | 'contribute';

export interface ModerationLog {
  id: string;
  moderator_id: string;
  target_type: 'archetype' | 'content_example' | 'user' | 'relationship';
  target_id: string;
  action: ModerationAction;
  previous_status?: string;
  new_status?: string;
  reason?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export type ModerationAction = 
  | 'approve' 
  | 'reject' 
  | 'flag' 
  | 'unflag' 
  | 'edit' 
  | 'delete' 
  | 'restore';

// ============================================================================
// VIEW TYPES (for database views)
// ============================================================================

export interface ArchetypeSummary extends ArchetypeNode {
  outgoing_relationships: number;
  incoming_relationships: number;
  content_examples_count: number;
  total_interactions: number;
}

export interface TrendingArchetype extends ArchetypeNode {
  combined_score: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateArchetypeRequest {
  name: string;
  description?: string;
  keywords?: string[];
  color?: string;
  metadata?: Record<string, any>;
  category_ids?: string[];
}

export interface UpdateArchetypeRequest {
  name?: string;
  description?: string;
  keywords?: string[];
  color?: string;
  metadata?: Record<string, any>;
  status?: ArchetypeNode['status'];
}

export interface CreateRelationshipRequest {
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface ArchetypeSearchQuery {
  query?: string;
  categories?: string[];
  status?: ArchetypeNode['status'][];
  moderation_status?: ModerationStatus[];
  min_popularity_score?: number;
  min_influence_score?: number;
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'popularity_score' | 'trending_score' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ContentSearchQuery {
  archetype_id?: string;
  platforms?: Platform[];
  media_types?: MediaType[];
  moderation_status?: ModerationStatus[];
  is_featured?: boolean;
  min_engagement?: number;
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// GRAPH VISUALIZATION TYPES
// ============================================================================

export interface GraphNode {
  id: string;
  label: string;
  data: ArchetypeNode;
  position: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data: ArchetypeRelationship;
  label?: string;
  style?: {
    strokeWidth?: number;
    stroke?: string;
    strokeDasharray?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    layout_algorithm?: string;
    generated_at: Date;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// Database connection and query types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle_timeout: number;
  };
}

export interface QueryOptions {
  transaction?: any; // Database transaction object
  timeout?: number;
  cache?: boolean;
  cache_ttl?: number;
} 