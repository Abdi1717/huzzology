/**
 * Twitter/X Scraper Stub (Subtask 5.5 will implement real logic)
 */

import { Platform, RawContent, Scraper } from './types';

const fetchStub = async (url: string): Promise<RawContent> => {
  return {
    platform: Platform.Twitter,
    url,
    rawData: '',
    collectedAt: new Date().toISOString(),
  };
};

export const twitterScraper: Scraper = {
  fetch: fetchStub,
};