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
          content: vi.fn(async () => '<html><body>ig mock</body></html>'),
          close,
        },
      };
    }),
  };
});

import { instagramScraper } from '../instagram';
import { Platform } from '../types';

const TEST_URL = 'https://www.instagram.com/p/ABC123xyz/';

describe('Instagram Scraper', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns RawContent for Instagram', async () => {
    const res = await instagramScraper.fetch(TEST_URL);
    expect(res.platform).toBe(Platform.Instagram);
    expect(res.url).toBe(TEST_URL);
    expect(res.rawData).toContain('ig mock');
    expect(res.collectedAt).toBeDefined();
  });
});