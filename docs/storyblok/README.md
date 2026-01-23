# Storyblok CMS Integration Guide

This documentation covers the Storyblok CMS integration for Vetify's content management needs, including the blog and support/help center features.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Environment Setup](#environment-setup)
4. [Architecture](#architecture)
5. [Documentation Index](#documentation-index)

## Overview

Vetify uses [Storyblok](https://www.storyblok.com/) as a headless CMS for managing:

- **Blog Content**: Articles, categories, authors, and tags
- **Support Center**: Help articles, FAQs, and troubleshooting guides (planned)

### Why Storyblok?

- **Visual Editor**: Content editors can see real-time previews
- **Headless Architecture**: Decoupled from the frontend for flexibility
- **Rich Content**: Supports complex content structures with nested blocks
- **API-First**: RESTful API with excellent TypeScript support
- **ISR Compatible**: Works seamlessly with Next.js Incremental Static Regeneration

## Quick Start

### 1. Create a Storyblok Account

1. Go to [Storyblok](https://www.storyblok.com/) and create an account
2. Create a new Space for your project
3. Note your Space ID (visible in the URL)

### 2. Get Your API Token

1. Go to **Settings** > **Access Tokens**
2. Create a new token:
   - For development: Use a **Preview** token (access to draft content)
   - For production: Use a **Public** token (published content only)

### 3. Configure Environment Variables

Add to your `.env.local`:

```bash
# Storyblok Configuration
STORYBLOK_API_TOKEN=your_token_here
STORYBLOK_PREVIEW_MODE=false

# Optional: For visual editor integration
STORYBLOK_SPACE_ID=your_space_id
```

### 4. Test the Connection

Start your development server and visit `/blog` to verify the integration is working.

## Environment Setup

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STORYBLOK_API_TOKEN` | Yes | API access token from Storyblok |
| `STORYBLOK_PREVIEW_MODE` | No | Set to `true` to see draft content |
| `STORYBLOK_SPACE_ID` | No | Required for visual editor |

### Token Types

| Token Type | Use Case | Access |
|------------|----------|--------|
| **Preview** | Development, staging | Draft + Published content |
| **Public** | Production | Published content only |

### Environment-Specific Configuration

```bash
# Development (.env.local)
STORYBLOK_API_TOKEN=your_preview_token
STORYBLOK_PREVIEW_MODE=true

# Production (Vercel)
STORYBLOK_API_TOKEN=your_public_token
STORYBLOK_PREVIEW_MODE=false
```

## Architecture

### File Structure

```
src/lib/storyblok/
├── client.ts          # Storyblok client configuration
├── api.ts             # Data fetching functions
├── types.ts           # TypeScript type definitions
└── __tests__/         # Unit tests
    ├── client.test.ts
    └── api.test.ts

src/components/blog/
├── RichTextRenderer.tsx    # Renders Storyblok rich text
├── TableOfContents.tsx     # Auto-generated TOC from headings
├── FAQSection.tsx          # FAQ rich snippet component
├── HowToSection.tsx        # HowTo schema component
└── RelatedPosts.tsx        # Related articles component

src/app/blog/
├── page.tsx                # Blog listing page
├── [slug]/page.tsx         # Individual article page
├── categoria/[category]/   # Category pages
├── autor/[author]/         # Author pages
└── etiqueta/[tag]/         # Tag pages
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Storyblok     │────▶│  Next.js Server  │────▶│   React Page    │
│   (Content)     │     │  (ISR/SSR)       │     │   Components    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
    API Token              storyblokApi              Transformed
    (Preview/Public)       (client.ts)              BlogPost types
```

### Caching Strategy

- **ISR Revalidation**: Content revalidates every 1 hour (3600 seconds)
- **Storyblok Cache**: In-memory cache with auto-clear on content changes
- **CDN**: Vercel Edge caches responses for faster delivery

```typescript
// Revalidation configuration (in client.ts)
export const BLOG_REVALIDATE_TIME = 3600; // 1 hour
```

## Documentation Index

| Document | Description |
|----------|-------------|
| [Blog Setup Guide](./BLOG_SETUP.md) | Complete blog configuration and content types |
| [Support Page Setup](./SUPPORT_PAGE_SETUP.md) | Help center/support page configuration |
| [Content Types Reference](./CONTENT_TYPES.md) | Detailed field specifications for all content types |

## Useful Links

- [Storyblok Documentation](https://www.storyblok.com/docs/guide/introduction)
- [Storyblok JS Client](https://github.com/storyblok/storyblok-js-client)
- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)

## Troubleshooting

### Common Issues

#### "Missing STORYBLOK_API_TOKEN environment variable"

Ensure you have the `STORYBLOK_API_TOKEN` variable set in your `.env.local` file.

#### Content not appearing

1. Check if content is **published** in Storyblok
2. Verify you're using the correct token type (Preview vs Public)
3. Check the browser console for API errors

#### Draft content not visible

Set `STORYBLOK_PREVIEW_MODE=true` in your environment and use a Preview token.

#### Stale content after publishing

Content uses ISR with a 1-hour revalidation period. To see changes immediately:
- In development: Restart the dev server
- In production: Trigger a revalidation via webhook or wait for the cache to expire

---

**Next Steps**: Follow the [Blog Setup Guide](./BLOG_SETUP.md) to configure your Storyblok space.
