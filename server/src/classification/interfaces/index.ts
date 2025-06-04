/**
 * Classification System Interfaces
 * 
 * Defines the core interfaces for the Huzzology classification engine components.
 */

import { 
  ArchetypeNode, 
  ClassifiableContent, 
  ContentEmbedding, 
  ClusterResult, 
  EmbeddingConfig,
  ClusteringConfig,
  ContentClassificationResult,
  BatchClassificationResult,
  EmergingArchetype,
  InfluenceConfig
} from '../../../../shared/src/types';

/**
 * Interface for components that generate embeddings from content
 */
export interface EmbeddingGenerator {
  /**
   * Generate embeddings for a batch of content
   */
  generateEmbeddings(
    contents: ClassifiableContent[], 
    config?: Partial<EmbeddingConfig>
  ): Promise<ContentEmbedding[]>;
  
  /**
   * Generate a single embedding for content text
   */
  generateEmbeddingForText(
    text: string,
    config?: Partial<EmbeddingConfig>
  ): Promise<number[]>;
}

/**
 * Interface for components that cluster content into groups
 */
export interface ContentClusterer {
  /**
   * Cluster content embeddings into groups
   */
  clusterEmbeddings(
    embeddings: ContentEmbedding[],
    config?: Partial<ClusteringConfig>
  ): Promise<ClusterResult[]>;
  
  /**
   * Assign a content item to the most appropriate cluster
   */
  assignToCluster(
    embedding: ContentEmbedding,
    clusters: ClusterResult[]
  ): Promise<{ clusterId: string; similarity: number }>;
  
  /**
   * Calculate cohesion metric for a cluster
   */
  calculateClusterCohesion(
    clusterContentIds: string[], 
    embeddings: ContentEmbedding[]
  ): number;
}

/**
 * Interface for components that identify archetypes from clusters
 */
export interface ArchetypeIdentifier {
  /**
   * Identify potential archetypes from content clusters
   */
  identifyArchetypes(
    clusters: ClusterResult[],
    contents: Map<string, ClassifiableContent>,
    existingArchetypes?: ArchetypeNode[]
  ): Promise<EmergingArchetype[]>;
  
  /**
   * Check if a cluster should form a new archetype
   */
  shouldFormNewArchetype(
    cluster: ClusterResult,
    contents: Map<string, ClassifiableContent>,
    existingArchetypes: ArchetypeNode[]
  ): Promise<boolean>;
  
  /**
   * Generate a label for a potential new archetype
   */
  generateArchetypeLabel(
    cluster: ClusterResult,
    contents: Map<string, ClassifiableContent>
  ): Promise<{
    label: string;
    description: string;
    keywords: string[];
  }>;
}

/**
 * Interface for components that classify content into archetypes
 */
export interface ContentClassifier {
  /**
   * Classify content into archetypes
   */
  classifyContent(
    contents: ClassifiableContent[],
    archetypes: ArchetypeNode[]
  ): Promise<BatchClassificationResult>;
  
  /**
   * Classify a single content item
   */
  classifySingleContent(
    content: ClassifiableContent,
    archetypes: ArchetypeNode[]
  ): Promise<ContentClassificationResult>;
}

/**
 * Interface for components that calculate influence scores
 */
export interface InfluenceCalculator {
  /**
   * Calculate influence scores for content within archetypes
   */
  calculateInfluenceScores(
    archetypeId: string,
    contentIds: string[],
    config?: Partial<InfluenceConfig>
  ): Promise<Map<string, number>>;
  
  /**
   * Calculate the overall influence score for an archetype
   */
  calculateArchetypeInfluence(
    archetype: ArchetypeNode,
    relatedArchetypes: ArchetypeNode[]
  ): Promise<number>;
}

/**
 * Interface for the complete classification pipeline
 */
export interface ClassificationPipeline {
  /**
   * Process new content through the full classification pipeline
   */
  processContent(
    contents: ClassifiableContent[]
  ): Promise<BatchClassificationResult>;
  
  /**
   * Analyze content to identify emerging archetypes
   */
  identifyEmergingArchetypes(
    contents: ClassifiableContent[]
  ): Promise<EmergingArchetype[]>;
  
  /**
   * Update influence scores for all archetypes
   */
  updateInfluenceScores(): Promise<void>;
} 