/**
 * Shared utility functions for Huzzology
 */

/**
 * Convert a string to kebab-case for archetype IDs
 */
export const toKebabCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate a random hex color for archetype visualization
 */
export const generateArchetypeColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Calculate influence score based on engagement metrics
 */
export const calculateInfluenceScore = (
  likes: number,
  shares: number,
  comments: number,
  followerCount?: number
): number => {
  const engagement = likes + (shares * 2) + (comments * 1.5);
  const followerBonus = followerCount ? Math.log10(followerCount) / 10 : 0;
  const score = Math.min((engagement / 10000) + followerBonus, 1);
  return Math.round(score * 100) / 100;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 