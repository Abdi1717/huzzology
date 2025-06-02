/**
 * Zod validation schemas for API requests and responses
 */
import { z } from 'zod';

export const PlatformSchema = z.enum(['tiktok', 'twitter', 'instagram', 'reddit']);

export const ContentExampleSchema = z.object({
  platform: PlatformSchema,
  url: z.string().url(),
  caption: z.string().optional(),
  timestamp: z.string(),
  engagement_metrics: z.object({
    likes: z.number().min(0),
    shares: z.number().min(0),
    comments: z.number().min(0),
  }).optional(),
  creator: z.object({
    username: z.string(),
    follower_count: z.number().min(0).optional(),
  }).optional(),
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