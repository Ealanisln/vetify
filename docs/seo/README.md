# SEO Implementation Guide

Complete guide to the SEO infrastructure in the Vetify application.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Documentation](#documentation)
5. [Testing](#testing)
6. [Resources](#resources)

## Overview

Vetify implements a comprehensive SEO strategy using Next.js 15's built-in SEO features, structured data (JSON-LD), dynamic OG image generation, and an automatically updated sitemap.

### Key Features

✅ **Dynamic Metadata**: Per-page SEO with generateMetadata()
✅ **Structured Data**: Schema.org compliant JSON-LD
✅ **Dynamic OG Images**: Auto-generated with @vercel/og
✅ **Dynamic Sitemap**: Auto-updated with clinic pages
✅ **Multi-language Ready**: Spanish (ES) with English (EN) prepared
✅ **Type-Safe**: Full TypeScript implementation

## Quick Start

### Adding SEO to a New Page

```typescript
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';

// 1. Generate metadata
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';

  const seoConfig = createPageSEO(
    'Page Title - Vetify',
    'Page description for search engines',
    {
      path: '/your-page',
      keywords: ['keyword1', 'keyword2', 'keyword3'],
      lang: 'es',
      images: [
        {
          url: `${baseUrl}/api/og?page=your-page`,
          width: 1200,
          height: 630,
          alt: 'Your Page Title',
        },
      ],
    }
  );

  return generateSEOMetadata(seoConfig, 'es');
}

// 2. Add structured data to page
export default function YourPage() {
  const breadcrumbSchema = createBreadcrumbsFromPath(
    '/your-page',
    'Your Page Title',
    'es'
  );

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      {/* Your page content */}
    </>
  );
}
```

## Architecture

### Core Components

```
src/
├── lib/seo/                      # SEO utilities
│   ├── config.ts                 # Base configuration
│   ├── types.ts                  # TypeScript types
│   ├── language.ts               # Language utilities
│   ├── metadata.ts               # Metadata generation
│   ├── structured-data.ts        # JSON-LD schemas
│   ├── breadcrumbs.ts            # Breadcrumb schemas
│   └── faq-schema.ts             # FAQ schemas
├── components/seo/
│   └── StructuredData.tsx        # JSON-LD renderer
├── app/
│   ├── sitemap.ts                # Dynamic sitemap
│   ├── robots.ts                 # Robots.txt
│   └── api/og/route.tsx          # OG image generator
└── docs/seo/                     # This documentation
```

### Structured Data Schemas

We implement the following Schema.org types:

- **Organization**: Company/brand information
- **SoftwareApplication**: Vetify product
- **LocalBusiness/VeterinaryCare**: Individual clinics
- **Service**: Veterinary services offered
- **Product**: Pricing plans with offers
- **BreadcrumbList**: Navigation hierarchy
- **FAQPage**: Frequently asked questions
- **WebPage**: Generic page metadata
- **Article**: Blog posts (when implemented)

## Documentation

### Detailed Guides

- **[Metadata Guide](./metadata-guide.md)**: How to add and configure metadata
- **[Structured Data Guide](./structured-data-guide.md)**: Working with JSON-LD schemas
- **[OG Images Guide](./og-images-guide.md)**: Using and customizing OG images

## Testing

### Manual Testing

1. **Metadata**: View page source and check `<head>` tags
2. **Structured Data**: Use [Google Rich Results Test](https://search.google.com/test/rich-results)
3. **OG Images**: Use [OpenGraph.xyz](https://www.opengraph.xyz/)
4. **Sitemap**: Visit `/sitemap.xml` in browser

### Automated Testing

```bash
# TypeScript compilation
pnpm tsc --noEmit

# Lint checks
pnpm lint

# Test sitemap generation
curl http://localhost:3000/sitemap.xml

# Test OG image
curl http://localhost:3000/api/og?page=pricing
```

### Tools

- **[Google Search Console](https://search.google.com/search-console)**: Monitor search performance
- **[Bing Webmaster Tools](https://www.bing.com/webmasters)**: Bing indexing
- **[Schema Markup Validator](https://validator.schema.org/)**: Validate JSON-LD
- **[PageSpeed Insights](https://pagespeed.web.dev/)**: Performance + SEO score

## Resources

### External Documentation

- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Google Search Central](https://developers.google.com/search)

### Internal Resources

- Vetify SEO configuration: `src/lib/seo/config.ts`
- Supported languages: `src/lib/seo/language.ts`
- Common FAQs: `src/lib/seo/faq-schema.ts`

## Contributing

When adding new pages or features:

1. ✅ Add metadata with `generateMetadata()`
2. ✅ Include appropriate structured data schemas
3. ✅ Update sitemap if adding dynamic routes
4. ✅ Test with validation tools
5. ✅ Document any new patterns in this guide

## Questions?

For questions or issues with SEO implementation, refer to:
- This documentation in `docs/seo/`
- Code comments in `src/lib/seo/`
- Next.js SEO documentation
