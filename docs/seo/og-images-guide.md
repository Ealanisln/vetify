# Open Graph Images Guide

Complete guide to using and customizing OG (Open Graph) images in Vetify.

## Table of Contents

1. [Overview](#overview)
2. [Dynamic OG Image API](#dynamic-og-image-api)
3. [Usage Examples](#usage-examples)
4. [Customization](#customization)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Overview

Open Graph images appear when your links are shared on social media platforms. Vetify uses `@vercel/og` to generate dynamic, branded OG images on-demand.

### Why Dynamic OG Images?

✅ **No Manual Creation**: Images generated automatically
✅ **Consistent Branding**: Vetify brand on all shares
✅ **Instant Updates**: Content changes reflect immediately
✅ **Zero Storage**: No image files to manage
✅ **Scalability**: Unlimited clinic-specific images
✅ **Fast Generation**: Edge runtime, sub-100ms globally

### Specifications

- **Dimensions**: 1200 x 630px (optimal for all platforms)
- **Format**: PNG
- **Generated**: On-demand via Edge Function
- **Cached**: Automatically by Vercel CDN
- **Platforms**: Facebook, Twitter, LinkedIn, WhatsApp, Telegram, etc.

## Dynamic OG Image API

Vetify's OG image generator is available at `/api/og` with query parameters for customization.

### Endpoint

```
GET /api/og
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | string | Preset page type | `pricing`, `features`, `contact` |
| `clinic` | string | Clinic name for custom image | `Clínica San Miguel` |
| `title` | string | Custom title override | `Custom Title` |
| `description` | string | Custom description override | `Custom Description` |

### Preset Pages

The API includes optimized presets for common pages:

| Page Value | Title | Description | Accent Color |
|------------|-------|-------------|--------------|
| `home` | Vetify | Software para clínicas veterinarias | Teal (#75a99c) |
| `pricing` | Planes y Precios | Encuentra el plan perfecto | Green (#10b981) |
| `features` | Funcionalidades | Todo lo que necesitas | Blue (#3b82f6) |
| `contact` | Contáctanos | Estamos aquí para ayudarte | Purple (#8b5cf6) |

## Usage Examples

### Example 1: Pricing Page

```typescript
// In your metadata
images: [
  {
    url: `${baseUrl}/api/og?page=pricing`,
    width: 1200,
    height: 630,
    alt: 'Vetify - Planes y Precios',
  },
]
```

**Generates**: Branded image with green accent, "Planes y Precios" title

### Example 2: Clinic Page

```typescript
// For a specific clinic
images: [
  {
    url: `${baseUrl}/api/og?clinic=${encodeURIComponent(clinic.name)}`,
    width: 1200,
    height: 630,
    alt: `${clinic.name}`,
  },
]
```

**Generates**: Branded image with clinic name and booking badge

### Example 3: Booking Page

```typescript
// Booking page for a clinic
images: [
  {
    url: `${baseUrl}/api/og?clinic=${encodeURIComponent(clinic.name)}&title=${encodeURIComponent('Agendar Cita')}`,
    width: 1200,
    height: 630,
    alt: `${clinic.name} - Agendar Cita`,
  },
]
```

**Generates**: Clinic-branded image with "Agendar Cita" title

### Example 4: Custom Content

```typescript
// Blog post or custom page
const ogImage = `${baseUrl}/api/og?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.excerpt)}`;

images: [
  {
    url: ogImage,
    width: 1200,
    height: 630,
    alt: post.title,
  },
]
```

**Generates**: Custom title and description with Vetify branding

### Example 5: Fallback Pattern

```typescript
// Use uploaded image if available, fallback to dynamic
const ogImage = content.customImage
  ? content.customImage
  : `${baseUrl}/api/og?title=${encodeURIComponent(content.title)}`;

images: [
  {
    url: ogImage,
    width: 1200,
    height: 630,
    alt: content.title,
  },
]
```

## Customization

### Modifying the OG Image Generator

The OG image generator is located at:
```
src/app/api/og/route.tsx
```

### Changing Colors

Edit the `accentColor` based on page type:

```typescript
// In src/app/api/og/route.tsx
switch (page) {
  case 'pricing':
    accentColor = '#10b981'; // Green
    break;
  case 'features':
    accentColor = '#3b82f6'; // Blue
    break;
  case 'contact':
    accentColor = '#8b5cf6'; // Purple
    break;
  default:
    accentColor = '#75a99c'; // Teal
}
```

### Changing Layout

Modify the ImageResponse JSX:

```typescript
return new ImageResponse(
  (
    <div style={{ /* Your custom styles */ }}>
      {/* Your custom layout */}
    </div>
  ),
  {
    width: 1200,
    height: 630,
  }
);
```

### Adding Logos

To include clinic logos in generated images:

```typescript
// Fetch logo from database
const clinic = await getTenantBySlug(clinicParam);

return new ImageResponse(
  (
    <div>
      {clinic.logo && (
        <img src={clinic.logo} alt="Logo" style={{ width: 100 }} />
      )}
      {/* Rest of image */}
    </div>
  )
);
```

### Using Custom Fonts

@vercel/og supports custom fonts:

```typescript
import { readFile } from 'fs/promises';

// Load font
const fontData = await readFile('./public/fonts/YourFont.ttf');

return new ImageResponse(
  (/* JSX */),
  {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'YourFont',
        data: fontData,
        style: 'normal',
      },
    ],
  }
);
```

## Best Practices

### ✅ DO

1. **Use Absolute URLs**
   ```typescript
   url: `https://vetify.com/api/og?page=pricing`
   ```

2. **URL Encode Parameters**
   ```typescript
   clinic=${encodeURIComponent(clinic.name)}
   ```

3. **Include Alt Text**
   ```typescript
   alt: 'Vetify - Planes y Precios'
   ```

4. **Keep Titles Short**
   - Maximum 60 characters
   - 1-2 lines on image

5. **Test on Multiple Platforms**
   - Facebook
   - Twitter
   - LinkedIn
   - WhatsApp

6. **Use High Contrast**
   - Dark text on light background
   - Or vice versa

7. **Include Branding**
   - Logo or brand name
   - Consistent colors

### ❌ DON'T

1. **Don't Use Relative URLs**
   ```typescript
   ❌ url: '/api/og?page=pricing'
   ✅ url: `${baseUrl}/api/og?page=pricing`
   ```

2. **Don't Exceed Safe Zone**
   - Keep important content in center 80%
   - Platforms may crop edges

3. **Don't Use Tiny Text**
   - Minimum 24px font size
   - Readable on mobile

4. **Don't Ignore URL Length**
   - Keep under 2000 characters
   - Use short parameter values

5. **Don't Create Static Files**
   - Use dynamic generation
   - Avoid /public/og-*.png approach

## Testing

### 1. OpenGraph.xyz

Test how your image appears:
```
https://www.opengraph.xyz/
```

Enter your page URL to see preview.

### 2. Facebook Sharing Debugger

Test Facebook sharing:
```
https://developers.facebook.com/tools/debug/
```

Clear cache if updating images.

### 3. Twitter Card Validator

Test Twitter cards:
```
https://cards-dev.twitter.com/validator
```

### 4. LinkedIn Post Inspector

Test LinkedIn sharing:
```
https://www.linkedin.com/post-inspector/
```

### 5. Direct Access

Test the API directly in browser:
```
http://localhost:3000/api/og?page=pricing
http://localhost:3000/api/og?clinic=Test Clinic
```

## Troubleshooting

### Image Not Showing

**Problem**: OG image doesn't appear when sharing.

**Solutions**:
1. Check URL is absolute
2. Verify image is 1200x630px
3. Clear social platform cache
4. Wait 24-48 hours for cache expiration
5. Use platform debugging tools

### Image Shows Old Content

**Problem**: Updated content but old image still shows.

**Solutions**:
1. Clear social media cache:
   - Facebook: Use Sharing Debugger "Scrape Again"
   - Twitter: Tweet the URL, delete, tweet again
   - LinkedIn: Use Post Inspector
2. Add cache-busting parameter:
   ```typescript
   url: `${baseUrl}/api/og?page=pricing&v=${Date.now()}`
   ```

### Error 500 on OG Endpoint

**Problem**: `/api/og` returns 500 error.

**Solutions**:
1. Check Edge runtime compatibility
2. Verify @vercel/og is installed
3. Check console for errors
4. Ensure all parameters are URL-encoded

### Image Renders Incorrectly

**Problem**: Layout breaks or text is cut off.

**Solutions**:
1. Check responsive styles
2. Use flexbox for centering
3. Test with long clinic names
4. Verify width/height in ImageResponse

### Chinese/Japanese Characters Not Showing

**Problem**: Non-Latin characters don't render.

**Solution**:
Load a font that supports those characters:
```typescript
fonts: [
  {
    name: 'Noto Sans',
    data: await loadFont(),
    style: 'normal',
  },
]
```

## Advanced Topics

### Conditional OG Images

Use different strategies based on content:

```typescript
function getOGImage(content: Content, baseUrl: string): string {
  // Priority 1: Custom uploaded image
  if (content.customImage) {
    return content.customImage;
  }

  // Priority 2: Preset page type
  if (content.pageType) {
    return `${baseUrl}/api/og?page=${content.pageType}`;
  }

  // Priority 3: Dynamic with title
  return `${baseUrl}/api/og?title=${encodeURIComponent(content.title)}`;
}
```

### Caching Strategy

Vercel automatically caches OG images, but you can optimize:

```typescript
// Add cache headers in og/route.tsx
export async function GET(request: NextRequest) {
  const response = new ImageResponse(/* ... */);

  // Cache for 7 days
  response.headers.set('Cache-Control', 'public, max-age=604800, immutable');

  return response;
}
```

### A/B Testing OG Images

Test different designs:

```typescript
// Add version parameter
const variant = Math.random() < 0.5 ? 'a' : 'b';
const ogImage = `${baseUrl}/api/og?page=pricing&variant=${variant}`;

// Track in analytics
analytics.track('og_image_shown', { variant });
```

## Checklist

When setting up OG images for a new page:

- [ ] OG image URL is absolute
- [ ] Parameters are URL-encoded
- [ ] Image dimensions are 1200x630px
- [ ] Alt text is descriptive
- [ ] Tested with OpenGraph.xyz
- [ ] Tested on Facebook
- [ ] Tested on Twitter
- [ ] Works with long titles
- [ ] Works with special characters
- [ ] Falls back gracefully on error

## Resources

- [@vercel/og Documentation](https://vercel.com/docs/functions/edge-functions/og-image-generation)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/best-practices)

## Next Steps

- [Metadata Guide](./metadata-guide.md) - Add page metadata
- [Structured Data Guide](./structured-data-guide.md) - Add JSON-LD schemas
