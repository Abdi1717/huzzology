/**
 * Huzzology Server - Main Entry Point
 * 
 * This is the main server file that initializes the Express application,
 * sets up middleware, routes, and starts the server.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { 
  errorHandler, 
  notFoundHandler, 
  setupGlobalErrorHandlers,
  gracefulShutdown,
  rateLimit 
} from './middleware/index.js';

// Load environment variables
dotenv.config();

// Setup global error handlers
setupGlobalErrorHandlers();

/**
 * Create and configure Express application
 * @returns Configured Express app instance
 */
export const createApp = (): express.Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }));

  // Request parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Global rate limiting for all requests
  app.use(rateLimit.general);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API routes
  app.use('/api', apiRoutes);

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

// Start server only if this file is run directly (not imported for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const PORT = process.env.PORT || 8000;

  const server = app.listen(PORT, () => {
    console.log(`🚀 Huzzology server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });

  // Setup graceful shutdown
  gracefulShutdown(server);
} 