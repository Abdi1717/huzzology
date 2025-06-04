/**
 * Scrapers index file
 * Exports all scrapers for the application
 */

export * from './types';
export * from './config';
export * from './utils';
export * from './tiktok-scraper';
export * from './twitter-scraper';
export * from './instagram-scraper';
export * from './reddit-scraper';

// Scraper factory for creating appropriate scraper instances
import { Scraper } from './types';
import { Platform } from '../../shared/src/types';
import { createScraperConfig } from './config';
import { TikTokScraper } from './tiktok-scraper';
import { TwitterScraper } from './twitter-scraper';
import { InstagramScraper } from './instagram-scraper';
import { RedditScraper } from './reddit-scraper';

/**
 * Create a scraper for the specified platform
 */
export function createScraper(platform: Platform): Scraper {
  const config = createScraperConfig(platform);
  
  switch (platform) {
    case 'tiktok':
      return new TikTokScraper(config);
    case 'twitter':
      return new TwitterScraper(config);
    case 'instagram':
      return new InstagramScraper(config);
    case 'reddit':
      return new RedditScraper(config);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
} 