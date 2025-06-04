// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../playwrightManager', () => {
  return {
    getPage: vi.fn(async () => {
      const close = vi.fn();
      return {
        context: { close },
        page: {
          goto: vi.fn(),
          waitForSelector: vi.fn(),
          waitForTimeout: vi.fn(),
          content: vi.fn(async () => '<html><body>twitter mock</body></html>'),
          close,
        },
      };
    }),
  };
});

import { twitterScraper } from '../twitter';
import { Platform } from '../types';

const TEST_URL = 'https://twitter.com/someuser/status/1234567890';

describe('Twitter Scraper', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns RawContent for Twitter', async () => {
    const res = await twitterScraper.fetch(TEST_URL);
    expect(res.platform).toBe(Platform.Twitter);
    expect(res.url).toBe(TEST_URL);
    expect(res.rawData).toContain('twitter mock');
    expect(res.collectedAt).toBeDefined();
  });
});