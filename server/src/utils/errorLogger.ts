/**
 * Error Logging Service
 * Comprehensive error tracking and analysis for the application
 */

import fs from 'fs/promises';
import path from 'path';
import { Request } from 'express';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    userAgent?: string;
    ip?: string;
    method?: string;
    url?: string;
    body?: any;
    query?: any;
    params?: any;
    headers?: Record<string, string>;
  };
  metadata?: Record<string, any>;
  resolved: boolean;
  tags: string[];
}

interface ErrorStats {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  recentErrors: ErrorLog[];
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: Date;
  }>;
}

/**
 * Error Logger Service
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private logFile: string;
  private maxLogs: number = 10000;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'errors.json');
    this.ensureLogDirectory();
    this.loadExistingLogs();
    this.startCleanupInterval();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with context
   */
  public async logError(
    error: Error | string,
    level: 'error' | 'warn' | 'info' = 'error',
    req?: Request,
    metadata?: Record<string, any>
  ): Promise<string> {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: this.extractRequestContext(req),
      metadata,
      resolved: false,
      tags: this.generateTags(error, req),
    };

    this.logs.push(errorLog);
    
    // Keep only the most recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Persist to file asynchronously
    this.persistLogs().catch(console.error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${level.toUpperCase()}] ${errorLog.message}`, {
        id: errorLog.id,
        context: errorLog.context,
        metadata: errorLog.metadata,
      });
    }

    return errorLog.id;
  }

  /**
   * Get error statistics
   */
  public getStats(timeframe?: { start: Date; end: Date }): ErrorStats {
    let filteredLogs = this.logs;
    
    if (timeframe) {
      filteredLogs = this.logs.filter(log => 
        log.timestamp >= timeframe.start && log.timestamp <= timeframe.end
      );
    }

    const errorsByLevel = filteredLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByType = filteredLogs.reduce((acc, log) => {
      const errorType = this.extractErrorType(log.message);
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByEndpoint = filteredLogs.reduce((acc, log) => {
      if (log.context.url) {
        const endpoint = `${log.context.method} ${log.context.url}`;
        acc[endpoint] = (acc[endpoint] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const errorCounts = filteredLogs.reduce((acc, log) => {
      acc[log.message] = (acc[log.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({
        message,
        count,
        lastOccurred: filteredLogs
          .filter(log => log.message === message)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
          .timestamp,
      }));

    return {
      totalErrors: filteredLogs.length,
      errorsByLevel,
      errorsByType,
      errorsByEndpoint,
      recentErrors: filteredLogs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50),
      topErrors,
    };
  }

  /**
   * Get errors by criteria
   */
  public getErrors(criteria: {
    level?: 'error' | 'warn' | 'info';
    userId?: string;
    endpoint?: string;
    resolved?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): ErrorLog[] {
    let filtered = this.logs;

    if (criteria.level) {
      filtered = filtered.filter(log => log.level === criteria.level);
    }

    if (criteria.userId) {
      filtered = filtered.filter(log => log.context.userId === criteria.userId);
    }

    if (criteria.endpoint) {
      filtered = filtered.filter(log => 
        log.context.url?.includes(criteria.endpoint)
      );
    }

    if (criteria.resolved !== undefined) {
      filtered = filtered.filter(log => log.resolved === criteria.resolved);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filtered = filtered.filter(log => 
        criteria.tags!.some(tag => log.tags.includes(tag))
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 100;
    
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Mark error as resolved
   */
  public resolveError(errorId: string): boolean {
    const error = this.logs.find(log => log.id === errorId);
    if (error) {
      error.resolved = true;
      this.persistLogs().catch(console.error);
      return true;
    }
    return false;
  }

  /**
   * Clear old logs
   */
  public clearOldLogs(olderThan: Date): number {
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > olderThan);
    const removedCount = initialCount - this.logs.length;
    
    if (removedCount > 0) {
      this.persistLogs().catch(console.error);
    }
    
    return removedCount;
  }

  /**
   * Export logs for analysis
   */
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'id', 'timestamp', 'level', 'message', 'userId', 'method', 'url', 'ip', 'resolved'
      ];
      
      const rows = this.logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.context.userId || '',
        log.context.method || '',
        log.context.url || '',
        log.context.ip || '',
        log.resolved.toString(),
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Generate unique ID for error log
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract request context for logging
   */
  private extractRequestContext(req?: Request): ErrorLog['context'] {
    if (!req) return {};

    return {
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      body: this.sanitizeData(req.body),
      query: req.query,
      params: req.params,
      headers: this.sanitizeHeaders(req.headers as Record<string, string>),
    };
  }

  /**
   * Generate tags for error categorization
   */
  private generateTags(error: Error | string, req?: Request): string[] {
    const tags: string[] = [];
    const message = typeof error === 'string' ? error : error.message;

    // Add error type tags
    if (message.includes('validation')) tags.push('validation');
    if (message.includes('authentication')) tags.push('auth');
    if (message.includes('authorization')) tags.push('auth');
    if (message.includes('database')) tags.push('database');
    if (message.includes('network')) tags.push('network');
    if (message.includes('timeout')) tags.push('timeout');
    if (message.includes('rate limit')) tags.push('rate-limit');

    // Add endpoint tags
    if (req?.originalUrl) {
      if (req.originalUrl.includes('/auth')) tags.push('auth-endpoint');
      if (req.originalUrl.includes('/archetypes')) tags.push('archetypes-endpoint');
      if (req.originalUrl.includes('/content-examples')) tags.push('content-endpoint');
      if (req.originalUrl.includes('/moderation')) tags.push('moderation-endpoint');
    }

    // Add method tags
    if (req?.method) {
      tags.push(`${req.method.toLowerCase()}-request`);
    }

    return tags;
  }

  /**
   * Extract error type from message
   */
  private extractErrorType(message: string): string {
    if (message.includes('ValidationError')) return 'ValidationError';
    if (message.includes('AuthenticationError')) return 'AuthenticationError';
    if (message.includes('AuthorizationError')) return 'AuthorizationError';
    if (message.includes('NotFoundError')) return 'NotFoundError';
    if (message.includes('ConflictError')) return 'ConflictError';
    if (message.includes('RateLimitError')) return 'RateLimitError';
    if (message.includes('DatabaseError')) return 'DatabaseError';
    if (message.includes('ExternalServiceError')) return 'ExternalServiceError';
    if (message.includes('TypeError')) return 'TypeError';
    if (message.includes('ReferenceError')) return 'ReferenceError';
    if (message.includes('SyntaxError')) return 'SyntaxError';
    return 'UnknownError';
  }

  /**
   * Sanitize sensitive data from request body
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize sensitive headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Load existing logs from file
   */
  private async loadExistingLogs(): Promise<void> {
    try {
      const data = await fs.readFile(this.logFile, 'utf-8');
      const logs = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      this.logs = logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      
      console.log(`Loaded ${this.logs.length} existing error logs`);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty logs
      this.logs = [];
    }
  }

  /**
   * Persist logs to file
   */
  private async persistLogs(): Promise<void> {
    try {
      await fs.writeFile(this.logFile, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error('Failed to persist error logs:', error);
    }
  }

  /**
   * Start cleanup interval to remove old logs
   */
  private startCleanupInterval(): void {
    // Clean up logs older than 30 days every 24 hours
    this.cleanupInterval = setInterval(() => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const removed = this.clearOldLogs(thirtyDaysAgo);
      
      if (removed > 0) {
        console.log(`Cleaned up ${removed} old error logs`);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance(); 