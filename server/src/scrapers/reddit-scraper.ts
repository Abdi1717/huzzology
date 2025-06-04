/**
 * Reddit scraper implementation
 */

import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScraperResult, ScraperSearchParams } from './types';
import { isValidPlatformUrl, extractUsernameFromUrl } from './utils';

/**
 * Reddit-specific scraper implementation
 */
export class RedditScraper extends BaseScraper {
  readonly platform: Platform = 'reddit';

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Scrape Reddit content based on search parameters
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

      // Navigate to Reddit search
      const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(params.query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('button[data-testid="COOKIE-BANNER-ACCEPT"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Handle any popups
      try {
        const closeButtons = await page.$$('button[aria-label="Close"]');
        for (const button of closeButtons) {
          await button.click();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        // Ignore popup errors
      }

      // Wait for posts to load
      await page.waitForSelector('div[data-testid="post-container"]', { timeout: 10000 });
      
      // Scroll to load more posts
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(1000);
      }

      // Extract posts
      const postElements = await page.$$('div[data-testid="post-container"]');
      const maxItems = Math.min(postElements.length, this.config.maxItems);

      for (let i = 0; i < maxItems; i++) {
        try {
          const postElement = postElements[i];
          
          // Extract post URL
          const titleElement = await postElement.$('a[data-testid="post-title"]');
          const url = titleElement ? await page.evaluate(el => el.href, titleElement) : '';
          
          // Extract post title and text
          const title = titleElement ? await page.evaluate(el => el.textContent, titleElement) : '';
          
          // Get post body (if visible)
          const bodyElement = await postElement.$('div[data-testid="post-content"]');
          const body = bodyElement ? await page.evaluate(el => el.textContent, bodyElement) : '';
          
          // Combine title and body for caption
          const caption = title + (body ? '\n\n' + body : '');
          
          // Extract engagement metrics
          const upvoteElement = await postElement.$('button[aria-label*="upvote"]');
          let upvotes = 0;
          
          if (upvoteElement) {
            const siblingElement = await page.evaluateHandle(el => el.nextSibling, upvoteElement);
            const upvoteText = await page.evaluate(el => el.textContent, siblingElement);
            upvotes = this.parseRedditMetric(upvoteText);
          }
          
          // Extract comment count
          const commentElement = await postElement.$('a[data-testid="comments-page-link-num-comments"]');
          let commentCount = 0;
          
          if (commentElement) {
            const commentText = await page.evaluate(el => el.textContent, commentElement);
            const match = commentText.match(/(\d+(?:,\d+)*)\s*(?:comments?)/i);
            if (match) {
              commentCount = parseInt(match[1].replace(/,/g, ''), 10);
            }
          }
          
          // Extract username and subreddit
          const authorElement = await postElement.$('a[data-testid="post_author_link"]');
          const username = authorElement ? await page.evaluate(el => el.textContent, authorElement) : '';
          
          const subredditElement = await postElement.$('a[data-testid="subreddit-link"]');
          const subreddit = subredditElement ? await page.evaluate(el => el.textContent, subredditElement) : '';
          
          // Create content example
          if (url) {
            contentExamples.push({
              platform: this.platform,
              url,
              caption: caption || undefined,
              timestamp: new Date().toISOString(),
              engagement_metrics: {
                likes: upvotes,
                comments: commentCount,
                shares: 0
              },
              creator: {
                username: username || undefined,
                follower_count: undefined
              },
              metadata: {
                subreddit: subreddit || undefined
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
   * Get trending content from Reddit
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

      // Navigate to Reddit trending/popular page
      await page.goto('https://www.reddit.com/r/popular/', { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('button[data-testid="COOKIE-BANNER-ACCEPT"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Handle any popups
      try {
        const closeButtons = await page.$$('button[aria-label="Close"]');
        for (const button of closeButtons) {
          await button.click();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        // Ignore popup errors
      }

      // Wait for posts to load
      await page.waitForSelector('div[data-testid="post-container"]', { timeout: 10000 });
      
      // Scroll to load more posts
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(1000);
      }

      // Extract posts
      const postElements = await page.$$('div[data-testid="post-container"]');
      const maxItems = Math.min(postElements.length, limit);

      for (let i = 0; i < maxItems; i++) {
        try {
          const postElement = postElements[i];
          
          // Extract post URL
          const titleElement = await postElement.$('a[data-testid="post-title"]');
          const url = titleElement ? await page.evaluate(el => el.href, titleElement) : '';
          
          // Extract post title
          const title = titleElement ? await page.evaluate(el => el.textContent, titleElement) : '';
          
          // Extract subreddit
          const subredditElement = await postElement.$('a[data-testid="subreddit-link"]');
          const subreddit = subredditElement ? await page.evaluate(el => el.textContent, subredditElement) : '';
          
          // Create content example
          if (url) {
            contentExamples.push({
              platform: this.platform,
              url,
              caption: title || undefined,
              timestamp: new Date().toISOString(),
              engagement_metrics: {
                likes: 0,
                comments: 0,
                shares: 0
              },
              metadata: {
                subreddit: subreddit || undefined
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
   * Get content from a specific Reddit URL
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

      // Navigate to the Reddit post
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('button[data-testid="COOKIE-BANNER-ACCEPT"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Handle any popups
      try {
        const closeButtons = await page.$$('button[aria-label="Close"]');
        for (const button of closeButtons) {
          await button.click();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        // Ignore popup errors
      }

      // Wait for post to load
      await page.waitForSelector('div[data-testid="post-container"]', { timeout: 10000 });
      
      // Extract post details
      const titleElement = await page.$('div[data-testid="post-container"] a[data-testid="post-title"]');
      const title = titleElement ? await page.evaluate(el => el.textContent, titleElement) : '';
      
      // Get post body
      const bodyElement = await page.$('div[data-testid="post-content"]');
      const body = bodyElement ? await page.evaluate(el => el.textContent, bodyElement) : '';
      
      // Combine title and body for caption
      const caption = title + (body ? '\n\n' + body : '');
      
      // Extract engagement metrics
      const upvoteElement = await page.$('div[data-testid="post-container"] button[aria-label*="upvote"]');
      let upvotes = 0;
      
      if (upvoteElement) {
        const siblingElement = await page.evaluateHandle(el => el.nextSibling, upvoteElement);
        const upvoteText = await page.evaluate(el => el.textContent, siblingElement);
        upvotes = this.parseRedditMetric(upvoteText);
      }
      
      // Extract comment count
      let commentCount = 0;
      const commentCountElement = await page.$('span[data-testid="comment-count"]');
      if (commentCountElement) {
        const commentText = await page.evaluate(el => el.textContent, commentCountElement);
        commentCount = parseInt(commentText.replace(/[^\d]/g, ''), 10);
      }
      
      // Extract username
      const authorElement = await page.$('a[data-testid="post_author_link"]');
      const username = authorElement ? await page.evaluate(el => el.textContent, authorElement) : '';
      
      // Extract subreddit
      const subredditElement = await page.$('a[data-testid="subreddit-link"]');
      const subreddit = subredditElement ? await page.evaluate(el => el.textContent, subredditElement) : '';
      
      // Try to extract user karma (follower equivalent)
      let userKarma: number | undefined = undefined;
      
      if (username) {
        try {
          // Open user profile in new tab
          const profilePage = await this.browser!.newPage();
          await this.enforceRateLimit();
          
          await profilePage.goto(`https://www.reddit.com/user/${username.replace('u/', '')}/`, { waitUntil: 'networkidle2' });
          
          // Extract karma count
          const karmaElement = await profilePage.$('span:has-text("karma")');
          if (karmaElement) {
            const karmaText = await profilePage.evaluate(el => el.previousSibling?.textContent || '', karmaElement);
            userKarma = this.parseRedditMetric(karmaText);
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
          likes: upvotes,
          comments: commentCount,
          shares: 0
        },
        creator: {
          username: username || undefined,
          follower_count: userKarma
        },
        metadata: {
          subreddit: subreddit || undefined
        }
      };
    } catch (error) {
      await this.cleanup();
      return null;
    }
  }

  /**
   * Check if a URL is a valid Reddit URL
   */
  isValidUrl(url: string): boolean {
    return isValidPlatformUrl(url, this.platform);
  }
  
  /**
   * Parse Reddit metrics that might have k, m or special formatting
   */
  private parseRedditMetric(value: string): number {
    if (!value) return 0;
    
    const cleanValue = value.trim();
    
    // Handle Reddit's vote format with decimal for thousands and up
    if (cleanValue.includes('k')) {
      return parseFloat(cleanValue.replace('k', '')) * 1000;
    }
    
    if (cleanValue.includes('m')) {
      return parseFloat(cleanValue.replace('m', '')) * 1000000;
    }
    
    // Handle "Vote" text or other special cases
    if (cleanValue === 'Vote' || cleanValue === '•') {
      return 0;
    }
    
    // Try to parse as a number
    const numericValue = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
} 