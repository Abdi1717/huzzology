/**
 * Core types for the Huzzology application
 */

export type Platform = 'tiktok' | 'twitter' | 'instagram' | 'reddit';

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
  };
}

export interface ContentExample {
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

export interface User {
  id: string;
  email: string;
  username: string;
  preferences: {
    favorite_archetypes: string[];
    hidden_platforms: Platform[];
    content_filter_level: 'low' | 'medium' | 'high';
  };
  created_at: string;
  updated_at: string;
}

export interface GraphData {
  nodes: ArchetypeNode[];
  edges: {
    source: string;
    target: string;
    weight: number;
    type: 'influence' | 'similarity' | 'evolution';
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Export all classification types
export * from './classification'; 