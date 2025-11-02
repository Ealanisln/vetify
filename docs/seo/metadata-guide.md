# Metadata Implementation Guide

Complete guide to implementing SEO metadata in Vetify pages using Next.js 15.

## Table of Contents

1. [Overview](#overview)
2. [Basic Implementation](#basic-implementation)
3. [Dynamic Metadata](#dynamic-metadata)
4. [Open Graph Images](#open-graph-images)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Overview

Vetify uses Next.js 15's `generateMetadata()` function to create SEO-optimized metadata for all pages. This approach provides:

- Server-side metadata generation
- Type-safe implementation
- Automatic Open Graph and Twitter card tags
- Canonical URL handling
- Dynamic content support

## Basic Implementation

### Static Page Metadata

For static pages (pricing, features, contact), use this pattern:

```typescript
// src/app/your-page/page.tsx
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';

  const seoConfig = createPageSEO(
    'Your Page Title - Vetify',
    'Your page description that appears in search results',
    {
      path: '/your-page',
      keywords: [
        'primary keyword',
        'secondary keyword',
        'related term',
      ],
      lang,
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

  return generateSEOMetadata(seoConfig, lang);
}
```

### What Gets Generated

The above code automatically generates:

```html
<!-- Title tag -->
<title>Your Page Title - Vetify</title>

<!-- Description -->
<meta name="description" content="Your page description..." />

<!-- Open Graph -->
<meta property="og:title" content="Your Page Title - Vetify" />
<meta property="og:description" content="Your page description..." />
<meta property="og:url" content="https://vetify.com/your-page" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://vetify.com/api/og?page=your-page" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your Page Title - Vetify" />
<meta name="twitter:description" content="Your page description..." />
<meta name="twitter:image" content="https://vetify.com/api/og?page=your-page" />

<!-- Canonical URL -->
<link rel="canonical" href="https://vetify.com/your-page" />

<!-- Robots -->
<meta name="robots" content="index, follow" />
```

## Dynamic Metadata

### Pages with Database Content

For dynamic pages (clinic pages, blog posts), fetch data first:

```typescript
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Fetch data from database
  const data = await prisma.yourModel.findUnique({
    where: { slug },
  });

  if (!data) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';
  const pageUrl = `${baseUrl}/${slug}`;

  return {
    title: `${data.title} - Vetify`,
    description: data.description || 'Default description',
    openGraph: {
      title: data.title,
      description: data.description,
      url: pageUrl,
      type: 'website',
      images: data.image ? [
        {
          url: data.image,
          width: 1200,
          height: 630,
          alt: data.title,
        }
      ] : [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(data.title)}`,
          width: 1200,
          height: 630,
          alt: data.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: data.image ? [data.image] : undefined,
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
```

## Open Graph Images

### Static Page Images

Use the dynamic OG image generator:

```typescript
images: [
  {
    url: `${baseUrl}/api/og?page=pricing`,
    width: 1200,
    height: 630,
    alt: 'Vetify - Planes y Precios',
  },
]
```

### Custom Images

For specific content:

```typescript
images: [
  {
    url: `${baseUrl}/api/og?title=${encodeURIComponent(customTitle)}&description=${encodeURIComponent(customDesc)}`,
    width: 1200,
    height: 630,
    alt: customTitle,
  },
]
```

### Uploaded Images

When content has uploaded images:

```typescript
images: content.image ? [
  {
    url: content.image,
    width: 1200,
    height: 630,
    alt: content.title,
  }
] : [
  {
    url: `${baseUrl}/api/og?title=${encodeURIComponent(content.title)}`,
    width: 1200,
    height: 630,
    alt: content.title,
  }
]
```

## Best Practices

### Title Tags

✅ **DO**:
- Keep titles under 60 characters
- Include primary keyword near the beginning
- Add "- Vetify" brand suffix
- Make each title unique

❌ **DON'T**:
- Keyword stuff (repeat same keyword)
- Use all caps
- Exceed 70 characters
- Duplicate titles across pages

**Examples**:
```
✅ Planes y Precios - Vetify
✅ Gestión Veterinaria - Vetify
❌ PLANES PRECIOS SOFTWARE VETERINARIO CLINICA - Vetify
❌ Veterinary software for veterinary clinics and veterinary practices
```

### Meta Descriptions

✅ **DO**:
- Keep between 150-160 characters
- Include primary keyword naturally
- Write compelling copy that encourages clicks
- End with a call to action

❌ **DON'T**:
- Exceed 160 characters (gets truncated)
- Duplicate descriptions
- Use only keywords (write for humans)
- Leave empty (Google will generate one)

**Examples**:
```
✅ "Encuentra el plan perfecto para tu clínica veterinaria. Desde $599/mes con prueba gratuita de 30 días. Comienza hoy."

❌ "veterinaria software precios planes costo sistema gestión clínica"

❌ "This is a page about pricing and plans for our veterinary software application that helps clinics manage their operations efficiently."
```

### Keywords

✅ **DO**:
- Include 5-8 relevant keywords
- Mix broad and specific terms
- Include location-based keywords (for clinics)
- Use variations and synonyms

❌ **DON'T**:
- Exceed 10 keywords
- Repeat the same keyword
- Use irrelevant keywords
- Ignore search intent

**Examples**:
```
✅ ['software veterinario', 'gestión clínica veterinaria', 'agenda veterinaria online']
❌ ['software', 'software', 'software veterinario', 'software de veterinaria']
```

### Canonical URLs

Always include canonical URLs to prevent duplicate content issues:

```typescript
alternates: {
  canonical: pageUrl,
}
```

### Robots Directives

**Public Pages** (should be indexed):
```typescript
robots: {
  index: true,
  follow: true,
}
```

**Private/Internal Pages** (should not be indexed):
```typescript
robots: {
  index: false,
  follow: false,
  noarchive: true,
}
```

## Examples

### Example 1: Simple Static Page

```typescript
// src/app/about/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';

  return {
    title: 'Sobre Nosotros - Vetify',
    description: 'Conoce más sobre Vetify, el software de gestión para clínicas veterinarias que está transformando la industria.',
    openGraph: {
      title: 'Sobre Nosotros - Vetify',
      description: 'Conoce más sobre Vetify y nuestro equipo.',
      url: `${baseUrl}/about`,
      type: 'website',
      images: [{
        url: `${baseUrl}/api/og?page=about`,
        width: 1200,
        height: 630,
      }],
    },
    alternates: {
      canonical: `${baseUrl}/about`,
    },
  };
}
```

### Example 2: Dynamic Clinic Page

```typescript
// src/app/[clinicSlug]/page.tsx
export async function generateMetadata({
  params
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const clinic = await getTenantBySlug(clinicSlug);

  if (!clinic || !clinic.publicPageEnabled) {
    return { title: 'Clínica no encontrada' };
  }

  const baseUrl = getBaseUrl();
  const clinicUrl = `${baseUrl}/${clinic.slug}`;

  return {
    title: `${clinic.name} - Clínica Veterinaria`,
    description: clinic.publicDescription ||
      `${clinic.name} - Atención veterinaria profesional.`,
    openGraph: {
      title: clinic.name,
      description: clinic.publicDescription,
      url: clinicUrl,
      images: [{
        url: clinic.logo || `${baseUrl}/api/og?clinic=${encodeURIComponent(clinic.name)}`,
        width: 1200,
        height: 630,
      }],
    },
  };
}
```

### Example 3: Using Helper Functions

```typescript
// Leverage existing SEO utilities
import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { PAGE_METADATA } from '@/lib/seo/config';

export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const pageMetadata = PAGE_METADATA.features;

  const seoConfig = createPageSEO(
    pageMetadata.title[lang],
    pageMetadata.description[lang],
    {
      path: '/funcionalidades',
      keywords: [
        'funcionalidades veterinaria',
        'características software veterinario',
      ],
      lang,
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}
```

## Checklist

When adding metadata to a new page, ensure:

- [ ] Title is unique and under 60 characters
- [ ] Description is compelling and under 160 characters
- [ ] Keywords are relevant and not stuffed
- [ ] Open Graph tags are included
- [ ] Twitter Card tags are included
- [ ] Canonical URL is set
- [ ] OG image is specified (static or dynamic)
- [ ] Robots directives are appropriate
- [ ] Type safety (all TypeScript types are correct)

## Testing Your Metadata

### View in Browser
```
View → Developer → View Source
```

Look for `<head>` section with all meta tags.

### Test Tools

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
4. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Troubleshooting

### Metadata Not Appearing

- **Check**: Is `generateMetadata()` exported?
- **Check**: Is it `async` function returning `Promise<Metadata>`?
- **Check**: Are you using correct Next.js 15 syntax?

### OG Images Not Showing

- **Check**: Is the image URL accessible?
- **Check**: Is the image 1200x630px?
- **Check**: Are you using absolute URLs?

### Duplicate Titles

- **Check**: Each page has unique `generateMetadata()`
- **Check**: Not using same title string across pages
- **Check**: Dynamic pages generate unique titles

## Next Steps

- [Structured Data Guide](./structured-data-guide.md) - Add JSON-LD schemas
- [OG Images Guide](./og-images-guide.md) - Customize OG images
