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
          content: vi.fn(async () => '<html><body>reddit mock</body></html>'),
          close,
        },
      };
    }),
  };
});

import { redditScraper } from '../reddit';
import { Platform } from '../types';

const TEST_URL = 'https://www.reddit.com/r/AskReddit/comments/xyz123/example_post/';

describe('Reddit Scraper', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns RawContent for Reddit', async () => {
    const res = await redditScraper.fetch(TEST_URL);
    expect(res.platform).toBe(Platform.Reddit);
    expect(res.url).toBe(TEST_URL);
    expect(res.rawData).toContain('reddit mock');
    expect(res.collectedAt).toBeDefined();
  });
});