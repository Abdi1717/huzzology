// @ts-ignore – zod types added as dev dependency in root; ignore local tsconfig discrepancy
import { z } from 'zod';

// Re-declare Platform enum locally to avoid circular workspace path issues.
// Keep values in sync with server/src/scrapers/types.ts.
export enum Platform {
  TikTok = 'tiktok',
  Twitter = 'twitter',
  Instagram = 'instagram',
  Reddit = 'reddit',
}

/**
 * Zod schema used for validating raw content objects exchanged between
 * services.  Mirrors the RawContentRow DB shape but limits payload size for
 * API usage (rawData remains string, not full payload in many cases).
 */
export const rawContentSchema = z.object({
  platform: z.nativeEnum(Platform),
  url: z.string().url(),
  rawData: z.string(),
  collectedAt: z.string().datetime(),
});

export type RawContentSchema = z.infer<typeof rawContentSchema>;