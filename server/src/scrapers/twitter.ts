/**
 * Twitter/X Scraper
 *
 * Fetches the raw HTML for a public tweet or profile page via Playwright. This
 * first-pass implementation is lightweight—advanced extraction (JSON payloads
 * via API, hydrated data from scripts) will be handled in later subtasks.
 */

// @ts-ignore – Playwright types not in workspace yet
import type { Page } from 'playwright';

import { Platform, RawContent, Scraper } from './types';
import { getPage } from './playwrightManager';
import { errorLogger } from '../utils/errorLogger';

async function fetchTwitter(url: string): Promise<RawContent> {
  let page: Page | undefined;
  let context: any;

  try {
    ({ context, page } = await getPage(url));

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Twitter dynamically loads content; wait briefly or until article element exists
    try {
      await page.waitForSelector('article', { timeout: 3_000 });
    } catch (_) {
      // fallback timeout; we still capture whatever HTML we have
      await page.waitForTimeout(1_000);
    }

    const html = await page.content();

    return {
      platform: Platform.Twitter,
      url,
      rawData: html,
      collectedAt: new Date().toISOString(),
    };
  } catch (err) {
    errorLogger.logError(err as Error, 'error', undefined, {
      scope: 'TwitterScraper',
      url,
    });
    throw err;
  } finally {
    try {
      await page?.close();
      await context?.close();
    } catch (_) {
      /* ignore */
    }
  }
}

export const twitterScraper: Scraper = {
  fetch: fetchTwitter,
};