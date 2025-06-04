/**
 * Base scraper class with common functionality
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';
import { 
  Scraper, 
  ScraperConfig, 
  ScraperResult, 
  ScraperSearchParams,
  ProxyConfig
} from './types';

/**
 * Abstract base class for all scrapers
 */
export abstract class BaseScraper implements Scraper {
  // Platform this scraper is for
  abstract readonly platform: Platform;
  
  // Browser instance
  protected browser: Browser | null = null;
  
  // Current proxy index for rotation
  protected currentProxyIndex = 0;
  
  // Rate limiting state
  protected requestCount = 0;
  protected lastRequestTime = 0;
  
  /**
   * Constructor
   */
  constructor(protected config: ScraperConfig) {}
  
  /**
   * Initialize the scraper and launch browser
   */
  protected async initialize(): Promise<void> {
    if (this.browser) {
      return; // Already initialized
    }
    
    const launchOptions: puppeteer.LaunchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ]
    };
    
    // Apply proxy if configured
    if (this.config.useProxy && this.config.proxyConfig && this.config.proxyConfig.proxies.length > 0) {
      const proxy = this.getNextProxy();
      if (proxy) {
        launchOptions.args!.push(`--proxy-server=${proxy}`);
      }
    }
    
    this.browser = await puppeteer.launch(launchOptions);
  }
  
  /**
   * Create a new page with proper configuration
   */
  protected async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    
    const page = await this.browser.newPage();
    
    // Set user agent
    if (this.config.userAgent) {
      await page.setUserAgent(this.config.userAgent);
    }
    
    // Set extra headers
    if (this.config.headers) {
      await page.setExtraHTTPHeaders(this.config.headers);
    }
    
    // Set proxy authentication if needed
    if (this.config.useProxy && this.config.proxyConfig?.auth) {
      await page.authenticate({
        username: this.config.proxyConfig.auth.username,
        password: this.config.proxyConfig.auth.password
      });
    }
    
    // Set viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });
    
    return page;
  }
  
  /**
   * Clean up resources
   */
  protected async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  /**
   * Enforce rate limiting between requests
   */
  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    this.requestCount++;
    
    // Calculate minimum delay based on rate limit
    const requestsPerMs = this.config.rateLimit / 60000;
    const minTimeBetweenRequests = 1 / requestsPerMs;
    
    // Calculate time since last request
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // If we need to wait to maintain rate limit
    if (timeSinceLastRequest < minTimeBetweenRequests) {
      const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last request time
    this.lastRequestTime = Date.now();
    
    // Rotate proxy if needed
    if (this.config.useProxy && 
        this.config.proxyConfig?.rotateAfter && 
        this.requestCount % this.config.proxyConfig.rotateAfter === 0) {
      await this.rotateProxy();
    }
  }
  
  /**
   * Get the next proxy in rotation
   */
  protected getNextProxy(): string | null {
    if (!this.config.useProxy || !this.config.proxyConfig || this.config.proxyConfig.proxies.length === 0) {
      return null;
    }
    
    const proxy = this.config.proxyConfig.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxyConfig.proxies.length;
    return proxy;
  }
  
  /**
   * Rotate to the next proxy
   */
  protected async rotateProxy(): Promise<void> {
    if (!this.config.useProxy || !this.config.proxyConfig || this.config.proxyConfig.proxies.length <= 1) {
      return; // No proxies or only one proxy
    }
    
    // Get next proxy
    const proxy = this.getNextProxy();
    if (!proxy) return;
    
    // Restart browser with new proxy
    await this.cleanup();
    await this.initialize();
  }
  
  /**
   * Create a standardized result object
   */
  protected createResult(
    contentExamples: NewContentExample[], 
    startTime: Date, 
    errors: Error[] = []
  ): ScraperResult {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    return {
      contentExamples,
      duration,
      requestCount: this.requestCount,
      successCount: contentExamples.length,
      errors,
      startTime,
      endTime
    };
  }
  
  /**
   * Abstract methods that must be implemented by subclasses
   */
  abstract scrape(params: ScraperSearchParams): Promise<ScraperResult>;
  abstract getTrending(limit?: number): Promise<ScraperResult>;
  abstract getFromUrl(url: string): Promise<NewContentExample | null>;
  abstract isValidUrl(url: string): boolean;
} 