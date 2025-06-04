/**
 * TikTok Scraper
 *
 * Implements minimal yet functional scraping logic using Playwright.  The goal
 * is to retrieve the raw HTML of a TikTok page while respecting rate limits
 * and leveraging the shared browser manager (proxy-aware, concurrency-limited).
 *
 * IMPORTANT: This scraper is intentionally lightweight—deeper parsing (e.g.
 * extracting video metadata or comments) will be added in dedicated subtasks
 * after the basic ingestion pipeline is validated.
 */

// @ts-ignore – Playwright types not installed yet
import type { Page } from 'playwright';

import { Platform, RawContent, Scraper } from './types';
import { getPage } from './playwrightManager';
import { errorLogger } from '../utils/errorLogger';

async function fetchTikTok(url: string): Promise<RawContent> {
  let page: Page | undefined;
  let context: any;
  try {
    ({ context, page } = await getPage(url));

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for main video element or fallback to short delay if not found.
    await page.waitForTimeout(1_000);

    const html: string = await page.content();

    return {
      platform: Platform.TikTok,
      url,
      rawData: html,
      collectedAt: new Date().toISOString(),
    };
  } catch (err) {
    errorLogger.logError(err as Error, 'error', undefined, {
      scope: 'TikTokScraper',
      url,
    });
    throw err;
  } finally {
    try {
      await page?.close();
      await context?.close();
    } catch (_) {
      /* swallow */
    }
  }
}

export const tikTokScraper: Scraper = {
  fetch: fetchTikTok,
};