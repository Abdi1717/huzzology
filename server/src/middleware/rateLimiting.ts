/**
 * Rate Limiting Middleware
 * Implements rate limiting for API endpoints using rate-limiter-flexible
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';

// Redis client for rate limiting (optional, falls back to memory)
let redisClient: Redis | null = null;

try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  }
} catch (error) {
  console.warn('Redis not available for rate limiting, using memory store:', error);
}

/**
 * Rate limiter configurations for different endpoint types
 */
const rateLimiterConfigs = {
  // General API endpoints
  general: {
    keyPrefix: 'general_limit',
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 60 seconds if limit exceeded
  },
  
  // Authentication endpoints (more restrictive)
  auth: {
    keyPrefix: 'auth_limit',
    points: 5, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 300, // Block for 5 minutes if limit exceeded
  },
  
  // Search endpoints (moderate limits)
  search: {
    keyPrefix: 'search_limit',
    points: 30, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 60 seconds if limit exceeded
  },
  
  // Upload/modification endpoints (more restrictive)
  modification: {
    keyPrefix: 'mod_limit',
    points: 20, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 120, // Block for 2 minutes if limit exceeded
  },
  
  // Admin endpoints (very restrictive)
  admin: {
    keyPrefix: 'admin_limit',
    points: 50, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 300, // Block for 5 minutes if limit exceeded
  },
};

/**
 * Create rate limiter instances
 */
const createRateLimiter = (config: typeof rateLimiterConfigs.general) => {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: config.keyPrefix,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });
  } else {
    return new RateLimiterMemory({
      keyPrefix: config.keyPrefix,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });
  }
};

// Initialize rate limiters
const rateLimiterInstances = {
  general: createRateLimiter(rateLimiterConfigs.general),
  auth: createRateLimiter(rateLimiterConfigs.auth),
  search: createRateLimiter(rateLimiterConfigs.search),
  modification: createRateLimiter(rateLimiterConfigs.modification),
  admin: createRateLimiter(rateLimiterConfigs.admin),
};

/**
 * Get client identifier for rate limiting
 */
const getClientId = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  
  // Get IP address (considering proxies)
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return `ip:${ip}`;
};

/**
 * Create rate limiting middleware
 */
export const createRateLimit = (type: keyof typeof rateLimiterInstances = 'general') => {
  const limiter = rateLimiterInstances[type];
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = getClientId(req);
      
      // Consume 1 point
      const resRateLimiter = await limiter.consume(clientId);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimiterConfigs[type].points.toString(),
        'X-RateLimit-Remaining': resRateLimiter.remainingPoints?.toString() || '0',
        'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext).toISOString(),
      });
      
      next();
    } catch (rejRes: any) {
      // Rate limit exceeded
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': rateLimiterConfigs[type].points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
        'Retry-After': secs.toString(),
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs,
      });
    }
  };
};

/**
 * Predefined rate limiting middleware for common use cases
 */
export const rateLimiters = {
  general: createRateLimit('general'),
  auth: createRateLimit('auth'),
  search: createRateLimit('search'),
  modification: createRateLimit('modification'),
  admin: createRateLimit('admin'),
};

/**
 * Rate limiting middleware for different endpoint types
 */
export const rateLimit = {
  // General API endpoints
  general: rateLimiters.general,
  
  // Authentication endpoints
  auth: rateLimiters.auth,
  
  // Search endpoints
  search: rateLimiters.search,
  
  // Upload/modification endpoints
  modification: rateLimiters.modification,
  
  // Admin endpoints
  admin: rateLimiters.admin,
};

/**
 * Get rate limit status for a client
 */
export const getRateLimitStatus = async (
  clientId: string,
  type: keyof typeof rateLimiterInstances = 'general'
) => {
  try {
    const limiter = rateLimiterInstances[type];
    const res = await limiter.get(clientId);
    
    if (res) {
      return {
        limit: rateLimiterConfigs[type].points,
        remaining: res.remainingPoints || 0,
        reset: new Date(Date.now() + res.msBeforeNext),
        blocked: res.remainingPoints === 0,
      };
    }
    
    return {
      limit: rateLimiterConfigs[type].points,
      remaining: rateLimiterConfigs[type].points,
      reset: new Date(Date.now() + rateLimiterConfigs[type].duration * 1000),
      blocked: false,
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return null;
  }
}; 