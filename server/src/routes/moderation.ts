/**
 * Moderation API Routes
 */

import { Router, Request, Response } from 'express';
import { ModerationService } from '../services/ModerationService';
import { z } from 'zod';
import { 
  authenticateToken, 
  requireRole, 
  validators,
  asyncHandler,
  rateLimit
} from '../middleware/index.js';
import type { ModerationAction } from '../../../shared/src/types/database';

const router = Router();
const moderationService = new ModerationService();

// Validation schemas
const logActionSchema = z.object({
  moderator_id: z.string().uuid(),
  target_type: z.string().min(1),
  target_id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'flag', 'remove', 'restore', 'warn', 'suspend', 'ban']),
  reason: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const moderateContentSchema = z.object({
  target_type: z.string().min(1),
  target_id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'flag', 'remove', 'restore', 'warn', 'suspend', 'ban']),
  reason: z.string().optional(),
  notes: z.string().optional(),
  moderator_id: z.string().uuid(),
});

const searchLogsSchema = z.object({
  moderator_id: z.string().uuid().optional(),
  target_type: z.string().optional(),
  target_id: z.string().uuid().optional(),
  action: z.array(z.enum(['approve', 'reject', 'flag', 'remove', 'restore', 'warn', 'suspend', 'ban'])).optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['created_at', 'action']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const bulkActionSchema = z.object({
  content_ids: z.array(z.string().uuid()).min(1).max(50),
  moderator_id: z.string().uuid(),
  reason: z.string().optional(),
});

const statsTimeframeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

// POST /api/moderation/logs - Log a moderation action
/**
 * @swagger
 * /api/moderation/logs:
 *   post:
 *     summary: Log a moderation action
 *     description: Record a moderation action taken by a moderator (moderator/admin only)
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moderator_id
 *               - target_type
 *               - target_id
 *               - action
 *             properties:
 *               moderator_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the moderator taking the action
 *               target_type:
 *                 type: string
 *                 description: Type of content being moderated
 *                 example: archetype
 *               target_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the content being moderated
 *               action:
 *                 type: string
 *                 enum: [approve, reject, flag, remove, restore, warn, suspend, ban]
 *                 description: Moderation action taken
 *               reason:
 *                 type: string
 *                 description: Reason for the moderation action
 *               notes:
 *                 type: string
 *                 description: Additional notes about the action
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Additional metadata about the action
 *     responses:
 *       201:
 *         description: Moderation action logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModerationLog'
 *                 message:
 *                   type: string
 *                   example: Moderation action logged successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logs', 
  rateLimit.modification,
  authenticateToken,
  requireRole(['moderator', 'admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const actionData = logActionSchema.parse(req.body);
    
    const log = await moderationService.logAction(actionData);
    
    res.status(201).json({
      success: true,
      data: log,
      message: 'Moderation action logged successfully'
    });
  }));

// GET /api/moderation/logs - Search moderation logs
/**
 * @swagger
 * /api/moderation/logs:
 *   get:
 *     summary: Search moderation logs
 *     description: Retrieve moderation logs with comprehensive filtering options
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: moderator_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by moderator ID
 *       - in: query
 *         name: target_type
 *         schema:
 *           type: string
 *         description: Filter by target content type
 *       - in: query
 *         name: target_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by target content ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [approve, reject, flag, remove, restore, warn, suspend, ban]
 *         style: form
 *         explode: false
 *         description: Filter by moderation actions (comma-separated)
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs created after this date
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs created before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of logs to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, action]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Moderation logs retrieved successfully
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
 *                     $ref: '#/components/schemas/ModerationLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const query = searchLogsSchema.parse(req.query);
    
    const options = {
      ...query,
      created_after: query.created_after ? new Date(query.created_after) : undefined,
      created_before: query.created_before ? new Date(query.created_before) : undefined,
    };

    const logs = await moderationService.searchLogs(options);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: logs.length,
      },
    });
  } catch (error) {
    console.error('Error searching moderation logs:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid search parameters',
    });
  }
});

// GET /api/moderation/logs/:id - Get moderation log by ID
/**
 * @swagger
 * /api/moderation/logs/{id}:
 *   get:
 *     summary: Get moderation log by ID
 *     description: Retrieve a specific moderation log by its ID
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Moderation log ID
 *     responses:
 *       200:
 *         description: Moderation log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModerationLog'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/logs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await moderationService.getLogById(id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Moderation log not found',
      });
    }
    
    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error getting moderation log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get moderation log',
    });
  }
});

// GET /api/moderation/logs/target/:type/:id - Get logs for specific target
/**
 * @swagger
 * /api/moderation/logs/target/{type}/{id}:
 *   get:
 *     summary: Get logs for specific target
 *     description: Retrieve all moderation logs for a specific piece of content
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of content (e.g., archetype, user, content_example)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the content
 *     responses:
 *       200:
 *         description: Moderation logs for target retrieved successfully
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
 *                     $ref: '#/components/schemas/ModerationLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/logs/target/:type/:id', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const logs = await moderationService.getLogsForTarget(type, id);
    
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error getting logs for target:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get logs for target',
    });
  }
});

// GET /api/moderation/logs/moderator/:id - Get logs by moderator
/**
 * @swagger
 * /api/moderation/logs/moderator/{id}:
 *   get:
 *     summary: Get logs by moderator
 *     description: Retrieve moderation logs for a specific moderator
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Moderator ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: Moderator logs retrieved successfully
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
 *                     $ref: '#/components/schemas/ModerationLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/logs/moderator/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const logs = await moderationService.getLogsByModerator(id, Number(limit));
    
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error getting logs by moderator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get logs by moderator',
    });
  }
});

// POST /api/moderation/moderate - Moderate content
/**
 * @swagger
 * /api/moderation/moderate:
 *   post:
 *     summary: Moderate content
 *     description: Take a moderation action on specific content
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_type
 *               - target_id
 *               - action
 *               - moderator_id
 *             properties:
 *               target_type:
 *                 type: string
 *                 description: Type of content being moderated
 *                 example: archetype
 *               target_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the content being moderated
 *               action:
 *                 type: string
 *                 enum: [approve, reject, flag, remove, restore, warn, suspend, ban]
 *                 description: Moderation action to take
 *               reason:
 *                 type: string
 *                 description: Reason for the moderation action
 *               notes:
 *                 type: string
 *                 description: Additional notes about the action
 *               moderator_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the moderator taking the action
 *     responses:
 *       200:
 *         description: Content moderated successfully
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
 *                   description: Moderation result
 *                 message:
 *                   type: string
 *                   example: Content approved successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/moderate', async (req: Request, res: Response) => {
  try {
    const request = moderateContentSchema.parse(req.body);
    
    const result = await moderationService.moderateContent(request);
    
    res.json({
      success: true,
      data: result,
      message: `Content ${request.action} successfully`,
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to moderate content',
    });
  }
});

// GET /api/moderation/stats - Get moderation statistics
/**
 * @swagger
 * /api/moderation/stats:
 *   get:
 *     summary: Get moderation statistics
 *     description: Retrieve comprehensive moderation statistics and metrics
 *     tags: [Moderation]
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
 *         description: Moderation statistics retrieved successfully
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
 *                     total_actions:
 *                       type: integer
 *                       description: Total number of moderation actions
 *                     actions_by_type:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Count of actions by type
 *                     actions_by_moderator:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Count of actions by moderator
 *                     content_types_moderated:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Count of moderated content by type
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           action_count:
 *                             type: integer
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
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const query = statsTimeframeSchema.parse(req.query);
    
    const timeframe = query.start && query.end ? {
      start: new Date(query.start),
      end: new Date(query.end),
    } : undefined;

    const stats = await moderationService.getStats(timeframe);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid timeframe parameters',
    });
  }
});

// GET /api/moderation/pending - Get pending moderation items
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const pendingItems = await moderationService.getPendingItems();
    
    res.json({
      success: true,
      data: pendingItems,
    });
  } catch (error) {
    console.error('Error getting pending items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending items',
    });
  }
});

// POST /api/moderation/bulk/approve - Bulk approve content
router.post('/bulk/approve', async (req: Request, res: Response) => {
  try {
    const { content_ids, moderator_id } = bulkActionSchema.parse(req.body);
    
    const result = await moderationService.bulkApprove(content_ids, moderator_id);
    
    res.json({
      success: true,
      data: result,
      message: `${result.approved} items approved successfully`,
    });
  } catch (error) {
    console.error('Error bulk approving:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to bulk approve',
    });
  }
});

// POST /api/moderation/bulk/reject - Bulk reject content
router.post('/bulk/reject', async (req: Request, res: Response) => {
  try {
    const { content_ids, moderator_id, reason } = bulkActionSchema.parse(req.body);
    
    const result = await moderationService.bulkReject(content_ids, moderator_id, reason);
    
    res.json({
      success: true,
      data: result,
      message: `${result.rejected} items rejected successfully`,
    });
  } catch (error) {
    console.error('Error bulk rejecting:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to bulk reject',
    });
  }
});

// GET /api/moderation/history/user/:id - Get user moderation history
router.get('/history/user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await moderationService.getUserModerationHistory(id);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting user moderation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user moderation history',
    });
  }
});

// GET /api/moderation/history/content/:id - Get content moderation history
router.get('/history/content/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await moderationService.getContentModerationHistory(id);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting content moderation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content moderation history',
    });
  }
});

export default router; 