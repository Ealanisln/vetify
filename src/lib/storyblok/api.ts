/**
 * Storyblok API Utilities
 *
 * Data fetching functions for blog content from Storyblok CMS.
 * All functions are designed for server-side use with ISR support.
 */

import {
  storyblokApi,
  getStoryblokVersion,
  calculateReadingTime,
  getStoryblokImageUrl,
  DEFAULT_POSTS_PER_PAGE,
  DEFAULT_RELATED_POSTS_LIMIT,
} from './client';

import type {
  BlogPost,
  BlogPostStory,
  BlogCategory,
  BlogCategoryStory,
  BlogAuthor,
  BlogAuthorStory,
  PaginatedResponse,
  BlogPostFilters,
  FAQBlockContent,
  HowToStepContent,
  StoryblokLink,
} from './types';

// ============================================
// Blog Posts
// ============================================

/**
 * Transform Storyblok story to BlogPost type
 */
function transformBlogPost(story: BlogPostStory): BlogPost {
  const content = story.content;

  return {
    id: story.id.toString(),
    uuid: story.uuid,
    slug: story.slug,
    fullSlug: story.full_slug,
    title: content.title || '',
    excerpt: content.excerpt || '',
    content: content.content,
    featuredImage: content.featured_image?.filename
      ? {
          url: getStoryblokImageUrl(content.featured_image.filename, {
            width: 1200,
            height: 630,
          }),
          alt: content.featured_image.alt || content.title || '',
          width: 1200,
          height: 630,
        }
      : null,
    category: content.category || '',
    tags: content.tags || [],
    author: content.author || '',
    publishedAt: content.published_at || story.first_published_at || story.created_at,
    updatedAt: story.published_at || story.created_at,
    readingTimeMinutes: content.reading_time_minutes || calculateReadingTime(content.content),
    showToc: content.show_toc ?? true,
    metaTitle: content.meta_title,
    metaDescription: content.meta_description || content.excerpt,
    keywords: content.keywords || [],
    canonicalUrl: content.canonical_url,
    noIndex: content.no_index ?? false,
    faqItems: (content.faq_items || []) as FAQBlockContent[],
    howToSteps: (content.how_to_steps || []) as HowToStepContent[],
    relatedPosts: (content.related_posts || []) as StoryblokLink[],
  };
}

/**
 * Get all blog posts with pagination and filtering
 */
