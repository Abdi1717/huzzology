/**
 * Instagram Scraper Stub (Subtask 5.6 will implement real logic)
 */

import { Platform, RawContent, Scraper } from './types';

const fetchStub = async (url: string): Promise<RawContent> => {
  return {
    platform: Platform.Instagram,
    url,
    rawData: '',
    collectedAt: new Date().toISOString(),
  };
};

export const instagramScraper: Scraper = {
  fetch: fetchStub,
};