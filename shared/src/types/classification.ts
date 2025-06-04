/**
 * Types for the content classification engine
 */

import { ArchetypeNode, ContentExample, Platform } from './index';

/**
 * Content item to be classified
 */
export interface ClassifiableContent {
  id: string;
  platform: Platform;
  text: string;
  media_urls?: string[];
  hashtags?: string[];
  caption?: string;
  timestamp: string;
  creator?: {
    username: string;
    follower_count?: number;
  };
  engagement_metrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Vector embedding for a content item
 */
export interface ContentEmbedding {
  contentId: string;
  vector: number[];
  model: string;
  timestamp: string;
}

/**
 * Supported embedding models
 */
export type EmbeddingModel = 'openai' | 'cohere' | 'tensorflow' | 'huggingface';

/**
 * Configuration for embedding generation
 */
export interface EmbeddingConfig {
  model: EmbeddingModel;
  dimensions?: number;
  batchSize?: number;
}

/**
 * Supported clustering methods
 */
export type ClusteringMethod = 'kmeans' | 'dbscan' | 'hierarchical' | 'spectral';

/**
 * Configuration for clustering
 */
export interface ClusteringConfig {
  method: ClusteringMethod;
  minClusterSize?: number;
  maxClusters?: number;
  iterations?: number;
  distanceThreshold?: number;
}

/**
 * Result of a clustering operation
 */
export interface ClusterResult {
  id: string;
  contentIds: string[];
  centroid: number[];
  coherence: number;
  createdAt: string;
}

/**
 * Confidence metrics for classification
 */
export interface ClassificationConfidence {
  score: number;
  factors: {
    textualMatch: number;
    hashtagMatch: number;
    contextualRelevance: number;
  };
}

/**
 * Result of classifying a single content item
 */
export interface ContentClassificationResult {
  contentId: string;
  archetypeId: string;
  confidence: ClassificationConfidence;
  timestamp: string;
  isNewArchetype: boolean;
  suggestedArchetypeName?: string;
}

/**
 * Result of a batch classification operation
 */
export interface BatchClassificationResult {
  results: ContentClassificationResult[];
  unclassified: string[];
  newArchetypes: Partial<ArchetypeNode>[];
  timestamp: string;
}

/**
 * A potential new archetype detected from unclassified content
 */
export interface EmergingArchetype {
  id: string;
  suggestedLabel: string;
  suggestedDescription: string;
  keywordCandidates: string[];
  contentExamples: string[];
  confidence: number;
  firstDetected: string;
  lastUpdated: string;
}

/**
 * Supported methods for calculating archetype influence
 */
export type InfluenceMethod = 'engagement' | 'spread' | 'growth' | 'hybrid';

/**
 * Configuration for influence score calculation
 */
export interface InfluenceConfig {
  method: InfluenceMethod;
  timeWindow?: number; // In days
  engagementWeight?: number;
  spreadWeight?: number;
  growthWeight?: number;
} 