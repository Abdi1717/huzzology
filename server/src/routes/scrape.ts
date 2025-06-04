/**
 * Scrape routes for Huzzology API
 */

import { Router } from 'express';
import { 
  createScraper, 
  createScraperFromUrl,
  TikTokScraper,
  TwitterScraper,
  InstagramScraper,
  RedditScraper
} from '../scrapers';
import { Platform, ScraperSearchParams } from '../scrapers/types';

const router = Router();

/**
 * @swagger
 * /api/scrape/tiktok:
 *   post:
 *     summary: Scrape TikTok content
 *     description: Initiate scraping of TikTok content for archetype analysis (admin only)
 *     tags: [Content Scraping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Hashtags to search for
 *                 example: ['#cleangirl', '#aesthetic', '#fashion']
 *               limit:
 *                 type: integer
 *                 default: 100
 *                 minimum: 1
 *                 maximum: 1000
 *                 description: Maximum number of posts to scrape
 *               archetype_id:
 *                 type: string
 *                 format: uuid
 *                 description: Target archetype ID for classification
 *     responses:
 *       200:
 *         description: TikTok scraping initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: TikTok scraping initiated successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentExample'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/scrape/tiktok - Scrape TikTok content
router.post('/tiktok', async (req, res) => {
  try {
    const { hashtags, limit = 100 } = req.body;
    
    const tiktokScraper = createScraper('tiktok') as TikTokScraper;
    
    const searchParams: ScraperSearchParams = {
      query: hashtags.join(' '),
      limit: Math.min(limit, 1000), // Cap at 1000
      sort: 'recent'
    };
    
    const result = await tiktokScraper.scrape(searchParams);
    
    res.json({
      success: true,
      message: 'TikTok content scraped successfully',
      data: result.content,
      meta: {
        total: result.content.length,
        duration: result.duration,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('TikTok scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping TikTok content',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/scrape/twitter:
 *   post:
 *     summary: Scrape Twitter content
 *     description: Initiate scraping of Twitter content for archetype analysis (admin only)
 *     tags: [Content Scraping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords to search for
 *                 example: ['clean girl', 'aesthetic', 'fashion trend']
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Hashtags to search for
 *                 example: ['#cleangirl', '#aesthetic']
 *               limit:
 *                 type: integer
 *                 default: 100
 *                 minimum: 1
 *                 maximum: 1000
 *                 description: Maximum number of tweets to scrape
 *               archetype_id:
 *                 type: string
 *                 format: uuid
 *                 description: Target archetype ID for classification
 *     responses:
 *       200:
 *         description: Twitter scraping initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Twitter scraping initiated successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentExample'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/scrape/twitter - Scrape Twitter content
router.post('/twitter', async (req, res) => {
  try {
    const { keywords = [], hashtags = [], limit = 100 } = req.body;
    
    const twitterScraper = createScraper('twitter') as TwitterScraper;
    
    // Combine keywords and hashtags for the query
    const query = [...keywords, ...hashtags].join(' ');
    
    const searchParams: ScraperSearchParams = {
      query,
      limit: Math.min(limit, 1000), // Cap at 1000
      sort: 'recent'
    };
    
    const result = await twitterScraper.scrape(searchParams);
    
    res.json({
      success: true,
      message: 'Twitter content scraped successfully',
      data: result.content,
      meta: {
        total: result.content.length,
        duration: result.duration,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Twitter scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping Twitter content',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/scrape/instagram:
 *   post:
 *     summary: Scrape Instagram content
 *     description: Initiate scraping of Instagram content for archetype analysis (admin only)
 *     tags: [Content Scraping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Hashtags to search for
 *                 example: ['#cleangirl', '#aesthetic', '#fashion']
 *               accounts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific Instagram accounts to scrape
 *                 example: ['@fashionista', '@beautyinfluencer']
 *               limit:
 *                 type: integer
 *                 default: 100
 *                 minimum: 1
 *                 maximum: 1000
 *                 description: Maximum number of posts to scrape
 *               archetype_id:
 *                 type: string
 *                 format: uuid
 *                 description: Target archetype ID for classification
 *     responses:
 *       200:
 *         description: Instagram scraping initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Instagram scraping initiated successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentExample'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/scrape/instagram - Scrape Instagram content
router.post('/instagram', async (req, res) => {
  try {
    const { hashtags = [], accounts = [], limit = 100 } = req.body;
    
    const instagramScraper = createScraper('instagram') as InstagramScraper;
    
    // Create a query combining hashtags and accounts
    const query = [
      ...hashtags,
      ...accounts.map(account => account.startsWith('@') ? account : `@${account}`)
    ].join(' ');
    
    const searchParams: ScraperSearchParams = {
      query,
      limit: Math.min(limit, 1000), // Cap at 1000
      sort: 'recent'
    };
    
    const result = await instagramScraper.scrape(searchParams);
    
    res.json({
      success: true,
      message: 'Instagram content scraped successfully',
      data: result.content,
      meta: {
        total: result.content.length,
        duration: result.duration,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Instagram scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping Instagram content',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/scrape/reddit:
 *   post:
 *     summary: Scrape Reddit content
 *     description: Initiate scraping of Reddit content for archetype analysis (admin only)
 *     tags: [Content Scraping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords to search for
 *                 example: ['clean girl', 'aesthetic', 'fashion trend']
 *               subreddits:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific subreddits to search in
 *                 example: ['r/fashion', 'r/aesthetics', 'r/FemaleLifestyle']
 *               limit:
 *                 type: integer
 *                 default: 100
 *                 minimum: 1
 *                 maximum: 1000
 *                 description: Maximum number of posts to scrape
 *               archetype_id:
 *                 type: string
 *                 format: uuid
 *                 description: Target archetype ID for classification
 *     responses:
 *       200:
 *         description: Reddit scraping initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Reddit scraping initiated successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentExample'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/scrape/reddit - Scrape Reddit content
router.post('/reddit', async (req, res) => {
  try {
    const { keywords = [], subreddits = [], limit = 100 } = req.body;
    
    const redditScraper = createScraper('reddit') as RedditScraper;
    
    // Create a query combining keywords and subreddits
    const query = [
      ...keywords,
      ...subreddits.map(sub => sub.startsWith('r/') ? sub : `r/${sub}`)
    ].join(' ');
    
    const searchParams: ScraperSearchParams = {
      query,
      limit: Math.min(limit, 1000), // Cap at 1000
      sort: 'hot'
    };
    
    const result = await redditScraper.scrape(searchParams);
    
    res.json({
      success: true,
      message: 'Reddit content scraped successfully',
      data: result.content,
      meta: {
        total: result.content.length,
        duration: result.duration,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Reddit scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping Reddit content',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/scrape/url:
 *   post:
 *     summary: Scrape content from a specific URL
 *     description: Extract content from a specific social media URL (admin only)
 *     tags: [Content Scraping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Social media URL to scrape
 *                 example: 'https://www.instagram.com/p/ABC123/'
 *               archetype_id:
 *                 type: string
 *                 format: uuid
 *                 description: Target archetype ID for classification
 *     responses:
 *       200:
 *         description: URL scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: URL content scraped successfully
 *                 data:
 *                   $ref: '#/components/schemas/ContentExample'
 *       400:
 *         description: Invalid URL or unsupported platform
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/scrape/url - Scrape content from a specific URL
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    // Create appropriate scraper based on URL
    const scraper = createScraperFromUrl(url);
    
    if (!scraper) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported platform or invalid URL'
      });
    }
    
    const result = await scraper.getContent(url);
    
    res.json({
      success: true,
      message: 'URL content scraped successfully',
      data: result.content[0] || null,
      meta: {
        platform: scraper.platform,
        duration: result.duration,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('URL scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scraping URL content',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/scrape/trending:
 *   get:
 *     summary: Get trending content
 *     description: Retrieve trending content from specified platform (admin only)
 *     tags: [Content Scraping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, twitter, instagram, reddit]
 *         required: true
 *         description: Platform to get trending content from
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of trending items to return
 *     responses:
 *       200:
 *         description: Trending content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Trending content retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentExample'
 *       400:
 *         description: Invalid platform
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/scrape/trending - Get trending content
router.get('/trending', async (req, res) => {
  try {
    const { platform, limit = 10 } = req.query;
    
    if (!platform || typeof platform !== 'string' || 
        !['tiktok', 'twitter', 'instagram', 'reddit'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Valid platform is required (tiktok, twitter, instagram, or reddit)'
      });
    }
    
    const scraper = createScraper(platform as Platform);
    const result = await scraper.getTrending(Math.min(parseInt(limit as string) || 10, 100));
    
    res.json({
      success: true,
      message: `Trending ${platform} content retrieved successfully`,
      data: result.content,
      meta: {
        platform,
        total: result.content.length,
        duration: result.duration,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Trending content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving trending content',
      error: error.message
    });
  }
});

export default router; 