/**
 * Twitter scraper implementation
 */

import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScraperResult, ScraperSearchParams } from './types';
import { isValidPlatformUrl, extractUsernameFromUrl } from './utils';

/**
 * Twitter-specific scraper implementation
 */
export class TwitterScraper extends BaseScraper {
  readonly platform: Platform = 'twitter';

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Scrape Twitter content based on search parameters
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

      // Navigate to Twitter search
      const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(params.query)}&src=typed_query&f=top`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('div[role="button"][data-testid="accept"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Wait for tweets to load
      await page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 });
      
      // Scroll to load more tweets
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
      }

      // Extract tweets
      const tweetElements = await page.$$('article[data-testid="tweet"]');
      const maxItems = Math.min(tweetElements.length, this.config.maxItems);

      for (let i = 0; i < maxItems; i++) {
        try {
          const tweetElement = tweetElements[i];
          
          // Extract tweet text
          const textElement = await tweetElement.$('div[data-testid="tweetText"]');
          const caption = textElement ? await page.evaluate(el => el.textContent, textElement) : '';
          
          // Extract tweet URL
          const timeElement = await tweetElement.$('time');
          let url = '';
          
          if (timeElement) {
            const parentAnchor = await page.evaluateHandle(el => el.closest('a'), timeElement);
            url = await page.evaluate(el => el.href, parentAnchor);
          }
          
          // Extract engagement metrics
          const likeButton = await tweetElement.$('div[data-testid="like"]');
          const retweetButton = await tweetElement.$('div[data-testid="retweet"]');
          const replyButton = await tweetElement.$('div[data-testid="reply"]');
          
          let likes = 0, retweets = 0, replies = 0;
          
          if (likeButton) {
            const likeCountElement = await likeButton.$('span[data-testid="app-text-transition-container"]');
            if (likeCountElement) {
              const likeText = await page.evaluate(el => el.textContent, likeCountElement);
              likes = this.parseMetric(likeText);
            }
          }
          
          if (retweetButton) {
            const retweetCountElement = await retweetButton.$('span[data-testid="app-text-transition-container"]');
            if (retweetCountElement) {
              const retweetText = await page.evaluate(el => el.textContent, retweetCountElement);
              retweets = this.parseMetric(retweetText);
            }
          }
          
          if (replyButton) {
            const replyCountElement = await replyButton.$('span[data-testid="app-text-transition-container"]');
            if (replyCountElement) {
              const replyText = await page.evaluate(el => el.textContent, replyCountElement);
              replies = this.parseMetric(replyText);
            }
          }
          
          // Extract username
          const usernameElement = await tweetElement.$('div[data-testid="User-Name"] > div:nth-child(2) > div > div > a > div > span');
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
                comments: replies,
                shares: retweets
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
   * Get trending content from Twitter
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

      // Navigate to Twitter trending page
      await page.goto('https://twitter.com/explore/tabs/trending', { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('div[role="button"][data-testid="accept"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Wait for trends to load
      await page.waitForSelector('div[data-testid="trend"]', { timeout: 10000 });

      // Click on the first trend to see related tweets
      const firstTrend = await page.$('div[data-testid="trend"]');
      if (firstTrend) {
        await firstTrend.click();
        await page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 });
        
        // Scroll to load more tweets
        for (let i = 0; i < 2; i++) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await page.waitForTimeout(1000);
        }
        
        // Extract tweets
        const tweetElements = await page.$$('article[data-testid="tweet"]');
        const maxItems = Math.min(tweetElements.length, limit);
        
        for (let i = 0; i < maxItems; i++) {
          try {
            const tweetElement = tweetElements[i];
            
            // Extract tweet text
            const textElement = await tweetElement.$('div[data-testid="tweetText"]');
            const caption = textElement ? await page.evaluate(el => el.textContent, textElement) : '';
            
            // Extract tweet URL
            const timeElement = await tweetElement.$('time');
            let url = '';
            
            if (timeElement) {
              const parentAnchor = await page.evaluateHandle(el => el.closest('a'), timeElement);
              url = await page.evaluate(el => el.href, parentAnchor);
            }
            
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
   * Get content from a specific Twitter URL
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

      // Navigate to the tweet
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Accept cookies if prompted
      try {
        const cookieButton = await page.$('div[role="button"][data-testid="accept"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Ignore cookie errors
      }

      // Wait for tweet to load
      await page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 });
      
      // Extract tweet details
      const tweetElement = await page.$('article[data-testid="tweet"]');
      
      if (!tweetElement) {
        throw new Error('Tweet not found');
      }
      
      // Extract tweet text
      const textElement = await tweetElement.$('div[data-testid="tweetText"]');
      const caption = textElement ? await page.evaluate(el => el.textContent, textElement) : '';
      
      // Extract engagement metrics
      const likeButton = await tweetElement.$('div[data-testid="like"]');
      const retweetButton = await tweetElement.$('div[data-testid="retweet"]');
      const replyButton = await tweetElement.$('div[data-testid="reply"]');
      
      let likes = 0, retweets = 0, replies = 0;
      
      if (likeButton) {
        const likeCountElement = await likeButton.$('span[data-testid="app-text-transition-container"]');
        if (likeCountElement) {
          const likeText = await page.evaluate(el => el.textContent, likeCountElement);
          likes = this.parseMetric(likeText);
        }
      }
      
      if (retweetButton) {
        const retweetCountElement = await retweetButton.$('span[data-testid="app-text-transition-container"]');
        if (retweetCountElement) {
          const retweetText = await page.evaluate(el => el.textContent, retweetCountElement);
          retweets = this.parseMetric(retweetText);
        }
      }
      
      if (replyButton) {
        const replyCountElement = await replyButton.$('span[data-testid="app-text-transition-container"]');
        if (replyCountElement) {
          const replyText = await page.evaluate(el => el.textContent, replyCountElement);
          replies = this.parseMetric(replyText);
        }
      }
      
      // Extract username
      const usernameElement = await tweetElement.$('div[data-testid="User-Name"] > div:nth-child(2) > div > div > a > div > span');
      const username = usernameElement ? await page.evaluate(el => el.textContent, usernameElement) : '';
      
      // Try to extract follower count
      let followerCount: number | undefined = undefined;
      
      // Click on username to view profile
      const nameElement = await tweetElement.$('div[data-testid="User-Name"]');
      if (nameElement) {
        await nameElement.click();
        await page.waitForTimeout(2000);
        
        // Check for follower count
        const followElement = await page.$('a[href*="/followers"] > span > span');
        if (followElement) {
          const followText = await page.evaluate(el => el.textContent, followElement);
          followerCount = this.parseMetric(followText);
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
          comments: replies,
          shares: retweets
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
   * Check if a URL is a valid Twitter URL
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