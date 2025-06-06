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

/**
 * Create a scraper based on the URL pattern
 * @param url URL to determine which scraper to use
 * @returns Appropriate scraper instance for the URL
 */
export function createScraperFromUrl(url: string): Scraper {
  // Match URL patterns to determine which platform the URL belongs to
  if (url.includes('tiktok.com')) {
    return createScraper('tiktok');
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    return createScraper('twitter');
  } else if (url.includes('instagram.com')) {
    return createScraper('instagram');
  } else if (url.includes('reddit.com')) {
    return createScraper('reddit');
  } else {
    throw new Error(`Unable to determine platform for URL: ${url}`);
  }
} 