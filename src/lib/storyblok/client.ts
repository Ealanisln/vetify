/**
 * Storyblok Client Configuration
 *
 * This module initializes and exports the Storyblok client for
 * fetching blog content from the Storyblok CMS.
 */

import StoryblokClient from 'storyblok-js-client';

// Validate environment variables
const accessToken = process.env.STORYBLOK_API_TOKEN;

if (!accessToken) {
  console.warn(
    '[Storyblok] Missing STORYBLOK_API_TOKEN environment variable. ' +
    'Blog features will not work correctly.'
  );
}

/**
 * Storyblok API client for server-side data fetching
 *
 * Usage:
 * ```typescript
 * import { storyblokApi } from '@/lib/storyblok/client';
 *
 * const { data } = await storyblokApi.get('cdn/stories', {
 *   starts_with: 'blog/',
 *   version: 'published',
 * });
 * ```
 */
export const storyblokApi = new StoryblokClient({
  accessToken: accessToken || '',
  cache: {
    clear: 'auto',
    type: 'memory',
  },
});

/**
 * Get the appropriate Storyblok version based on environment
 * - 'draft' for preview/development
 * - 'published' for production
 */
export function getStoryblokVersion(): 'draft' | 'published' {
  // Check if we're in preview mode or development
  if (process.env.STORYBLOK_PREVIEW_MODE === 'true') {
    return 'draft';
  }

  if (process.env.NODE_ENV === 'development') {
    return 'draft';
  }

  return 'published';
}

/**
 * Storyblok image service URL transformer
 * Converts Storyblok asset URLs to optimized versions
 *
 * @param url - Original Storyblok image URL
 * @param options - Image transformation options
 * @returns Optimized image URL
 */
export function getStoryblokImageUrl(
  url: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpg';
    fit?: 'in' | 'smart';
  } = {}
): string {
  if (!url) return '';

  // If not a Storyblok URL, return as-is
  if (!url.includes('storyblok.com')) {
    return url;
  }

  const { width, height, quality = 80, format = 'webp', fit = 'smart' } = options;

  // Build transformation parameters
  const params: string[] = [];

  if (width || height) {
    params.push(`${width || 0}x${height || 0}`);
  }

  if (fit) {
    params.push(`filters:format(${format}):quality(${quality})`);
  }

  // Storyblok image service format: /m/{width}x{height}/filters:...
  if (params.length > 0) {
    const transformPath = `/m/${params.join('/')}`;
    return url.replace('/a.storyblok.com', '/a.storyblok.com' + transformPath);
  }

  return url;
}

/**
 * Calculate estimated reading time from rich text content
 *
 * @param content - Storyblok rich text content
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: unknown): number {
  if (!content) return 1;

  // Extract text from rich text content
  const text = extractTextFromRichText(content);

  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return Math.max(1, readingTime);
}

/**
 * Extract plain text from Storyblok rich text content
 */
function extractTextFromRichText(content: unknown): string {
  if (!content || typeof content !== 'object') return '';

  const node = content as { type?: string; text?: string; content?: unknown[] };

  if (node.type === 'text' && node.text) {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromRichText).join(' ');
  }

  return '';
}

/**
 * Extract headings from rich text content for table of contents
 *
 * @param content - Storyblok rich text content
 * @returns Array of heading objects with level, text, and id
 */
export function extractHeadings(content: unknown): Array<{
  level: number;
  text: string;
  id: string;
}> {
  if (!content || typeof content !== 'object') return [];

  const headings: Array<{ level: number; text: string; id: string }> = [];

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return;

    const typedNode = node as {
      type?: string;
      attrs?: { level?: number };
      content?: unknown[];
      text?: string;
    };

    if (typedNode.type?.startsWith('heading') && typedNode.attrs?.level) {
      const text = extractTextFromNode(typedNode);
      if (text) {
        headings.push({
          level: typedNode.attrs.level,
          text,
          id: generateSlug(text),
        });
      }
    }

    if (Array.isArray(typedNode.content)) {
      typedNode.content.forEach(traverse);
    }
  }

  traverse(content);
  return headings;
}

function extractTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return '';

  const typedNode = node as { text?: string; content?: unknown[] };

  if (typedNode.text) return typedNode.text;

  if (Array.isArray(typedNode.content)) {
    return typedNode.content.map(extractTextFromNode).join('');
  }

  return '';
}

/**
 * Generate URL-safe slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * ISR Revalidation time in seconds (1 hour)
 */
export const BLOG_REVALIDATE_TIME = 3600;

/**
 * Default pagination settings
 */
export const DEFAULT_POSTS_PER_PAGE = 12;
export const DEFAULT_RELATED_POSTS_LIMIT = 3;
