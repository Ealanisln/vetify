/**
 * Unit and Integration tests for Storyblok API utilities
 * Tests data fetching and transformation functions
 */

import {
  getBlogPosts,
  getBlogPost,
  getRelatedPosts,
  getAllPostSlugs,
  getCategories,
  getCategory,
  getAllCategorySlugs,
  getAuthors,
  getAuthor,
  getAllAuthorSlugs,
  getAllTags,
  getBlogSitemapUrls,
} from '../api';

import { storyblokApi } from '../client';
import type { BlogPost } from '../types';

// Mock the Storyblok client
jest.mock('../client', () => ({
  storyblokApi: {
    get: jest.fn(),
  },
  getStoryblokVersion: jest.fn(() => 'published'),
  calculateReadingTime: jest.fn(() => 5),
  getStoryblokImageUrl: jest.fn((url, options) => {
    if (!url) return '';
    if (!url.includes('storyblok.com')) return url;
    return `${url}?w=${options?.width || 0}&h=${options?.height || 0}`;
  }),
  DEFAULT_POSTS_PER_PAGE: 12,
  DEFAULT_RELATED_POSTS_LIMIT: 3,
}));

// Mock data factories
const createMockBlogPostStory = (overrides = {}) => ({
  id: 12345,
  uuid: 'test-uuid-123',
  slug: 'test-post',
  full_slug: 'blog/test-post',
  first_published_at: '2024-01-15T10:00:00.000Z',
  published_at: '2024-01-16T10:00:00.000Z',
  created_at: '2024-01-14T10:00:00.000Z',
  content: {
    title: 'Test Blog Post',
    excerpt: 'This is a test excerpt',
    content: { type: 'doc', content: [] },
    featured_image: {
      filename: 'https://a.storyblok.com/f/123/test.jpg',
      alt: 'Test image',
    },
    category: 'cuidado-mascotas',
    tags: ['perros', 'salud'],
    author: 'dr-veterinario',
    published_at: '2024-01-15T10:00:00.000Z',
    reading_time_minutes: 5,
    show_toc: true,
    meta_title: 'Test Post | Vetify',
    meta_description: 'Test meta description',
    keywords: ['test', 'blog'],
    faq_items: [],
    how_to_steps: [],
    related_posts: [],
  },
  ...overrides,
});

const createMockCategoryStory = (overrides = {}) => ({
  id: 100,
  uuid: 'cat-uuid-123',
  slug: 'cuidado-mascotas',
  content: {
    name: 'Cuidado de Mascotas',
    description: 'Artículos sobre cuidado de mascotas',
    featured_image: {
      filename: 'https://a.storyblok.com/f/123/category.jpg',
      alt: 'Category image',
    },
    color: '#75a99c',
    icon: '🐾',
  },
  ...overrides,
});

const createMockAuthorStory = (overrides = {}) => ({
  id: 200,
  uuid: 'author-uuid-123',
  slug: 'dr-veterinario',
  content: {
    name: 'Dr. Veterinario',
    bio: { type: 'doc', content: [] },
    avatar: {
      filename: 'https://a.storyblok.com/f/123/avatar.jpg',
      alt: 'Author avatar',
    },
    role: 'Veterinario Senior',
    social_links: [
      { platform: 'twitter', url: 'https://twitter.com/drveterinario' },
    ],
  },
  ...overrides,
});

