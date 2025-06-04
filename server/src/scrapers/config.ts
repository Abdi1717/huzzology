/**
 * Default configuration for scrapers
 */

import { ScraperConfig } from './types';
import { Platform } from '../../shared/src/types';

/**
 * Default user agents for different platforms
 */
export const USER_AGENTS = {
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  tablet: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
};

/**
 * Default configuration for all scrapers
 */
export const DEFAULT_SCRAPER_CONFIG: Omit<ScraperConfig, 'platformConfig'> = {
  rateLimit: 30,
  maxItems: 100,
  useProxy: false,
  userAgent: USER_AGENTS.desktop,
  requestDelay: 1000
};

/**
 * Platform-specific configurations
 */
export const PLATFORM_CONFIGS: Record<Platform, Record<string, any>> = {
  tiktok: {
    baseUrl: 'https://www.tiktok.com',
    trendingPath: '/explore',
    searchPath: '/search?q=',
    userPath: '/@',
    defaultHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  twitter: {
    baseUrl: 'https://twitter.com',
    trendingPath: '/explore',
    searchPath: '/search?q=',
    userPath: '/',
    defaultHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  },
  instagram: {
    baseUrl: 'https://www.instagram.com',
    trendingPath: '/explore',
    searchPath: '/explore/tags/',
    userPath: '/',
    defaultHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  },
  reddit: {
    baseUrl: 'https://www.reddit.com',
    trendingPath: '/r/popular',
    searchPath: '/search?q=',
    userPath: '/user/',
    defaultHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  }
};

/**
 * Create a configuration for a specific platform
 */
export function createScraperConfig(
  platform: Platform, 
  overrides: Partial<ScraperConfig> = {}
): ScraperConfig {
  return {
    ...DEFAULT_SCRAPER_CONFIG,
    platformConfig: PLATFORM_CONFIGS[platform],
    ...overrides
  };
} 