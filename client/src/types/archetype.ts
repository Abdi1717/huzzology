/**
 * Archetype and Content Types for Huzzology
 */

export type Platform = 'tiktok' | 'twitter' | 'instagram' | 'reddit' | 'pinterest' | 'youtube' | 'tumblr';

export interface ContentExample {
  id: string;
  platform: Platform;
  url: string;
  caption?: string;
  timestamp: string;
  engagement_metrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
  creator?: {
    username: string;
    follower_count?: number;
  };
}

export interface ArchetypeNode {
  id: string;                    // kebab-case: 'clean-girl'
  label: string;                 // Display name: 'Clean Girl'
  description: string;           // Brief explanation
  keywords: string[];            // Hashtags and terms
  influences: string[];          // Related archetype IDs
  examples: ContentExample[];    // Source content
  color: string;                 // Hex color for visualization
  metadata: {
    origin_date?: string;
    peak_popularity?: string;
    influence_score: number;     // 0-1 scale
    platforms: Platform[];
    trending?: boolean;
    category?: string;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SearchFilters {
  query: string;
  platforms: Platform[];
  dateRange?: DateRange;
  influenceScore?: {
    min: number;
    max: number;
  };
} 