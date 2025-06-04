/**
 * Clustering Service for Huzzology
 * 
 * Handles content clustering operations to identify potential archetype groups.
 */

import { 
  ClassifiableContent,
  ClusteringConfig,
  ClusterResult,
  ContentEmbedding
} from '../../../shared/src/types';
import logger from '../utils/logger';
import EmbeddingService from './EmbeddingService';

class ClusteringService {
  private defaultClusteringConfig: ClusteringConfig;
  
  constructor() {
    this.defaultClusteringConfig = {
      method: 'kmeans',
      minClusterSize: 5,
      maxClusters: 20,
      iterations: 100
    };
  }
  
  /**
   * Cluster content embeddings to identify potential archetype groups
   */
  async clusterEmbeddings(
    embeddings: ContentEmbedding[],
    config: Partial<ClusteringConfig> = {}
  ): Promise<ClusterResult[]> {
    const clusteringConfig = { ...this.defaultClusteringConfig, ...config };
    const log = logger.scope('ClusteringService:clusterEmbeddings');
    
    log.info(`Clustering ${embeddings.length} embeddings using ${clusteringConfig.method}`);
    
    try {
      let clusters: ClusterResult[] = [];
      
      switch (clusteringConfig.method) {
        case 'kmeans':
          clusters = await this.performKMeansClustering(embeddings, clusteringConfig);
          break;
        case 'dbscan':
          clusters = await this.performDBSCANClustering(embeddings, clusteringConfig);
          break;
        case 'hierarchical':
          clusters = await this.performHierarchicalClustering(embeddings, clusteringConfig);
          break;
        case 'spectral':
          clusters = await this.performSpectralClustering(embeddings, clusteringConfig);
          break;
        default:
          throw new Error(`Clustering method ${clusteringConfig.method} not supported`);
      }
      
      log.info(`Created ${clusters.length} clusters`);
      return clusters;
    } catch (error) {
      log.error(`Error clustering embeddings: ${error}`);
      throw new Error(`Failed to cluster embeddings: ${error}`);
    }
  }
  
