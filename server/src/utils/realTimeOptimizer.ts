/**
 * Real-Time Update Optimization System
 * Optimizes real-time data updates, caching, and synchronization
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { db } from '../database/connection';
import { QueryMonitor } from './queryMonitor';

interface UpdateEvent {
  type: 'archetype' | 'trend' | 'aesthetic' | 'user' | 'moderation';
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: any;
  timestamp: number;
  userId?: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  version: number;
}

interface BatchUpdate {
  updates: UpdateEvent[];
  scheduledAt: number;
  timeout: NodeJS.Timeout;
}

/**
 * Real-time update optimizer with intelligent caching and batching
 */
export class RealTimeOptimizer extends EventEmitter {
  private static instance: RealTimeOptimizer;
  private redis: Redis;
  private queryMonitor: QueryMonitor;
  private cache: Map<string, CacheEntry> = new Map();
  private batchUpdates: Map<string, BatchUpdate> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // userId -> Set of subscribed resources
  
  // Configuration
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_TIMEOUT = 100; // ms
  private readonly CACHE_TTL = {
    archetype: 300000, // 5 minutes
    trend: 180000,     // 3 minutes
    aesthetic: 300000, // 5 minutes
    user: 600000,      // 10 minutes
    moderation: 60000, // 1 minute
  };
  
  private constructor() {
    super();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.queryMonitor = QueryMonitor.getInstance();
    this.setupRedisSubscriptions();
    this.startCacheCleanup();
  }

  public static getInstance(): RealTimeOptimizer {
    if (!RealTimeOptimizer.instance) {
      RealTimeOptimizer.instance = new RealTimeOptimizer();
    }
    return RealTimeOptimizer.instance;
  }

  /**
   * Set up Redis pub/sub for distributed real-time updates
   */
  private setupRedisSubscriptions(): void {
    this.redis.subscribe('huzzology:updates', (err, count) => {
      if (err) {
        console.error('Failed to subscribe to Redis updates:', err);
      } else {
        console.log(`Subscribed to ${count} Redis channels`);
      }
    });

    this.redis.on('message', (channel, message) => {
      try {
        const update: UpdateEvent = JSON.parse(message);
        this.processDistributedUpdate(update);
      } catch (error) {
        console.error('Failed to process Redis message:', error);
      }
    });
  }

  /**
   * Process updates from other server instances
   */
  private processDistributedUpdate(update: UpdateEvent): void {
    // Invalidate local cache
    this.invalidateCache(update.type, update.id);
    
    // Emit to local subscribers
    this.emit('update', update);
    
    // Update subscribed users
    this.notifySubscribers(update);
  }

  /**
   * Publish update to Redis for distribution to other instances
   */
  private async publishUpdate(update: UpdateEvent): Promise<void> {
    try {
      await this.redis.publish('huzzology:updates', JSON.stringify(update));
    } catch (error) {
      console.error('Failed to publish update to Redis:', error);
    }
  }

