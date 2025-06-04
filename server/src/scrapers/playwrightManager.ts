/**
 * Centralised Playwright browser manager.
 *
 * We maintain a single Playwright Browser instance for the whole process in
 * order to minimise resource consumption and avoid repeatedly launching
 * Chromium for every scrape. At this stage we keep the implementation minimal
 * (skeleton); detailed error handling, proxy configuration and context pooling
 * will be added in later subtasks.
 */

// Minimal global declarations to satisfy TypeScript when Node libs are not
// included in the current tsconfig lib array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function setTimeout(handler: any, timeout?: number): any;

// @ts-ignore – Playwright types not installed yet; ignore for now
import type { Browser, BrowserContext, LaunchOptions } from 'playwright';
import { errorLogger } from '../utils/errorLogger';
import { RateLimiter } from './utils/rateLimiter';
import { ProxyPool } from './utils/proxyPool';

// ---------------------------------------------------------------------------
// Runtime configuration (ENV > defaults)
// ---------------------------------------------------------------------------

const HEADLESS = process.env.SCRAPER_HEADLESS !== 'false';
const MAX_CONCURRENT_CONTEXTS = parseInt(process.env.SCRAPER_MAX_CONTEXTS || '4');
const PROXY_LIST = process.env.SCRAPER_PROXIES?.split(',') ?? [];

const proxyPool = new ProxyPool(PROXY_LIST);
const rateLimiter = new RateLimiter({ capacity: 10, refillRate: 2 });

// ---------------------------------------------------------------------------
// Browser lifecycle management
// ---------------------------------------------------------------------------

let browser: Browser | null = null;
let activeContexts = 0;

function registerShutdown(): void {
  if (process.listenerCount('SIGINT') === 0) {
    process.once('SIGINT', async () => {
      await closeBrowser();
      process.exit(0);
    });
    process.once('SIGTERM', async () => {
      await closeBrowser();
      process.exit(0);
    });
  }
}

/** Lazy-initialise a Playwright browser instance */
export async function getBrowser(options: LaunchOptions = {}): Promise<Browser> {
  if (browser) return browser;

  // Dynamically import to defer the heavyweight Playwright module until needed
  const { chromium } = await import('playwright');
  try {
    browser = await chromium.launch({ headless: HEADLESS, ...options });
  } catch (err) {
    errorLogger.logError(err as Error, 'error', undefined, { scope: 'playwrightManager', action: 'launch' });
    throw err;
  }

  registerShutdown();
  return browser;
}

/** Gracefully close the shared browser instance (e.g. on process exit) */
export async function closeBrowser(): Promise<void> {
  if (!browser) return;
  await browser.close();
  browser = null;
}

// ---------------------------------------------------------------------------
// Context & Page helpers
// ---------------------------------------------------------------------------

/**
 * Acquire a new BrowserContext subject to concurrency limits and optional
 * per-host rate limiting. Automatically configures a proxy from the pool (if
 * available).
 */
export async function getContext(): Promise<BrowserContext> {
  const br = await getBrowser();

  // Simple semaphore to limit concurrent contexts
  while (activeContexts >= MAX_CONCURRENT_CONTEXTS) {
    await new Promise(res => {
      // @ts-ignore – global setTimeout provided by Node
      setTimeout(res, 50);
    });
  }

  activeContexts += 1;

  const proxy = proxyPool.next();
  const contextOptions: Record<string, unknown> = {};
  if (proxy) {
    contextOptions.proxy = { server: proxy };
  }

  try {
    const context = await br.newContext(contextOptions);

    context.on('close', () => {
      activeContexts -= 1;
    });

    return context;
  } catch (err) {
    activeContexts -= 1;
    if (proxy) proxyPool.reportFailure(proxy);
    errorLogger.logError(err as Error, 'error', undefined, { scope: 'playwrightManager', action: 'newContext' });
    throw err;
  }
}

/**
 * Convenience wrapper returning a ready-to-use Page. Handles rate limiting per
 * hostname to avoid accidental DoS or platform bans.
 */
export async function getPage(url: string): Promise<{ context: BrowserContext; page: any }> {
  // @ts-ignore – Node global URL type may be missing from lib set
  const { hostname } = new URL(url);
  await rateLimiter.consume(hostname);

  const context = await getContext();
  const page = await context.newPage();
  return { context, page };
}