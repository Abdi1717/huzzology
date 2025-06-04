/**
 * K-means implementation of the ContentClusterer interface
 */

import { 
  ClusteringConfig, 
  ClusterResult, 
  ContentEmbedding 
} from '../../../../shared/src/types';
import { ContentClusterer } from '../interfaces';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class KMeansClusterer implements ContentClusterer {
  private defaultConfig: ClusteringConfig;

  constructor() {
    this.defaultConfig = {
      method: 'kmeans',
      minClusterSize: 5,
      maxClusters: 20,
      iterations: 100
    };
  }

  /**
   * Cluster content embeddings using K-means algorithm
   */
  async clusterEmbeddings(
    embeddings: ContentEmbedding[],
    config?: Partial<ClusteringConfig>
  ): Promise<ClusterResult[]> {
    const log = logger.scope('KMeansClusterer:clusterEmbeddings');
    const clusteringConfig = { ...this.defaultConfig, ...config };
    
    if (embeddings.length === 0) {
      log.info('No embeddings provided for clustering');
      return [];
    }
    
    log.info(`Running K-means clustering on ${embeddings.length} embeddings`);
    
    try {
      // Determine optimal number of clusters (k)
      const k = this.determineClusterCount(embeddings.length, clusteringConfig);
      
      if (k <= 1) {
        // Not enough data for meaningful clustering
        log.info('Not enough data for K-means clustering, returning single cluster');
        
        // Return single cluster with all items
        const allIds = embeddings.map(e => e.contentId);
        return [{
          id: `cluster-${uuidv4().slice(0, 8)}`,
          contentIds: allIds,
          centroid: this.calculateCentroid(allIds, embeddings),
          coherence: 1.0, // Default coherence for single cluster
          createdAt: new Date().toISOString()
        }];
      }
      
      log.info(`Using k=${k} clusters, running for ${clusteringConfig.iterations} iterations`);
      
      // Initialize k random centroids
      const dimensions = embeddings[0].vector.length;
      let centroids: number[][] = this.initializeCentroids(k, embeddings);
      let clusterAssignments: Map<string, number> = new Map(); // contentId -> cluster index
      
      // Run K-means iterations
      for (let iter = 0; iter < (clusteringConfig.iterations || 100); iter++) {
        // Assign points to nearest centroid
        const newAssignments = new Map<string, number>();
        
        for (const embedding of embeddings) {
          const closestCentroidIndex = this.findClosestCentroidIndex(embedding.vector, centroids);
          newAssignments.set(embedding.contentId, closestCentroidIndex);
        }
        
        // Check if clusters have stabilized
        let assignmentsChanged = false;
        for (const [contentId, clusterIndex] of newAssignments.entries()) {
          if (clusterAssignments.get(contentId) !== clusterIndex) {
            assignmentsChanged = true;
            break;
          }
        }
        
        if (!assignmentsChanged && iter > 0) {
          log.info(`K-means converged after ${iter} iterations`);
          break;
        }
        
        clusterAssignments = newAssignments;
        
        // Recalculate centroids
        centroids = this.recalculateCentroids(clusterAssignments, embeddings, k, dimensions);
      }
      
      // Convert cluster assignments to result format
      const clusters: ClusterResult[] = [];
      const clusterContentIds: Map<number, string[]> = new Map();
      
      // Group content IDs by cluster
      for (const [contentId, clusterIndex] of clusterAssignments.entries()) {
        if (!clusterContentIds.has(clusterIndex)) {
          clusterContentIds.set(clusterIndex, []);
        }
        clusterContentIds.get(clusterIndex)?.push(contentId);
      }
      
      // Create cluster results
      for (const [clusterIndex, contentIds] of clusterContentIds.entries()) {
        // Skip clusters smaller than minClusterSize
        if (contentIds.length < (clusteringConfig.minClusterSize || 3)) {
          continue;
        }
        
        clusters.push({
          id: `cluster-${uuidv4().slice(0, 8)}`,
          contentIds,
          centroid: centroids[clusterIndex],
          coherence: this.calculateClusterCohesion(contentIds, embeddings),
          createdAt: new Date().toISOString()
        });
      }
      
      log.info(`Created ${clusters.length} clusters from k=${k}`);
      return clusters;
    } catch (error) {
      log.error(`Error in K-means clustering: ${error}`);
      throw new Error(`K-means clustering failed: ${error}`);
    }
  }

  /**
   * Assign a content item to the closest cluster
   */
  async assignToCluster(
    embedding: ContentEmbedding,
    clusters: ClusterResult[]
  ): Promise<{ clusterId: string; similarity: number }> {
    if (clusters.length === 0) {
      throw new Error('No clusters provided for assignment');
    }
    
    let bestClusterId = clusters[0].id;
    let highestSimilarity = -1;
    
    for (const cluster of clusters) {
      const similarity = this.cosineSimilarity(embedding.vector, cluster.centroid);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestClusterId = cluster.id;
      }
    }
    
    return {
      clusterId: bestClusterId,
      similarity: highestSimilarity
    };
  }

  /**
   * Calculate cluster cohesion
   */
  calculateClusterCohesion(
    clusterContentIds: string[],
    embeddings: ContentEmbedding[]
  ): number {
    const clusterEmbeddings = embeddings.filter(e => clusterContentIds.includes(e.contentId));
    
    if (clusterEmbeddings.length <= 1) {
      return 1.0; // Perfect cohesion for single-item clusters
    }
    
    // Calculate average pairwise similarity
    let totalSimilarity = 0;
    let pairCount = 0;
    
    for (let i = 0; i < clusterEmbeddings.length; i++) {
      for (let j = i + 1; j < clusterEmbeddings.length; j++) {
        const similarity = this.cosineSimilarity(
          clusterEmbeddings[i].vector,
          clusterEmbeddings[j].vector
        );
        
        totalSimilarity += similarity;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }

  /**
   * Calculate centroid of vectors
   */
  private calculateCentroid(
    contentIds: string[],
    embeddings: ContentEmbedding[]
  ): number[] {
    const relevantEmbeddings = embeddings.filter(e => contentIds.includes(e.contentId));
    
    if (relevantEmbeddings.length === 0) {
      throw new Error('Cannot calculate centroid for empty cluster');
    }
    
    const dimensions = relevantEmbeddings[0].vector.length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const embedding of relevantEmbeddings) {
      for (let d = 0; d < dimensions; d++) {
        centroid[d] += embedding.vector[d] / relevantEmbeddings.length;
      }
    }
    
    return centroid;
  }

  /**
   * Determine the appropriate number of clusters
   */
  private determineClusterCount(
    dataSize: number,
    config: ClusteringConfig
  ): number {
    // Simple heuristic: sqrt(n/2) bounded by min and max
    const suggestedK = Math.ceil(Math.sqrt(dataSize / 2));
    
    // Ensure k is within bounds
    return Math.min(
      config.maxClusters || 20,
      Math.max(2, Math.min(suggestedK, dataSize / (config.minClusterSize || 5)))
    );
  }

  /**
   * Initialize k centroids from the data
   */
  private initializeCentroids(
    k: number,
    embeddings: ContentEmbedding[]
  ): number[][] {
    // Use k-means++ style initialization
    const centroids: number[][] = [];
    const dimensions = embeddings[0].vector.length;
    
    // Select first centroid randomly
    const firstIndex = Math.floor(Math.random() * embeddings.length);
    centroids.push([...embeddings[firstIndex].vector]);
    
    // Select remaining centroids with probability proportional to distance
    for (let i = 1; i < k; i++) {
      const distances = embeddings.map(embedding => {
        // Calculate minimum distance to any existing centroid
        let minDistance = Number.MAX_VALUE;
        for (const centroid of centroids) {
          const distance = this.squaredEuclideanDistance(embedding.vector, centroid);
          minDistance = Math.min(minDistance, distance);
        }
        return minDistance;
      });
      
      // Calculate sum of distances
      const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);
      
      // Select next centroid with probability proportional to distance
      let target = Math.random() * totalDistance;
      let sum = 0;
      let nextIndex = 0;
      
      for (let j = 0; j < distances.length; j++) {
        sum += distances[j];
        if (sum >= target) {
          nextIndex = j;
          break;
        }
      }
      
      centroids.push([...embeddings[nextIndex].vector]);
    }
    
    return centroids;
  }

  /**
   * Find the index of the closest centroid
   */
  private findClosestCentroidIndex(
    vector: number[],
    centroids: number[][]
  ): number {
    let closestIndex = 0;
    let minDistance = Number.MAX_VALUE;
    
    for (let i = 0; i < centroids.length; i++) {
      const distance = this.squaredEuclideanDistance(vector, centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  }

  /**
   * Recalculate centroids based on cluster assignments
   */
  private recalculateCentroids(
    clusterAssignments: Map<string, number>,
    embeddings: ContentEmbedding[],
    k: number,
    dimensions: number
  ): number[][] {
    // Initialize centroids as zeros
    const newCentroids: number[][] = Array(k)
      .fill(null)
      .map(() => new Array(dimensions).fill(0));
    
    // Count points in each cluster
    const clusterCounts = new Array(k).fill(0);
    
    // Sum vectors for each cluster
    for (const embedding of embeddings) {
      const clusterIndex = clusterAssignments.get(embedding.contentId);
      if (clusterIndex !== undefined) {
        clusterCounts[clusterIndex]++;
        for (let d = 0; d < dimensions; d++) {
          newCentroids[clusterIndex][d] += embedding.vector[d];
        }
      }
    }
    
    // Divide by count to get average
    for (let i = 0; i < k; i++) {
      if (clusterCounts[i] > 0) {
        for (let d = 0; d < dimensions; d++) {
          newCentroids[i][d] /= clusterCounts[i];
        }
      }
    }
    
    // Handle empty clusters by assigning a random point
    for (let i = 0; i < k; i++) {
      if (clusterCounts[i] === 0) {
        const randomIndex = Math.floor(Math.random() * embeddings.length);
        newCentroids[i] = [...embeddings[randomIndex].vector];
      }
    }
    
    return newCentroids;
  }

  /**
   * Calculate squared Euclidean distance between vectors
   */
  private squaredEuclideanDistance(vecA: number[], vecB: number[]): number {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return sum;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
} 