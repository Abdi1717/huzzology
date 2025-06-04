/**
 * Admin API Routes
 * Administrative endpoints for system monitoring and management
 */

import { Router } from 'express';
import { 
  authenticateToken, 
  requireRole, 
  asyncHandler,
  rateLimit
} from '../middleware/index.js';
import { errorLogger } from '../utils/errorLogger.js';
import { QueryMonitor } from '../utils/queryMonitor.js';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['admin']));
router.use(rateLimit.admin);

/**
 * GET /admin/errors/stats - Get error statistics
 */
/**
 * @swagger
 * /api/admin/errors/stats:
 *   get:
 *     summary: Get error statistics
 *     description: Retrieve comprehensive error statistics for system monitoring (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics timeframe
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics timeframe
 *     responses:
 *       200:
 *         description: Error statistics retrieved successfully
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
 *                     total_errors:
 *                       type: integer
 *                       description: Total number of errors
 *                     errors_by_level:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Error count by severity level
 *                     errors_by_endpoint:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Error count by API endpoint
 *                     resolved_count:
 *                       type: integer
 *                       description: Number of resolved errors
 *                     unresolved_count:
 *                       type: integer
 *                       description: Number of unresolved errors
 *                 timeframe:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     end:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/errors/stats', 
  asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    
    const timeframe = start && end ? {
      start: new Date(start as string),
      end: new Date(end as string)
    } : undefined;

    const stats = errorLogger.getStats(timeframe);
    
    res.json({
      success: true,
      data: stats,
      timeframe: timeframe || { start: null, end: null }
    });
  }));

/**
 * GET /admin/errors - Get error logs with filtering
 */
/**
 * @swagger
 * /api/admin/errors:
 *   get:
 *     summary: Get error logs with filtering
 *     description: Retrieve error logs with comprehensive filtering options (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Filter by error level
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filter by API endpoint
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *         description: Filter by resolution status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of errors to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of errors to skip
 *     responses:
 *       200:
 *         description: Error logs retrieved successfully
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
 *                         description: Error log ID
 *                       level:
 *                         type: string
 *                         enum: [error, warn, info, debug]
 *                       message:
 *                         type: string
 *                         description: Error message
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                       endpoint:
 *                         type: string
 *                         description: API endpoint where error occurred
 *                       resolved:
 *                         type: boolean
 *                         description: Whether error has been resolved
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/errors', 
  asyncHandler(async (req, res) => {
    const {
      level,
      userId,
      endpoint,
      resolved,
      tags,
      limit = 50,
      offset = 0
    } = req.query;

    const criteria = {
      level: level as any,
      userId: userId as string,
      endpoint: endpoint as string,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const errors = errorLogger.getErrors(criteria);
    
    res.json({
      success: true,
      data: errors,
      pagination: {
        limit: criteria.limit,
        offset: criteria.offset,
        total: errors.length
      }
    });
  }));

/**
 * PUT /admin/errors/:id/resolve - Mark error as resolved
 */
/**
 * @swagger
 * /api/admin/errors/{id}/resolve:
 *   put:
 *     summary: Mark error as resolved
 *     description: Mark a specific error log as resolved (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Error log ID
 *     responses:
 *       200:
 *         description: Error marked as resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Error marked as resolved
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/errors/:id/resolve', 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const resolved = errorLogger.resolveError(id);
    
    if (!resolved) {
      return res.status(404).json({
        success: false,
        error: 'Error log not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Error marked as resolved'
    });
  }));

/**
 * DELETE /admin/errors/cleanup - Clean up old error logs
 */
/**
 * @swagger
 * /api/admin/errors/cleanup:
 *   delete:
 *     summary: Clean up old error logs
 *     description: Remove error logs older than specified number of days (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *         description: Number of days to keep logs (older logs will be deleted)
 *     responses:
 *       200:
 *         description: Old error logs cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cleaned up 150 old error logs
 *                 removedCount:
 *                   type: integer
 *                   description: Number of logs removed
 *                 cutoffDate:
 *                   type: string
 *                   format: date-time
 *                   description: Cutoff date for cleanup
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/errors/cleanup', 
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    
    const removedCount = errorLogger.clearOldLogs(cutoffDate);
    
    res.json({
      success: true,
      message: `Cleaned up ${removedCount} old error logs`,
      removedCount,
      cutoffDate: cutoffDate.toISOString()
    });
  }));

/**
 * GET /admin/errors/export - Export error logs
 */
/**
 * @swagger
 * /api/admin/errors/export:
 *   get:
 *     summary: Export error logs
 *     description: Export error logs in JSON or CSV format (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Error logs exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: JSON formatted error logs
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV formatted error logs
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/errors/export', 
  asyncHandler(async (req, res) => {
    const { format = 'json' } = req.query;
    const exportData = errorLogger.exportLogs(format as 'json' | 'csv');
    
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `error-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  }));

/**
 * GET /admin/performance/query-stats - Get query performance statistics
 */
