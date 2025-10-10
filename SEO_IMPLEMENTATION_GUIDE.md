# SEO Implementation Guide - Vetify

Complete SEO setup for Vetify veterinary SaaS platform with Spanish as primary language and structure for future English support.

## 📋 Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [Testing & Validation](#testing--validation)
6. [Adding English Support](#adding-english-support)
7. [Dynamic OG Images](#dynamic-og-images)
8. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This SEO implementation includes:

- ✅ Centralized SEO configuration with TypeScript types
- ✅ Spanish language support (es-MX) with structure for English
- ✅ Open Graph (Facebook, LinkedIn) and Twitter Card meta tags
- ✅ JSON-LD structured data (Organization, SoftwareApplication, WebPage, Article)
- ✅ Veterinary/medical-specific schema markup
- ✅ Dynamic sitemap.xml with language support
- ✅ robots.txt configuration
- ✅ Reusable SEO components and utilities
- ✅ Next.js 14+ App Router metadata API integration

## 📁 File Structure

```
src/
├── lib/
│   └── seo/
│       ├── types.ts                 # TypeScript types for SEO
│       ├── config.ts                # Site-wide SEO configuration (Spanish content)
│       ├── language.ts              # Language/locale utilities
│       ├── metadata.ts              # Metadata generation functions
│       ├── structured-data.ts       # JSON-LD schema generators
│       └── index.ts                 # Barrel export
├── components/
│   └── seo/
│       ├── SEOMetadata.tsx          # Client-side SEO component
│       └── PageSEO.tsx              # Server-side SEO wrapper
└── app/
    ├── layout.tsx                   # Root layout with SEO
    ├── robots.ts                    # robots.txt configuration
    ├── sitemap.ts                   # Sitemap generation
    └── pricing/
        └── page.tsx                 # Example page with custom SEO

public/
└── images/
    └── og/
        ├── README.md                # OG image documentation
        ├── default-og-image.jpg     # ⚠️ TODO: Create this (1200x630px)
        └── twitter-card.jpg         # ⚠️ TODO: Create this (1200x675px)
```

## ⚙️ Configuration

### 1. Environment Variables

Add to your `.env` or `.env.local`:

```bash
# Base URL for your application
NEXT_PUBLIC_BASE_URL=https://vetify.com  # Production URL
# NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Development
```

### 2. Update Site Configuration

Edit `src/lib/seo/config.ts`:

```typescript
// Update Spanish variant if targeting Spain instead of Mexico
export const SPANISH_VARIANT: 'es-ES' | 'es-MX' = 'es-MX';

// Update site metadata
export const SITE_METADATA: SiteMetadata = {
  siteName: {
    es: 'Vetify - Software de Gestión Veterinaria',
    en: 'Vetify - Veterinary Management Software',
  },
  // ... update other fields as needed
  twitterHandle: '@vetify', // Update with actual handle
};

// Update default OG image path
defaultOGImage: '/images/og/default-og-image.jpg',
```

### 3. Update Contact Information

Edit `src/lib/seo/structured-data.ts`:

```typescript
// In generateOrganizationSchema function
contactPoint: [
  {
    '@type': 'ContactPoint',
    contactType: 'Atención al Cliente',
    email: 'contacto@vetify.com', // ⚠️ Update with actual email
    availableLanguage: ['Spanish', 'English'],
  },
],

// Update business address if needed
address: {
  '@type': 'PostalAddress',
  addressCountry: 'MX', // ⚠️ Update based on your location
}
```

### 4. Update Social Links

Edit `src/app/layout.tsx`:

```typescript
const organizationSchema = generateOrganizationSchema('es', {
  socialLinks: [
    'https://www.facebook.com/vetify',      // ⚠️ Add actual links
    'https://twitter.com/vetify',
    'https://www.linkedin.com/company/vetify',
  ],
});
```

## 📝 Usage Examples

### Example 1: Basic Page with SEO

```typescript
// src/app/features/page.tsx
import type { Metadata } from 'next';
import { createPageSEO, generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  createPageSEO(
    'Funcionalidades - Vetify',
    'Descubre todas las herramientas para gestionar tu clínica veterinaria de forma eficiente.',
    {
      path: '/features',
      keywords: ['funcionalidades', 'herramientas veterinarias', 'gestión clínica'],
    }
  ),
  'es'
);

export default function FeaturesPage() {
  return <div>{/* Your content */}</div>;
}
```

### Example 2: Page with Custom OG Image

```typescript
// src/app/about/page.tsx
import type { Metadata } from 'next';
import { createPageSEO, generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(
  createPageSEO(
    'Sobre Nosotros - Vetify',
    'Conoce la historia detrás de Vetify y nuestro compromiso con las clínicas veterinarias.',
    {
      path: '/about',
      ogImage: '/images/og/about-og.jpg', // Custom OG image
    }
  ),
  'es'
);

export default function AboutPage() {
  return <div>{/* Your content */}</div>;
}
```

### Example 3: Blog Article with Structured Data

```typescript
// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import { generateMetadata, createArticleSEO } from '@/lib/seo';
import { generateArticleSchema, StructuredData } from '@/lib/seo/structured-data';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch article data
  const article = await fetchArticle(params.slug);

  return generateMetadata(
    createArticleSEO(
      article.title,
      article.description,
      {
        path: `/blog/${params.slug}`,
        ogImage: article.coverImage,
        publishedTime: article.publishedAt,
        author: article.author.name,
      }
    ),
    'es'
  );
}

export default async function BlogPostPage({ params }: Props) {
  const article = await fetchArticle(params.slug);

  // Generate article structured data
  const articleSchema = generateArticleSchema(
    article.title,
    article.description,
    `https://vetify.com/blog/${params.slug}`,
    article.publishedAt,
    {
      modifiedDate: article.updatedAt,
      image: article.coverImage,
      authorName: article.author.name,
    }
  );

  return (
    <>
      <StructuredData data={articleSchema} />
      <article>{/* Your article content */}</article>
    </>
  );
}
```

### Example 4: Client-Side Dynamic SEO

```typescript
'use client';

