/**
 * TikTok Scraper Stub
 *
 * NOTE: Full scraping logic will be implemented in subtask 5.4. For now this
 * provides a type-safe placeholder so that the scraper facade compiles without
 * errors.
 */

import { Platform, RawContent, Scraper } from './types';

const fetchStub = async (url: string): Promise<RawContent> => {
  // TODO: Replace with real scraping logic
  return {
    platform: Platform.TikTok,
    url,
    rawData: '',
    collectedAt: new Date().toISOString(),
  };
};

export const tikTokScraper: Scraper = {
  fetch: fetchStub,
};