/**
 * @swagger
 * /api/admin/performance/query-stats:
 *   get:
 *     summary: Get query performance statistics
 *     description: Retrieve database query performance statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Query performance statistics retrieved successfully
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
 *                       description: Total number of queries executed
 *                     average_duration:
 *                       type: number
 *                       description: Average query duration in milliseconds
 *                     slow_queries_count:
 *                       type: integer
 *                       description: Number of slow queries
 *                     queries_by_table:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Query count by database table
 *                     performance_trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           average_duration:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/performance/query-stats', 
  asyncHandler(async (req, res) => {
    const queryMonitor = QueryMonitor.getInstance();
    const stats = queryMonitor.getPerformanceStats();
    
    res.json({
      success: true,
      data: stats
    });
  }));

/**
 * GET /admin/performance/slow-queries - Get slow query patterns
 */
/**
 * @swagger
 * /api/admin/performance/slow-queries:
 *   get:
 *     summary: Get slow query patterns
 *     description: Retrieve patterns of slow database queries for optimization (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of slow query patterns to return
 *     responses:
 *       200:
 *         description: Slow query patterns retrieved successfully
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
 *                       query_pattern:
 *                         type: string
 *                         description: SQL query pattern
 *                       execution_count:
 *                         type: integer
 *                         description: Number of times this pattern was executed
 *                       average_duration:
 *                         type: number
 *                         description: Average execution time in milliseconds
 *                       max_duration:
 *                         type: number
 *                         description: Maximum execution time in milliseconds
 *                       last_executed:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/performance/slow-queries', 
  asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;
    const queryMonitor = QueryMonitor.getInstance();
    const slowQueries = queryMonitor.getSlowQueryPatterns(parseInt(limit as string));
    
    res.json({
      success: true,
      data: slowQueries
    });
  }));

/**
 * GET /admin/performance/connection-pool - Get connection pool health
 */
/**
 * @swagger
 * /api/admin/performance/connection-pool:
 *   get:
 *     summary: Get connection pool health
 *     description: Retrieve database connection pool health metrics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection pool health retrieved successfully
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
 *                     total_connections:
 *                       type: integer
 *                       description: Total number of connections in pool
 *                     active_connections:
 *                       type: integer
 *                       description: Number of active connections
 *                     idle_connections:
 *                       type: integer
 *                       description: Number of idle connections
 *                     pending_requests:
 *                       type: integer
 *                       description: Number of pending connection requests
 *                     pool_utilization:
 *                       type: number
 *                       description: Pool utilization percentage
 *                     health_status:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                       description: Overall pool health status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/performance/connection-pool', 
  asyncHandler(async (req, res) => {
    const queryMonitor = QueryMonitor.getInstance();
    const poolHealth = queryMonitor.getConnectionPoolHealth();
    
    res.json({
      success: true,
      data: poolHealth
    });
  }));

/**
 * POST /admin/performance/reset-metrics - Reset performance metrics
 */
/**
 * @swagger
 * /api/admin/performance/reset-metrics:
 *   post:
 *     summary: Reset performance metrics
 *     description: Clear all performance metrics and start fresh monitoring (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Performance metrics reset successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/performance/reset-metrics', 
  asyncHandler(async (req, res) => {
    const queryMonitor = QueryMonitor.getInstance();
    queryMonitor.clearMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  }));

/**
 * GET /admin/system/health - Comprehensive system health check
 */
/**
 * @swagger
 * /api/admin/system/health:
 *   get:
 *     summary: Comprehensive system health check
 *     description: Get comprehensive system health status including database, performance, and error metrics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status retrieved successfully
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
 *                     overall_status:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                       description: Overall system health status
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, warning, critical]
 *                         connection_pool:
 *                           type: object
 *                           description: Connection pool metrics
 *                         query_performance:
 *                           type: object
 *                           description: Query performance metrics
 *                     errors:
 *                       type: object
 *                       properties:
 *                         total_count:
 *                           type: integer
 *                         unresolved_count:
 *                           type: integer
 *                         recent_errors:
 *                           type: array
 *                           items:
 *                             type: object
 *                     performance:
 *                       type: object
 *                       properties:
 *                         cpu_usage:
 *                           type: number
 *                         memory_usage:
 *                           type: number
 *                         response_times:
 *                           type: object
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/system/health', 
  asyncHandler(async (req, res) => {
    const queryMonitor = QueryMonitor.getInstance();
    const errorStats = errorLogger.getStats();
    
    // Get recent error rate (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrorStats = errorLogger.getStats({ 
      start: oneHourAgo, 
      end: new Date() 
    });

    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy', // Will be updated based on checks
      checks: {
        database: {
          status: 'healthy',
          connectionPool: queryMonitor.getConnectionPoolHealth()
        },
        errors: {
          status: recentErrorStats.totalErrors > 100 ? 'warning' : 'healthy',
          recentErrors: recentErrorStats.totalErrors,
          totalErrors: errorStats.totalErrors
        },
        performance: {
          status: 'healthy',
          queryStats: queryMonitor.getPerformanceStats()
        }
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    };

    // Determine overall status
    const checkStatuses = Object.values(health.checks).map(check => check.status);
    if (checkStatuses.includes('error')) {
      health.status = 'error';
    } else if (checkStatuses.includes('warning')) {
      health.status = 'warning';
    }

    const statusCode = health.status === 'error' ? 503 : 200;
    
    res.status(statusCode).json({
      success: health.status !== 'error',
      data: health
    });
  }));

export default router; 