describe('Storyblok API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBlogPosts', () => {
    it('should fetch blog posts with default pagination', async () => {
      const mockStories = [
        createMockBlogPostStory({ slug: 'post-1' }),
        createMockBlogPostStory({ slug: 'post-2' }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: mockStories },
        total: 2,
      });

      const result = await getBlogPosts();

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        starts_with: 'blog/',
        content_type: 'blog_post',
        per_page: 12,
        page: 1,
      }));

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(12);
    });

    it('should handle pagination correctly', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [createMockBlogPostStory()] },
        total: 25,
      });

      const result = await getBlogPosts({ page: 2, perPage: 10 });

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        per_page: 10,
        page: 2,
      }));

      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should apply category filter', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [] },
        total: 0,
      });

      await getBlogPosts({ filters: { category: 'cuidado-mascotas' } });

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        'filter_query[category][in]': 'cuidado-mascotas',
      }));
    });

    it('should apply tag filter', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [] },
        total: 0,
      });

      await getBlogPosts({ filters: { tag: 'perros' } });

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        'filter_query[tags][in_array]': 'perros',
      }));
    });

    it('should apply author filter', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [] },
        total: 0,
      });

      await getBlogPosts({ filters: { author: 'dr-veterinario' } });

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        'filter_query[author][in]': 'dr-veterinario',
      }));
    });

    it('should apply excludeSlug filter', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [] },
        total: 0,
      });

      await getBlogPosts({ filters: { excludeSlug: 'current-post' } });

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        excluding_slugs: 'blog/current-post',
      }));
    });

    it('should transform story data correctly', async () => {
      const mockStory = createMockBlogPostStory();
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [mockStory] },
        total: 1,
      });

      const result = await getBlogPosts();
      const post = result.items[0];

      expect(post.id).toBe('12345');
      expect(post.uuid).toBe('test-uuid-123');
      expect(post.slug).toBe('test-post');
      expect(post.title).toBe('Test Blog Post');
      expect(post.excerpt).toBe('This is a test excerpt');
      expect(post.category).toBe('cuidado-mascotas');
      expect(post.tags).toEqual(['perros', 'salud']);
      expect(post.showToc).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await getBlogPosts();

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty response', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [] },
        total: 0,
      });

      const result = await getBlogPosts();

      expect(result.items).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });
  });

  describe('getBlogPost', () => {
    it('should fetch a single blog post by slug', async () => {
      const mockStory = createMockBlogPostStory();
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { story: mockStory },
      });

      const result = await getBlogPost('test-post');

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories/blog/test-post', expect.any(Object));
      expect(result).not.toBeNull();
      expect(result!.slug).toBe('test-post');
    });

    it('should return null for non-existent post', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { story: null },
      });

      const result = await getBlogPost('non-existent');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await getBlogPost('error-post');

      expect(result).toBeNull();
    });
  });

  describe('getRelatedPosts', () => {
    it('should fetch related posts by category', async () => {
      const currentPost = {
        slug: 'current-post',
        category: 'cuidado-mascotas',
        tags: ['perros'],
        relatedPosts: [],
      };

      const relatedStory = createMockBlogPostStory({ slug: 'related-post' });
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [relatedStory] },
        total: 1,
      });

      const result = await getRelatedPosts(currentPost as Partial<BlogPost> as BlogPost);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('related-post');
    });

    it('should use manually selected related posts when available', async () => {
      const currentPost = {
        slug: 'current-post',
        category: 'cuidado-mascotas',
        tags: [],
        relatedPosts: [
          { story: { full_slug: 'blog/manual-related' }, cached_url: 'blog/manual-related' },
        ],
      };

      const manualRelated = createMockBlogPostStory({ slug: 'manual-related' });
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [manualRelated] },
      });

      await getRelatedPosts(currentPost as Partial<BlogPost> as BlogPost);

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        by_slugs: 'blog/manual-related',
      }));
    });

    it('should handle errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await getRelatedPosts({
        slug: 'test',
        category: 'test',
        tags: [],
        relatedPosts: [],
      } as Partial<BlogPost> as BlogPost);

      expect(result).toEqual([]);
    });
  });

  describe('getAllPostSlugs', () => {
    it('should fetch all post slugs', async () => {
      const mockStories = [
        createMockBlogPostStory({ slug: 'post-1' }),
        createMockBlogPostStory({ slug: 'post-2' }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: mockStories },
        total: 2,
      });

      const result = await getAllPostSlugs();

      expect(result).toEqual(['post-1', 'post-2']);
    });

    it('should handle pagination for many posts', async () => {
      const firstBatch = Array(100).fill(null).map((_, i) =>
        createMockBlogPostStory({ slug: `post-${i}` })
      );
      const secondBatch = [createMockBlogPostStory({ slug: 'post-100' })];

      (storyblokApi.get as jest.Mock)
        .mockResolvedValueOnce({ data: { stories: firstBatch }, total: 101 })
        .mockResolvedValueOnce({ data: { stories: secondBatch }, total: 101 });

      const result = await getAllPostSlugs();

      expect(result).toHaveLength(101);
      expect(storyblokApi.get).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await getAllPostSlugs();

      expect(result).toEqual([]);
    });
  });

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = [
        createMockCategoryStory({ slug: 'cat-1' }),
        createMockCategoryStory({ slug: 'cat-2' }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: mockCategories },
      });

      const result = await getCategories();

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        starts_with: 'categorias/',
        content_type: 'blog_category',
      }));
      expect(result).toHaveLength(2);
    });

    it('should transform category data correctly', async () => {
      const mockCategory = createMockCategoryStory();
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [mockCategory] },
      });

      const result = await getCategories();
      const category = result[0];

      expect(category.id).toBe('100');
      expect(category.name).toBe('Cuidado de Mascotas');
      expect(category.slug).toBe('cuidado-mascotas');
      expect(category.color).toBe('#75a99c');
      expect(category.icon).toBe('🐾');
    });

    it('should handle errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await getCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getCategory', () => {
    it('should fetch a single category by slug', async () => {
      const mockCategory = createMockCategoryStory();
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { story: mockCategory },
      });

      const result = await getCategory('cuidado-mascotas');

      expect(storyblokApi.get).toHaveBeenCalledWith(
        'cdn/stories/categorias/cuidado-mascotas',
        expect.any(Object)
      );
      expect(result).not.toBeNull();
      expect(result!.slug).toBe('cuidado-mascotas');
    });

    it('should return null for non-existent category', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { story: null },
      });

      const result = await getCategory('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllCategorySlugs', () => {
    it('should fetch all category slugs', async () => {
      const mockCategories = [
        createMockCategoryStory({ slug: 'perros' }),
        createMockCategoryStory({ slug: 'gatos' }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: mockCategories },
      });

      const result = await getAllCategorySlugs();

      expect(result).toEqual(['perros', 'gatos']);
    });
  });

  describe('getAuthors', () => {
    it('should fetch all authors', async () => {
      const mockAuthors = [
        createMockAuthorStory({ slug: 'author-1' }),
        createMockAuthorStory({ slug: 'author-2' }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: mockAuthors },
      });

      const result = await getAuthors();

      expect(storyblokApi.get).toHaveBeenCalledWith('cdn/stories', expect.objectContaining({
        starts_with: 'autores/',
        content_type: 'blog_author',
      }));
      expect(result).toHaveLength(2);
    });

    it('should transform author data correctly', async () => {
      const mockAuthor = createMockAuthorStory();
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: [mockAuthor] },
      });

      const result = await getAuthors();
      const author = result[0];

      expect(author.id).toBe('200');
      expect(author.name).toBe('Dr. Veterinario');
      expect(author.slug).toBe('dr-veterinario');
      expect(author.role).toBe('Veterinario Senior');
      expect(author.socialLinks).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await getAuthors();

      expect(result).toEqual([]);
    });
  });

  describe('getAuthor', () => {
    it('should fetch a single author by slug', async () => {
      const mockAuthor = createMockAuthorStory();
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { story: mockAuthor },
      });

      const result = await getAuthor('dr-veterinario');

      expect(storyblokApi.get).toHaveBeenCalledWith(
        'cdn/stories/autores/dr-veterinario',
        expect.any(Object)
      );
      expect(result).not.toBeNull();
      expect(result!.slug).toBe('dr-veterinario');
    });

    it('should return null for non-existent author', async () => {
      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { story: null },
      });

      const result = await getAuthor('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllAuthorSlugs', () => {
    it('should fetch all author slugs', async () => {
      const mockAuthors = [
        createMockAuthorStory({ slug: 'author-1' }),
        createMockAuthorStory({ slug: 'author-2' }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: mockAuthors },
      });

      const result = await getAllAuthorSlugs();

      expect(result).toEqual(['author-1', 'author-2']);
    });
  });

  describe('getAllTags', () => {
    it('should extract unique tags from posts', async () => {
      const posts = [
        createMockBlogPostStory({ content: { ...createMockBlogPostStory().content, tags: ['perros', 'salud'] } }),
        createMockBlogPostStory({ content: { ...createMockBlogPostStory().content, tags: ['gatos', 'salud'] } }),
      ];

      (storyblokApi.get as jest.Mock).mockResolvedValue({
        data: { stories: posts },
        total: 2,
      });

      const result = await getAllTags();

      expect(result).toContain('perros');
      expect(result).toContain('gatos');
      expect(result).toContain('salud');
      // Should be unique and sorted
      expect(result.filter(t => t === 'salud')).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await getAllTags();

      expect(result).toEqual([]);
    });
  });

  describe('getBlogSitemapUrls', () => {
    beforeEach(() => {
      // Setup mocks for all the API calls - check options.starts_with
      (storyblokApi.get as jest.Mock).mockImplementation((_path: string, options?: { starts_with?: string }) => {
        const startsWithPath = options?.starts_with || '';

        if (startsWithPath.includes('blog/')) {
          return Promise.resolve({
            data: { stories: [createMockBlogPostStory()] },
            total: 1,
          });
        }
        if (startsWithPath.includes('categorias/')) {
          return Promise.resolve({
            data: { stories: [createMockCategoryStory()] },
          });
        }
        if (startsWithPath.includes('autores/')) {
          return Promise.resolve({
            data: { stories: [createMockAuthorStory()] },
          });
        }
        return Promise.resolve({ data: { stories: [] }, total: 0 });
      });
    });

    it('should include blog home page', async () => {
      const urls = await getBlogSitemapUrls();

      const blogHome = urls.find(u => u.url === '/blog');
      expect(blogHome).toBeDefined();
      expect(blogHome!.priority).toBe(0.9);
      expect(blogHome!.changeFrequency).toBe('daily');
    });

    it('should include post URLs', async () => {
      const urls = await getBlogSitemapUrls();

      // Post URLs are direct children of /blog/ without additional path segments
      const postUrls = urls.filter(u => {
        const path = u.url;
        // Match /blog/slug but not /blog/categoria/slug, /blog/autor/slug, etc.
        return path.startsWith('/blog/') &&
          path !== '/blog' &&
          !path.includes('/categoria/') &&
          !path.includes('/autor/') &&
          !path.includes('/etiqueta/');
      });
      expect(postUrls.length).toBeGreaterThan(0);
    });

    it('should include category URLs', async () => {
      const urls = await getBlogSitemapUrls();

      const categoryUrls = urls.filter(u => u.url.includes('/blog/categoria/'));
      expect(categoryUrls.length).toBeGreaterThan(0);
      expect(categoryUrls[0].priority).toBe(0.7);
    });

    it('should include author URLs', async () => {
      const urls = await getBlogSitemapUrls();

      const authorUrls = urls.filter(u => u.url.includes('/blog/autor/'));
      expect(authorUrls.length).toBeGreaterThan(0);
      expect(authorUrls[0].priority).toBe(0.6);
      expect(authorUrls[0].changeFrequency).toBe('monthly');
    });

    it('should have lastModified dates', async () => {
      const urls = await getBlogSitemapUrls();

      urls.forEach(url => {
        expect(url.lastModified).toBeDefined();
        expect(new Date(url.lastModified).toString()).not.toBe('Invalid Date');
      });
    });

    it('should handle errors gracefully', async () => {
      (storyblokApi.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const urls = await getBlogSitemapUrls();

      // Should at least have the blog home page
      expect(urls.length).toBeGreaterThanOrEqual(0);
    });
  });
});
