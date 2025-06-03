/**
 * ContentExampleService Tests
 * Tests for content example business logic and database operations
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { ContentExampleService } from '../services/ContentExampleService';
import { db, client } from '../database/connection';
import { contentExamples, archetypes } from '../database/schema';
import type { NewContentExample, NewArchetype } from '../../../shared/src/types/database';

describe('ContentExampleService', () => {
  let service: ContentExampleService;
  let testArchetypeId: string;
  let testContentExampleId: string;

  beforeAll(async () => {
    // Create test archetype for content examples
    const [archetype] = await db
      .insert(archetypes)
      .values({
        name: 'Test Archetype',
        slug: 'test-archetype',
        description: 'Test archetype for content examples',
        keywords: ['test', 'example'],
        status: 'active',
        moderation_status: 'approved',
      } as NewArchetype)
      .returning();
    
    testArchetypeId = archetype.id;
  });

  beforeEach(() => {
    service = new ContentExampleService();
  });

  afterEach(async () => {
    // Clean up test content examples
    await db.delete(contentExamples);
  });

  afterAll(async () => {
    // Clean up test archetype
    await db.delete(archetypes);
    await client.end();
  });

  describe('create', () => {
    it('should create a new content example', async () => {
      const contentData: NewContentExample = {
        archetype_id: testArchetypeId,
        platform: 'tiktok',
        platform_id: 'test123',
        url: 'https://tiktok.com/test123',
        caption: 'Test content',
        media_type: 'video',
        engagement_metrics: {
          likes: 100,
          shares: 50,
          comments: 25,
        },
        creator_data: {
          username: 'testuser',
          follower_count: 1000,
        },
        moderation_status: 'pending',
      };

      const result = await service.create(contentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.archetype_id).toBe(testArchetypeId);
      expect(result.platform).toBe('tiktok');
      expect(result.url).toBe('https://tiktok.com/test123');
      expect(result.moderation_status).toBe('pending');

      testContentExampleId = result.id;
    });

    it('should create content example with minimal required fields', async () => {
      const contentData: NewContentExample = {
        archetype_id: testArchetypeId,
        platform: 'instagram',
        url: 'https://instagram.com/p/test456',
      };

      const result = await service.create(contentData);

      expect(result).toBeDefined();
      expect(result.archetype_id).toBe(testArchetypeId);
      expect(result.platform).toBe('instagram');
      expect(result.moderation_status).toBe('pending'); // default value
    });
  });

  describe('getById', () => {
    beforeEach(async () => {
      const [content] = await db
        .insert(contentExamples)
        .values({
          archetype_id: testArchetypeId,
          platform: 'twitter',
          url: 'https://twitter.com/test/status/123',
          caption: 'Test tweet',
        } as NewContentExample)
        .returning();
      
      testContentExampleId = content.id;
    });

    it('should return content example by ID', async () => {
      const result = await service.getById(testContentExampleId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(testContentExampleId);
      expect(result!.platform).toBe('twitter');
      expect(result!.caption).toBe('Test tweet');
    });

    it('should return null for non-existent ID', async () => {
      const result = await service.getById('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBeNull();
    });
  });

  describe('getByArchetypeId', () => {
    beforeEach(async () => {
      // Create multiple content examples
      await db.insert(contentExamples).values([
        {
          archetype_id: testArchetypeId,
          platform: 'tiktok',
          url: 'https://tiktok.com/1',
          moderation_status: 'approved',
        },
        {
          archetype_id: testArchetypeId,
          platform: 'instagram',
          url: 'https://instagram.com/1',
          moderation_status: 'pending',
        },
        {
          archetype_id: testArchetypeId,
          platform: 'twitter',
          url: 'https://twitter.com/1',
          moderation_status: 'approved',
        },
      ] as NewContentExample[]);
    });

    it('should return content examples for archetype', async () => {
      const result = await service.getByArchetypeId(testArchetypeId);

      expect(result).toHaveLength(3);
      expect(result.every(c => c.archetype_id === testArchetypeId)).toBe(true);
    });

    it('should filter by moderation status', async () => {
      const result = await service.getByArchetypeId(testArchetypeId, {
        moderationStatus: ['approved'],
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.moderation_status === 'approved')).toBe(true);
    });

    it('should filter by platforms', async () => {
      const result = await service.getByArchetypeId(testArchetypeId, {
        platforms: ['tiktok', 'instagram'],
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => ['tiktok', 'instagram'].includes(c.platform))).toBe(true);
    });

    it('should respect limit and offset', async () => {
      const result = await service.getByArchetypeId(testArchetypeId, {
        limit: 2,
        offset: 1,
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await db.insert(contentExamples).values([
        {
          archetype_id: testArchetypeId,
          platform: 'tiktok',
          url: 'https://tiktok.com/search1',
          media_type: 'video',
          moderation_status: 'approved',
          is_featured: true,
          engagement_metrics: { likes: 1000, shares: 100, comments: 50 },
        },
        {
          archetype_id: testArchetypeId,
          platform: 'instagram',
          url: 'https://instagram.com/search2',
          media_type: 'image',
          moderation_status: 'pending',
          is_featured: false,
          engagement_metrics: { likes: 500, shares: 25, comments: 10 },
        },
      ] as NewContentExample[]);
    });

    it('should search with no filters', async () => {
      const result = await service.search({});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by platform', async () => {
      const result = await service.search({
        platforms: ['tiktok'],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].platform).toBe('tiktok');
    });

    it('should filter by moderation status', async () => {
      const result = await service.search({
        moderation_status: ['approved'],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].moderation_status).toBe('approved');
    });

    it('should filter by featured status', async () => {
      const result = await service.search({
        is_featured: true,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].is_featured).toBe(true);
    });

    it('should filter by minimum engagement', async () => {
      const result = await service.search({
        min_engagement: 800, // likes + shares + comments >= 800
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].platform).toBe('tiktok');
    });

    it('should respect pagination', async () => {
      const result = await service.search({
        limit: 1,
        offset: 0,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      const [content] = await db
        .insert(contentExamples)
        .values({
          archetype_id: testArchetypeId,
          platform: 'reddit',
          url: 'https://reddit.com/r/test/123',
          caption: 'Original caption',
        } as NewContentExample)
        .returning();
      
      testContentExampleId = content.id;
    });

    it('should update content example', async () => {
      const updates = {
        caption: 'Updated caption',
        media_type: 'text' as const,
      };

      const result = await service.update(testContentExampleId, updates);

      expect(result).toBeDefined();
      expect(result!.caption).toBe('Updated caption');
      expect(result!.media_type).toBe('text');
    });

    it('should return null for non-existent ID', async () => {
      const result = await service.update('550e8400-e29b-41d4-a716-446655440000', {
        caption: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('updateModerationStatus', () => {
    beforeEach(async () => {
      const [content] = await db
        .insert(contentExamples)
        .values({
          archetype_id: testArchetypeId,
          platform: 'youtube',
          url: 'https://youtube.com/watch?v=test123',
          moderation_status: 'pending',
        } as NewContentExample)
        .returning();
      
      testContentExampleId = content.id;
    });

    it('should update moderation status', async () => {
      const result = await service.updateModerationStatus(testContentExampleId, 'approved');

      expect(result).toBeDefined();
      expect(result!.moderation_status).toBe('approved');
    });
  });

  describe('setFeatured', () => {
    beforeEach(async () => {
      const [content] = await db
        .insert(contentExamples)
        .values({
          archetype_id: testArchetypeId,
          platform: 'tiktok',
          url: 'https://tiktok.com/featured123',
          is_featured: false,
        } as NewContentExample)
        .returning();
      
      testContentExampleId = content.id;
    });

    it('should set featured status', async () => {
      const result = await service.setFeatured(testContentExampleId, true);

      expect(result).toBeDefined();
      expect(result!.is_featured).toBe(true);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const [content] = await db
        .insert(contentExamples)
        .values({
          archetype_id: testArchetypeId,
          platform: 'instagram',
          url: 'https://instagram.com/delete123',
        } as NewContentExample)
        .returning();
      
      testContentExampleId = content.id;
    });

    it('should delete content example', async () => {
      const result = await service.delete(testContentExampleId);
      expect(result).toBe(true);

      const deleted = await service.getById(testContentExampleId);
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const result = await service.delete('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe(false);
    });
  });

  describe('getFeatured', () => {
    beforeEach(async () => {
      await db.insert(contentExamples).values([
        {
          archetype_id: testArchetypeId,
          platform: 'tiktok',
          url: 'https://tiktok.com/featured1',
          is_featured: true,
          moderation_status: 'approved',
        },
        {
          archetype_id: testArchetypeId,
          platform: 'instagram',
          url: 'https://instagram.com/featured2',
          is_featured: true,
          moderation_status: 'pending', // Should not be included
        },
        {
          archetype_id: testArchetypeId,
          platform: 'twitter',
          url: 'https://twitter.com/notfeatured',
          is_featured: false,
          moderation_status: 'approved',
        },
      ] as NewContentExample[]);
    });

    it('should return only featured and approved content', async () => {
      const result = await service.getFeatured();

      expect(result).toHaveLength(1);
      expect(result[0].is_featured).toBe(true);
      expect(result[0].moderation_status).toBe('approved');
    });

    it('should respect limit parameter', async () => {
      const result = await service.getFeatured(0);
      expect(result).toHaveLength(0);
    });
  });

  describe('getEngagementStats', () => {
    beforeEach(async () => {
      await db.insert(contentExamples).values([
        {
          archetype_id: testArchetypeId,
          platform: 'tiktok',
          url: 'https://tiktok.com/stats1',
          moderation_status: 'approved',
          engagement_metrics: { likes: 100, shares: 50, comments: 25 },
        },
        {
          archetype_id: testArchetypeId,
          platform: 'instagram',
          url: 'https://instagram.com/stats2',
          moderation_status: 'approved',
          engagement_metrics: { likes: 200, shares: 75, comments: 30 },
        },
      ] as NewContentExample[]);
    });

    it('should return engagement statistics', async () => {
      const result = await service.getEngagementStats();

      expect(result.total_content).toBe(2);
      expect(result.avg_likes).toBe(150); // (100 + 200) / 2
      expect(result.platform_breakdown).toHaveLength(2);
      expect(result.platform_breakdown[0].platform).toBeDefined();
      expect(result.platform_breakdown[0].count).toBeGreaterThan(0);
    });

    it('should filter by archetype ID', async () => {
      const result = await service.getEngagementStats(testArchetypeId);

      expect(result.total_content).toBe(2);
    });
  });

  describe('bulkUpdateModerationStatus', () => {
    let contentIds: string[];

    beforeEach(async () => {
      const contents = await db.insert(contentExamples).values([
        {
          archetype_id: testArchetypeId,
          platform: 'tiktok',
          url: 'https://tiktok.com/bulk1',
          moderation_status: 'pending',
        },
        {
          archetype_id: testArchetypeId,
          platform: 'instagram',
          url: 'https://instagram.com/bulk2',
          moderation_status: 'pending',
        },
      ] as NewContentExample[]).returning();
      
      contentIds = contents.map(c => c.id);
    });

    it('should bulk update moderation status', async () => {
      const result = await service.bulkUpdateModerationStatus(contentIds, 'approved');

      expect(result).toBe(2);

      // Verify updates
      const updated = await service.search({
        moderation_status: ['approved'],
      });
      expect(updated.data).toHaveLength(2);
    });

    it('should handle empty array', async () => {
      const result = await service.bulkUpdateModerationStatus([], 'approved');
      expect(result).toBe(0);
    });
  });
}); 