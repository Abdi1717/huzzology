/**
 * Zod validation schemas for API requests and responses
 */
import { z } from 'zod';

// Platform and media type enums
export const PlatformSchema = z.enum(['tiktok', 'instagram', 'twitter', 'reddit', 'youtube']);
export const MediaTypeSchema = z.enum(['image', 'video', 'text', 'audio', 'carousel']);
export const ModerationStatusSchema = z.enum(['pending', 'approved', 'rejected', 'flagged']);

// Engagement metrics schema
export const EngagementMetricsSchema = z.object({
  likes: z.number().min(0).optional(),
  shares: z.number().min(0).optional(),
  comments: z.number().min(0).optional(),
  views: z.number().min(0).optional(),
  saves: z.number().min(0).optional(),
  retweets: z.number().min(0).optional(), // Twitter
  upvotes: z.number().min(0).optional(), // Reddit
  downvotes: z.number().min(0).optional(), // Reddit
}).catchall(z.any()); // Allow additional platform-specific metrics

// Creator data schema
export const CreatorDataSchema = z.object({
  username: z.string().optional(),
  display_name: z.string().optional(),
  follower_count: z.number().min(0).optional(),
  verified: z.boolean().optional(),
  profile_url: z.string().url().optional(),
}).catchall(z.any()); // Allow additional creator info

// Classification results schema
export const ClassificationResultsSchema = z.object({
  archetype_matches: z.array(z.object({
    archetype_id: z.string().uuid(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
  })),
  keywords_extracted: z.array(z.string()),
  sentiment_score: z.number().min(-1).max(1).optional(),
  aesthetic_tags: z.array(z.string()).optional(),
  ai_model_used: z.string().optional(),
  processed_at: z.string().datetime(),
}).catchall(z.any()); // Allow additional AI results

// Content example schema (for database)
export const ContentExampleSchema = z.object({
  id: z.string().uuid(),
  archetype_id: z.string().uuid(),
  platform: PlatformSchema,
  platform_id: z.string().optional(),
  url: z.string().url(),
  content_data: z.record(z.any()).default({}),
  caption: z.string().optional(),
  media_type: MediaTypeSchema.optional(),
  engagement_metrics: EngagementMetricsSchema.default({}),
  creator_data: CreatorDataSchema.default({}),
  classification_results: ClassificationResultsSchema.default({}),
  confidence_score: z.number().min(0).max(1).optional(),
  moderation_status: ModerationStatusSchema.default('pending'),
  is_featured: z.boolean().default(false),
  content_created_at: z.string().datetime().optional(),
  scraped_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create content example request schema
export const CreateContentExampleSchema = z.object({
  archetype_id: z.string().uuid(),
  platform: PlatformSchema,
  platform_id: z.string().optional(),
  url: z.string().url(),
  content_data: z.record(z.any()).default({}),
  caption: z.string().optional(),
  media_type: MediaTypeSchema.optional(),
  engagement_metrics: EngagementMetricsSchema.default({}),
  creator_data: CreatorDataSchema.default({}),
  classification_results: ClassificationResultsSchema.optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  content_created_at: z.string().datetime().optional(),
});

// Update content example request schema
export const UpdateContentExampleSchema = CreateContentExampleSchema.partial();

// Content search query schema
export const ContentSearchQuerySchema = z.object({
  archetype_id: z.string().uuid().optional(),
  platforms: z.array(PlatformSchema).optional(),
  media_types: z.array(MediaTypeSchema).optional(),
  moderation_status: z.array(ModerationStatusSchema).optional(),
  is_featured: z.boolean().optional(),
  min_engagement: z.number().min(0).optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const ArchetypeNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string()),
  influences: z.array(z.string()),
  examples: z.array(ContentExampleSchema),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  metadata: z.object({
    origin_date: z.string().optional(),
    peak_popularity: z.string().optional(),
    influence_score: z.number().min(0).max(1),
    platforms: z.array(PlatformSchema),
  }),
});

export const UserPreferencesSchema = z.object({
  favorite_archetypes: z.array(z.string()),
  hidden_platforms: z.array(PlatformSchema),
  content_filter_level: z.enum(['low', 'medium', 'high']),
});

export const CreateArchetypeRequestSchema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  keywords: z.array(z.string()).min(1),
  platforms: z.array(PlatformSchema).min(1),
});

export const SearchArchetypesRequestSchema = z.object({
  query: z.string().optional(),
  platforms: z.array(PlatformSchema).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
}); 