  /**
   * Calculate the cohesion score for a cluster (how similar items within cluster are)
   */
  calculateClusterCohesion(
    cluster: string[], 
    embeddings: ContentEmbedding[]
  ): number {
    const clusterEmbeddings = embeddings.filter(e => cluster.includes(e.contentId));
    
    if (clusterEmbeddings.length <= 1) {
      return 1.0; // Perfect cohesion for single-item clusters
    }
    
    // Calculate average pairwise similarity
    let totalSimilarity = 0;
    let pairCount = 0;
    
    for (let i = 0; i < clusterEmbeddings.length; i++) {
      for (let j = i + 1; j < clusterEmbeddings.length; j++) {
        const similarity = EmbeddingService.calculateCosineSimilarity(
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
   * Calculate cluster centroid (average vector for all items in cluster)
   */
  calculateClusterCentroid(
    cluster: string[], 
    embeddings: ContentEmbedding[]
  ): number[] {
    const clusterEmbeddings = embeddings.filter(e => cluster.includes(e.contentId));
    
    if (clusterEmbeddings.length === 0) {
      throw new Error('Cannot calculate centroid for empty cluster');
    }
    
    const dimensions = clusterEmbeddings[0].vector.length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const embedding of clusterEmbeddings) {
      for (let d = 0; d < dimensions; d++) {
        centroid[d] += embedding.vector[d] / clusterEmbeddings.length;
      }
    }
    
    return centroid;
  }
  
  /**
   * Find closest cluster for a content item
   */
  findClosestCluster(
    embedding: ContentEmbedding,
    clusters: ClusterResult[]
  ): { clusterId: string; similarity: number } {
    if (clusters.length === 0) {
      throw new Error('No clusters provided');
    }
    
    let bestClusterId = '';
    let highestSimilarity = -1;
    
    for (const cluster of clusters) {
      const similarity = EmbeddingService.calculateCosineSimilarity(
        embedding.vector,
        cluster.centroid
      );
      
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
  
  // Implementation of clustering algorithms
  
  private async performKMeansClustering(
    embeddings: ContentEmbedding[],
    config: ClusteringConfig
  ): Promise<ClusterResult[]> {
    if (embeddings.length === 0) {
      return [];
    }
    
    const log = logger.scope('ClusteringService:performKMeansClustering');
    
    // Determine number of clusters (k)
    const k = Math.min(
      config.maxClusters || 10,
      Math.max(2, Math.floor(embeddings.length / (config.minClusterSize || 5)))
    );
    
    if (k <= 1 || embeddings.length < k) {
      // Not enough data for meaningful clustering
      log.info('Not enough data for K-means clustering');
      
      // Return single cluster with all items
      const allIds = embeddings.map(e => e.contentId);
      return [{
        id: 'cluster-all',
        contentIds: allIds,
        centroid: this.calculateClusterCentroid(allIds, embeddings),
        coherence: 1.0, // Default coherence
        createdAt: new Date().toISOString()
      }];
    }
    
    log.info(`Running K-means with k=${k}, iterations=${config.iterations}`);
    
    // Initialize k random centroids
    const dimensions = embeddings[0].vector.length;
    let centroids: number[][] = [];
    
    // Simple initialization: pick k random embeddings as initial centroids
    const randomIndices = new Set<number>();
    while (randomIndices.size < k) {
      randomIndices.add(Math.floor(Math.random() * embeddings.length));
    }
    
    centroids = Array.from(randomIndices).map(idx => [...embeddings[idx].vector]);
    
    // Assign points to clusters and update centroids
    const iterations = config.iterations || 100;
    let clusterAssignments: number[] = new Array(embeddings.length).fill(-1);
    
    for (let iter = 0; iter < iterations; iter++) {
      let changed = false;
      
      // Assign each point to nearest centroid
      for (let i = 0; i < embeddings.length; i++) {
        let minDistance = Infinity;
        let newCluster = -1;
        
        for (let j = 0; j < k; j++) {
          const distance = this.euclideanDistance(embeddings[i].vector, centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            newCluster = j;
          }
        }
        
        if (clusterAssignments[i] !== newCluster) {
          changed = true;
          clusterAssignments[i] = newCluster;
        }
      }
      
      // If no assignments changed, we've converged
      if (!changed && iter > 0) {
        log.info(`K-means converged after ${iter} iterations`);
        break;
      }
      
      // Update centroids
      const newCentroids: number[][] = Array(k).fill(0).map(() => Array(dimensions).fill(0));
      const counts: number[] = Array(k).fill(0);
      
      for (let i = 0; i < embeddings.length; i++) {
        const clusterId = clusterAssignments[i];
        if (clusterId === -1) continue;
        
        counts[clusterId]++;
        for (let d = 0; d < dimensions; d++) {
          newCentroids[clusterId][d] += embeddings[i].vector[d];
        }
      }
      
      // Calculate average for each centroid
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          for (let d = 0; d < dimensions; d++) {
            newCentroids[j][d] /= counts[j];
          }
          centroids[j] = newCentroids[j];
        }
      }
    }
    
    // Build final cluster results
    const clusterResults: ClusterResult[] = [];
    const clusterContentIds: string[][] = Array(k).fill(0).map(() => []);
    
    for (let i = 0; i < embeddings.length; i++) {
      const clusterId = clusterAssignments[i];
      if (clusterId !== -1) {
        clusterContentIds[clusterId].push(embeddings[i].contentId);
      }
    }
    
    // Filter out empty clusters and those below minimum size
    for (let j = 0; j < k; j++) {
      if (clusterContentIds[j].length >= (config.minClusterSize || 3)) {
        const coherence = this.calculateClusterCohesion(
          clusterContentIds[j],
          embeddings
        );
        
        clusterResults.push({
          id: `cluster-${j}`,
          contentIds: clusterContentIds[j],
          centroid: centroids[j],
          coherence,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    log.info(`K-means produced ${clusterResults.length} valid clusters`);
    return clusterResults;
  }
  
  private async performDBSCANClustering(
    embeddings: ContentEmbedding[],
    config: ClusteringConfig
  ): Promise<ClusterResult[]> {
    // Simple placeholder implementation - in a real app, use a proper library
    const log = logger.scope('ClusteringService:performDBSCANClustering');
    log.info('DBSCAN clustering not fully implemented, using simplified version');
    
    const eps = config.distanceThreshold || 0.5;
    const minPts = config.minClusterSize || 5;
    
    // Labels: -1 for noise, 0+ for cluster assignments
    const labels: number[] = new Array(embeddings.length).fill(-1);
    let clusterIdx = 0;
    
    // Simple DBSCAN implementation
    for (let i = 0; i < embeddings.length; i++) {
      if (labels[i] !== -1) continue; // Already processed
      
      // Find neighbors
      const neighbors: number[] = [];
      for (let j = 0; j < embeddings.length; j++) {
        if (i === j) continue;
        
        const distance = this.euclideanDistance(embeddings[i].vector, embeddings[j].vector);
        if (distance <= eps) {
          neighbors.push(j);
        }
      }
      
      if (neighbors.length < minPts - 1) {
        // Mark as noise
        labels[i] = -1;
        continue;
      }
      
      // Start a new cluster
      labels[i] = clusterIdx;
      
      // Expand cluster (simplified)
      for (const j of neighbors) {
        labels[j] = clusterIdx;
      }
      
      clusterIdx++;
    }
    
    // Build final cluster results
    const clusterContentIds: Map<number, string[]> = new Map();
    
    for (let i = 0; i < embeddings.length; i++) {
      if (labels[i] >= 0) {
        if (!clusterContentIds.has(labels[i])) {
          clusterContentIds.set(labels[i], []);
        }
        clusterContentIds.get(labels[i])!.push(embeddings[i].contentId);
      }
    }
    
    const clusterResults: ClusterResult[] = [];
    
    for (const [idx, contentIds] of clusterContentIds.entries()) {
      if (contentIds.length >= minPts) {
        const centroid = this.calculateClusterCentroid(contentIds, embeddings);
        const coherence = this.calculateClusterCohesion(contentIds, embeddings);
        
        clusterResults.push({
          id: `cluster-${idx}`,
          contentIds,
          centroid,
          coherence,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    log.info(`DBSCAN produced ${clusterResults.length} clusters`);
    return clusterResults;
  }
  
  private async performHierarchicalClustering(
    embeddings: ContentEmbedding[],
    config: ClusteringConfig
  ): Promise<ClusterResult[]> {
    // Placeholder for hierarchical clustering
    // In a real implementation, use a library or implement properly
    const log = logger.scope('ClusteringService:performHierarchicalClustering');
    log.warn('Hierarchical clustering not implemented, falling back to K-means');
    
    return this.performKMeansClustering(embeddings, config);
  }
  
  private async performSpectralClustering(
    embeddings: ContentEmbedding[],
    config: ClusteringConfig
  ): Promise<ClusterResult[]> {
    // Placeholder for spectral clustering
    // In a real implementation, use a library or implement properly
    const log = logger.scope('ClusteringService:performSpectralClustering');
    log.warn('Spectral clustering not implemented, falling back to K-means');
    
    return this.performKMeansClustering(embeddings, config);
  }
  
  // Helper methods
  
  private euclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    
    return Math.sqrt(sum);
  }
}

export default new ClusteringService(); 