/**
 * Scraper Facade
 *
 * Public API used by the rest of the backend to retrieve raw content from
 * various social-media platforms. Platform-specific logic is delegated to
 * individual modules (e.g. `tiktok.ts`).  These modules will be implemented in
 * later subtasks; for now we provide placeholder stubs that satisfy the
 * TypeScript type system.
 */

import { Platform, RawContent, Scraper } from './types';

/**
 * Registry mapping a Platform enum value to its scraper implementation. The
 * registry is populated lazily to avoid circular dependencies when each
 * scraper module imports from this facade in the future.
 */
const scraperRegistry: Partial<Record<Platform, Scraper>> = {};

/**
 * Dynamically import (or return a cached instance of) the scraper for the given
 * platform.  This keeps initial startup time low and avoids loading Playwright
 * for platforms the application may never scrape in a particular session.
 */
async function getScraper(platform: Platform): Promise<Scraper> {
  if (scraperRegistry[platform]) return scraperRegistry[platform]!;

  let scraper: Scraper;

  switch (platform) {
    case Platform.TikTok:
      scraper = await import('./tiktok').then(m => m.tikTokScraper);
      break;
    case Platform.Twitter:
      scraper = await import('./twitter').then(m => m.twitterScraper);
      break;
    case Platform.Instagram:
      scraper = await import('./instagram').then(m => m.instagramScraper);
      break;
    case Platform.Reddit:
      scraper = await import('./reddit').then(m => m.redditScraper);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  scraperRegistry[platform] = scraper;
  return scraper;
}

/**
 * Fetch content from a given URL using the appropriate platform scraper.
 *
 * @param platform - Social-media platform identifier
 * @param url - Fully-qualified URL of the resource to scrape
 */
export async function fetchContent(
  platform: Platform,
  url: string,
): Promise<RawContent> {
  const scraper = await getScraper(platform);
  return scraper.fetch(url);
}