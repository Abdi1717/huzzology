/**
 * Application constants for Huzzology
 */

export const PLATFORMS = {
  TIKTOK: 'tiktok',
  TWITTER: 'twitter', 
  INSTAGRAM: 'instagram',
  REDDIT: 'reddit',
} as const;

export const TASK_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
  REVIEW: 'review',
  DEFERRED: 'deferred',
  CANCELLED: 'cancelled',
} as const;

export const PRIORITY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  API_BASE: '/api',
  ARCHETYPES: '/api/archetypes',
  SCRAPE: '/api/scrape',
  TRENDS: '/api/trends',
} as const;

export const DEFAULT_ARCHETYPE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#AED6F1', '#D7BDE2', '#F9E79F'
] as const;

export const GRAPH_LAYOUT_OPTIONS = {
  DIRECTION: 'TB', // Top to Bottom
  NODE_SPACING: 100,
  RANK_SPACING: 150,
  EDGE_SPACING: 50,
} as const;

export const CONTENT_MODERATION = {
  MAX_CAPTION_LENGTH: 500,
  MIN_ENGAGEMENT_THRESHOLD: 10,
  EXPLICIT_CONTENT_KEYWORDS: [
    // Add moderation keywords as needed
  ],
} as const; 