  /**
   * Optimized data retrieval with multi-level caching
   */
  public async getData(type: string, id: string, fetchFn: () => Promise<any>): Promise<any> {
    const cacheKey = `${type}:${id}`;
    
    // Check local cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Check Redis cache
    try {
      const redisData = await this.redis.get(cacheKey);
      if (redisData) {
        const parsed = JSON.parse(redisData);
        // Update local cache
        this.cache.set(cacheKey, {
          data: parsed,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL[type as keyof typeof this.CACHE_TTL] || 300000,
          version: 1,
        });
        return parsed;
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
    }

    // Fetch from database
    const tracker = this.queryMonitor.startQuery(`fetch_${type}`, { id });
    try {
      const data = await fetchFn();
      tracker.end();
      
      // Cache the result
      await this.setCache(cacheKey, data, type as keyof typeof this.CACHE_TTL);
      
      return data;
    } catch (error) {
      tracker.end(error);
      throw error;
    }
  }

  /**
   * Batch update processing for efficiency
   */
  public scheduleUpdate(update: UpdateEvent): void {
    const batchKey = `${update.type}:${update.action}`;
    
    if (!this.batchUpdates.has(batchKey)) {
      // Create new batch
      const timeout = setTimeout(() => {
        this.processBatch(batchKey);
      }, this.BATCH_TIMEOUT);
      
      this.batchUpdates.set(batchKey, {
        updates: [update],
        scheduledAt: Date.now(),
        timeout,
      });
    } else {
      // Add to existing batch
      const batch = this.batchUpdates.get(batchKey)!;
      batch.updates.push(update);
      
      // Process immediately if batch is full
      if (batch.updates.length >= this.BATCH_SIZE) {
        clearTimeout(batch.timeout);
        this.processBatch(batchKey);
      }
    }
  }

  /**
   * Process a batch of updates
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchUpdates.get(batchKey);
    if (!batch) return;

    this.batchUpdates.delete(batchKey);
    
    try {
      // Group updates by ID to avoid duplicates
      const uniqueUpdates = new Map<string, UpdateEvent>();
      batch.updates.forEach(update => {
        uniqueUpdates.set(update.id, update);
      });

      // Process each unique update
      for (const update of uniqueUpdates.values()) {
        await this.processUpdate(update);
      }
      
      console.log(`Processed batch of ${uniqueUpdates.size} updates for ${batchKey}`);
    } catch (error) {
      console.error(`Failed to process batch ${batchKey}:`, error);
    }
  }

  /**
   * Process individual update
   */
  private async processUpdate(update: UpdateEvent): Promise<void> {
    // Invalidate cache
    this.invalidateCache(update.type, update.id);
    
    // Publish to other instances
    await this.publishUpdate(update);
    
    // Emit local event
    this.emit('update', update);
    
    // Update materialized views if needed
    await this.updateMaterializedViews(update);
    
    // Notify subscribers
    this.notifySubscribers(update);
  }

  /**
   * Invalidate cache entries
   */
  private invalidateCache(type: string, id: string): void {
    const cacheKey = `${type}:${id}`;
    
    // Remove from local cache
    this.cache.delete(cacheKey);
    
    // Remove from Redis cache
    this.redis.del(cacheKey).catch(error => {
      console.error('Failed to invalidate Redis cache:', error);
    });
    
    // Invalidate related caches
    this.invalidateRelatedCaches(type, id);
  }

  /**
   * Invalidate related cache entries
   */
  private invalidateRelatedCaches(type: string, _id: string): void {
    const patterns = {
      archetype: [`trend:*`, `aesthetic:*`], // Archetypes affect trends and aesthetics
      trend: [`archetype:*`], // Trends affect archetypes
      aesthetic: [`archetype:*`], // Aesthetics affect archetypes
      user: [`moderation:*`], // User changes affect moderation
    };

    const relatedPatterns = patterns[type as keyof typeof patterns] || [];
    relatedPatterns.forEach(pattern => {
      // In a real implementation, you'd use Redis SCAN to find matching keys
      // For now, we'll clear specific known relationships
      this.clearCachePattern(pattern);
    });
  }

  /**
   * Clear cache entries matching a pattern
   */
  private async clearCachePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        
        // Also clear from local cache
        keys.forEach(key => this.cache.delete(key));
      }
    } catch (error) {
      console.error('Failed to clear cache pattern:', error);
    }
  }

  /**
   * Set cache with TTL
   */
  private async setCache(key: string, data: any, type: keyof typeof this.CACHE_TTL): Promise<void> {
    const ttl = this.CACHE_TTL[type] || 300000;
    
    // Set local cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      version: 1,
    });

    // Set Redis cache
    try {
      await this.redis.setex(key, Math.floor(ttl / 1000), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to set Redis cache:', error);
    }
  }

  /**
   * Update materialized views based on data changes
   */
  private async updateMaterializedViews(update: UpdateEvent): Promise<void> {
    const viewsToRefresh: string[] = [];

    switch (update.type) {
      case 'archetype':
        viewsToRefresh.push('archetype_stats', 'trending_archetypes');
        break;
      case 'trend':
        viewsToRefresh.push('trend_stats', 'archetype_trends');
        break;
      case 'aesthetic':
        viewsToRefresh.push('aesthetic_stats', 'archetype_aesthetics');
        break;
      case 'user':
        viewsToRefresh.push('user_activity_stats');
        break;
    }

    for (const view of viewsToRefresh) {
      try {
        await db.execute(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`);
      } catch (error) {
        console.error(`Failed to refresh materialized view ${view}:`, error);
      }
    }
  }

  /**
   * Notify subscribed users about updates
   */
  private notifySubscribers(update: UpdateEvent): void {
    const resourceKey = `${update.type}:${update.id}`;
    
    // Find users subscribed to this resource
    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(resourceKey) || subscriptions.has(`${update.type}:*`)) {
        this.emit('userUpdate', userId, update);
      }
    }
  }

  /**
   * Subscribe user to resource updates
   */
  public subscribeUser(userId: string, resourceType: string, resourceId?: string): void {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set());
    }
    
    const subscription = resourceId ? `${resourceType}:${resourceId}` : `${resourceType}:*`;
    this.subscriptions.get(userId)!.add(subscription);
  }

  /**
   * Unsubscribe user from resource updates
   */
  public unsubscribeUser(userId: string, resourceType?: string, resourceId?: string): void {
    const userSubs = this.subscriptions.get(userId);
    if (!userSubs) return;

    if (!resourceType) {
      // Unsubscribe from all
      this.subscriptions.delete(userId);
    } else {
      const subscription = resourceId ? `${resourceType}:${resourceId}` : `${resourceType}:*`;
      userSubs.delete(subscription);
      
      if (userSubs.size === 0) {
        this.subscriptions.delete(userId);
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): any {
    const localCacheSize = this.cache.size;
    const batchCount = this.batchUpdates.size;
    const subscriptionCount = this.subscriptions.size;
    
    return {
      localCache: {
        size: localCacheSize,
        hitRate: this.calculateCacheHitRate(),
      },
      batches: {
        pending: batchCount,
      },
      subscriptions: {
        users: subscriptionCount,
        total: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.size, 0),
      },
      redis: {
        connected: this.redis.status === 'ready',
      },
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private calculateCacheHitRate(): number {
    // This would need proper tracking in a real implementation
    return 0.85; // Placeholder
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} expired cache entries`);
      }
    }, 60000); // Clean every minute
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down RealTimeOptimizer...');
    
    // Clear all pending batches
    for (const [key, batch] of this.batchUpdates.entries()) {
      clearTimeout(batch.timeout);
      await this.processBatch(key);
    }
    
    // Close Redis connection
    await this.redis.quit();
    
    console.log('RealTimeOptimizer shutdown complete');
  }
}

export default RealTimeOptimizer; 