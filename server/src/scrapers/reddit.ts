/**
 * Reddit Scraper Stub (Subtask 5.7 will implement real logic)
 */

import { Platform, RawContent, Scraper } from './types';

const fetchStub = async (url: string): Promise<RawContent> => {
  return {
    platform: Platform.Reddit,
    url,
    rawData: '',
    collectedAt: new Date().toISOString(),
  };
};

export const redditScraper: Scraper = {
  fetch: fetchStub,
};