export async function getBlogPosts(options: {
  page?: number;
  perPage?: number;
  filters?: BlogPostFilters;
} = {}): Promise<PaginatedResponse<BlogPost>> {
  const { page = 1, perPage = DEFAULT_POSTS_PER_PAGE, filters = {} } = options;

  try {
    // Build filter parameters
    const filterQuery: Record<string, unknown> = {};

    if (filters.category) {
      filterQuery['filter_query[category][in]'] = filters.category;
    }

    if (filters.tag) {
      filterQuery['filter_query[tags][in_array]'] = filters.tag;
    }

    if (filters.author) {
      filterQuery['filter_query[author][in]'] = filters.author;
    }

    if (filters.excludeSlug) {
      filterQuery['excluding_slugs'] = `blog/${filters.excludeSlug}`;
    }

    const { data, total } = await storyblokApi.get('cdn/stories', {
      starts_with: 'blog/',
      content_type: 'blog_post',
      version: getStoryblokVersion(),
      per_page: perPage,
      page,
      sort_by: 'first_published_at:desc',
      ...filterQuery,
    });

    const stories = (data?.stories || []) as BlogPostStory[];
    const totalCount = total || 0;
    const totalPages = Math.ceil(totalCount / perPage);

    return {
      items: stories.map(transformBlogPost),
      total: totalCount,
      page,
      perPage,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error('[Storyblok] Error fetching blog posts:', error);
    return {
      items: [],
      total: 0,
      page,
      perPage,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data } = await storyblokApi.get(`cdn/stories/blog/${slug}`, {
      version: getStoryblokVersion(),
    });

    if (!data?.story) {
      return null;
    }

    return transformBlogPost(data.story as BlogPostStory);
  } catch (error) {
    console.error(`[Storyblok] Error fetching blog post "${slug}":`, error);
    return null;
  }
}

/**
 * Get related posts for an article
 */
export async function getRelatedPosts(
  currentPost: BlogPost,
  limit: number = DEFAULT_RELATED_POSTS_LIMIT
): Promise<BlogPost[]> {
  try {
    // First try to get manually selected related posts
    if (currentPost.relatedPosts && currentPost.relatedPosts.length > 0) {
      const slugs = currentPost.relatedPosts
        .map(link => link.story?.full_slug || link.cached_url)
        .filter(Boolean)
        .slice(0, limit);

      if (slugs.length > 0) {
        const { data } = await storyblokApi.get('cdn/stories', {
          by_slugs: slugs.join(','),
          version: getStoryblokVersion(),
        });

        if (data?.stories?.length > 0) {
          return (data.stories as BlogPostStory[]).map(transformBlogPost);
        }
      }
    }

    // Fallback: Get posts from same category
    const { items } = await getBlogPosts({
      perPage: limit + 1,
      filters: {
        category: currentPost.category,
        excludeSlug: currentPost.slug,
      },
    });

    // If not enough from category, get by tags
    if (items.length < limit && currentPost.tags.length > 0) {
      const { items: tagPosts } = await getBlogPosts({
        perPage: limit,
        filters: {
          tag: currentPost.tags[0],
          excludeSlug: currentPost.slug,
        },
      });

      // Combine and deduplicate
      const allPosts = [...items, ...tagPosts];
      const uniquePosts = allPosts.filter(
        (post, index, self) =>
          index === self.findIndex(p => p.uuid === post.uuid)
      );

      return uniquePosts.slice(0, limit);
    }

    return items.slice(0, limit);
  } catch (error) {
    console.error('[Storyblok] Error fetching related posts:', error);
    return [];
  }
}

/**
 * Get all post slugs for static generation
 */
export async function getAllPostSlugs(): Promise<string[]> {
  try {
    const slugs: string[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, total } = await storyblokApi.get('cdn/stories', {
        starts_with: 'blog/',
        content_type: 'blog_post',
        version: 'published',
        per_page: 100,
        page,
      });

      const stories = (data?.stories || []) as BlogPostStory[];
      slugs.push(...stories.map(story => story.slug));

      hasMore = slugs.length < (total || 0);
      page++;
    }

    return slugs;
  } catch (error) {
    console.error('[Storyblok] Error fetching all post slugs:', error);
    return [];
  }
}

// ============================================
// Categories
// ============================================

/**
 * Transform Storyblok story to BlogCategory type
 */
function transformBlogCategory(story: BlogCategoryStory): BlogCategory {
  const content = story.content;

  return {
    id: story.id.toString(),
    uuid: story.uuid,
    slug: story.slug,
    name: content.name || '',
    description: content.description,
    featuredImage: content.featured_image?.filename
      ? {
          url: getStoryblokImageUrl(content.featured_image.filename, {
            width: 800,
            height: 400,
          }),
          alt: content.featured_image.alt || content.name || '',
        }
      : null,
    color: content.color,
    icon: content.icon,
  };
}

/**
 * Get all blog categories
 */
export async function getCategories(): Promise<BlogCategory[]> {
  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'categorias/',
      content_type: 'blog_category',
      version: getStoryblokVersion(),
      per_page: 100,
    });

    const stories = (data?.stories || []) as BlogCategoryStory[];
    return stories.map(transformBlogCategory);
  } catch (error) {
    console.error('[Storyblok] Error fetching categories:', error);
    return [];
  }
}

/**
 * Get a single category by slug
 */
export async function getCategory(slug: string): Promise<BlogCategory | null> {
  try {
    const { data } = await storyblokApi.get(`cdn/stories/categorias/${slug}`, {
      version: getStoryblokVersion(),
    });

    if (!data?.story) {
      return null;
    }

    return transformBlogCategory(data.story as BlogCategoryStory);
  } catch (error) {
    console.error(`[Storyblok] Error fetching category "${slug}":`, error);
    return null;
  }
}

