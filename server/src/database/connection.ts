/**
 * Database Connection Configuration
 * Sets up Drizzle ORM with PostgreSQL with optimized connection pooling
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import { QueryMonitor } from '../utils/queryMonitor';

// Initialize query monitor
const queryMonitor = QueryMonitor.getInstance();

// Optimized database configuration from environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'huzzology'}`;

// Optimized connection pool configuration
const poolConfig: PoolConfig = {
  connectionString,
  // Connection pool sizing
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '5'),  // Minimum connections to maintain
  
  // Timeout configurations
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 10 seconds
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 60 seconds
  
  // Connection validation and retry
  allowExitOnIdle: false, // Keep pool alive
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 seconds
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30 seconds
  
  // SSL configuration
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Application name for monitoring
  application_name: 'huzzology-server',
};

// Create PostgreSQL connection pool with monitoring
const client = new Pool(poolConfig);

// Set up connection pool monitoring
client.on('connect', (client) => {
  console.log('New database connection established');
  queryMonitor.recordConnectionEvent('connect');
});

client.on('acquire', (client) => {
  queryMonitor.recordConnectionEvent('acquire');
});

client.on('remove', (client) => {
  console.log('Database connection removed from pool');
  queryMonitor.recordConnectionEvent('remove');
});

client.on('error', (err, client) => {
  console.error('Database connection error:', err);
  queryMonitor.recordConnectionEvent('error');
});

// Enhanced query monitoring wrapper
const originalQuery = client.query.bind(client);
client.query = function(...args: any[]) {
  const tracker = queryMonitor.startQuery(args[0], args[1]);
  
  const result = originalQuery(...args);
  
  if (result && typeof result.then === 'function') {
    return result
      .then((res: any) => {
        tracker.end();
        return res;
      })
      .catch((err: any) => {
        tracker.end(err);
        throw err;
      });
  }
  
  tracker.end();
  return result;
};

// Create Drizzle database instance
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Export the client for direct access if needed
export { client };

/**
 * Get current connection pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: client.totalCount,
    idleCount: client.idleCount,
    waitingCount: client.waitingCount,
    maxConnections: poolConfig.max,
    minConnections: poolConfig.min,
  };
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await client.query('SELECT 1 as health');
    return result.rows[0]?.health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database performance metrics
 */
export async function getPerformanceMetrics() {
  try {
    const poolStats = getPoolStats();
    const queryStats = queryMonitor.getMetrics();
    
    return {
      pool: poolStats,
      queries: queryStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    return null;
  }
}

// Graceful shutdown with connection draining
async function gracefulShutdown(signal: string) {
  console.log(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    console.log('Draining connection pool...');
    
    // Wait for active connections to finish (with timeout)
    const shutdownTimeout = setTimeout(() => {
      console.log('Shutdown timeout reached, forcing close...');
      process.exit(1);
    }, 10000); // 10 second timeout
    
    await client.end();
    clearTimeout(shutdownTimeout);
    
    console.log('Database connections closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Monitor pool health periodically
setInterval(() => {
  const stats = getPoolStats();
  const utilization = (stats.totalCount - stats.idleCount) / stats.maxConnections;
  
  if (utilization > 0.8) {
    console.warn('High database connection pool utilization:', {
      utilization: `${(utilization * 100).toFixed(1)}%`,
      active: stats.totalCount - stats.idleCount,
      total: stats.totalCount,
      waiting: stats.waitingCount,
    });
  }
}, 30000); // Check every 30 seconds 