import { SEOMetadata } from '@/components/seo/SEOMetadata';
import { useEffect, useState } from 'react';

export default function DynamicPage() {
  const [seoConfig, setSeoConfig] = useState({
    title: 'Título inicial',
    description: 'Descripción inicial',
  });

  useEffect(() => {
    // Update SEO based on some dynamic data
    fetchData().then(data => {
      setSeoConfig({
        title: data.title,
        description: data.description,
      });
    });
  }, []);

  return (
    <>
      <SEOMetadata config={seoConfig} lang="es" />
      <div>{/* Your content */}</div>
    </>
  );
}
```

## 🧪 Testing & Validation

### 1. Local Testing

```bash
# Start development server
pnpm dev

# Test these URLs in your browser:
http://localhost:3000/                    # Home page
http://localhost:3000/pricing             # Example page with custom SEO
http://localhost:3000/robots.txt          # Robots.txt
http://localhost:3000/sitemap.xml         # Sitemap

# Inspect meta tags:
# 1. Right-click → Inspect
# 2. Go to <head> section
# 3. Verify meta tags are present
```

### 2. Meta Tag Validators

**Open Graph / Facebook Debugger**:
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your URL (must be publicly accessible)
3. Click "Debug"
4. Verify og:title, og:description, og:image appear correctly

**Twitter Card Validator**:
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL (must be publicly accessible)
3. Verify Twitter card preview

**LinkedIn Post Inspector**:
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Verify preview

### 3. Structured Data Testing

**Google Rich Results Test**:
1. Visit: https://search.google.com/test/rich-results
2. Enter your URL or paste HTML
3. Verify Organization and SoftwareApplication schemas are detected

**Schema.org Validator**:
1. Visit: https://validator.schema.org/
2. Paste your page's HTML or URL
3. Check for errors

### 4. SEO Analysis Tools

**Recommended Tools**:
- [Ahrefs Site Audit](https://ahrefs.com/site-audit) - Comprehensive SEO audit
- [Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/) - Crawl and analyze your site
- [Google PageSpeed Insights](https://pagespeed.web.dev/) - Performance + SEO
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome DevTools audit

### 5. Quick Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_BASE_URL` in production environment
- [ ] Create OG images (1200x630px minimum)
- [ ] Update contact email in structured data
- [ ] Update Twitter handle if available
- [ ] Add actual social media links
- [ ] Test all meta tags with validators
- [ ] Verify robots.txt is accessible
- [ ] Verify sitemap.xml is accessible and valid
- [ ] Test on mobile devices
- [ ] Submit sitemap to Google Search Console

