/**
 * Instagram scraper implementation
 */

import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScraperResult, ScraperSearchParams } from './types';
import { isValidPlatformUrl, extractUsernameFromUrl } from './utils';

/**
 * Instagram-specific scraper implementation
 */
export class InstagramScraper extends BaseScraper {
  readonly platform: Platform = 'instagram';

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Scrape Instagram content based on search parameters
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

      // Navigate to Instagram search
      await page.goto('https://www.instagram.com/explore/tags/' + encodeURIComponent(params.query.replace(/\s+/g, '')), { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('button[type="submit"]');
        if (cookieButton) {
          const buttonText = await page.evaluate(el => el.textContent, cookieButton);
          if (buttonText && (buttonText.includes('Allow') || buttonText.includes('Accept'))) {
            await cookieButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Handle login modal if it appears
      try {
        const closeButton = await page.$('button[aria-label="Close"]');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore login modal errors
      }

      // Wait for posts to load
      await page.waitForSelector('article a', { timeout: 10000 });

      // Extract posts
      const postLinks = await page.$$('article a');
      const maxItems = Math.min(postLinks.length, this.config.maxItems);

      for (let i = 0; i < maxItems; i++) {
        try {
          const postLink = postLinks[i];
          const href = await page.evaluate(el => el.href, postLink);
          
          // Open post in new page
          const postPage = await this.browser!.newPage();
          await this.enforceRateLimit();
          
          await postPage.goto(href, { waitUntil: 'networkidle2' });
          
          // Extract post caption
          const captionElement = await postPage.$('div[data-testid="post-comment-root"] > span');
          const caption = captionElement ? await postPage.evaluate(el => el.textContent, captionElement) : '';
          
          // Extract engagement metrics
          const likeCountElement = await postPage.$('section:nth-child(3) span');
          let likes = 0;
          
          if (likeCountElement) {
            const likeText = await postPage.evaluate(el => el.textContent, likeCountElement);
            if (likeText && likeText.includes('like')) {
              const match = likeText.match(/(\d+(?:,\d+)*)/);
              if (match) {
                likes = parseInt(match[1].replace(/,/g, ''), 10);
              }
            }
          }
          
          // Extract username
          const usernameElement = await postPage.$('a.x1i10hfl');
          const username = usernameElement ? await postPage.evaluate(el => el.textContent, usernameElement) : '';
          
          // Create content example
          contentExamples.push({
            platform: this.platform,
            url: href,
            caption: caption || undefined,
            timestamp: new Date().toISOString(),
            engagement_metrics: {
              likes,
              comments: 0,
              shares: 0
            },
            creator: {
              username: username || undefined,
              follower_count: undefined
            }
          });
          
          await postPage.close();
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
   * Get trending content from Instagram
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

      // Navigate to Instagram explore page
      await page.goto('https://www.instagram.com/explore/', { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('button[type="submit"]');
        if (cookieButton) {
          const buttonText = await page.evaluate(el => el.textContent, cookieButton);
          if (buttonText && (buttonText.includes('Allow') || buttonText.includes('Accept'))) {
            await cookieButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Handle login modal if it appears
      try {
        const closeButton = await page.$('button[aria-label="Close"]');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore login modal errors
      }

      // Wait for posts to load
      await page.waitForSelector('article a', { timeout: 10000 });
      
      // Scroll to load more posts
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 2);
      });
      
      await page.waitForTimeout(2000);

      // Extract posts
      const postLinks = await page.$$('article a');
      const maxItems = Math.min(postLinks.length, limit);

      for (let i = 0; i < maxItems; i++) {
        try {
          const postLink = postLinks[i];
          const href = await page.evaluate(el => el.href, postLink);
          
          // Create content example with minimal info since we can't get much without logging in
          contentExamples.push({
            platform: this.platform,
            url: href,
            timestamp: new Date().toISOString(),
            engagement_metrics: {
              likes: 0,
              comments: 0,
              shares: 0
            }
          });
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
   * Get content from a specific Instagram URL
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

      // Navigate to the Instagram post
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('button[type="submit"]');
        if (cookieButton) {
          const buttonText = await page.evaluate(el => el.textContent, cookieButton);
          if (buttonText && (buttonText.includes('Allow') || buttonText.includes('Accept'))) {
            await cookieButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Handle login modal if it appears
      try {
        const closeButton = await page.$('button[aria-label="Close"]');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore login modal errors
      }

      // Extract post caption
      const captionElement = await page.$('div[data-testid="post-comment-root"] > span');
      const caption = captionElement ? await page.evaluate(el => el.textContent, captionElement) : '';
      
      // Extract engagement metrics
      const likeCountElement = await page.$('section:nth-child(3) span');
      let likes = 0;
      
      if (likeCountElement) {
        const likeText = await page.evaluate(el => el.textContent, likeCountElement);
        if (likeText && likeText.includes('like')) {
          const match = likeText.match(/(\d+(?:,\d+)*)/);
          if (match) {
            likes = parseInt(match[1].replace(/,/g, ''), 10);
          }
        }
      }
      
      // Extract username
      const usernameElement = await page.$('a.x1i10hfl');
      const username = usernameElement ? await page.evaluate(el => el.textContent, usernameElement) : '';
      
      // Extract follower count (need to visit profile)
      let followerCount: number | undefined = undefined;
      
      if (username) {
        try {
          // Open profile in new tab
          const profilePage = await this.browser!.newPage();
          await this.enforceRateLimit();
          
          await profilePage.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle2' });
          
          // Extract follower count
          const followerElement = await profilePage.$('ul li:nth-child(2) span');
          if (followerElement) {
            const followerText = await profilePage.evaluate(el => el.textContent, followerElement);
            if (followerText) {
              const match = followerText.match(/(\d+(?:,\d+)*)/);
              if (match) {
                followerCount = parseInt(match[1].replace(/,/g, ''), 10);
              } else if (followerText.includes('K')) {
                followerCount = parseFloat(followerText.replace('K', '')) * 1000;
              } else if (followerText.includes('M')) {
                followerCount = parseFloat(followerText.replace('M', '')) * 1000000;
              }
            }
          }
          
          await profilePage.close();
        } catch (error) {
          // Ignore profile errors
        }
      }

      await page.close();
      await this.cleanup();

      return {
        platform: this.platform,
        url,
        caption: caption || undefined,
        timestamp: new Date().toISOString(),
        engagement_metrics: {
          likes,
          comments: 0,
          shares: 0
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
   * Check if a URL is a valid Instagram URL
   */
  isValidUrl(url: string): boolean {
    return isValidPlatformUrl(url, this.platform);
  }
} 