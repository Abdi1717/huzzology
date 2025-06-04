/**
 * Shared types for scraper modules.
 *
 * Defines the supported social media platforms and the raw content structure
 * captured by each scraper. This skeleton allows platform-specific scraper
 * implementations to conform to a common interface without coupling them to
 * storage/processing concerns yet (those will be addressed in later
 * subtasks).
 */

// NOTE: We intentionally keep this file dependency-free so it can be imported
// from both server-side code and potential shared libraries in the future.

/** Supported social-media / content platforms */
export enum Platform {
  TikTok = 'tiktok',
  Twitter = 'twitter',
  Instagram = 'instagram',
  Reddit = 'reddit',
}

/**
 * Minimum data captured for a piece of scraped content.
 * Additional fields (e.g. engagement metrics) will be appended in later
 * subtasks once the raw schema is finalised.
 */
export interface RawContent {
  platform: Platform;
  url: string;
  /** Raw HTML or JSON response payload */
  rawData: string;
  /** Timestamp (ISO-8601) when the content was fetched */
  collectedAt: string;
}

/**
 * Common interface every platform-specific scraper must implement.
 */
export interface Scraper {
  /**
   * Fetches the target URL and returns normalised RawContent.
   *
   * @param url - Fully-qualified URL pointing to the resource to scrape
   * @returns RawContent object containing at least the rawData payload
   */
  fetch: (url: string) => Promise<RawContent>;
}