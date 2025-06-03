/**
 * Redis Cache Utility for Performance Optimization
 * Handles caching of frequently accessed data like trending archetypes, search results, and analytics
 */

import Redis from 'ioredis';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large objects
}

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;
  private defaultTTL: number = 300; // 5 minutes default

  constructor(config: CacheConfig) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'huzzology:',
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('Redis cache connected');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('Redis cache error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('Redis cache connection closed');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const ttl = options.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);
      
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - if key doesn't exist, execute function and cache result
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch and store
    try {
      const result = await fetchFunction();
      await this.set(key, result, options);
      return result;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      throw error;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memory_usage?: string;
    total_keys?: number;
    hits?: number;
    misses?: number;
  }> {
    const stats = {
      connected: this.isConnected,
    };

    if (!this.isConnected) {
      return stats;
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      if (memoryMatch) {
        stats.memory_usage = memoryMatch[1].trim();
      }

      // Parse total keys
      const keysMatch = keyspace.match(/keys=(\d+)/);
      if (keysMatch) {
        stats.total_keys = parseInt(keysMatch[1]);
      }

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return stats;
    }
  }
}

// Cache key generators for consistent naming
export const CacheKeys = {
  // Archetype caching
  archetype: (id: string) => `archetype:${id}`,
  archetypeWithStats: (id: string) => `archetype:stats:${id}`,
  archetypeSearch: (query: string) => `search:archetypes:${Buffer.from(query).toString('base64')}`,
  trendingArchetypes: (limit: number) => `trending:archetypes:${limit}`,
  archetypeAnalytics: () => 'analytics:archetypes',
  archetypeRelated: (id: string, options: string) => `related:${id}:${Buffer.from(options).toString('base64')}`,
  
  // Content caching
  contentSearch: (query: string) => `search:content:${Buffer.from(query).toString('base64')}`,
  featuredContent: (platform?: string) => platform ? `featured:content:${platform}` : 'featured:content:all',
  
  // User caching
  userStats: (userId: string) => `user:stats:${userId}`,
  userInteractions: (userId: string, options: string) => `user:interactions:${userId}:${Buffer.from(options).toString('base64')}`,
  
  // Moderation caching
  moderationStats: () => 'moderation:stats',
  pendingModeration: (type?: string) => type ? `moderation:pending:${type}` : 'moderation:pending:all',
};

// Default cache TTL values (in seconds)
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
  DAILY: 86400,     // 24 hours
};

// Create singleton instance
let cacheInstance: CacheService | null = null;

export function createCacheService(config: CacheConfig): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(config);
  }
  return cacheInstance;
}

export function getCacheService(): CacheService | null {
  return cacheInstance;
}

// Cache decorator for methods
export function cached(key: string, ttl: number = CacheTTL.MEDIUM) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCacheService();
      if (!cache) {
        return method.apply(this, args);
      }

      const cacheKey = typeof key === 'function' ? key(...args) : key;
      
      return cache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        { ttl }
      );
    };

    return descriptor;
  };
} 