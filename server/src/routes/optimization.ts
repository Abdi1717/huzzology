/**
 * Database Optimization API Routes
 * Provides endpoints for monitoring and controlling database optimization
 */

import { Router } from 'express';
import { DatabaseOptimizationService } from '../services/DatabaseOptimizationService';
import { QueryMonitor } from '../utils/queryMonitor';
import { RealTimeOptimizer } from '../utils/realTimeOptimizer';
import { getPoolStats, getPerformanceMetrics } from '../database/connection';

const router = Router();
const optimizationService = DatabaseOptimizationService.getInstance();
const queryMonitor = QueryMonitor.getInstance();
const realTimeOptimizer = RealTimeOptimizer.getInstance();

/**
 * @swagger
 * /api/optimization/status:
 *   get:
 *     summary: Get system optimization status
 *     description: Retrieve current system optimization status and health metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System optimization status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [optimal, good, warning, critical]
 *                       example: good
 *                     last_optimization:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:30:00Z'
 *                     performance_score:
 *                       type: number
 *                       example: 0.85
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['Consider adding index on user_id column']
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * GET /api/optimization/status
 * Get current system optimization status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await optimizationService.getSystemStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting optimization status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimization status',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /api/optimization/report:
 *   get:
 *     summary: Generate optimization report
 *     description: Generate comprehensive optimization report with recommendations
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Optimization report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     report_id:
 *                       type: string
 *                       format: uuid
 *                       example: '123e4567-e89b-12d3-a456-426614174000'
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:30:00Z'
 *                     overall_score:
 *                       type: number
 *                       example: 0.78
 *                     sections:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             score:
 *                               type: number
 *                               example: 0.85
 *                             recommendations:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         queries:
 *                           type: object
 *                           properties:
 *                             score:
 *                               type: number
 *                               example: 0.72
 *                             slow_queries:
 *                               type: integer
 *                               example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * GET /api/optimization/report
 * Generate comprehensive optimization report
 */
