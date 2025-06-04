/**
 * Instagram Scraper
 *
 * Grabs raw HTML for a public Instagram post or profile.  Instagram heavily
 * relies on JS; we wait for the main `<article>` (post) or `header` (profile)
 * element but fallback to a small delay to avoid hanging. Further JSON data
 * extraction will be handled in later subtasks.
 */

// @ts-ignore – Playwright types absent in monorepo TS config
import type { Page } from 'playwright';

import { Platform, RawContent, Scraper } from './types';
import { getPage } from './playwrightManager';
import { errorLogger } from '../utils/errorLogger';

async function fetchInstagram(url: string): Promise<RawContent> {
  let page: Page | undefined;
  let context: any;
  try {
    ({ context, page } = await getPage(url));

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    try {
      // Wait for post container or profile header
      await page.waitForSelector('article, header', { timeout: 3_000 });
    } catch (_) {
      await page.waitForTimeout(1_000);
    }

    const html = await page.content();

    return {
      platform: Platform.Instagram,
      url,
      rawData: html,
      collectedAt: new Date().toISOString(),
    };
  } catch (err) {
    errorLogger.logError(err as Error, 'error', undefined, {
      scope: 'InstagramScraper',
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

export const instagramScraper: Scraper = {
  fetch: fetchInstagram,
};