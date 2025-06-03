/**
 * Middleware Index
 * Centralized exports for all middleware
 */

// Authentication middleware
export {
  authenticateToken,
  requireRole,
  optionalAuth,
  generateToken,
} from './auth.js';

// Rate limiting middleware
export {
  createRateLimit,
  rateLimit,
  getRateLimitStatus,
} from './rateLimiting.js';

// Validation middleware
export {
  validate,
  validators,
  commonSchemas,
  userSchemas,
  archetypeSchemas,
  contentExampleSchemas,
  moderationSchemas,
} from './validation.js';

// Error handling middleware
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  gracefulShutdown,
  setupGlobalErrorHandlers,
} from './errorHandler.js'; 