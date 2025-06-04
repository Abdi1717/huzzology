/**
 * Database Optimization Service
 * Comprehensive service integrating query monitoring, connection pooling, and real-time optimization
 */

import { QueryMonitor } from '../utils/queryMonitor';
import { RealTimeOptimizer } from '../utils/realTimeOptimizer';
import { getPoolStats, healthCheck } from '../database/connection';
import { db } from '../database/connection';
import { sql } from 'drizzle-orm';

interface OptimizationReport {
  timestamp: Date;
  queryPerformance: {
    slowQueries: any[];
    averageQueryTime: number;
    errorRate: number;
    totalQueries: number;
  };
  connectionPool: {
    utilization: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    healthStatus: boolean;
  };
  realTimeOptimization: {
    cacheHitRate: number;
    pendingUpdates: number;
    activeSubscriptions: number;
    batchEfficiency: number;
  };
  recommendations: string[];
}

interface DatabaseStats {
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    tableSize: string;
    indexSize: string;
    totalSize: string;
  }>;
  indexUsage: Array<{
    indexName: string;
    tableName: string;
    scans: number;
    tuples: number;
    usage: number;
  }>;
  slowQueries: Array<{
    query: string;
    calls: number;
    totalTime: number;
    avgTime: number;
  }>;
}

/**
 * Comprehensive database optimization service
 */
export class DatabaseOptimizationService {
  private static instance: DatabaseOptimizationService;
  private queryMonitor: QueryMonitor;
  private realTimeOptimizer: RealTimeOptimizer;
  private optimizationHistory: OptimizationReport[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  private constructor() {
    this.queryMonitor = QueryMonitor.getInstance();
    this.realTimeOptimizer = RealTimeOptimizer.getInstance();
    this.setupPeriodicOptimization();
  }

  static getInstance(): DatabaseOptimizationService {
    if (!DatabaseOptimizationService.instance) {
      DatabaseOptimizationService.instance = new DatabaseOptimizationService();
    }
    return DatabaseOptimizationService.instance;
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateOptimizationReport(): Promise<OptimizationReport> {
    const timestamp = new Date();
    
    // Gather metrics from all optimization components
    const [queryMetrics, poolStats, realTimeStats, dbHealth] = await Promise.all([
      this.queryMonitor.getMetrics(),
      getPoolStats(),
      this.realTimeOptimizer.getStats(),
      healthCheck(),
    ]);

    // Calculate derived metrics
    const poolUtilization = (poolStats.totalCount - poolStats.idleCount) / poolStats.maxConnections;
    const queryErrorRate = queryMetrics.errorCount / Math.max(queryMetrics.totalQueries, 1);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      queryMetrics,
      poolStats,
      realTimeStats,
      poolUtilization,
      queryErrorRate,
      dbHealth,
    });

    const report: OptimizationReport = {
      timestamp,
      queryPerformance: {
        slowQueries: queryMetrics.slowQueries,
        averageQueryTime: queryMetrics.averageQueryTime,
        errorRate: queryErrorRate,
        totalQueries: queryMetrics.totalQueries,
      },
      connectionPool: {
        utilization: poolUtilization,
        activeConnections: poolStats.totalCount - poolStats.idleCount,
        idleConnections: poolStats.idleCount,
        waitingClients: poolStats.waitingCount,
        healthStatus: dbHealth,
      },
      realTimeOptimization: {
        cacheHitRate: this.calculateCacheHitRate(),
        pendingUpdates: realTimeStats.pendingBatches,
        activeSubscriptions: realTimeStats.activeSubscriptions,
        batchEfficiency: this.calculateBatchEfficiency(),
      },
      recommendations,
    };

    // Store in history
    this.optimizationHistory.push(report);
    if (this.optimizationHistory.length > this.MAX_HISTORY_SIZE) {
      this.optimizationHistory.shift();
    }

    return report;
  }