router.get('/report', async (req, res) => {
  try {
    const report = await optimizationService.generateOptimizationReport();
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating optimization report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization report',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /api/optimization/database-stats:
 *   get:
 *     summary: Get database statistics
 *     description: Retrieve detailed database performance statistics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     table_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           table_name:
 *                             type: string
 *                             example: 'archetypes'
 *                           row_count:
 *                             type: integer
 *                             example: 1250
 *                           size_mb:
 *                             type: number
 *                             example: 45.2
 *                           index_usage:
 *                             type: number
 *                             example: 0.92
 *                     query_performance:
 *                       type: object
 *                       properties:
 *                         avg_query_time:
 *                           type: number
 *                           example: 125.5
 *                         slow_query_count:
 *                           type: integer
 *                           example: 8
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * GET /api/optimization/database-stats
 * Get detailed database statistics
 */
router.get('/database-stats', async (req, res) => {
  try {
    const stats = await optimizationService.getDatabaseStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /api/optimization/optimize:
 *   post:
 *     summary: Run database optimization
 *     description: Execute database optimization procedures (admin only)
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database optimization completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     optimization_id:
 *                       type: string
 *                       format: uuid
 *                       example: '123e4567-e89b-12d3-a456-426614174000'
 *                     started_at:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:30:00Z'
 *                     completed_at:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:35:00Z'
 *                     duration_ms:
 *                       type: integer
 *                       example: 300000
 *                     improvements:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['Added index on user_id', 'Optimized query cache']
 *                     performance_gain:
 *                       type: number
 *                       example: 0.15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * POST /api/optimization/optimize
 * Run database optimization
 */
router.post('/optimize', async (req, res) => {
  try {
    const result = await optimizationService.optimizeDatabase();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error running optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run optimization',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /api/optimization/history:
 *   get:
 *     summary: Get optimization history
 *     description: Retrieve history of database optimization runs
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of history entries to return
 *     responses:
 *       200:
 *         description: Optimization history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: '123e4567-e89b-12d3-a456-426614174000'
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                         example: '2024-01-15T10:30:00Z'
 *                       duration_ms:
 *                         type: integer
 *                         example: 300000
 *                       status:
 *                         type: string
 *                         enum: [completed, failed, running]
 *                         example: completed
 *                       performance_gain:
 *                         type: number
 *                         example: 0.15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * GET /api/optimization/history
 * Get optimization history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = optimizationService.getOptimizationHistory(limit);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting optimization history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimization history',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /api/optimization/query-metrics:
 *   get:
 *     summary: Get query performance metrics
 *     description: Retrieve detailed query performance metrics and statistics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Query metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_queries:
 *                       type: integer
 *                       example: 15420
 *                     avg_execution_time:
 *                       type: number
 *                       example: 125.5
 *                     slow_queries:
 *                       type: integer
 *                       example: 8
 *                     query_patterns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           pattern:
 *                             type: string
 *                             example: 'SELECT * FROM archetypes WHERE...'
 *                           count:
 *                             type: integer
 *                             example: 245
 *                           avg_time:
 *                             type: number
 *                             example: 89.2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * GET /api/optimization/query-metrics
 * Get query performance metrics
 */
router.get('/query-metrics', async (req, res) => {
  try {
    const metrics = queryMonitor.getMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting query metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get query metrics',
      details: error.message,
    });
  }
});

/**
 * @swagger
 * /api/optimization/connection-pool:
 *   get:
 *     summary: Get connection pool statistics
 *     description: Retrieve database connection pool statistics and performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection pool statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     pool:
 *                       type: object
 *                       properties:
 *                         totalCount:
 *                           type: integer
 *                           example: 20
 *                         idleCount:
 *                           type: integer
 *                           example: 15
 *                         waitingCount:
 *                           type: integer
 *                           example: 2
 *                         maxConnections:
 *                           type: integer
 *                           example: 25
 *                         utilization:
 *                           type: number
 *                           example: 0.2
 *                     performance:
 *                       type: object
 *                       properties:
 *                         avg_connection_time:
 *                           type: number
 *                           example: 45.2
 *                         peak_connections:
 *                           type: integer
 *                           example: 22
 *                         connection_errors:
 *                           type: integer
 *                           example: 0
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * GET /api/optimization/connection-pool
 * Get connection pool statistics
 */
router.get('/connection-pool', async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const performanceMetrics = await getPerformanceMetrics();
    
    res.json({
      success: true,
      data: {
        pool: poolStats,
        performance: performanceMetrics,
      },
    });
  } catch (error) {
    console.error('Error getting connection pool stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connection pool statistics',
      details: error.message,
    });
  }
});

/**
 * GET /api/optimization/real-time-stats
 * Get real-time optimization statistics
 */
router.get('/real-time-stats', async (req, res) => {
  try {
    const stats = realTimeOptimizer.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get real-time statistics',
      details: error.message,
    });
  }
});

/**
 * POST /api/optimization/subscribe
 * Subscribe to real-time updates
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, entityType, entityId } = req.body;
    
    if (!userId || !entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, entityType, entityId',
      });
    }
    
    realTimeOptimizer.subscribeUser(userId, entityType, entityId);
    
    res.json({
      success: true,
      message: 'Successfully subscribed to real-time updates',
    });
  } catch (error) {
    console.error('Error subscribing to updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to updates',
      details: error.message,
    });
  }
});

/**
 * POST /api/optimization/unsubscribe
 * Unsubscribe from real-time updates
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, entityType, entityId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId',
      });
    }
    
    realTimeOptimizer.unsubscribeUser(userId, entityType, entityId);
    
    res.json({
      success: true,
      message: 'Successfully unsubscribed from real-time updates',
    });
  } catch (error) {
    console.error('Error unsubscribing from updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from updates',
      details: error.message,
    });
  }
});

/**
 * GET /api/optimization/recent-updates/:type
 * Get recent updates for a specific entity type
 */
router.get('/recent-updates/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    
    const updates = await realTimeOptimizer.getRecentUpdates(type, since);
    
    res.json({
      success: true,
      data: updates,
    });
  } catch (error) {
    console.error('Error getting recent updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent updates',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/optimization/query-metrics
 * Clear query metrics history
 */
router.delete('/query-metrics', async (req, res) => {
  try {
    queryMonitor.clearOldMetrics();
    res.json({
      success: true,
      message: 'Query metrics cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing query metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear query metrics',
      details: error.message,
    });
  }
});

/**
 * GET /api/optimization/health
 * Simple health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const status = await optimizationService.getSystemStatus();
    
    res.status(status.status === 'critical' ? 503 : 200).json({
      success: status.status !== 'critical',
      status: status.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router; 