## 🌐 Adding English Support

When you're ready to add English language support:

### Step 1: Update Language Configuration

```typescript
// src/lib/seo/config.ts
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es'; // Keep Spanish as default
```

### Step 2: Add English Content

```typescript
// src/lib/seo/config.ts
export const PAGE_METADATA = {
  home: {
    title: {
      es: 'Vetify - Software de Gestión para Clínicas Veterinarias',
      en: 'Vetify - Management Software for Veterinary Clinics', // ✅ Already prepared
    },
    // ... add English translations for all pages
  },
};
```

### Step 3: Create Language Middleware (Optional)

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromPath } from '@/lib/seo/language';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const lang = getLanguageFromPath(pathname);

  // Store language in headers for use in components
  const response = NextResponse.next();
  response.headers.set('x-language', lang);

  return response;
}
```

### Step 4: Create Language Switcher Component

```typescript
// src/components/LanguageSwitcher.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      <Link href={pathname} locale="es">
        Español
      </Link>
      <Link href={pathname} locale="en">
        English
      </Link>
    </div>
  );
}
```

### Step 5: Update Routing Structure

Create language-specific routes:
```
app/
├── [lang]/
│   ├── layout.tsx       # Language-aware layout
│   ├── page.tsx         # Home page
│   ├── pricing/
│   │   └── page.tsx
│   └── features/
│       └── page.tsx
```

## 🎨 Dynamic OG Images

For dynamically generated OG images:

### Option 1: Using Vercel OG Image Generation

```typescript
// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Vetify';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {title}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

Usage in metadata:
```typescript
export const metadata: Metadata = generateMetadata(
  createPageSEO(title, description, {
    ogImage: `/api/og?title=${encodeURIComponent(title)}`,
  }),
  'es'
);
```

### Option 2: Using External Services

- [Bannerbear](https://www.bannerbear.com/) - API-based image generation
- [Cloudinary](https://cloudinary.com/) - Image transformation and overlays
- [Imgix](https://imgix.com/) - Real-time image processing

## 🔧 Troubleshooting

### Issue: Meta tags not showing up

**Solution**:
1. Verify metadata is exported from page.tsx
2. Check browser DevTools → Elements → `<head>`
3. Ensure no JavaScript errors preventing rendering
4. Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Issue: OG image not displaying on social media

**Solution**:
1. Verify image URL is absolute (not relative)
2. Check image is publicly accessible (not behind auth)
3. Image must be under 8MB
4. Use Facebook Debugger to clear cache
5. Wait a few minutes after deploying changes

### Issue: Sitemap not showing all pages

**Solution**:
1. Add dynamic routes to sitemap.ts
2. Check if pages are being blocked by robots.txt
3. Verify base URL is correct in production
4. Submit sitemap to Google Search Console

### Issue: Different metadata on server vs client

**Solution**:
1. Use Next.js Metadata API (server-side) when possible
2. Avoid mixing server and client-side SEO components
3. Check for hydration mismatches in console

### Issue: 404 on robots.txt or sitemap.xml

**Solution**:
1. Verify files are in `src/app/` directory
2. Rebuild application: `pnpm build`
3. Check Vercel/deployment logs for build errors
4. Ensure files export default functions correctly

## 📚 Additional Resources

- [Next.js Metadata API Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org SoftwareApplication](https://schema.org/SoftwareApplication)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Central](https://developers.google.com/search/docs)

## 🎯 Next Steps

1. **Create OG Images**: Design and add images to `/public/images/og/`
2. **Update Configuration**: Add actual contact details and social links
3. **Test Everything**: Use all validators before going live
4. **Submit to Search Engines**:
   - [Google Search Console](https://search.google.com/search-console)
   - [Bing Webmaster Tools](https://www.bing.com/webmasters)
5. **Monitor Performance**: Set up analytics and track organic search traffic
6. **Add Blog/Content**: Create SEO-optimized content to drive traffic
7. **Build Backlinks**: Reach out for partnerships and mentions

## 🤝 Support

If you need help with SEO implementation:
1. Check this documentation first
2. Review Next.js documentation
3. Test with validators to identify specific issues
4. Check browser console for errors

---

**Last Updated**: 2025-01-09
**Version**: 1.0.0
**Language Support**: Spanish (primary), English (prepared)
