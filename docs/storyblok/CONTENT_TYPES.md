# Storyblok Content Types Reference

This document provides a comprehensive reference for all Storyblok content types used in Vetify.

## Table of Contents

1. [Content Type Overview](#content-type-overview)
2. [Blog Content Types](#blog-content-types)
3. [Support Content Types](#support-content-types)
4. [Shared Block Components](#shared-block-components)
5. [Field Type Reference](#field-type-reference)
6. [Validation Patterns](#validation-patterns)

## Content Type Overview

### Content Types vs Block Components

| Type | Purpose | Can be a Story | Nestable |
|------|---------|----------------|----------|
| **Content Type** | Main content (articles, pages) | Yes | No |
| **Block Component** | Reusable content pieces | No | Yes |

### All Content Types

| Name | Technical Name | Folder | Purpose |
|------|----------------|--------|---------|
| Blog Post | `blog_post` | `blog/` | Blog articles |
| Blog Category | `blog_category` | `categorias/` | Blog categorization |
| Blog Author | `blog_author` | `autores/` | Author profiles |
| Support Article | `support_article` | `soporte/` | Help center articles |
| Support Category | `support_category` | `soporte-categorias/` | Support categorization |

### All Block Components

| Name | Technical Name | Used In |
|------|----------------|---------|
| FAQ Block | `faq_block` | Blog posts, Support articles |
| HowTo Step | `how_to_step` | Blog posts |
| Callout Box | `callout_box` | Any rich text |
| Image Block | `image_block` | Any rich text |
| Video Embed | `video_embed` | Blog posts, Support articles |
| Social Link | `social_link` | Author profiles |
| Screenshot Block | `screenshot_block` | Support articles |

## Blog Content Types

### Blog Post (`blog_post`)

The main content type for blog articles.

```yaml
Component: blog_post
Type: Content Type Block
Folder: blog/
```

#### Fields

##### Core Content

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | Text | Yes | - | Article headline |
| `slug` | Text | Yes | - | URL identifier |
| `excerpt` | Textarea | Yes | - | Brief summary for listings |
| `content` | Richtext | Yes | - | Main article body |
| `featured_image` | Asset | Yes | - | Hero/thumbnail image |

##### Categorization

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `category` | Text | Yes | - | Category slug reference |
| `tags` | Text (Multi) | No | `[]` | Array of tag strings |
| `author` | Text | Yes | - | Author slug reference |

##### Publication

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `published_at` | Datetime | No | Story publish date | Override publish date |
| `reading_time_minutes` | Number | No | Auto-calculated | Manual reading time |

##### SEO

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `meta_title` | Text | No | `title` | SEO title (max 60 chars) |
| `meta_description` | Textarea | No | `excerpt` | SEO description (max 160 chars) |
| `keywords` | Text (Multi) | No | `[]` | SEO keywords |
| `canonical_url` | Text | No | - | Canonical URL if different |
| `no_index` | Boolean | No | `false` | Exclude from search engines |

##### Rich Snippets

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `faq_items` | Blocks | No | `[]` | FAQ schema blocks |
| `how_to_steps` | Blocks | No | `[]` | HowTo schema blocks |

##### Display Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `show_toc` | Boolean | No | `true` | Show table of contents |
| `related_posts` | Multi-link | No | `[]` | Manually curated related articles |

#### Example Content

```json
{
  "title": "Guía completa de vacunación para perros",
  "slug": "guia-vacunacion-perros",
  "excerpt": "Todo lo que necesitas saber sobre el calendario de vacunas para tu perro, desde cachorro hasta adulto.",
  "category": "salud-mascotas",
  "tags": ["perros", "vacunas", "salud", "cachorros"],
  "author": "dra-maria-garcia",
  "show_toc": true,
  "faq_items": [
    {
      "question": "¿A qué edad debe recibir mi cachorro su primera vacuna?",
      "answer": "Los cachorros deben recibir su primera vacuna entre las 6 y 8 semanas de edad..."
    }
  ]
}
```

---

### Blog Category (`blog_category`)

Categories for organizing blog posts.

```yaml
Component: blog_category
Type: Content Type Block
Folder: categorias/
```

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | Text | Yes | - | Display name |
| `slug` | Text | Yes | - | URL identifier |
| `description` | Textarea | No | - | Category description |
| `featured_image` | Asset | No | - | Category image |
| `meta_title` | Text | No | `name` | SEO title |
| `meta_description` | Textarea | No | `description` | SEO description |
| `color` | Text | No | - | Hex color code |
| `icon` | Text | No | - | Icon identifier |

#### Example Content

```json
{
  "name": "Salud de Mascotas",
  "slug": "salud-mascotas",
  "description": "Artículos sobre salud, prevención y bienestar de tus mascotas.",
  "color": "#75a99c",
  "icon": "heart"
}
```

---

### Blog Author (`blog_author`)

Author profiles for blog articles.

```yaml
Component: blog_author
Type: Content Type Block
Folder: autores/
```

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | Text | Yes | - | Full name |
| `slug` | Text | Yes | - | URL identifier |
| `bio` | Richtext | No | - | Author biography |
| `avatar` | Asset | No | - | Profile photo |
| `role` | Text | No | - | Job title/role |
| `social_links` | Blocks | No | `[]` | Social media links |
| `meta_description` | Textarea | No | - | SEO description |

#### Example Content

```json
{
  "name": "Dra. María García",
  "slug": "dra-maria-garcia",
  "role": "Veterinaria Especialista en Pequeñas Especies",
  "bio": "Dra. María García cuenta con más de 15 años de experiencia...",
  "social_links": [
    { "platform": "linkedin", "url": "https://linkedin.com/in/dra-maria-garcia" }
  ]
}
```

---

## Support Content Types

### Support Article (`support_article`)

Help center articles and guides.

```yaml
Component: support_article
Type: Content Type Block
Folder: soporte/
```

#### Fields

##### Core Content

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | Text | Yes | - | Article title |
| `slug` | Text | Yes | - | URL identifier |
| `excerpt` | Textarea | Yes | - | Brief description |
| `content` | Richtext | Yes | - | Main content |

##### Categorization

| Field | Type | Required | Default | Options |
|-------|------|----------|---------|---------|
| `category` | Single Option | Yes | - | `getting-started`, `guides`, `faq`, `troubleshooting` |
| `tags` | Text (Multi) | No | `[]` | Filter tags |
| `difficulty` | Single Option | No | - | `beginner`, `intermediate`, `advanced` |

##### Media

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `featured_image` | Asset | No | - | Hero image |
| `video_url` | Text | No | - | Tutorial video URL |
| `screenshots` | Blocks | No | `[]` | Step screenshots |

##### Navigation

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `related_articles` | Multi-link | No | `[]` | Related help articles |
| `order` | Number | No | `0` | Display order |
| `estimated_time` | Text | No | - | e.g., "5 min" |

##### SEO & Display

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `meta_title` | Text | No | `title` | SEO title |
| `meta_description` | Textarea | No | `excerpt` | SEO description |
| `show_feedback` | Boolean | No | `true` | Show feedback widget |
| `faq_items` | Blocks | No | `[]` | FAQ rich snippets |

#### Example Content

```json
{
  "title": "Cómo crear tu primera cita",
  "slug": "crear-primera-cita",
  "excerpt": "Aprende a programar citas para tus pacientes en Vetify.",
  "category": "getting-started",
  "difficulty": "beginner",
  "estimated_time": "3 min",
  "show_feedback": true
}
```

---

### Support Category (`support_category`)

Categories for organizing support content.

```yaml
Component: support_category
Type: Content Type Block
Folder: soporte-categorias/
```

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | Text | Yes | - | Category name |
| `slug` | Text | Yes | - | URL identifier |
| `description` | Textarea | Yes | - | Category description |
| `icon` | Text | Yes | - | Icon identifier |
| `color` | Text | No | - | Brand color |
| `featured_articles` | Multi-link | No | `[]` | Pinned articles |
| `order` | Number | No | `0` | Display order |

---

## Shared Block Components

### FAQ Block (`faq_block`)

For FAQ schema rich snippets.

```yaml
Component: faq_block
Type: Block (Nestable)
Used In: blog_post, support_article
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | Text | Yes | The question |
| `answer` | Richtext | Yes | The answer |

#### Schema Output

Generates [FAQPage](https://schema.org/FAQPage) structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text here",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text here"
      }
    }
  ]
}
```

---

### HowTo Step (`how_to_step`)

For HowTo schema rich snippets.

```yaml
Component: how_to_step
Type: Block (Nestable)
Used In: blog_post
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step_number` | Number | Yes | Step order (1, 2, 3...) |
| `title` | Text | Yes | Step title |
| `description` | Richtext | Yes | Step instructions |
| `image` | Asset | No | Step illustration |

#### Schema Output

Generates [HowTo](https://schema.org/HowTo) structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Article title",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Step title",
      "text": "Step description",
      "image": "https://..."
    }
  ]
}
```

---

### Callout Box (`callout_box`)

Highlighted content sections.

```yaml
Component: callout_box
Type: Block (Nestable)
Used In: Any richtext field
```

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `type` | Single Option | Yes | `info`, `warning`, `tip`, `important` | Visual style |
| `title` | Text | No | - | Optional heading |
| `content` | Richtext | Yes | - | Box content |

#### Visual Styles

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `info` | Blue | Info circle | General information |
| `warning` | Yellow/Orange | Warning triangle | Cautions |
| `tip` | Green | Lightbulb | Helpful tips |
| `important` | Red | Exclamation | Critical information |

---

### Image Block (`image_block`)

Images with captions and alignment.

```yaml
Component: image_block
Type: Block (Nestable)
Used In: Any richtext field
```

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `image` | Asset | Yes | - | The image |
| `caption` | Text | No | - | Image caption |
| `alignment` | Single Option | Yes | `left`, `center`, `right`, `full` | Image alignment |

---

### Video Embed (`video_embed`)

Embedded videos from external platforms.

```yaml
Component: video_embed
Type: Block (Nestable)
Used In: blog_post, support_article
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `video_url` | Text | Yes | YouTube, Vimeo, or other embed URL |
| `title` | Text | No | Video title for accessibility |
| `thumbnail` | Asset | No | Custom thumbnail image |

#### Supported Platforms

- YouTube: `https://www.youtube.com/watch?v=...`
- Vimeo: `https://vimeo.com/...`
- Loom: `https://www.loom.com/share/...`

---

### Social Link (`social_link`)

Author social media profiles.

```yaml
Component: social_link
Type: Block (Nestable)
Used In: blog_author
```

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `platform` | Single Option | Yes | `twitter`, `linkedin`, `instagram`, `facebook`, `website` | Platform |
| `url` | Text | Yes | - | Profile URL |

---

### Screenshot Block (`screenshot_block`)

Step-by-step screenshots for tutorials.

```yaml
Component: screenshot_block
Type: Block (Nestable)
Used In: support_article
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | Asset | Yes | Screenshot image |
| `caption` | Text | No | Description text |
| `step_number` | Number | No | Step number if sequential |
| `highlight_area` | Text | No | CSS coordinates for highlight |

---

## Field Type Reference

### Text Fields

| Storyblok Type | TypeScript Type | Validation |
|----------------|-----------------|------------|
| Text | `string` | Max length, regex |
| Textarea | `string` | Max length |
| Richtext | `ISbRichtext` | - |

### Selection Fields

| Storyblok Type | TypeScript Type | Configuration |
|----------------|-----------------|---------------|
| Single Option | `string` (union type) | Define options |
| Multi Options | `string[]` | Define options |

### Asset Fields

| Storyblok Type | TypeScript Type | Configuration |
|----------------|-----------------|---------------|
| Asset | `StoryblokAsset` | File types, dimensions |
| Multi Assets | `StoryblokAsset[]` | Max files |

### Link Fields

| Storyblok Type | TypeScript Type | Configuration |
|----------------|-----------------|---------------|
| Link | `StoryblokLink` | Internal/external |
| Multi-link | `StoryblokLink[]` | Max links |

### Other Fields

| Storyblok Type | TypeScript Type | Configuration |
|----------------|-----------------|---------------|
| Number | `number` | Min, max, step |
| Boolean | `boolean` | Default value |
| Datetime | `string` (ISO 8601) | - |
| Blocks | `Array<Component>` | Allowed components |

---

## Validation Patterns

### Slug Pattern

```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

- Lowercase letters and numbers
- Hyphens to separate words
- No leading/trailing hyphens

**Valid**: `my-article-slug`, `post-123`, `hello`
**Invalid**: `My-Article`, `post_slug`, `-invalid-`

### URL Pattern

```regex
^https?:\/\/.+
```

Must start with `http://` or `https://`

### Color Pattern

```regex
^#[0-9A-Fa-f]{6}$
```

6-digit hex color code with hash prefix

**Valid**: `#75a99c`, `#FFFFFF`, `#000000`
**Invalid**: `75a99c`, `#fff`, `rgb(0,0,0)`

### Character Limits

| Field Type | Recommended Limit | Reason |
|------------|-------------------|--------|
| Title | 60-70 chars | SEO title length |
| Meta Description | 155-160 chars | Search result snippet |
| Excerpt | 150-200 chars | Card previews |
| Slug | 50 chars | URL readability |

---

**Related Documentation**:
- [Storyblok Overview](./README.md)
- [Blog Setup Guide](./BLOG_SETUP.md)
- [Support Page Setup](./SUPPORT_PAGE_SETUP.md)
