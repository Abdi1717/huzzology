/**
 * Performance Monitoring Routes
 * Provides endpoints for monitoring database performance, connection pool health, and real-time metrics
 */

import { Router } from 'express';
import { getPoolStats, healthCheck, getPerformanceMetrics } from '../database/connection';
import { QueryMonitor } from '../utils/queryMonitor';
import { getCacheService } from '../utils/cache';

const router = Router();
const queryMonitor = QueryMonitor.getInstance();

/**
 * GET /performance/health - Basic health check
 */
router.get('/health', async (req, res) => {
  try {
    const dbHealthy = await healthCheck();
    const cacheService = getCacheService();
    const cacheHealthy = cacheService ? await cacheService.exists('health_check') : false;

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy,
      cache: cacheHealthy,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    res.status(dbHealthy ? 200 : 503).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /performance/metrics - Comprehensive performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getPerformanceMetrics();
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to retrieve metrics' });
    }

    res.json(metrics);
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve performance metrics' });
  }
});

/**
 * GET /performance/database - Database-specific metrics
 */
router.get('/database', async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const queryStats = queryMonitor.getStats();
    const slowQueries = queryMonitor.getSlowQueryPatterns();
    const poolHealth = queryMonitor.getPoolHealth();

    const databaseMetrics = {
      connectionPool: {
        ...poolStats,
        health: poolHealth,
        utilization: poolStats.totalCount > 0 
          ? (poolStats.totalCount - poolStats.idleCount) / poolStats.maxConnections 
          : 0,
      },
      queries: {
        ...queryStats,
        slowQueryPatterns: slowQueries,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(databaseMetrics);
  } catch (error) {
    console.error('Database metrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve database metrics' });
  }
});

/**
 * GET /performance/queries/slow - Recent slow queries
 */
router.get('/queries/slow', (req, res) => {
  try {
    const timeWindow = parseInt(req.query.window as string) || 3600000; // 1 hour default
    const slowQueries = queryMonitor.getSlowQueryPatterns(timeWindow);

    res.json({
      timeWindow,
      patterns: slowQueries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Slow queries error:', error);
    res.status(500).json({ error: 'Failed to retrieve slow queries' });
  }
});

/**
 * GET /performance/cache - Cache performance metrics
 */
router.get('/cache', async (req, res) => {
  try {
    const cacheService = getCacheService();
    
    if (!cacheService) {
      return res.status(503).json({ error: 'Cache service not available' });
    }

    const stats = await cacheService.getStats();
    
    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve cache metrics' });
  }
});

/**
 * GET /performance/system - System resource metrics
 */
router.get('/system', (req, res) => {
  try {
    const systemMetrics = {
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(systemMetrics);
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve system metrics' });
  }
});

/**
 * POST /performance/cache/clear - Clear cache (admin only)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // TODO: Add authentication/authorization check for admin users
    
    const cacheService = getCacheService();
    
    if (!cacheService) {
      return res.status(503).json({ error: 'Cache service not available' });
    }

    const pattern = req.body.pattern || '*';
    const cleared = await cacheService.deletePattern(pattern);
    
    res.json({
      message: 'Cache cleared successfully',
      pattern,
      keysCleared: cleared,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * GET /performance/export - Export all metrics for external monitoring
 */
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format as string || 'json';
    
    const exportData = {
      database: queryMonitor.exportMetrics(),
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      connectionPool: getPoolStats(),
      timestamp: new Date().toISOString(),
    };

    if (format === 'prometheus') {
      // Convert to Prometheus format
      const prometheusMetrics = convertToPrometheusFormat(exportData);
      res.set('Content-Type', 'text/plain');
      res.send(prometheusMetrics);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export metrics error:', error);
    res.status(500).json({ error: 'Failed to export metrics' });
  }
});

/**
 * Convert metrics to Prometheus format
 */
function convertToPrometheusFormat(data: any): string {
  const lines: string[] = [];
  const timestamp = Date.now();

  // Database metrics
  lines.push(`# HELP huzzology_db_queries_total Total number of database queries`);
  lines.push(`# TYPE huzzology_db_queries_total counter`);
  lines.push(`huzzology_db_queries_total ${data.database.stats.totalQueries} ${timestamp}`);

  lines.push(`# HELP huzzology_db_query_duration_avg Average query duration in milliseconds`);
  lines.push(`# TYPE huzzology_db_query_duration_avg gauge`);
  lines.push(`huzzology_db_query_duration_avg ${data.database.stats.averageQueryTime} ${timestamp}`);

  lines.push(`# HELP huzzology_db_error_rate Database query error rate`);
  lines.push(`# TYPE huzzology_db_error_rate gauge`);
  lines.push(`huzzology_db_error_rate ${data.database.stats.errorRate} ${timestamp}`);

  lines.push(`# HELP huzzology_db_pool_utilization Connection pool utilization`);
  lines.push(`# TYPE huzzology_db_pool_utilization gauge`);
  lines.push(`huzzology_db_pool_utilization ${data.database.stats.poolUtilization} ${timestamp}`);

  // Connection pool metrics
  lines.push(`# HELP huzzology_db_connections_total Total database connections`);
  lines.push(`# TYPE huzzology_db_connections_total gauge`);
  lines.push(`huzzology_db_connections_total ${data.connectionPool.totalCount} ${timestamp}`);

  lines.push(`# HELP huzzology_db_connections_idle Idle database connections`);
  lines.push(`# TYPE huzzology_db_connections_idle gauge`);
  lines.push(`huzzology_db_connections_idle ${data.connectionPool.idleCount} ${timestamp}`);

  lines.push(`# HELP huzzology_db_connections_waiting Waiting database connections`);
  lines.push(`# TYPE huzzology_db_connections_waiting gauge`);
  lines.push(`huzzology_db_connections_waiting ${data.connectionPool.waitingCount} ${timestamp}`);

  // System metrics
  lines.push(`# HELP huzzology_process_uptime_seconds Process uptime in seconds`);
  lines.push(`# TYPE huzzology_process_uptime_seconds gauge`);
  lines.push(`huzzology_process_uptime_seconds ${data.system.uptime} ${timestamp}`);

  lines.push(`# HELP huzzology_process_memory_rss_bytes Process RSS memory in bytes`);
  lines.push(`# TYPE huzzology_process_memory_rss_bytes gauge`);
  lines.push(`huzzology_process_memory_rss_bytes ${data.system.memoryUsage.rss} ${timestamp}`);

  lines.push(`# HELP huzzology_process_memory_heap_used_bytes Process heap used memory in bytes`);
  lines.push(`# TYPE huzzology_process_memory_heap_used_bytes gauge`);
  lines.push(`huzzology_process_memory_heap_used_bytes ${data.system.memoryUsage.heapUsed} ${timestamp}`);

  return lines.join('\n') + '\n';
}

export default router; 