/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorLogger } from '../utils/errorLogger.js';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error types
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, true, 'RATE_LIMIT_ERROR', { retryAfter });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, true, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service: string, details?: any) {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR', { service, ...details });
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error: AppError, req: Request) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: any = {
    success: false,
    error: error.code || 'INTERNAL_SERVER_ERROR',
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add error details in development or for operational errors
  if (isDevelopment || error.isOperational) {
    if (error.details) {
      response.details = error.details;
    }
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  return response;
};

/**
 * Log error details using the error logger service
 */
const logError = async (error: Error, req: Request): Promise<string> => {
  const level = error instanceof AppError && error.isOperational && error.statusCode < 500 
    ? 'warn' 
    : 'error';

  const metadata = {
    errorName: error.name,
    isOperational: error instanceof AppError ? error.isOperational : false,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    code: error instanceof AppError ? error.code : undefined,
    details: error instanceof AppError ? error.details : undefined,
  };

  return await errorLogger.logError(error, level, req, metadata);
};

/**
 * Main error handling middleware
 */
export const errorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Log the error and get error ID
  const errorId = await logError(error, req);

  // Handle different error types
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    // Zod validation errors
    const validationErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    appError = new ValidationError('Request validation failed', validationErrors);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid authentication token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Authentication token has expired');
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    appError = new DatabaseError('Database operation failed');
  } else if (error.message.includes('ECONNREFUSED')) {
    appError = new ExternalServiceError('External service unavailable', 'unknown');
  } else {
    // Unknown error - treat as internal server error
    appError = new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      500,
      false
    );
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(appError, req);
  
  // Add error ID to response for tracking
  errorResponse.errorId = errorId;
  
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (server: any) => {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err: Error) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Unhandled rejection and exception handlers
 */
export const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, let the application handle it
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    // Exit the process for uncaught exceptions
    process.exit(1);
  });
}; 