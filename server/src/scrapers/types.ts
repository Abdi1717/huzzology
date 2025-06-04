/**
 * Types and interfaces for the scraping infrastructure
 */

import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';

/**
 * Configuration for a scraper
 */
export interface ScraperConfig {
  // Maximum number of requests per minute
  rateLimit: number;
  
  // Maximum number of items to scrape in a single run
  maxItems: number;
  
  // Whether to use proxy rotation
  useProxy: boolean;
  
  // Proxy configuration if useProxy is true
  proxyConfig?: ProxyConfig;
  
  // Platform-specific configuration
  platformConfig: Record<string, any>;
  
  // User agent to use for requests
  userAgent?: string;
  
  // Headers to include in requests
  headers?: Record<string, string>;
  
  // Delay between requests in milliseconds
  requestDelay?: number;
}

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  // List of proxy servers to use
  proxies: string[];
  
  // Authentication credentials for proxies
  auth?: {
    username: string;
    password: string;
  };
  
  // Number of requests to make before switching proxies
  rotateAfter?: number;
}

/**
 * Result of a scraping operation
 */
export interface ScraperResult {
  // Content examples retrieved
  contentExamples: NewContentExample[];
  
  // Duration of the scraping operation in milliseconds
  duration: number;
  
  // Number of requests made
  requestCount: number;
  
  // Number of successful requests
  successCount: number;
  
  // Errors encountered during scraping
  errors: Error[];
  
  // Start time of the scraping operation
  startTime: Date;
  
  // End time of the scraping operation
  endTime: Date;
}

/**
 * Search parameters for scraping
 */
export interface ScraperSearchParams {
  // Search query
  query: string;
  
  // Platform-specific search parameters
  platformParams?: Record<string, any>;
  
  // Number of items to return
  limit?: number;
  
  // Type of content to search for
  contentType?: string;
  
  // Date range for search
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  
  // Whether to sort by relevance or recency
  sortBy?: 'relevance' | 'recent';
}

/**
 * Core interface for all scrapers
 */
export interface Scraper {
  // Platform this scraper is for
  readonly platform: Platform;
  
  // Scrape content based on search parameters
  scrape(params: ScraperSearchParams): Promise<ScraperResult>;
  
  // Get trending content
  getTrending(limit?: number): Promise<ScraperResult>;
  
  // Get content from a specific URL
  getFromUrl(url: string): Promise<NewContentExample | null>;
  
  // Check if a URL is valid for this platform
  isValidUrl(url: string): boolean;
} 