/**
 * User API Routes
 */

import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { z } from 'zod';
import { 
  authenticateToken, 
  requireRole, 
  optionalAuth,
  validators,
  asyncHandler,
  rateLimit
} from '../middleware/index.js';
import type { UserRole, InteractionType } from '../../../shared/src/types/database';

const router = Router();
const userService = new UserService();

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  display_name: z.string().min(1).max(100).optional(),
  role: z.enum(['user', 'moderator', 'admin']).default('user'),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    notifications_enabled: z.boolean().optional(),
    privacy_level: z.enum(['public', 'private', 'friends']).optional(),
    content_preferences: z.object({
      preferred_platforms: z.array(z.string()).optional(),
      content_types: z.array(z.string()).optional(),
      mature_content: z.boolean().optional(),
    }).optional(),
  }).optional(),
  profile_data: z.record(z.any()).optional(),
});

const updateUserSchema = createUserSchema.partial();

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications_enabled: z.boolean().optional(),
  privacy_level: z.enum(['public', 'private', 'friends']).optional(),
  content_preferences: z.object({
    preferred_platforms: z.array(z.string()).optional(),
    content_types: z.array(z.string()).optional(),
    mature_content: z.boolean().optional(),
  }).optional(),
});

const searchUsersSchema = z.object({
  role: z.array(z.enum(['user', 'moderator', 'admin'])).optional(),
  is_active: z.boolean().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['username', 'display_name', 'created_at', 'last_login_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const recordInteractionSchema = z.object({
  archetype_id: z.string().uuid(),
  interaction_type: z.enum(['view', 'like', 'save', 'share', 'comment']),
  metadata: z.record(z.any()).optional(),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Search and list users
 *     description: Search for users using various filters and criteria
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, moderator, admin]
 *         description: Filter by user roles
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter users created after this date
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter users created before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of users to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [username, display_name, created_at, last_login_at]
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
 *         description: List of users
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
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchUsersSchema.parse(req.query);
    
    const options = {
      ...query,
      created_after: query.created_after ? new Date(query.created_after) : undefined,
      created_before: query.created_before ? new Date(query.created_before) : undefined,
    };

    const users = await userService.search(options);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: users.length,
      },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid search parameters',
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: fashionlover123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               display_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Fashion Lover
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *               preferences:
 *                 type: object
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum: [light, dark, auto]
 *                   notifications_enabled:
 *                     type: boolean
 *                   privacy_level:
 *                     type: string
 *                     enum: [public, private, friends]
 *                   content_preferences:
 *                     type: object
 *                     properties:
 *                       preferred_platforms:
 *                         type: array
 *                         items:
 *                           type: string
 *                       content_types:
 *                         type: array
 *                         items:
 *                           type: string
 *                       mature_content:
 *                         type: boolean
 *               profile_data:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userData = createUserSchema.parse(req.body);
    
    // Check if username or email already exists
    const existingUser = await userService.getByUsername(userData.username) || 
                        await userService.getByEmail(userData.email);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists',
      });
    }

    const user = await userService.create(userData);
    
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to create user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their unique identifier
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user information
 *     description: Update user profile information and settings (admin only or own profile)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: fashionlover123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               display_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Fashion Lover
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *               preferences:
 *                 type: object
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum: [light, dark, auto]
 *                   notifications_enabled:
 *                     type: boolean
 *                   privacy_level:
 *                     type: string
 *                     enum: [public, private, friends]
 *                   content_preferences:
 *                     type: object
 *                     properties:
 *                       preferred_platforms:
 *                         type: array
 *                         items:
 *                           type: string
 *                       content_types:
 *                         type: array
 *                         items:
 *                           type: string
 *                       mature_content:
 *                         type: boolean
 *               profile_data:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = updateUserSchema.parse(req.body);
    
    const user = await userService.update(id, updates);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to update user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete a user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await userService.delete(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences and settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, auto]
 *                 description: User interface theme preference
 *               notifications_enabled:
 *                 type: boolean
 *                 description: Whether to enable notifications
 *               privacy_level:
 *                 type: string
 *                 enum: [public, private, friends]
 *                 description: User privacy level
 *               content_preferences:
 *                 type: object
 *                 properties:
 *                   preferred_platforms:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of preferred social media platforms
 *                   content_types:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of preferred content types
 *                   mature_content:
 *                     type: boolean
 *                     description: Whether to show mature content
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
router.put('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const preferences = updatePreferencesSchema.parse(req.body);
    
    const user = await userService.updatePreferences(id, preferences);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to update preferences',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     description: Update a user's role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
router.put('/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }
    
    const user = await userService.updateRole(id, role as UserRole);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   put:
 *     summary: Deactivate user account
 *     description: Deactivate a user account (admin only or own account)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: User deactivated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.deactivate(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/reactivate:
 *   put:
 *     summary: Reactivate user account
 *     description: Reactivate a previously deactivated user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     responses:
 *       200:
 *         description: User reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: User reactivated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/reactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.reactivate(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'User reactivated successfully',
    });
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate user',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/interactions:
 *   post:
 *     summary: Record user interaction
 *     description: Record a user interaction with an archetype (view, like, save, etc.)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - archetype_id
 *               - interaction_type
 *             properties:
 *               archetype_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the archetype being interacted with
 *               interaction_type:
 *                 type: string
 *                 enum: [view, like, save, share, comment]
 *                 description: Type of interaction
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Additional metadata about the interaction
 *     responses:
 *       201:
 *         description: Interaction recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserInteraction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/interactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interactionData = recordInteractionSchema.parse(req.body);
    
    const interaction = await userService.recordInteraction({
      user_id: id,
      ...interactionData,
    });
    
    res.status(201).json({
      success: true,
      data: interaction,
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Failed to record interaction',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/interactions:
 *   get:
 *     summary: Get user interactions
 *     description: Retrieve a user's interaction history with archetypes
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *       - in: query
 *         name: interaction_types
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [view, like, save, share, comment]
 *         description: Filter by interaction types
 *       - in: query
 *         name: archetype_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific archetype
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter interactions created after this date
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter interactions created before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of interactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of interactions to skip
 *     responses:
 *       200:
 *         description: User interactions retrieved successfully
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
 *                     $ref: '#/components/schemas/UserInteraction'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/interactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      interaction_types, 
      archetype_id, 
      created_after, 
      created_before, 
      limit = 20, 
      offset = 0 
    } = req.query;
    
    const options = {
      interaction_types: interaction_types ? 
        (Array.isArray(interaction_types) ? interaction_types : [interaction_types]) as InteractionType[] : 
        undefined,
      archetype_id: archetype_id as string,
      created_after: created_after ? new Date(created_after as string) : undefined,
      created_before: created_before ? new Date(created_before as string) : undefined,
      limit: Number(limit),
      offset: Number(offset),
    };
    
    const interactions = await userService.getUserInteractions(id, options);
    
    res.json({
      success: true,
      data: interactions,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: interactions.length,
      },
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get interactions',
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve comprehensive statistics for a user's activity and engagement
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     total_interactions:
 *                       type: integer
 *                       description: Total number of interactions
 *                     interactions_by_type:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       description: Breakdown of interactions by type
 *                     favorite_archetypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           archetype_id:
 *                             type: string
 *                             format: uuid
 *                           interaction_count:
 *                             type: integer
 *                     activity_timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           interaction_count:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await userService.getUserStats(id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
    });
  }
});

/**
 * @swagger
 * /api/users/role/{role}:
 *   get:
 *     summary: Get users by role
 *     description: Retrieve all users with a specific role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/UserRole'
 *         description: User role to filter by
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/role/:role', async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }
    
    const users = await userService.getUsersByRole(role as UserRole);
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error getting users by role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users by role',
    });
  }
});

/**
 * @swagger
 * /api/users/moderators:
 *   get:
 *     summary: Get all moderators
 *     description: Retrieve all users with moderator role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderators retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/moderators', async (req: Request, res: Response) => {
  try {
    const moderators = await userService.getModerators();
    
    res.json({
      success: true,
      data: moderators,
    });
  } catch (error) {
    console.error('Error getting moderators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get moderators',
    });
  }
});

/**
 * @swagger
 * /api/users/admins:
 *   get:
 *     summary: Get all admins
 *     description: Retrieve all users with admin role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/admins', async (req: Request, res: Response) => {
  try {
    const admins = await userService.getAdmins();
    
    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admins',
    });
  }
});

export default router; 