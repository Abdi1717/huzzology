/**
 * Validation utilities for Huzzology
 */

import { PLATFORMS, CONTENT_MODERATION } from '../constants/index.js';

/**
 * Validate if a string is a valid platform
 */
export const isValidPlatform = (platform: string): boolean => {
  return Object.values(PLATFORMS).includes(platform as any);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate archetype ID format (kebab-case)
 */
export const isValidArchetypeId = (id: string): boolean => {
  const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return kebabCaseRegex.test(id);
};

/**
 * Validate content caption length
 */
export const isValidCaption = (caption: string): boolean => {
  return caption.length <= CONTENT_MODERATION.MAX_CAPTION_LENGTH;
};

/**
 * Validate engagement metrics
 */
export const isValidEngagement = (metrics: {
  likes: number;
  shares: number;
  comments: number;
}): boolean => {
  return (
    metrics.likes >= 0 &&
    metrics.shares >= 0 &&
    metrics.comments >= 0
  );
};

/**
 * Validate hex color format
 */
export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
};

/**
 * Validate influence score (0-1 range)
 */
export const isValidInfluenceScore = (score: number): boolean => {
  return score >= 0 && score <= 1;
};

/**
 * Sanitize content for display
 */
export const sanitizeContent = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}; 