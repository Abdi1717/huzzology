/**
 * Centralised Playwright browser manager.
 *
 * We maintain a single Playwright Browser instance for the whole process in
 * order to minimise resource consumption and avoid repeatedly launching
 * Chromium for every scrape. At this stage we keep the implementation minimal
 * (skeleton); detailed error handling, proxy configuration and context pooling
 * will be added in later subtasks.
 */

// @ts-ignore – Playwright types not installed yet; will be added in future subtasks
import type { Browser, LaunchOptions } from 'playwright';

let browser: Browser | null = null;

/** Lazy-initialise a Playwright browser instance */
export async function getBrowser(options: LaunchOptions = {}): Promise<Browser> {
  if (browser) return browser;

  // Dynamically import to defer the heavyweight Playwright module until needed
  const { chromium } = await import('playwright');
  browser = await chromium.launch({ headless: true, ...options });
  return browser;
}

/** Gracefully close the shared browser instance (e.g. on process exit) */
export async function closeBrowser(): Promise<void> {
  if (!browser) return;
  await browser.close();
  browser = null;
}