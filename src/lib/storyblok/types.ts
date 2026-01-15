/**
 * Storyblok Types for Blog Content
 *
 * These types define the structure of content stored in Storyblok CMS
 * for the Vetify blog feature.
 */

import type { ISbStoryData, ISbRichtext } from 'storyblok-js-client';

// ============================================
// Base Types
// ============================================

export interface StoryblokAsset {
  id: number;
  alt: string;
  name: string;
  focus: string;
  title: string;
  filename: string;
  copyright: string;
  fieldtype: 'asset';
}

export interface StoryblokLink {
  id: string;
  url: string;
  linktype: 'story' | 'url';
  fieldtype: 'multilink';
  cached_url: string;
  story?: {
    full_slug: string;
    uuid: string;
  };
}

// ============================================
// Blog Post Content Type
// ============================================

export interface BlogPostContent {
  component: 'blog_post';

  // Core fields
  title: string;
  slug: string;
  excerpt: string;
  content: ISbRichtext;
  featured_image: StoryblokAsset;

  // SEO fields
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  canonical_url?: string;
  no_index?: boolean;

  // Organization
  category: string;
  tags?: string[];
  author: string;

  // Dates
  published_at?: string;

  // Related content
  related_posts?: StoryblokLink[];

  // Rich snippets
  faq_items?: FAQBlockContent[];
  how_to_steps?: HowToStepContent[];

  // Reading experience
  reading_time_minutes?: number;
  show_toc?: boolean;
}

export type BlogPostStory = ISbStoryData<BlogPostContent>;

// ============================================
// Category Content Type
// ============================================

export interface BlogCategoryContent {
  component: 'blog_category';
  name: string;
  slug: string;
  description?: string;
  featured_image?: StoryblokAsset;
  meta_title?: string;
  meta_description?: string;
  color?: string;
  icon?: string;
}

export type BlogCategoryStory = ISbStoryData<BlogCategoryContent>;

// ============================================
// Author Content Type
// ============================================

export interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'website';
  url: string;
}

export interface BlogAuthorContent {
  component: 'blog_author';
  name: string;
  slug: string;
  bio?: ISbRichtext;
  avatar?: StoryblokAsset;
  role?: string;
  social_links?: SocialLink[];
  meta_description?: string;
}

export type BlogAuthorStory = ISbStoryData<BlogAuthorContent>;

// ============================================
// Block Components (Bloks)
// ============================================

export interface FAQBlockContent {
  _uid: string;
  component: 'faq_block';
  question: string;
  answer: ISbRichtext;
}

export interface HowToStepContent {
  _uid: string;
  component: 'how_to_step';
  step_number: number;
  title: string;
  description: ISbRichtext;
  image?: StoryblokAsset;
}

export interface CalloutBoxContent {
  _uid: string;
  component: 'callout_box';
  type: 'info' | 'warning' | 'tip' | 'important';
  title?: string;
  content: ISbRichtext;
}

export interface ImageBlockContent {
  _uid: string;
  component: 'image_block';
  image: StoryblokAsset;
  caption?: string;
  alignment: 'left' | 'center' | 'right' | 'full';
}

export interface VideoEmbedContent {
  _uid: string;
  component: 'video_embed';
  video_url: string;
  title?: string;
  thumbnail?: StoryblokAsset;
}

export interface RelatedPostsBlockContent {
  _uid: string;
  component: 'related_posts';
  title?: string;
  posts: StoryblokLink[];
  display_style: 'grid' | 'list' | 'carousel';
}

// ============================================
// API Response Types
// ============================================

export interface BlogPostsResponse {
  stories: BlogPostStory[];
  cv: number;
  rels: unknown[];
  links: unknown[];
}

export interface BlogPostResponse {
  story: BlogPostStory;
  cv: number;
  rels: unknown[];
  links: unknown[];
}

export interface CategoriesResponse {
  stories: BlogCategoryStory[];
  cv: number;
}

export interface AuthorsResponse {
  stories: BlogAuthorStory[];
  cv: number;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================
// Filter Types
// ============================================

export interface BlogPostFilters {
  category?: string;
  tag?: string;
  author?: string;
  excludeSlug?: string;
}

// ============================================
// Transformed Types (for components)
// ============================================

export interface BlogPost {
  id: string;
  uuid: string;
  slug: string;
  fullSlug: string;
  title: string;
  excerpt: string;
  content: ISbRichtext;
  featuredImage: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  } | null;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  showToc: boolean;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  canonicalUrl?: string;
  noIndex: boolean;
  faqItems: FAQBlockContent[];
  howToSteps: HowToStepContent[];
  relatedPosts: StoryblokLink[];
}

export interface BlogCategory {
  id: string;
  uuid: string;
  slug: string;
  name: string;
  description?: string;
  featuredImage: {
    url: string;
    alt: string;
  } | null;
  color?: string;
  icon?: string;
  postCount?: number;
}

export interface BlogAuthor {
  id: string;
  uuid: string;
  slug: string;
  name: string;
  bio?: ISbRichtext;
  avatar: {
    url: string;
    alt: string;
  } | null;
  role?: string;
  socialLinks: SocialLink[];
  postCount?: number;
}

// ============================================
// Utility Types
// ============================================

export type StoryblokComponent =
  | BlogPostContent
  | BlogCategoryContent
  | BlogAuthorContent
  | FAQBlockContent
  | HowToStepContent
  | CalloutBoxContent
  | ImageBlockContent
  | VideoEmbedContent
  | RelatedPostsBlockContent;
