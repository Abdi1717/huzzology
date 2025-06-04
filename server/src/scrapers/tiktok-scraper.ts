/**
 * TikTok scraper implementation
 */

import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScraperResult, ScraperSearchParams } from './types';
import { isValidPlatformUrl, extractUsernameFromUrl } from './utils';

/**
 * TikTok-specific scraper implementation
 */
export class TikTokScraper extends BaseScraper {
  readonly platform: Platform = 'tiktok';

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Scrape TikTok content based on search parameters
   */
  async scrape(params: ScraperSearchParams): Promise<ScraperResult> {
    const startTime = new Date();
    const contentExamples: NewContentExample[] = [];
    const errors: Error[] = [];

    try {
      await this.initialize();
      const page = await this.createPage();

      // Enforce rate limiting
      await this.enforceRateLimit();

      // Navigate to TikTok search
      await page.goto('https://www.tiktok.com/search', { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('[data-e2e="cookie-banner-accept"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Enter search query
      const searchInput = await page.$('input[data-e2e="search-user-input"]');
      if (searchInput) {
        await searchInput.type(params.query);
        await page.keyboard.press('Enter');
        await page.waitForSelector('[data-e2e="search-card-container"]', { timeout: 10000 });
      }

      // Extract content
      const videoElements = await page.$$('[data-e2e="search-card-container"]');
      const maxItems = Math.min(videoElements.length, this.config.maxItems);

      for (let i = 0; i < maxItems; i++) {
        try {
          const videoElement = videoElements[i];
          
          // Extract content details
          const captionElement = await videoElement.$('[data-e2e="search-card-video-caption"]');
          const caption = captionElement ? await page.evaluate(el => el.textContent, captionElement) : '';
          
          const urlElement = await videoElement.$('a[href*="/video/"]');
          const url = urlElement ? await page.evaluate(el => el.href, urlElement) : '';
          
          const statsElement = await videoElement.$('[data-e2e="search-card-like-container"]');
          const stats = statsElement ? await page.evaluate(el => el.textContent, statsElement) : '';
          
          // Parse engagement metrics (likes, comments, shares)
          const likesMatch = stats.match(/(\d+(?:\.\d+)?[KMB]?)\s*likes/i);
          const commentsMatch = stats.match(/(\d+(?:\.\d+)?[KMB]?)\s*comments/i);
          const sharesMatch = stats.match(/(\d+(?:\.\d+)?[KMB]?)\s*shares/i);
          
          const likes = likesMatch ? this.parseMetric(likesMatch[1]) : 0;
          const comments = commentsMatch ? this.parseMetric(commentsMatch[1]) : 0;
          const shares = sharesMatch ? this.parseMetric(sharesMatch[1]) : 0;
          
          // Extract username and image
          const usernameElement = await videoElement.$('[data-e2e="search-card-user-unique-id"]');
          const username = usernameElement ? await page.evaluate(el => el.textContent, usernameElement) : '';
          
          // Create content example
          if (url) {
            contentExamples.push({
              platform: this.platform,
              url,
              caption: caption || undefined,
              timestamp: new Date().toISOString(),
              engagement_metrics: {
                likes,
                comments,
                shares
              },
              creator: {
                username: username || undefined,
                follower_count: undefined
              }
            });
          }
        } catch (error) {
          errors.push(error as Error);
        }
      }

      await page.close();
    } catch (error) {
      errors.push(error as Error);
    } finally {
      await this.cleanup();
    }

    return this.createResult(contentExamples, startTime, errors);
  }

  /**
   * Get trending content from TikTok
   */
  async getTrending(limit: number = 10): Promise<ScraperResult> {
    const startTime = new Date();
    const contentExamples: NewContentExample[] = [];
    const errors: Error[] = [];

    try {
      await this.initialize();
      const page = await this.createPage();

      // Enforce rate limiting
      await this.enforceRateLimit();

      // Navigate to TikTok trending page
      await page.goto('https://www.tiktok.com/explore', { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('[data-e2e="cookie-banner-accept"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Wait for trending content to load
      await page.waitForSelector('[data-e2e="explore-item"]', { timeout: 10000 });

      // Extract trending videos
      const trendingElements = await page.$$('[data-e2e="explore-item"]');
      const maxItems = Math.min(trendingElements.length, limit);

      for (let i = 0; i < maxItems; i++) {
        try {
          const trendingElement = trendingElements[i];
          
          // Get video URL
          const linkElement = await trendingElement.$('a');
          const url = linkElement ? await page.evaluate(el => el.href, linkElement) : '';
          
          // Get video caption
          const captionElement = await trendingElement.$('.tiktok-1ejylhp-DivContainer');
          const caption = captionElement ? await page.evaluate(el => el.textContent, captionElement) : '';
          
          // Create content example
          if (url) {
            contentExamples.push({
              platform: this.platform,
              url,
              caption: caption || undefined,
              timestamp: new Date().toISOString(),
              engagement_metrics: {
                likes: 0,
                comments: 0,
                shares: 0
              }
            });
          }
        } catch (error) {
          errors.push(error as Error);
        }
      }

      await page.close();
    } catch (error) {
      errors.push(error as Error);
    } finally {
      await this.cleanup();
    }

    return this.createResult(contentExamples, startTime, errors);
  }

  /**
   * Get content from a specific TikTok URL
   */
  async getFromUrl(url: string): Promise<NewContentExample | null> {
    if (!this.isValidUrl(url)) {
      return null;
    }

    try {
      await this.initialize();
      const page = await this.createPage();

      // Enforce rate limiting
      await this.enforceRateLimit();

      // Navigate to the TikTok video
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('[data-e2e="cookie-banner-accept"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Extract video information
      const captionElement = await page.$('[data-e2e="video-desc"]');
      const caption = captionElement ? await page.evaluate(el => el.textContent, captionElement) : '';

      // Extract engagement metrics
      const likesElement = await page.$('[data-e2e="like-count"]');
      const commentsElement = await page.$('[data-e2e="comment-count"]');
      const sharesElement = await page.$('[data-e2e="share-count"]');

      const likes = likesElement ? this.parseMetric(await page.evaluate(el => el.textContent, likesElement)) : 0;
      const comments = commentsElement ? this.parseMetric(await page.evaluate(el => el.textContent, commentsElement)) : 0;
      const shares = sharesElement ? this.parseMetric(await page.evaluate(el => el.textContent, sharesElement)) : 0;

      // Extract creator information
      const usernameElement = await page.$('[data-e2e="video-owner-uniqueid"]');
      const username = usernameElement ? await page.evaluate(el => el.textContent, usernameElement) : '';

      const followerElement = await page.$('[data-e2e="followers-count"]');
      const followerCount = followerElement ? this.parseMetric(await page.evaluate(el => el.textContent, followerElement)) : undefined;

      await page.close();
      await this.cleanup();

      return {
        platform: this.platform,
        url,
        caption: caption || undefined,
        timestamp: new Date().toISOString(),
        engagement_metrics: {
          likes,
          comments,
          shares
        },
        creator: {
          username: username || undefined,
          follower_count: followerCount
        }
      };
    } catch (error) {
      await this.cleanup();
      return null;
    }
  }

  /**
   * Check if a URL is a valid TikTok URL
   */
  isValidUrl(url: string): boolean {
    return isValidPlatformUrl(url, this.platform);
  }

  /**
   * Parse engagement metrics that might have K, M, or B suffixes
   */
  private parseMetric(value: string): number {
    if (!value) return 0;
    
    const match = value.trim().match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
    if (!match) return 0;
    
    const [, num, suffix] = match;
    const numValue = parseFloat(num);
    
    if (suffix) {
      if (suffix.toUpperCase() === 'K') return numValue * 1000;
      if (suffix.toUpperCase() === 'M') return numValue * 1000000;
      if (suffix.toUpperCase() === 'B') return numValue * 1000000000;
    }
    
    return numValue;
  }
} 