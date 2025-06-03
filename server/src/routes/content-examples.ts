/**
 * Content Examples routes for Huzzology API
 */

import { Router } from 'express';
import { contentExampleService } from '../services/ContentExampleService';
import { 
  authenticateToken, 
  requireRole, 
  optionalAuth,
  validators,
  asyncHandler,
  rateLimit
} from '../middleware/index.js';
import type { 
  ContentSearchQuery, 
  NewContentExample,
  Platform,
  ModerationStatus 
} from '../../../shared/src/types/database';

const router = Router();

/**
 * @swagger
 * /api/content-examples:
 *   get:
 *     summary: Search and list content examples
 *     description: Search for content examples using various filters and criteria
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: archetype_id
 *         schema:
 *           type: string
 *         description: Filter by specific archetype ID
 *       - in: query
 *         name: platforms
 *         schema:
 *           type: string
 *         description: Comma-separated list of platforms (tiktok, instagram, twitter, reddit)
 *       - in: query
 *         name: media_types
 *         schema:
 *           type: string
 *         description: Comma-separated list of media types (video, image, text, audio)
 *       - in: query
 *         name: moderation_status
 *         schema:
 *           type: string
 *         description: Comma-separated list of moderation statuses
 *       - in: query
 *         name: is_featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: min_engagement
 *         schema:
 *           type: integer
 *         description: Minimum engagement count
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter content created after this date
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter content created before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results with pagination
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
 *                     $ref: '#/components/schemas/ContentExample'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', 
  rateLimit.search,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const searchQuery: ContentSearchQuery = {
      archetype_id: req.query.archetype_id as string,
      platforms: req.query.platforms ? (req.query.platforms as string).split(',') as Platform[] : undefined,
      media_types: req.query.media_types ? (req.query.media_types as string).split(',') as any[] : undefined,
      moderation_status: req.query.moderation_status ? (req.query.moderation_status as string).split(',') as ModerationStatus[] : undefined,
      is_featured: req.query.is_featured ? req.query.is_featured === 'true' : undefined,
      min_engagement: req.query.min_engagement ? parseInt(req.query.min_engagement as string) : undefined,
      created_after: req.query.created_after ? new Date(req.query.created_after as string) : undefined,
      created_before: req.query.created_before ? new Date(req.query.created_before as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await contentExampleService.search(searchQuery);
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: searchQuery.limit || 50,
        offset: searchQuery.offset || 0,
        has_next: (searchQuery.offset || 0) + (searchQuery.limit || 50) < result.total,
        has_prev: (searchQuery.offset || 0) > 0,
      },
    });
  }));

/**
 * @swagger
 * /api/content-examples/featured:
 *   get:
 *     summary: Get featured content examples
 *     description: Retrieve content examples that have been marked as featured
 *     tags: [Content Examples]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of featured content examples to return
 *     responses:
 *       200:
 *         description: List of featured content examples
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
 *                     $ref: '#/components/schemas/ContentExample'
 *                 count:
 *                   type: integer
 *                   description: Number of featured content examples returned
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const featured = await contentExampleService.getFeatured(limit);
    
    res.json({
      success: true,
      data: featured,
      count: featured.length,
    });
  } catch (error) {
    console.error('Error getting featured content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get featured content examples',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/stats:
 *   get:
 *     summary: Get engagement statistics
 *     description: Retrieve engagement statistics for content examples, optionally filtered by archetype
 *     tags: [Content Examples]
 *     parameters:
 *       - in: query
 *         name: archetype_id
 *         schema:
 *           type: string
 *         description: Filter statistics by specific archetype ID
 *     responses:
 *       200:
 *         description: Engagement statistics
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
 *                     total_content:
 *                       type: integer
 *                       description: Total number of content examples
 *                     average_engagement:
 *                       type: number
 *                       format: float
 *                       description: Average engagement across all content
 *                     platform_breakdown:
 *                       type: object
 *                       description: Engagement statistics by platform
 *                     trending_content:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContentExample'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/stats', async (req, res) => {
  try {
    const archetypeId = req.query.archetype_id as string;
    const stats = await contentExampleService.getEngagementStats(archetypeId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting engagement stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get engagement statistics',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/platform/{platform}:
 *   get:
 *     summary: Get content by platform
 *     description: Retrieve content examples from a specific platform
 *     tags: [Content Examples]
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Platform'
 *         description: Platform to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: moderation_status
 *         schema:
 *           $ref: '#/components/schemas/ModerationStatus'
 *           default: approved
 *         description: Filter by moderation status
 *     responses:
 *       200:
 *         description: Content examples from the specified platform
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
 *                     $ref: '#/components/schemas/ContentExample'
 *                 count:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/platform/:platform', async (req, res) => {
  try {
    const platform = req.params.platform as Platform;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const moderationStatus = req.query.moderation_status as ModerationStatus || 'approved';
    
    const content = await contentExampleService.getByPlatform(platform, {
      limit,
      offset,
      moderationStatus,
    });
    
    res.json({
      success: true,
      data: content,
      count: content.length,
    });
  } catch (error) {
    console.error('Error getting content by platform:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content examples by platform',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/with-archetypes:
 *   get:
 *     summary: Get content with archetype info
 *     description: Retrieve content examples with their associated archetype information
 *     tags: [Content Examples]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: moderation_status
 *         schema:
 *           $ref: '#/components/schemas/ModerationStatus'
 *           default: approved
 *         description: Filter by moderation status
 *     responses:
 *       200:
 *         description: Content examples with archetype information
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/ContentExample'
 *                       - type: object
 *                         properties:
 *                           archetype:
 *                             $ref: '#/components/schemas/Archetype'
 *                 count:
 *                   type: integer
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/with-archetypes', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const moderationStatus = req.query.moderation_status as ModerationStatus || 'approved';
    
    const content = await contentExampleService.getWithArchetypes({
      limit,
      offset,
      moderationStatus,
    });
    
    res.json({
      success: true,
      data: content,
      count: content.length,
    });
  } catch (error) {
    console.error('Error getting content with archetypes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content examples with archetype information',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/{id}:
 *   get:
 *     summary: Get specific content example
 *     description: Retrieve a specific content example by its unique identifier
 *     tags: [Content Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the content example
 *     responses:
 *       200:
 *         description: Content example details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentExample'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contentExample = await contentExampleService.getById(id);
    
    if (!contentExample) {
      return res.status(404).json({
        success: false,
        error: 'Content example not found',
      });
    }
    
    res.json({
      success: true,
      data: contentExample,
    });
  } catch (error) {
    console.error('Error getting content example:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content example',
    });
  }
});

/**
 * @swagger
 * /api/content-examples:
 *   post:
 *     summary: Create new content example
 *     description: Create a new content example in the system
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewContentExampleRequest'
 *     responses:
 *       201:
 *         description: Content example created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentExample'
 *                 message:
 *                   type: string
 *                   example: "Content example created successfully"
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
router.post('/', 
  rateLimit.modification,
  authenticateToken,
  requireRole(['curator', 'admin']),
  validators.contentExampleCreate,
  asyncHandler(async (req, res) => {
    const contentData: NewContentExample = req.body;
    
    const contentExample = await contentExampleService.create(contentData);
    
    res.status(201).json({
      success: true,
      data: contentExample,
      message: 'Content example created successfully'
    });
  }));

/**
 * @swagger
 * /api/content-examples/{id}:
 *   put:
 *     summary: Update content example
 *     description: Update an existing content example's information
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the content example to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContentExampleRequest'
 *     responses:
 *       200:
 *         description: Content example updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentExample'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updated = await contentExampleService.update(id, updates);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Content example not found',
      });
    }
    
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating content example:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content example',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/{id}/moderation:
 *   patch:
 *     summary: Update moderation status
 *     description: Update the moderation status of a content example
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the content example
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/ModerationStatus'
 *     responses:
 *       200:
 *         description: Moderation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentExample'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/moderation', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid moderation status',
      });
    }
    
    const updated = await contentExampleService.updateModerationStatus(id, status);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Content example not found',
      });
    }
    
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating moderation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update moderation status',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/{id}/featured:
 *   patch:
 *     summary: Set featured status
 *     description: Update the featured status of a content example
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the content example
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featured
 *             properties:
 *               featured:
 *                 type: boolean
 *                 description: Whether the content should be featured
 *     responses:
 *       200:
 *         description: Featured status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentExample'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/featured', async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    if (typeof featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Featured status must be a boolean',
      });
    }
    
    const updated = await contentExampleService.setFeatured(id, featured);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Content example not found',
      });
    }
    
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update featured status',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/bulk/moderation:
 *   post:
 *     summary: Bulk update moderation status
 *     description: Update the moderation status of multiple content examples
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of content example IDs to update
 *               status:
 *                 $ref: '#/components/schemas/ModerationStatus'
 *     responses:
 *       200:
 *         description: Bulk moderation update completed
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
 *                     updated_count:
 *                       type: integer
 *                       description: Number of content examples successfully updated
 *                     requested_count:
 *                       type: integer
 *                       description: Number of content examples requested to update
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/bulk/moderation', async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!Array.isArray(ids) || !status || !['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: ids must be an array and status must be valid',
      });
    }
    
    const updatedCount = await contentExampleService.bulkUpdateModerationStatus(ids, status);
    
    res.json({
      success: true,
      data: {
        updated_count: updatedCount,
        requested_count: ids.length,
      },
    });
  } catch (error) {
    console.error('Error bulk updating moderation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update moderation status',
    });
  }
});

/**
 * @swagger
 * /api/content-examples/{id}:
 *   delete:
 *     summary: Delete content example
 *     description: Delete a content example from the system
 *     tags: [Content Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the content example to delete
 *     responses:
 *       200:
 *         description: Content example deleted successfully
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
 *                   example: "Content example deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await contentExampleService.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Content example not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Content example deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting content example:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content example',
    });
  }
});

export default router; 