/**
 * Get all category slugs for static generation
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'categorias/',
      content_type: 'blog_category',
      version: 'published',
      per_page: 100,
    });

    const stories = (data?.stories || []) as BlogCategoryStory[];
    return stories.map(story => story.slug);
  } catch (error) {
    console.error('[Storyblok] Error fetching all category slugs:', error);
    return [];
  }
}

// ============================================
// Authors
// ============================================

/**
 * Transform Storyblok story to BlogAuthor type
 */
function transformBlogAuthor(story: BlogAuthorStory): BlogAuthor {
  const content = story.content;

  return {
    id: story.id.toString(),
    uuid: story.uuid,
    slug: story.slug,
    name: content.name || '',
    bio: content.bio,
    avatar: content.avatar?.filename
      ? {
          url: getStoryblokImageUrl(content.avatar.filename, {
            width: 200,
            height: 200,
          }),
          alt: content.avatar.alt || content.name || '',
        }
      : null,
    role: content.role,
    socialLinks: content.social_links || [],
  };
}

/**
 * Get all blog authors
 */
export async function getAuthors(): Promise<BlogAuthor[]> {
  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'autores/',
      content_type: 'blog_author',
      version: getStoryblokVersion(),
      per_page: 100,
    });

    const stories = (data?.stories || []) as BlogAuthorStory[];
    return stories.map(transformBlogAuthor);
  } catch (error) {
    console.error('[Storyblok] Error fetching authors:', error);
    return [];
  }
}

/**
 * Get a single author by slug
 */
export async function getAuthor(slug: string): Promise<BlogAuthor | null> {
  try {
    const { data } = await storyblokApi.get(`cdn/stories/autores/${slug}`, {
      version: getStoryblokVersion(),
    });

    if (!data?.story) {
      return null;
    }

    return transformBlogAuthor(data.story as BlogAuthorStory);
  } catch (error) {
    console.error(`[Storyblok] Error fetching author "${slug}":`, error);
    return null;
  }
}

/**
 * Get all author slugs for static generation
 */
export async function getAllAuthorSlugs(): Promise<string[]> {
  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'autores/',
      content_type: 'blog_author',
      version: 'published',
      per_page: 100,
    });

    const stories = (data?.stories || []) as BlogAuthorStory[];
    return stories.map(story => story.slug);
  } catch (error) {
    console.error('[Storyblok] Error fetching all author slugs:', error);
    return [];
  }
}

// ============================================
// Tags
// ============================================

/**
 * Get all unique tags from blog posts
 */
export async function getAllTags(): Promise<string[]> {
  try {
    const { items } = await getBlogPosts({ perPage: 100 });

    const allTags = items.flatMap(post => post.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  } catch (error) {
    console.error('[Storyblok] Error fetching all tags:', error);
    return [];
  }
}

// ============================================
// Sitemap Helpers
// ============================================

/**
 * Get all blog URLs for sitemap generation
 */
export async function getBlogSitemapUrls(): Promise<Array<{
  url: string;
  lastModified: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
}>> {
  const urls: Array<{
    url: string;
    lastModified: string;
    changeFrequency: 'daily' | 'weekly' | 'monthly';
    priority: number;
  }> = [];

  try {
    // Blog home page
    urls.push({
      url: '/blog',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    });

    // Individual posts
    const postSlugs = await getAllPostSlugs();
    for (const slug of postSlugs) {
      urls.push({
        url: `/blog/${slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Category pages
    const categorySlugs = await getAllCategorySlugs();
    for (const slug of categorySlugs) {
      urls.push({
        url: `/blog/categoria/${slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Author pages
    const authorSlugs = await getAllAuthorSlugs();
    for (const slug of authorSlugs) {
      urls.push({
        url: `/blog/autor/${slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }

    // Tag pages
    const tags = await getAllTags();
    for (const tag of tags) {
      urls.push({
        url: `/blog/etiqueta/${encodeURIComponent(tag)}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error('[Storyblok] Error generating sitemap URLs:', error);
  }

  return urls;
}
