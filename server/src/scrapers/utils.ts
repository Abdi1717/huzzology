/**
 * Utility functions for scrapers
 */

import { Platform } from '../../shared/src/types';
import { NewContentExample } from '../database/schema';

/**
 * Validates if a URL is from a specific platform
 */
export function isValidPlatformUrl(url: string, platform: Platform): boolean {
  const platformDomains: Record<Platform, string[]> = {
    tiktok: ['tiktok.com', 'vm.tiktok.com'],
    twitter: ['twitter.com', 'x.com'],
    instagram: ['instagram.com'],
    reddit: ['reddit.com']
  };

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    return platformDomains[platform].some(domain => hostname === domain);
  } catch (error) {
    return false;
  }
}

/**
 * Extracts username from a platform URL
 */
export function extractUsernameFromUrl(url: string, platform: Platform): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    switch (platform) {
      case 'tiktok':
        // TikTok: https://www.tiktok.com/@username
        const tiktokMatch = pathname.match(/^\/@([^\/]+)/);
        return tiktokMatch ? tiktokMatch[1] : null;
        
      case 'twitter':
        // Twitter: https://twitter.com/username
        // Exclude known paths like explore, search, etc.
        if (pathname.match(/^\/(explore|search|home|notifications|messages)/)) {
          return null;
        }
        const twitterMatch = pathname.match(/^\/([^\/]+)/);
        return twitterMatch ? twitterMatch[1] : null;
        
      case 'instagram':
        // Instagram: https://www.instagram.com/username
        // Exclude known paths
        if (pathname.match(/^\/(explore|p|reel|stories|direct)/)) {
          return null;
        }
        const instagramMatch = pathname.match(/^\/([^\/]+)/);
        return instagramMatch ? instagramMatch[1] : null;
        
      case 'reddit':
        // Reddit: https://www.reddit.com/user/username or /u/username
        const redditMatch = pathname.match(/^\/(user|u)\/([^\/]+)/);
        return redditMatch ? redditMatch[2] : null;
        
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Extracts content ID from a platform URL
 */
export function extractContentIdFromUrl(url: string, platform: Platform): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    switch (platform) {
      case 'tiktok':
        // TikTok: https://www.tiktok.com/@username/video/1234567890123456789
        const tiktokMatch = pathname.match(/\/video\/(\d+)/);
        return tiktokMatch ? tiktokMatch[1] : null;
        
      case 'twitter':
        // Twitter: https://twitter.com/username/status/1234567890123456789
        const twitterMatch = pathname.match(/\/status\/(\d+)/);
        return twitterMatch ? twitterMatch[1] : null;
        
      case 'instagram':
        // Instagram: https://www.instagram.com/p/ABC123/
        const instagramMatch = pathname.match(/\/p\/([^\/]+)/);
        return instagramMatch ? instagramMatch[1] : null;
        
      case 'reddit':
        // Reddit: https://www.reddit.com/r/subreddit/comments/abc123/title/
        const redditMatch = pathname.match(/\/comments\/([^\/]+)/);
        return redditMatch ? redditMatch[1] : null;
        
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Standardizes a content example object
 */
export function standardizeContentExample(
  rawData: Record<string, any>,
  platform: Platform,
  url: string
): Partial<NewContentExample> {
  // Extract platform-specific ID
  const platformId = extractContentIdFromUrl(url, platform);
  
  // Create base content example
  const contentExample: Partial<NewContentExample> = {
    platform,
    platform_id: platformId || undefined,
    url,
    scraped_at: new Date(),
    content_data: rawData
  };
  
  // Add platform-specific fields
  switch (platform) {
    case 'tiktok':
      return {
        ...contentExample,
        caption: rawData.desc || rawData.description || rawData.text,
        media_type: 'video',
        engagement_metrics: {
          likes: rawData.diggCount || rawData.likes || 0,
          comments: rawData.commentCount || rawData.comments || 0,
          shares: rawData.shareCount || rawData.shares || 0
        },
        creator_data: rawData.author ? {
          username: rawData.author.uniqueId || rawData.author.username,
          displayName: rawData.author.nickname || rawData.author.displayName,
          followerCount: rawData.author.followerCount || rawData.author.followers
        } : undefined,
        content_created_at: rawData.createTime ? new Date(rawData.createTime * 1000) : undefined
      };
      
    case 'twitter':
      return {
        ...contentExample,
        caption: rawData.text || rawData.full_text,
        media_type: rawData.extended_entities?.media ? 
          (rawData.extended_entities.media[0].type === 'photo' ? 'image' : 'video') : 'text',
        engagement_metrics: {
          likes: rawData.favorite_count || rawData.likes || 0,
          comments: rawData.reply_count || rawData.comments || 0,
          shares: rawData.retweet_count || rawData.retweets || 0
        },
        creator_data: rawData.user ? {
          username: rawData.user.screen_name,
          displayName: rawData.user.name,
          followerCount: rawData.user.followers_count
        } : undefined,
        content_created_at: rawData.created_at ? new Date(rawData.created_at) : undefined
      };
      
    case 'instagram':
      return {
        ...contentExample,
        caption: rawData.edge_media_to_caption?.edges[0]?.node?.text || rawData.caption,
        media_type: rawData.is_video ? 'video' : 'image',
        engagement_metrics: {
          likes: rawData.edge_liked_by?.count || rawData.like_count || 0,
          comments: rawData.edge_media_to_comment?.count || rawData.comment_count || 0,
          shares: 0 // Instagram doesn't provide share count
        },
        creator_data: rawData.owner ? {
          username: rawData.owner.username,
          displayName: rawData.owner.full_name,
          followerCount: rawData.owner.edge_followed_by?.count
        } : undefined,
        content_created_at: rawData.taken_at_timestamp ? 
          new Date(rawData.taken_at_timestamp * 1000) : undefined
      };
      
    case 'reddit':
      return {
        ...contentExample,
        caption: rawData.title,
        media_type: rawData.is_video ? 'video' : 
          (rawData.post_hint === 'image' ? 'image' : 'text'),
        engagement_metrics: {
          likes: rawData.ups || rawData.score || 0,
          comments: rawData.num_comments || 0,
          shares: 0 // Reddit doesn't provide share count
        },
        creator_data: {
          username: rawData.author,
          subreddit: rawData.subreddit
        },
        content_created_at: rawData.created_utc ? 
          new Date(rawData.created_utc * 1000) : undefined
      };
      
    default:
      return contentExample;
  }
}

/**
 * Safely extracts text content from an element
 */
export async function extractTextContent(
  page: any, 
  selector: string
): Promise<string | null> {
  try {
    return await page.evaluate((sel: string) => {
      const element = document.querySelector(sel);
      return element ? element.textContent?.trim() : null;
    }, selector);
  } catch (error) {
    return null;
  }
}

/**
 * Safely extracts attribute from an element
 */
export async function extractAttribute(
  page: any, 
  selector: string, 
  attribute: string
): Promise<string | null> {
  try {
    return await page.evaluate((sel: string, attr: string) => {
      const element = document.querySelector(sel);
      return element ? element.getAttribute(attr) : null;
    }, selector, attribute);
  } catch (error) {
    return null;
  }
}

/**
 * Safely waits for a selector with timeout
 */
export async function safeWaitForSelector(
  page: any, 
  selector: string, 
  timeoutMs: number = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: timeoutMs });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely clicks an element with retry
 */
export async function safeClick(
  page: any, 
  selector: string, 
  maxRetries: number = 3
): Promise<boolean> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 5000 });
      await page.click(selector);
      return true;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
} 