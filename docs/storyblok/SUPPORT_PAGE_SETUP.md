# Storyblok Support/Help Center Setup Guide

This guide covers setting up a Support/Help Center in Storyblok for Vetify. This feature allows you to create and manage help articles, FAQs, and troubleshooting guides.

## Table of Contents

1. [Overview](#overview)
2. [Space Structure](#space-structure)
3. [Content Types](#content-types)
4. [Implementation Guide](#implementation-guide)
5. [URL Structure](#url-structure)
6. [Search Functionality](#search-functionality)
7. [Best Practices](#best-practices)

## Overview

The Support Center provides:

- **Help Articles**: Detailed guides on using Vetify features
- **FAQs**: Quick answers to common questions
- **Troubleshooting**: Solutions to common problems
- **Getting Started**: Onboarding guides for new users
- **Search**: Full-text search across all support content

### Target Audience

- New users learning the platform
- Existing users seeking help with specific features
- Users troubleshooting issues

## Space Structure

Create this folder structure in your Storyblok space:

```
Content/
├── soporte/                    # Support root folder
│   ├── empezar/               # Getting started guides
│   ├── guias/                 # Feature guides
│   ├── preguntas-frecuentes/  # FAQs
│   └── solucion-problemas/    # Troubleshooting
```

### Folder Descriptions

| Folder | Purpose | Example Content |
|--------|---------|-----------------|
| `empezar/` | First steps for new users | "Cómo crear tu primera cita", "Configurar tu clínica" |
| `guias/` | In-depth feature documentation | "Gestión de inventario", "Configurar recordatorios" |
| `preguntas-frecuentes/` | Quick Q&A format | "¿Cómo cambio mi contraseña?", "¿Puedo exportar datos?" |
| `solucion-problemas/` | Problem-solution format | "Error al iniciar sesión", "Pagos no procesados" |

## Content Types

### Support Article (`support_article`)

The main content type for help center articles.

#### Core Fields

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `title` | Text | Yes | Article title (max 100 chars) |
| `slug` | Text | Yes | URL-safe identifier |
| `excerpt` | Textarea | Yes | Brief description (max 200 chars) |
| `content` | Richtext | Yes | Main article content |

#### Categorization

| Field Name | Field Type | Required | Options |
|------------|------------|----------|---------|
| `category` | Single Option | Yes | `getting-started`, `guides`, `faq`, `troubleshooting` |
| `tags` | Text (Multi) | No | For filtering and search |
| `difficulty` | Single Option | No | `beginner`, `intermediate`, `advanced` |

#### Media & Enhancement

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `featured_image` | Asset | No | Hero image for the article |
| `video_url` | Text | No | YouTube/Vimeo URL for video tutorials |
| `screenshots` | Blocks | No | Step-by-step screenshot blocks |

#### Navigation & Related

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `related_articles` | Multi-link | No | Links to related help articles |
| `order` | Number | No | Display order within category |
| `estimated_time` | Text | No | e.g., "5 min read", "10 min video" |

#### SEO & Display

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `meta_title` | Text | No | SEO title override |
| `meta_description` | Textarea | No | SEO description |
| `show_feedback` | Boolean | No | Show "Was this helpful?" widget |
| `faq_items` | Blocks | No | FAQ blocks for rich snippets |

### Support Category (`support_category`)

For organizing support content into sections.

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `name` | Text | Yes | Category display name |
| `slug` | Text | Yes | URL identifier |
| `description` | Textarea | Yes | Category description |
| `icon` | Text | Yes | Icon identifier (e.g., `book-open`, `help-circle`) |
| `color` | Text | No | Brand color hex code |
| `featured_articles` | Multi-link | No | Pinned articles for this category |
| `order` | Number | No | Display order on support home |

### Screenshot Block (`screenshot_block`)

For step-by-step visual guides.

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `image` | Asset | Yes | Screenshot image |
| `caption` | Text | No | Image caption |
| `step_number` | Number | No | Step number if part of sequence |
| `highlight_area` | Text | No | CSS coordinates for highlight overlay |

## Implementation Guide

### Step 1: Add TypeScript Types

Add to `src/lib/storyblok/types.ts`:

```typescript
// ============================================
// Support Article Content Type
// ============================================

export interface SupportArticleContent {
  component: 'support_article';

  // Core fields
  title: string;
  slug: string;
  excerpt: string;
  content: ISbRichtext;

  // Categorization
  category: 'getting-started' | 'guides' | 'faq' | 'troubleshooting';
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  // Media
  featured_image?: StoryblokAsset;
  video_url?: string;
  screenshots?: ScreenshotBlockContent[];

  // Navigation
  related_articles?: StoryblokLink[];
  order?: number;
  estimated_time?: string;

  // SEO & Display
  meta_title?: string;
  meta_description?: string;
  show_feedback?: boolean;
  faq_items?: FAQBlockContent[];
}

export type SupportArticleStory = ISbStoryData<SupportArticleContent>;

// ============================================
// Support Category Content Type
// ============================================

export interface SupportCategoryContent {
  component: 'support_category';
  name: string;
  slug: string;
  description: string;
  icon: string;
  color?: string;
  featured_articles?: StoryblokLink[];
  order?: number;
}

export type SupportCategoryStory = ISbStoryData<SupportCategoryContent>;

// ============================================
// Screenshot Block
// ============================================

export interface ScreenshotBlockContent {
  _uid: string;
  component: 'screenshot_block';
  image: StoryblokAsset;
  caption?: string;
  step_number?: number;
  highlight_area?: string;
}

// ============================================
// Transformed Types
// ============================================

export interface SupportArticle {
  id: string;
  uuid: string;
  slug: string;
  fullSlug: string;
  title: string;
  excerpt: string;
  content: ISbRichtext;
  category: string;
  categoryLabel: string;
  tags: string[];
  difficulty?: string;
  featuredImage: {
    url: string;
    alt: string;
  } | null;
  videoUrl?: string;
  screenshots: ScreenshotBlockContent[];
  relatedArticles: StoryblokLink[];
  order: number;
  estimatedTime?: string;
  metaTitle?: string;
  metaDescription?: string;
  showFeedback: boolean;
  faqItems: FAQBlockContent[];
  publishedAt: string;
  updatedAt: string;
}

export interface SupportCategory {
  id: string;
  uuid: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
  featuredArticles: StoryblokLink[];
  order: number;
  articleCount?: number;
}
```

### Step 2: Add API Functions

Create `src/lib/storyblok/support-api.ts`:

```typescript
/**
 * Storyblok Support/Help Center API
 *
 * Data fetching functions for support content.
 */

import {
  storyblokApi,
  getStoryblokVersion,
  getStoryblokImageUrl,
} from './client';

import type {
  SupportArticle,
  SupportArticleStory,
  SupportCategory,
  SupportCategoryStory,
  PaginatedResponse,
  FAQBlockContent,
  ScreenshotBlockContent,
  StoryblokLink,
} from './types';

// Category label mapping
const CATEGORY_LABELS: Record<string, string> = {
  'getting-started': 'Empezar',
  'guides': 'Guías',
  'faq': 'Preguntas Frecuentes',
  'troubleshooting': 'Solución de Problemas',
};

// ============================================
// Transform Functions
// ============================================

function transformSupportArticle(story: SupportArticleStory): SupportArticle {
  const content = story.content;

  return {
    id: story.id.toString(),
    uuid: story.uuid,
    slug: story.slug,
    fullSlug: story.full_slug,
    title: content.title || '',
    excerpt: content.excerpt || '',
    content: content.content,
    category: content.category || 'guides',
    categoryLabel: CATEGORY_LABELS[content.category] || content.category,
    tags: content.tags || [],
    difficulty: content.difficulty,
    featuredImage: content.featured_image?.filename
      ? {
          url: getStoryblokImageUrl(content.featured_image.filename, {
            width: 1200,
            height: 630,
          }),
          alt: content.featured_image.alt || content.title || '',
        }
      : null,
    videoUrl: content.video_url,
    screenshots: (content.screenshots || []) as ScreenshotBlockContent[],
    relatedArticles: (content.related_articles || []) as StoryblokLink[],
    order: content.order || 0,
    estimatedTime: content.estimated_time,
    metaTitle: content.meta_title,
    metaDescription: content.meta_description || content.excerpt,
    showFeedback: content.show_feedback ?? true,
    faqItems: (content.faq_items || []) as FAQBlockContent[],
    publishedAt: story.first_published_at || story.created_at,
    updatedAt: story.published_at || story.created_at,
  };
}

function transformSupportCategory(story: SupportCategoryStory): SupportCategory {
  const content = story.content;

  return {
    id: story.id.toString(),
    uuid: story.uuid,
    slug: story.slug,
    name: content.name || '',
    description: content.description || '',
    icon: content.icon || 'help-circle',
    color: content.color,
    featuredArticles: (content.featured_articles || []) as StoryblokLink[],
    order: content.order || 0,
  };
}

// ============================================
// Support Articles API
// ============================================

export async function getSupportArticles(options: {
  category?: string;
  tag?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<PaginatedResponse<SupportArticle>> {
  const {
    category,
    tag,
    difficulty,
    search,
    page = 1,
    perPage = 20
  } = options;

  try {
    const filterQuery: Record<string, unknown> = {};

    if (category) {
      filterQuery['filter_query[category][in]'] = category;
    }
    if (tag) {
      filterQuery['filter_query[tags][in_array]'] = tag;
    }
    if (difficulty) {
      filterQuery['filter_query[difficulty][in]'] = difficulty;
    }

    const queryParams: Record<string, unknown> = {
      starts_with: 'soporte/',
      content_type: 'support_article',
      version: getStoryblokVersion(),
      per_page: perPage,
      page,
      sort_by: 'content.order:asc,first_published_at:desc',
      ...filterQuery,
    };

    if (search) {
      queryParams.search_term = search;
    }

    const { data, total } = await storyblokApi.get('cdn/stories', queryParams);

    const stories = (data?.stories || []) as SupportArticleStory[];
    const totalCount = total || 0;
    const totalPages = Math.ceil(totalCount / perPage);

    return {
      items: stories.map(transformSupportArticle),
      total: totalCount,
      page,
      perPage,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error('[Storyblok] Error fetching support articles:', error);
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

export async function getSupportArticle(slug: string): Promise<SupportArticle | null> {
  try {
    // Try to find by full path first
    const paths = [
      `soporte/${slug}`,
      `soporte/empezar/${slug}`,
      `soporte/guias/${slug}`,
      `soporte/preguntas-frecuentes/${slug}`,
      `soporte/solucion-problemas/${slug}`,
    ];

    for (const path of paths) {
      try {
        const { data } = await storyblokApi.get(`cdn/stories/${path}`, {
          version: getStoryblokVersion(),
          resolve_links: 'url',
        });

        if (data?.story) {
          return transformSupportArticle(data.story as SupportArticleStory);
        }
      } catch {
        // Continue to next path
      }
    }

    return null;
  } catch (error) {
    console.error(`[Storyblok] Error fetching support article "${slug}":`, error);
    return null;
  }
}

export async function searchSupportArticles(query: string): Promise<SupportArticle[]> {
  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'soporte/',
      content_type: 'support_article',
      version: getStoryblokVersion(),
      search_term: query,
      per_page: 10,
    });

    const stories = (data?.stories || []) as SupportArticleStory[];
    return stories.map(transformSupportArticle);
  } catch (error) {
    console.error('[Storyblok] Error searching support articles:', error);
    return [];
  }
}

export async function getRelatedSupportArticles(
  currentArticle: SupportArticle,
  limit: number = 3
): Promise<SupportArticle[]> {
  try {
    // First try manually linked related articles
    if (currentArticle.relatedArticles.length > 0) {
      const slugs = currentArticle.relatedArticles
        .map(link => link.story?.full_slug || link.cached_url)
        .filter(Boolean)
        .slice(0, limit);

      if (slugs.length > 0) {
        const { data } = await storyblokApi.get('cdn/stories', {
          by_slugs: slugs.join(','),
          version: getStoryblokVersion(),
        });

        if (data?.stories?.length > 0) {
          return (data.stories as SupportArticleStory[]).map(transformSupportArticle);
        }
      }
    }

    // Fallback: Get articles from same category
    const { items } = await getSupportArticles({
      category: currentArticle.category,
      perPage: limit + 1,
    });

    return items
      .filter(article => article.uuid !== currentArticle.uuid)
      .slice(0, limit);
  } catch (error) {
    console.error('[Storyblok] Error fetching related support articles:', error);
    return [];
  }
}

// ============================================
// Support Categories API
// ============================================

export async function getSupportCategories(): Promise<SupportCategory[]> {
  try {
    const { data } = await storyblokApi.get('cdn/stories', {
      starts_with: 'soporte-categorias/',
      content_type: 'support_category',
      version: getStoryblokVersion(),
      per_page: 100,
      sort_by: 'content.order:asc',
    });

    const stories = (data?.stories || []) as SupportCategoryStory[];
    return stories.map(transformSupportCategory);
  } catch (error) {
    console.error('[Storyblok] Error fetching support categories:', error);
    return [];
  }
}

// ============================================
// Aggregation Functions
// ============================================

export async function getSupportStats(): Promise<{
  totalArticles: number;
  byCategory: Record<string, number>;
  recentlyUpdated: SupportArticle[];
}> {
  try {
    const { items, total } = await getSupportArticles({ perPage: 100 });

    const byCategory: Record<string, number> = {};
    items.forEach(article => {
      byCategory[article.category] = (byCategory[article.category] || 0) + 1;
    });

    const recentlyUpdated = [...items]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalArticles: total,
      byCategory,
      recentlyUpdated,
    };
  } catch (error) {
    console.error('[Storyblok] Error fetching support stats:', error);
    return {
      totalArticles: 0,
      byCategory: {},
      recentlyUpdated: [],
    };
  }
}

export async function getAllSupportTags(): Promise<string[]> {
  try {
    const { items } = await getSupportArticles({ perPage: 100 });
    const allTags = items.flatMap(article => article.tags);
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error('[Storyblok] Error fetching support tags:', error);
    return [];
  }
}

// ============================================
// Sitemap Helpers
// ============================================

export async function getSupportSitemapUrls(): Promise<Array<{
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
    // Support home
    urls.push({
      url: '/soporte',
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Individual articles
    const { items } = await getSupportArticles({ perPage: 100 });
    for (const article of items) {
      urls.push({
        url: `/soporte/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Category pages
    const categories = ['getting-started', 'guides', 'faq', 'troubleshooting'];
    for (const category of categories) {
      urls.push({
        url: `/soporte/categoria/${category}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error('[Storyblok] Error generating support sitemap URLs:', error);
  }

  return urls;
}
```

### Step 3: Create Next.js Routes

Create the support page routes:

```
src/app/soporte/
├── page.tsx                      # Support home
├── [slug]/page.tsx               # Article page
├── categoria/[category]/page.tsx # Category listing
└── buscar/page.tsx               # Search results
```

## URL Structure

| Page | URL | Description |
|------|-----|-------------|
| Support Home | `/soporte` | Overview with category cards |
| Article | `/soporte/{slug}` | Individual article |
| Category | `/soporte/categoria/{category}` | Articles in category |
| Search | `/soporte/buscar?q={query}` | Search results |

### Category URL Mapping

| Category ID | URL | Display Name |
|-------------|-----|--------------|
| `getting-started` | `/soporte/categoria/getting-started` | Empezar |
| `guides` | `/soporte/categoria/guides` | Guías |
| `faq` | `/soporte/categoria/faq` | Preguntas Frecuentes |
| `troubleshooting` | `/soporte/categoria/troubleshooting` | Solución de Problemas |

## Search Functionality

### Storyblok Search

The `search_term` parameter in the Storyblok API provides full-text search:

```typescript
const { data } = await storyblokApi.get('cdn/stories', {
  starts_with: 'soporte/',
  search_term: 'cómo crear cita',
  per_page: 10,
});
```

### Enhanced Search UI

Consider implementing:

1. **Instant Search**: Debounced search as user types
2. **Search Suggestions**: Show popular searches
3. **Category Filters**: Filter results by category
4. **Highlighted Results**: Show matching text snippets

```typescript
// Example search component hook
function useSupportSearch(query: string) {
  const [results, setResults] = useState<SupportArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsLoading(true);
      const articles = await searchSupportArticles(query);
      setResults(articles);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return { results, isLoading };
}
```

## Best Practices

### Content Guidelines

#### Writing Style

- Use clear, simple language
- Write in second person ("you")
- Use active voice
- Keep sentences short
- Include step-by-step instructions

#### Article Structure

1. **Title**: Clear, action-oriented (e.g., "Cómo crear una nueva cita")
2. **Excerpt**: One sentence summary
3. **Introduction**: Brief context (1-2 sentences)
4. **Steps/Content**: Numbered steps with screenshots
5. **Related Articles**: 2-3 relevant links
6. **Feedback Widget**: "Was this helpful?" at the end

#### Screenshots

- Use consistent dimensions (e.g., 1200x800)
- Highlight relevant UI elements
- Add numbered callouts for complex screens
- Update when UI changes

### Organization Tips

1. **Start Small**: Begin with most common questions
2. **Track Analytics**: See which articles are viewed most
3. **Collect Feedback**: Use the feedback widget to identify gaps
4. **Regular Updates**: Review articles quarterly

### SEO Considerations

- Include keywords naturally in titles and content
- Add FAQ schema for question-based articles
- Use descriptive URLs
- Link between related articles

---

**Related Documentation**:
- [Storyblok Overview](./README.md)
- [Blog Setup Guide](./BLOG_SETUP.md)
- [Content Types Reference](./CONTENT_TYPES.md)
