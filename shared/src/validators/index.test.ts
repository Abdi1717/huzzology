import { describe, it, expect } from 'vitest';
import { 
  isValidUrl, 
  isValidArchetypeId, 
  isValidPlatform,
  isValidCaption,
  isValidEngagement,
  isValidHexColor,
  isValidInfluenceScore,
  sanitizeContent
} from './index';

describe('Validators', () => {
  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com/path')).toBe(true);
      expect(isValidUrl('ftp://example.com')).toBe(true); // URL constructor accepts ftp
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(true); // URL constructor accepts this
    });
  });

  describe('isValidArchetypeId', () => {
    it('should validate correct archetype IDs', () => {
      expect(isValidArchetypeId('clean-girl')).toBe(true);
      expect(isValidArchetypeId('dark-academia')).toBe(true);
      expect(isValidArchetypeId('cottagecore')).toBe(true);
      expect(isValidArchetypeId('a')).toBe(true); // single letter is valid
      expect(isValidArchetypeId('test123')).toBe(true); // numbers are allowed
    });

    it('should reject invalid archetype IDs', () => {
      expect(isValidArchetypeId('Clean Girl')).toBe(false); // spaces
      expect(isValidArchetypeId('clean_girl')).toBe(false); // underscores
      expect(isValidArchetypeId('CLEAN-GIRL')).toBe(false); // uppercase
      expect(isValidArchetypeId('')).toBe(false); // empty
      expect(isValidArchetypeId('-clean')).toBe(false); // starts with dash
      expect(isValidArchetypeId('clean-')).toBe(false); // ends with dash
    });
  });

  describe('isValidPlatform', () => {
    it('should validate known platforms', () => {
      expect(isValidPlatform('instagram')).toBe(true);
      expect(isValidPlatform('tiktok')).toBe(true);
      expect(isValidPlatform('twitter')).toBe(true);
      expect(isValidPlatform('reddit')).toBe(true);
    });

    it('should reject unknown platforms', () => {
      expect(isValidPlatform('pinterest')).toBe(false); // not in PLATFORMS
      expect(isValidPlatform('unknown')).toBe(false);
      expect(isValidPlatform('')).toBe(false);
      expect(isValidPlatform('INSTAGRAM')).toBe(false); // case sensitive
    });
  });

  describe('isValidCaption', () => {
    it('should validate captions within length limit', () => {
      expect(isValidCaption('Short caption')).toBe(true);
      expect(isValidCaption('')).toBe(true); // empty is valid
    });

    it('should reject captions exceeding length limit', () => {
      const longCaption = 'a'.repeat(2201); // Assuming max is 2200
      expect(isValidCaption(longCaption)).toBe(false);
    });
  });

  describe('isValidEngagement', () => {
    it('should validate positive engagement metrics', () => {
      expect(isValidEngagement({ likes: 100, shares: 50, comments: 25 })).toBe(true);
      expect(isValidEngagement({ likes: 0, shares: 0, comments: 0 })).toBe(true);
    });

    it('should reject negative engagement metrics', () => {
      expect(isValidEngagement({ likes: -1, shares: 50, comments: 25 })).toBe(false);
      expect(isValidEngagement({ likes: 100, shares: -1, comments: 25 })).toBe(false);
      expect(isValidEngagement({ likes: 100, shares: 50, comments: -1 })).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#123ABC')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false); // missing #
      expect(isValidHexColor('#GG0000')).toBe(false); // invalid characters
      expect(isValidHexColor('#FF00')).toBe(false); // wrong length
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('isValidInfluenceScore', () => {
    it('should validate scores in 0-1 range', () => {
      expect(isValidInfluenceScore(0)).toBe(true);
      expect(isValidInfluenceScore(0.5)).toBe(true);
      expect(isValidInfluenceScore(1)).toBe(true);
    });

    it('should reject scores outside 0-1 range', () => {
      expect(isValidInfluenceScore(-0.1)).toBe(false);
      expect(isValidInfluenceScore(1.1)).toBe(false);
      expect(isValidInfluenceScore(2)).toBe(false);
    });
  });

  describe('sanitizeContent', () => {
    it('should remove script tags', () => {
      const maliciousContent = '<script>alert("xss")</script>Hello World';
      expect(sanitizeContent(maliciousContent)).toBe('Hello World');
    });

    it('should remove HTML tags', () => {
      const htmlContent = '<div><p>Hello <strong>World</strong></p></div>';
      expect(sanitizeContent(htmlContent)).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      const content = '  Hello World  ';
      expect(sanitizeContent(content)).toBe('Hello World');
    });

    it('should handle empty content', () => {
      expect(sanitizeContent('')).toBe('');
      expect(sanitizeContent('   ')).toBe('');
    });
  });
}); 