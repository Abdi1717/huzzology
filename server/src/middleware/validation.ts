/**
 * Validation Middleware
 * Provides request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Validation middleware factory
 */
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Request validation failed',
          details: validationErrors,
        });
        return;
      }

      // Unexpected error
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),

  // Pagination query validation
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // Search query validation
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    sort: z.enum(['created_at', 'updated_at', 'name', 'popularity']).optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Date range validation
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['dateRange'],
    }
  ),
};

/**
 * User-related validation schemas
 */
export const userSchemas = {
  // User registration
  register: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(8).max(128),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'auto']).default('auto'),
      notifications: z.object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
      }).default({}),
      privacy: z.object({
        profileVisible: z.boolean().default(true),
        activityVisible: z.boolean().default(false),
      }).default({}),
    }).optional(),
  }),

  // User login
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Update user profile
  updateProfile: z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      notifications: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
      }).optional(),
      privacy: z.object({
        profileVisible: z.boolean().optional(),
        activityVisible: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }),

  // Change password
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8).max(128),
  }),
};

/**
 * Archetype-related validation schemas
 */
export const archetypeSchemas = {
  // Create archetype
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    keywords: z.array(z.string().min(1).max(50)).min(1).max(20),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
    categoryId: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
  }),

  // Update archetype
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(1000).optional(),
    keywords: z.array(z.string().min(1).max(50)).min(1).max(20).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    categoryId: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
  }),

  // Search archetypes
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    category: z.string().uuid().optional(),
    keywords: z.array(z.string()).optional(),
    sort: z.enum(['name', 'created_at', 'updated_at', 'popularity']).default('popularity'),
    order: z.enum(['asc', 'desc']).default('desc'),
    ...commonSchemas.pagination.shape,
  }),
};

/**
 * Content example validation schemas
 */
export const contentExampleSchemas = {
  // Create content example
  create: z.object({
    archetypeId: z.string().uuid(),
    platform: z.enum(['tiktok', 'instagram', 'twitter', 'reddit', 'youtube']),
    url: z.string().url(),
    mediaType: z.enum(['image', 'video', 'text', 'audio']),
    caption: z.string().max(2000).optional(),
    contentData: z.record(z.any()).optional(),
    engagementMetrics: z.object({
      likes: z.number().int().min(0).optional(),
      shares: z.number().int().min(0).optional(),
      comments: z.number().int().min(0).optional(),
      views: z.number().int().min(0).optional(),
    }).optional(),
    creatorData: z.object({
      username: z.string().optional(),
      followerCount: z.number().int().min(0).optional(),
      verified: z.boolean().optional(),
    }).optional(),
  }),

  // Update content example
  update: z.object({
    caption: z.string().max(2000).optional(),
    contentData: z.record(z.any()).optional(),
    engagementMetrics: z.object({
      likes: z.number().int().min(0).optional(),
      shares: z.number().int().min(0).optional(),
      comments: z.number().int().min(0).optional(),
      views: z.number().int().min(0).optional(),
    }).optional(),
    creatorData: z.object({
      username: z.string().optional(),
      followerCount: z.number().int().min(0).optional(),
      verified: z.boolean().optional(),
    }).optional(),
  }),

  // Search content examples
  search: z.object({
    archetypeId: z.string().uuid().optional(),
    platform: z.enum(['tiktok', 'instagram', 'twitter', 'reddit', 'youtube']).optional(),
    mediaType: z.enum(['image', 'video', 'text', 'audio']).optional(),
    moderationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    featured: z.coerce.boolean().optional(),
    ...commonSchemas.search.shape,
    ...commonSchemas.pagination.shape,
  }),
};

/**
 * Moderation validation schemas
 */
export const moderationSchemas = {
  // Moderation action
  action: z.object({
    action: z.enum(['approve', 'reject', 'flag', 'unflag', 'edit', 'delete', 'restore']),
    targetType: z.enum(['archetype', 'content_example', 'user', 'relationship']),
    targetId: z.string().uuid(),
    reason: z.string().min(1).max(500).optional(),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.any()).optional(),
  }),

  // Bulk moderation
  bulkAction: z.object({
    action: z.enum(['approve', 'reject', 'flag', 'unflag']),
    targetType: z.enum(['archetype', 'content_example', 'user', 'relationship']),
    targetIds: z.array(z.string().uuid()).min(1).max(100),
    reason: z.string().min(1).max(500).optional(),
    notes: z.string().max(1000).optional(),
  }),

  // Search moderation logs
  search: z.object({
    moderatorId: z.string().uuid().optional(),
    targetType: z.enum(['archetype', 'content_example', 'user', 'relationship']).optional(),
    action: z.enum(['approve', 'reject', 'flag', 'unflag', 'edit', 'delete', 'restore']).optional(),
    ...commonSchemas.dateRange.shape,
    ...commonSchemas.pagination.shape,
  }),
};

/**
 * Predefined validation middleware for common use cases
 */
export const validators = {
  // Common validators
  uuidParam: validate({ params: commonSchemas.uuidParam }),
  pagination: validate({ query: commonSchemas.pagination }),
  search: validate({ query: commonSchemas.search }),

  // User validators
  userRegister: validate({ body: userSchemas.register }),
  userLogin: validate({ body: userSchemas.login }),
  userUpdate: validate({ body: userSchemas.updateProfile }),
  userChangePassword: validate({ body: userSchemas.changePassword }),

  // Archetype validators
  archetypeCreate: validate({ body: archetypeSchemas.create }),
  archetypeUpdate: validate({ body: archetypeSchemas.update }),
  archetypeSearch: validate({ query: archetypeSchemas.search }),

  // Content example validators
  contentCreate: validate({ body: contentExampleSchemas.create }),
  contentUpdate: validate({ body: contentExampleSchemas.update }),
  contentSearch: validate({ query: contentExampleSchemas.search }),

  // Moderation validators
  moderationAction: validate({ body: moderationSchemas.action }),
  moderationBulk: validate({ body: moderationSchemas.bulkAction }),
  moderationSearch: validate({ query: moderationSchemas.search }),
}; 