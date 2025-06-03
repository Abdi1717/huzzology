/**
 * Query Performance Monitor
 * Tracks database query performance, connection pool metrics, and provides insights
 */

import { performance } from 'perf_hooks';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
  error?: string;
  connectionId?: string;
}

interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  timestamp: Date;
}

interface PerformanceStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: QueryMetrics[];
  errorRate: number;
  poolUtilization: number;
}

class QueryMonitor {
  private queryMetrics: QueryMetrics[] = [];
  private poolMetrics: PoolMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private maxMetricsHistory: number = 10000;
  private cleanupInterval: NodeJS.Timeout;

  constructor(slowQueryThreshold = 1000, maxHistory = 10000) {
    this.slowQueryThreshold = slowQueryThreshold;
    this.maxMetricsHistory = maxHistory;
    
    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Start monitoring a query
   */
  startQuery(query: string, params?: any[]): QueryTracker {
    return new QueryTracker(query, params, this);
  }

  /**
   * Record query completion
   */
  recordQuery(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Log slow queries
    if (metrics.duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected (${metrics.duration}ms):`, {
        query: metrics.query.substring(0, 200),
        duration: metrics.duration,
        params: metrics.params
      });
    }

    // Log errors
    if (metrics.error) {
      console.error('Query error:', {
        query: metrics.query.substring(0, 200),
        error: metrics.error,
        params: metrics.params
      });
    }

    // Maintain history limit
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Record connection pool metrics
   */
  recordPoolMetrics(metrics: Omit<PoolMetrics, 'timestamp'>): void {
    this.poolMetrics.push({
      ...metrics,
      timestamp: new Date()
    });

    // Maintain history limit
    if (this.poolMetrics.length > 1000) {
      this.poolMetrics = this.poolMetrics.slice(-1000);
    }
  }

  /**
   * Record connection pool events for monitoring
   */
  recordConnectionEvent(event: 'connect' | 'acquire' | 'remove' | 'error'): void {
    // This method is called from the connection pool event handlers
    // For now, we'll just log the event - could be extended to track connection events
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Connection pool event: ${event} at ${new Date().toISOString()}`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): PerformanceStats {
    const cutoff = timeWindow 
      ? new Date(Date.now() - timeWindow)
      : new Date(0);

    const recentQueries = this.queryMetrics.filter(
      m => m.timestamp >= cutoff
    );

    const totalQueries = recentQueries.length;
    const averageQueryTime = totalQueries > 0
      ? recentQueries.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0;

    const slowQueries = recentQueries.filter(
      m => m.duration > this.slowQueryThreshold
    );

    const errorQueries = recentQueries.filter(m => m.error);
    const errorRate = totalQueries > 0 ? errorQueries.length / totalQueries : 0;

    const recentPoolMetrics = this.poolMetrics.filter(
      m => m.timestamp >= cutoff
    );

    const poolUtilization = recentPoolMetrics.length > 0
      ? recentPoolMetrics.reduce((sum, m) => {
          const total = m.totalConnections || 1;
          return sum + (m.activeConnections / total);
        }, 0) / recentPoolMetrics.length
      : 0;

    return {
      totalQueries,
      averageQueryTime,
      slowQueries: slowQueries.slice(-50), // Last 50 slow queries
      errorRate,
      poolUtilization
    };
  }

  /**
   * Get slow queries grouped by pattern
   */
  getSlowQueryPatterns(timeWindow = 24 * 60 * 60 * 1000): Record<string, {
    count: number;
    averageDuration: number;
    maxDuration: number;
    examples: QueryMetrics[];
  }> {
    const cutoff = new Date(Date.now() - timeWindow);
    const slowQueries = this.queryMetrics.filter(
      m => m.timestamp >= cutoff && m.duration > this.slowQueryThreshold
    );

    const patterns: Record<string, QueryMetrics[]> = {};

    // Group by query pattern (remove specific values)
    slowQueries.forEach(query => {
      const pattern = this.normalizeQuery(query.query);
      if (!patterns[pattern]) {
        patterns[pattern] = [];
      }
      patterns[pattern].push(query);
    });

    // Calculate statistics for each pattern
    const result: Record<string, any> = {};
    Object.entries(patterns).forEach(([pattern, queries]) => {
      const durations = queries.map(q => q.duration);
      result[pattern] = {
        count: queries.length,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        maxDuration: Math.max(...durations),
        examples: queries.slice(0, 3) // First 3 examples
      };
    });

    return result;
  }

  /**
   * Get connection pool health
   */
  getPoolHealth(): {
    current: PoolMetrics | null;
    trends: {
      utilizationTrend: number;
      waitingClientsTrend: number;
    };
  } {
    const recent = this.poolMetrics.slice(-10);
    const current = recent[recent.length - 1] || null;

    if (recent.length < 2) {
      return {
        current,
        trends: { utilizationTrend: 0, waitingClientsTrend: 0 }
      };
    }

    const utilizationTrend = this.calculateTrend(
      recent.map(m => m.activeConnections / (m.totalConnections || 1))
    );

    const waitingClientsTrend = this.calculateTrend(
      recent.map(m => m.waitingClients)
    );

    return {
      current,
      trends: {
        utilizationTrend,
        waitingClientsTrend
      }
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    queries: QueryMetrics[];
    pool: PoolMetrics[];
    stats: PerformanceStats;
  } {
    return {
      queries: this.queryMetrics.slice(-1000), // Last 1000 queries
      pool: this.poolMetrics.slice(-100), // Last 100 pool snapshots
      stats: this.getStats()
    };
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    this.queryMetrics = this.queryMetrics.filter(
      m => m.timestamp >= cutoff
    );

    this.poolMetrics = this.poolMetrics.filter(
      m => m.timestamp >= cutoff
    );
  }

  /**
   * Normalize query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate trend from array of numbers
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Query tracker for individual query monitoring
 */
class QueryTracker {
  private startTime: number;
  private query: string;
  private params?: any[];
  private monitor: QueryMonitor;

  constructor(query: string, params: any[] | undefined, monitor: QueryMonitor) {
    this.startTime = performance.now();
    this.query = query;
    this.params = params;
    this.monitor = monitor;
  }

  /**
   * End query tracking with success
   */
  end(): void {
    const duration = performance.now() - this.startTime;
    this.monitor.recordQuery({
      query: this.query,
      duration,
      timestamp: new Date(),
      params: this.params
    });
  }

  /**
   * End query tracking with error
   */
  error(error: Error | string): void {
    const duration = performance.now() - this.startTime;
    this.monitor.recordQuery({
      query: this.query,
      duration,
      timestamp: new Date(),
      params: this.params,
      error: typeof error === 'string' ? error : error.message
    });
  }
}

// Global query monitor instance
export const queryMonitor = new QueryMonitor();

export { QueryMonitor, QueryTracker, type QueryMetrics, type PoolMetrics, type PerformanceStats }; 