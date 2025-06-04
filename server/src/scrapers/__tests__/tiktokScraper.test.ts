/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the heavy Playwright-dependent functions to avoid launching browsers
vi.mock('../playwrightManager', () => {
  return {
    getPage: vi.fn(async () => {
      const close = vi.fn();
      return {
        context: { close },
        page: {
          goto: vi.fn(),
          waitForTimeout: vi.fn(),
          content: vi.fn(async () => '<html><body>mock</body></html>'),
          close,
        },
      };
    }),
  };
});

import { tikTokScraper } from '../tiktok';
import { Platform } from '../types';

const TEST_URL = 'https://www.tiktok.com/@someuser/video/1234567890';

describe('TikTok Scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns RawContent with expected fields', async () => {
    const result = await tikTokScraper.fetch(TEST_URL);

    expect(result.platform).toBe(Platform.TikTok);
    expect(result.url).toBe(TEST_URL);
    expect(result.rawData).toContain('<html');
    expect(result.collectedAt).toBeDefined();
  });
});