/**
 * Authentication API Routes
 * Handles user registration, login, logout, and profile management
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserService } from '../services/UserService.js';
import { 
  authenticateToken, 
  optionalAuth,
  generateToken,
  validators,
  asyncHandler,
  rateLimit,
  ValidationError,
  AuthenticationError,
  ConflictError
} from '../middleware/index.js';

const router = Router();
const userService = new UserService();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, username, and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             username: "fashionlover123"
 *             email: "user@example.com"
 *             password: "SecurePassword123!"
 *             preferences:
 *               content_filter_level: "medium"
 *               favorite_archetypes: []
 *               hidden_platforms: []
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register',
  rateLimit.auth,
  validators.userRegister,
  asyncHandler(async (req, res) => {
    const { email, username, password, preferences } = req.body;

    // Check if user already exists
    const existingUser = await userService.getByEmail(email) || 
                        await userService.getByUsername(username);
    
    if (existingUser) {
      throw new ConflictError('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      username,
      email,
      password_hash,
      role: 'user' as const,
      preferences: preferences || {},
      profile_data: {},
      is_active: true
    };

    const user = await userService.create(userData);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove sensitive data from response
    const { password_hash: _, ...userResponse } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
        expires_in: process.env.JWT_EXPIRES_IN || '7d'
      },
      message: 'User registered successfully'
    });
  })
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login',
  rateLimit.auth,
  validators.userLogin,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Get user by email
    const user = await userService.getByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove sensitive data from response
    const { password_hash: _, ...userResponse } = user;

    res.json({
      success: true,
      data: {
        user: userResponse,
        token,
        expires_in: process.env.JWT_EXPIRES_IN || '7d'
      },
      message: 'Login successful'
    });
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout current user (client-side token invalidation)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // But we can log the logout event for analytics
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await userService.getById(req.user!.id);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Remove sensitive data from response
    const { password_hash: _, ...userResponse } = user;

    res.json({
      success: true,
      data: userResponse
    });
  })
);

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                 example: "newfashionlover"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *               preferences:
 *                 type: object
 *                 properties:
 *                   favorite_archetypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: uuid
 *                   hidden_platforms:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Platform'
 *                   content_filter_level:
 *                     type: string
 *                     enum: [low, medium, high]
 *               profile_data:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me',
  authenticateToken,
  validators.userUpdate,
  asyncHandler(async (req, res) => {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password_hash;
    delete updates.role;
    delete updates.is_active;

    const user = await userService.update(req.user!.id, updates);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Remove sensitive data from response
    const { password_hash: _, ...userResponse } = user;

    res.json({
      success: true,
      data: userResponse,
      message: 'Profile updated successfully'
    });
  })
);

/**
 * PUT /auth/change-password - Change user password
 */
router.put('/change-password',
  authenticateToken,
  validators.userChangePassword,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get current user with password hash
    const user = await userService.getById(req.user!.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await userService.update(user.id, { password_hash });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * PUT /auth/preferences - Update user preferences
 */
router.put('/preferences',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const preferences = req.body;

    const user = await userService.updatePreferences(req.user!.id, preferences);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    res.json({
      success: true,
      data: user.preferences,
      message: 'Preferences updated successfully'
    });
  })
);

/**
 * GET /auth/verify - Verify JWT token
 */
router.get('/verify',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user,
        valid: true
      },
      message: 'Token is valid'
    });
  })
);

export default router; 