  /**
   * Get detailed database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Get table statistics
      const tableStatsQuery = sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins + n_tup_upd + n_tup_del as total_operations,
          n_live_tup as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      // Get index usage statistics
      const indexUsageQuery = sql`
        SELECT 
          indexrelname as index_name,
          relname as table_name,
          idx_scan as scans,
          idx_tup_read as tuples,
          CASE 
            WHEN idx_scan = 0 THEN 0
            ELSE round((idx_tup_read::numeric / idx_scan), 2)
          END as usage
        FROM pg_stat_user_indexes 
        JOIN pg_stat_user_tables ON pg_stat_user_indexes.relid = pg_stat_user_tables.relid
        WHERE pg_stat_user_tables.schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;

      // Get slow query statistics (if pg_stat_statements is available)
      const slowQueriesQuery = sql`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time as avg_time
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC 
        LIMIT 10;
      `;

      const [tableStats, indexUsage] = await Promise.all([
        db.execute(tableStatsQuery),
        db.execute(indexUsageQuery),
      ]);

      let slowQueries: any[] = [];
      try {
        const slowQueriesResult = await db.execute(slowQueriesQuery);
        slowQueries = slowQueriesResult.rows;
      } catch (error) {
        // pg_stat_statements might not be available
        console.log('pg_stat_statements not available for slow query analysis');
      }

      return {
        tableStats: tableStats.rows.map((row: any) => ({
          tableName: row.tablename,
          rowCount: parseInt(row.row_count) || 0,
          tableSize: row.table_size,
          indexSize: row.index_size,
          totalSize: row.total_size,
        })),
        indexUsage: indexUsage.rows.map((row: any) => ({
          indexName: row.index_name,
          tableName: row.table_name,
          scans: parseInt(row.scans) || 0,
          tuples: parseInt(row.tuples) || 0,
          usage: parseFloat(row.usage) || 0,
        })),
        slowQueries: slowQueries.map((row: any) => ({
          query: row.query,
          calls: parseInt(row.calls) || 0,
          totalTime: parseFloat(row.total_exec_time) || 0,
          avgTime: parseFloat(row.avg_time) || 0,
        })),
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Optimize database based on current metrics
   */
  async optimizeDatabase(): Promise<{
    applied: string[];
    skipped: string[];
    errors: string[];
  }> {
    const applied: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    try {
      const report = await this.generateOptimizationReport();
      const dbStats = await this.getDatabaseStats();

      // Apply automatic optimizations based on analysis
      
      // 1. Optimize unused indexes
      const unusedIndexes = dbStats.indexUsage.filter(idx => idx.scans === 0);
      for (const index of unusedIndexes) {
        try {
          // Only drop indexes that haven't been used and aren't primary keys or unique constraints
          if (!index.indexName.includes('pkey') && !index.indexName.includes('unique')) {
            console.log(`Considering dropping unused index: ${index.indexName}`);
            // In production, you might want to just log this for manual review
            skipped.push(`Unused index detected: ${index.indexName} (manual review recommended)`);
          }
        } catch (error) {
          errors.push(`Error analyzing index ${index.indexName}: ${error}`);
        }
      }

      // 2. Update table statistics if needed
      try {
        await db.execute(sql`ANALYZE;`);
        applied.push('Updated table statistics (ANALYZE)');
      } catch (error) {
        errors.push(`Error updating statistics: ${error}`);
      }

      // 3. Optimize connection pool if utilization is high
      if (report.connectionPool.utilization > 0.8) {
        applied.push('High connection pool utilization detected - consider increasing pool size');
      }

      // 4. Clear old query monitor data
      this.queryMonitor.clearOldMetrics();
      applied.push('Cleared old query monitoring data');

      // 5. Optimize real-time cache based on hit rate
      if (report.realTimeOptimization.cacheHitRate < 0.7) {
        applied.push('Low cache hit rate detected - consider adjusting cache TTL settings');
      }

      return { applied, skipped, errors };
    } catch (error) {
      errors.push(`Optimization failed: ${error}`);
      return { applied, skipped, errors };
    }
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(limit?: number): OptimizationReport[] {
    const history = this.optimizationHistory.slice();
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: {
    queryMetrics: any;
    poolStats: any;
    realTimeStats: any;
    poolUtilization: number;
    queryErrorRate: number;
    dbHealth: boolean;
  }): string[] {
    const recommendations: string[] = [];

    // Query performance recommendations
    if (metrics.queryMetrics.averageQueryTime > 100) {
      recommendations.push('Average query time is high (>100ms). Consider adding indexes or optimizing queries.');
    }

    if (metrics.queryMetrics.slowQueries.length > 5) {
      recommendations.push(`${metrics.queryMetrics.slowQueries.length} slow queries detected. Review and optimize these queries.`);
    }

    if (metrics.queryErrorRate > 0.01) {
      recommendations.push(`Query error rate is ${(metrics.queryErrorRate * 100).toFixed(2)}%. Investigate failing queries.`);
    }

    // Connection pool recommendations
    if (metrics.poolUtilization > 0.8) {
      recommendations.push('Connection pool utilization is high (>80%). Consider increasing pool size.');
    }

    if (metrics.poolStats.waitingCount > 0) {
      recommendations.push(`${metrics.poolStats.waitingCount} clients waiting for connections. Increase pool size or optimize query performance.`);
    }

    // Real-time optimization recommendations
    if (metrics.realTimeStats.pendingBatches > 10) {
      recommendations.push('High number of pending update batches. Consider reducing batch delay or increasing processing capacity.');
    }

    const cacheHitRate = this.calculateCacheHitRate();
    if (cacheHitRate < 0.7) {
      recommendations.push(`Cache hit rate is low (${(cacheHitRate * 100).toFixed(1)}%). Consider increasing cache TTL or improving cache strategy.`);
    }

    // Health recommendations
    if (!metrics.dbHealth) {
      recommendations.push('Database health check failed. Investigate connection issues.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database performance is optimal. No immediate optimizations needed.');
    }

    return recommendations;
  }

  /**
   * Calculate cache hit rate (placeholder - would need actual cache metrics)
   */
  private calculateCacheHitRate(): number {
    // This would be calculated from actual cache hit/miss metrics
    // For now, return a placeholder value
    return 0.85;
  }

  /**
   * Calculate batch processing efficiency
   */
  private calculateBatchEfficiency(): number {
    // This would be calculated from actual batch processing metrics
    // For now, return a placeholder value
    return 0.92;
  }

  /**
   * Setup periodic optimization checks
   */
  private setupPeriodicOptimization(): void {
    // Run optimization analysis every 5 minutes
    setInterval(async () => {
      try {
        const report = await this.generateOptimizationReport();
        
        // Log warnings for critical issues
        if (report.connectionPool.utilization > 0.9) {
          console.warn('CRITICAL: Database connection pool utilization >90%');
        }
        
        if (report.queryPerformance.errorRate > 0.05) {
          console.warn('CRITICAL: Query error rate >5%');
        }
        
        if (!report.connectionPool.healthStatus) {
          console.error('CRITICAL: Database health check failed');
        }
      } catch (error) {
        console.error('Error in periodic optimization check:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Run full optimization every hour
    setInterval(async () => {
      try {
        console.log('Running scheduled database optimization...');
        const result = await this.optimizeDatabase();
        console.log('Optimization complete:', result);
      } catch (error) {
        console.error('Error in scheduled optimization:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    details: any;
  }> {
    try {
      const report = await this.generateOptimizationReport();
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      // Determine overall status
      if (!report.connectionPool.healthStatus || 
          report.queryPerformance.errorRate > 0.05 ||
          report.connectionPool.utilization > 0.9) {
        status = 'critical';
      } else if (report.queryPerformance.averageQueryTime > 100 ||
                 report.connectionPool.utilization > 0.8 ||
                 report.realTimeOptimization.cacheHitRate < 0.7) {
        status = 'warning';
      }
      
      return {
        status,
        details: report,
      };
    } catch (error) {
      return {
        status: 'critical',
        details: { error: error.message },
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.realTimeOptimizer.shutdown();
    console.log('DatabaseOptimizationService shutdown complete');
  }
}

export default DatabaseOptimizationService; 