/**
 * Unit tests for Storyblok client utilities
 * Tests image URL transformation, reading time calculation, heading extraction, and slug generation
 */

import {
  getStoryblokImageUrl,
  calculateReadingTime,
  extractHeadings,
  generateSlug,
  getStoryblokVersion,
  BLOG_REVALIDATE_TIME,
  DEFAULT_POSTS_PER_PAGE,
  DEFAULT_RELATED_POSTS_LIMIT,
} from '../client';

describe('Storyblok Client Utilities', () => {
  describe('getStoryblokImageUrl', () => {
    const baseUrl = 'https://a.storyblok.com/f/123456/1920x1080/abc123/image.jpg';

    it('should return empty string for null/undefined', () => {
      expect(getStoryblokImageUrl(null)).toBe('');
      expect(getStoryblokImageUrl(undefined)).toBe('');
      expect(getStoryblokImageUrl('')).toBe('');
    });

    it('should return non-Storyblok URLs unchanged', () => {
      const externalUrl = 'https://example.com/image.jpg';
      expect(getStoryblokImageUrl(externalUrl)).toBe(externalUrl);
    });

    it('should apply default filters when no options provided', () => {
      // Default behavior adds webp format and quality 80
      const result = getStoryblokImageUrl(baseUrl);
      expect(result).toContain('filters:format(webp):quality(80)');
      expect(result).not.toContain('/m/0x0/'); // No dimensions by default
    });

    it('should add width transformation', () => {
      const result = getStoryblokImageUrl(baseUrl, { width: 800 });
      expect(result).toContain('/m/800x0/');
      expect(result).toContain('filters:format(webp):quality(80)');
    });

    it('should add height transformation', () => {
      const result = getStoryblokImageUrl(baseUrl, { height: 600 });
      expect(result).toContain('/m/0x600/');
    });

    it('should add both width and height', () => {
      const result = getStoryblokImageUrl(baseUrl, { width: 800, height: 600 });
      expect(result).toContain('/m/800x600/');
    });

    it('should use custom quality', () => {
      const result = getStoryblokImageUrl(baseUrl, { width: 800, quality: 90 });
      expect(result).toContain('quality(90)');
    });

    it('should use custom format', () => {
      const result = getStoryblokImageUrl(baseUrl, { width: 800, format: 'png' });
      expect(result).toContain('format(png)');
    });

    it('should default to webp format and 80 quality', () => {
      const result = getStoryblokImageUrl(baseUrl, { width: 800 });
      expect(result).toContain('format(webp)');
      expect(result).toContain('quality(80)');
    });

    it('should handle all options together', () => {
      const result = getStoryblokImageUrl(baseUrl, {
        width: 1200,
        height: 630,
        quality: 85,
        format: 'jpg',
        fit: 'smart',
      });

      expect(result).toContain('/m/1200x630/');
      expect(result).toContain('format(jpg)');
      expect(result).toContain('quality(85)');
    });
  });

  describe('calculateReadingTime', () => {
    it('should return 1 for null/undefined content', () => {
      expect(calculateReadingTime(null)).toBe(1);
      expect(calculateReadingTime(undefined)).toBe(1);
    });

    it('should return 1 for empty content', () => {
      expect(calculateReadingTime({})).toBe(1);
      expect(calculateReadingTime({ content: [] })).toBe(1);
    });

    it('should calculate reading time for simple text', () => {
      // 200 words = 1 minute
      const words = Array(200).fill('word').join(' ');
      const content = { type: 'text', text: words };

      expect(calculateReadingTime(content)).toBe(1);
    });

    it('should round up reading time', () => {
      // 250 words should be 2 minutes (250/200 = 1.25, rounded up)
      const words = Array(250).fill('word').join(' ');
      const content = { type: 'text', text: words };

      expect(calculateReadingTime(content)).toBe(2);
    });

    it('should handle nested content', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: Array(100).fill('word').join(' ') },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: Array(100).fill('word').join(' ') },
            ],
          },
        ],
      };

      expect(calculateReadingTime(content)).toBe(1);
    });

    it('should return at least 1 minute for short content', () => {
      const content = { type: 'text', text: 'Short text' };
      expect(calculateReadingTime(content)).toBe(1);
    });

    it('should calculate correctly for long articles', () => {
      // 1000 words = 5 minutes
      const words = Array(1000).fill('word').join(' ');
      const content = { type: 'text', text: words };

      expect(calculateReadingTime(content)).toBe(5);
    });
  });

  describe('extractHeadings', () => {
    it('should return empty array for null/undefined content', () => {
      expect(extractHeadings(null)).toEqual([]);
      expect(extractHeadings(undefined)).toEqual([]);
    });

    it('should return empty array for non-object content', () => {
      expect(extractHeadings('string')).toEqual([]);
      expect(extractHeadings(123)).toEqual([]);
    });

    it('should extract h2 headings', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'First Heading' }],
          },
        ],
      };

      const headings = extractHeadings(content);

      expect(headings).toHaveLength(1);
      expect(headings[0]).toEqual({
        level: 2,
        text: 'First Heading',
        id: 'first-heading',
      });
    });

    it('should extract multiple headings with different levels', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Section One' }],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Subsection' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Section Two' }],
          },
        ],
      };

      const headings = extractHeadings(content);

      expect(headings).toHaveLength(3);
      expect(headings[0].level).toBe(2);
      expect(headings[1].level).toBe(3);
      expect(headings[2].level).toBe(2);
    });

    it('should handle nested text within headings', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [
              { type: 'text', text: 'Part ' },
              { type: 'text', text: 'One' },
            ],
          },
        ],
      };

      const headings = extractHeadings(content);

      expect(headings[0].text).toBe('Part One');
    });

    it('should skip headings without text', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Valid Heading' }],
          },
        ],
      };

      const headings = extractHeadings(content);

      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('Valid Heading');
    });

    it('should skip content without heading type', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Not a heading' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Real Heading' }],
          },
        ],
      };

      const headings = extractHeadings(content);

      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('Real Heading');
    });
  });

  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('hello world test')).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello! World?')).toBe('hello-world');
    });

    it('should handle Spanish characters (diacritics)', () => {
      expect(generateSlug('Cómo bañar a tu mascota')).toBe('como-banar-a-tu-mascota');
      expect(generateSlug('Información útil')).toBe('informacion-util');
      expect(generateSlug('Niño feliz')).toBe('nino-feliz');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('--hello--')).toBe('hello');
      expect(generateSlug('  hello  ')).toBe('hello');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
      expect(generateSlug('hello---world')).toBe('hello-world');
    });

    it('should handle numbers', () => {
      expect(generateSlug('Section 1: Introduction')).toBe('section-1-introduction');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle only special characters', () => {
      expect(generateSlug('!@#$%')).toBe('');
    });
  });

  describe('getStoryblokVersion', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return draft when preview mode is enabled', () => {
      process.env.STORYBLOK_PREVIEW_MODE = 'true';
      process.env.NODE_ENV = 'production';

      expect(getStoryblokVersion()).toBe('draft');
    });

    it('should return draft in development environment', () => {
      process.env.STORYBLOK_PREVIEW_MODE = 'false';
      process.env.NODE_ENV = 'development';

      expect(getStoryblokVersion()).toBe('draft');
    });

    it('should return published in production without preview mode', () => {
      process.env.STORYBLOK_PREVIEW_MODE = 'false';
      process.env.NODE_ENV = 'production';

      expect(getStoryblokVersion()).toBe('published');
    });
  });

  describe('Constants', () => {
    it('should have correct revalidation time (1 hour)', () => {
      expect(BLOG_REVALIDATE_TIME).toBe(3600);
    });

    it('should have correct default posts per page', () => {
      expect(DEFAULT_POSTS_PER_PAGE).toBe(12);
    });

    it('should have correct default related posts limit', () => {
      expect(DEFAULT_RELATED_POSTS_LIMIT).toBe(3);
    });
  });
});
