# Open Graph Images Directory

This directory contains images used for social media sharing (Open Graph and Twitter Cards).

## Required Images

### Default OG Image
- **Filename**: `default-og-image.jpg`
- **Dimensions**: 1200x630px
- **Format**: JPG or PNG
- **Purpose**: Default image shown when sharing links on social media
- **Content**: Should include:
  - Vetify logo
  - Tagline: "Software de Gestión Veterinaria"
  - Professional veterinary-related imagery
  - Brand colors (#75a99c)

### Twitter Card Image
- **Filename**: `twitter-card.jpg` (optional, can use default-og-image.jpg)
- **Dimensions**: 1200x675px
- **Format**: JPG or PNG
- **Purpose**: Optimized for Twitter card display

## Page-Specific OG Images

You can create custom OG images for specific pages:

- `pricing-og.jpg` - For pricing page
- `features-og.jpg` - For features page
- `blog-og.jpg` - Default for blog posts
- `dashboard-og.jpg` - For dashboard/app previews

### Best Practices

1. **File Size**: Keep images under 8MB (ideally under 1MB)
2. **Safe Zone**: Important text/imagery should be within 1200x600px center area
3. **Text Size**: Minimum 60px font size for readability
4. **Contrast**: Ensure text is readable against background
5. **Mobile Preview**: Test how image appears on mobile devices
6. **Compression**: Use tools like TinyPNG or ImageOptim to optimize file size

## Design Tools

Recommended tools for creating OG images:

- **Figma** - Professional design tool (free tier available)
- **Canva** - Easy-to-use templates (https://www.canva.com)
- **OG Image Generator** - Automated generation tools
  - https://og-image.vercel.app/
  - https://www.bannerbear.com/

## Usage in Code

### Default Image (set in config)
```typescript
// src/lib/seo/config.ts
defaultOGImage: '/images/og/default-og-image.jpg'
```

### Custom Image per Page
```typescript
// In your page.tsx
export const metadata: Metadata = generateMetadata(
  createPageSEO(title, description, {
    ogImage: '/images/og/pricing-og.jpg',
  }),
  'es'
);
```

## Testing Your Images

After adding images, test them using these validators:

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Current Status

⚠️ **Action Required**:
- [ ] Create default-og-image.jpg (1200x630px)
- [ ] Create twitter-card.jpg (1200x675px) or use default
- [ ] Design page-specific OG images (optional)
- [ ] Test images with social media validators
- [ ] Optimize images for web (compress)

## Example Image Content

### Default OG Image Layout Suggestion:
```
┌────────────────────────────────────────┐
│                                        │
│           [Vetify Logo]                │
│                                        │
│    Software de Gestión Veterinaria    │
│                                        │
│    [Veterinarian with pet imagery]    │
│                                        │
│  Gestiona tu clínica de forma simple  │
│        y profesional                   │
│                                        │
└────────────────────────────────────────┘
```

## Logo Location

Make sure your logo is available at:
- `/public/images/logo.png` - For structured data
- `/public/images/logo.svg` - For high-quality displays
