/**
 * Reddit Scraper
 *
 * Retrieves raw HTML for Reddit post, comments page or subreddit front page.
 * Reddit's HTML is rendered server-side so we can capture quickly—still use
 * Playwright to benefit from shared proxy/rate-limit infra.
 */

// @ts-ignore
import type { Page } from 'playwright';

import { Platform, RawContent, Scraper } from './types';
import { getPage } from './playwrightManager';
import { errorLogger } from '../utils/errorLogger';

async function fetchReddit(url: string): Promise<RawContent> {
  let page: Page | undefined;
  let context: any;
  try {
    ({ context, page } = await getPage(url));

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for post content div or fallback small delay
    try {
      await page.waitForSelector('div[data-test-id="post-content"]', { timeout: 2_000 });
    } catch (_) {
      await page.waitForTimeout(500);
    }

    const html = await page.content();

    return {
      platform: Platform.Reddit,
      url,
      rawData: html,
      collectedAt: new Date().toISOString(),
    };
  } catch (err) {
    errorLogger.logError(err as Error, 'error', undefined, {
      scope: 'RedditScraper',
      url,
    });
    throw err;
  } finally {
    try {
      await page?.close();
      await context?.close();
    } catch (_) {/* ignore */}
  }
}

export const redditScraper: Scraper = {
  fetch: fetchReddit,
};