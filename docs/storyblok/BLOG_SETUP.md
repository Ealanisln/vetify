# Storyblok Blog Setup Guide

This guide walks you through setting up the blog feature in Storyblok for Vetify.

## Table of Contents

1. [Space Structure](#space-structure)
2. [Creating Content Types](#creating-content-types)
3. [Creating Block Components](#creating-block-components)
4. [Content Organization](#content-organization)
5. [SEO Configuration](#seo-configuration)
6. [Testing Your Setup](#testing-your-setup)

## Space Structure

Create the following folder structure in your Storyblok space:

```
Content/
├── blog/              # Blog posts (blog_post)
├── categorias/        # Categories (blog_category)
└── autores/           # Authors (blog_author)
```

### Creating Folders

1. Go to **Content** in your Storyblok dashboard
2. Click **Create new** > **Folder**
3. Create each folder with the exact names above (lowercase, Spanish)

## Creating Content Types

### Step 1: Blog Post (`blog_post`)

1. Go to **Block Library** (Components section)
2. Click **New Block**
3. Name it `blog_post` and set as **Content Type Block**
4. Add the following fields:

#### Core Fields

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `title` | Text | Required, Max 100 chars |
| `slug` | Text | Required, Regex: `^[a-z0-9-]+$` |
| `excerpt` | Textarea | Required, Max 200 chars |
| `content` | Richtext | Required, Enable all formatting options |
| `featured_image` | Asset | Required, Images only |

#### Categorization Fields

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `category` | Text | Required (matches category slug) |
| `tags` | Text | Allow multiple values |
| `author` | Text | Required (matches author slug) |

#### SEO Fields

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `meta_title` | Text | Max 60 chars |
| `meta_description` | Textarea | Max 160 chars |
| `keywords` | Text | Allow multiple values |
| `canonical_url` | Text | URL validation |
| `no_index` | Boolean | Default: false |

#### Rich Snippet Fields

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `faq_items` | Blocks | Allow only `faq_block` |
| `how_to_steps` | Blocks | Allow only `how_to_step` |

#### Display Options

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `published_at` | Datetime | Optional override |
| `reading_time_minutes` | Number | Min: 1, Max: 60 |
| `show_toc` | Boolean | Default: true |
| `related_posts` | Multi-link | Stories only, blog folder |

### Step 2: Blog Category (`blog_category`)

1. Create a new Content Type Block named `blog_category`
2. Add these fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `name` | Text | Required |
| `slug` | Text | Required, Regex: `^[a-z0-9-]+$` |
| `description` | Textarea | Max 200 chars |
| `featured_image` | Asset | Images only |
| `meta_title` | Text | Max 60 chars |
| `meta_description` | Textarea | Max 160 chars |
| `color` | Text | Hex color (e.g., #75a99c) |
| `icon` | Text | Icon name for UI |

### Step 3: Blog Author (`blog_author`)

1. Create a new Content Type Block named `blog_author`
2. Add these fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `name` | Text | Required |
| `slug` | Text | Required, Regex: `^[a-z0-9-]+$` |
| `bio` | Richtext | Optional |
| `avatar` | Asset | Images only |
| `role` | Text | e.g., "Veterinarian", "Content Writer" |
| `social_links` | Blocks | Allow only `social_link` |
| `meta_description` | Textarea | Max 160 chars |

## Creating Block Components

Block components (Bloks) are reusable content pieces that can be nested within other content types.

### FAQ Block (`faq_block`)

Used for FAQ rich snippets that appear in Google search results.

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `question` | Text | Required |
| `answer` | Richtext | Required |

### HowTo Step (`how_to_step`)

Used for HowTo schema markup for instructional content.

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `step_number` | Number | Required, Min: 1 |
| `title` | Text | Required |
| `description` | Richtext | Required |
| `image` | Asset | Optional, Images only |

### Callout Box (`callout_box`)

For highlighted content sections.

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `type` | Single Option | Options: info, warning, tip, important |
| `title` | Text | Optional |
| `content` | Richtext | Required |

### Image Block (`image_block`)

For images with captions and alignment control.

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `image` | Asset | Required, Images only |
| `caption` | Text | Optional |
| `alignment` | Single Option | Options: left, center, right, full |

### Video Embed (`video_embed`)

For embedded videos from YouTube, Vimeo, etc.

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `video_url` | Text | Required, URL validation |
| `title` | Text | Optional |
| `thumbnail` | Asset | Optional, Images only |

### Social Link (`social_link`)

For author social media profiles.

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| `platform` | Single Option | Options: twitter, linkedin, instagram, facebook, website |
| `url` | Text | Required, URL validation |

## Content Organization

### Recommended Categories

Create these categories in the `categorias/` folder:

| Slug | Name (Spanish) | Description |
|------|----------------|-------------|
| `salud-mascotas` | Salud de Mascotas | Artículos sobre salud y bienestar animal |
| `nutricion` | Nutrición | Guías de alimentación y dietas |
| `comportamiento` | Comportamiento | Consejos de comportamiento y entrenamiento |
| `cuidados` | Cuidados | Cuidados generales y rutinas |
| `emergencias` | Emergencias | Guías de primeros auxilios |
| `noticias` | Noticias | Novedades del sector veterinario |

### Recommended Authors

Create author profiles in the `autores/` folder:

```
autores/
├── equipo-vetify      # For general team content
├── dr-nombre-apellido # For specific veterinarians
└── ...
```

### URL Structure

The blog generates these URLs:

| Content | URL Pattern | Example |
|---------|-------------|---------|
| Blog home | `/blog` | `/blog` |
| Article | `/blog/{slug}` | `/blog/cuidados-basicos-perros` |
| Category | `/blog/categoria/{slug}` | `/blog/categoria/salud-mascotas` |
| Author | `/blog/autor/{slug}` | `/blog/autor/equipo-vetify` |
| Tag | `/blog/etiqueta/{tag}` | `/blog/etiqueta/perros` |

## SEO Configuration

### Article SEO Checklist

When creating a blog post, ensure:

- [ ] **Title**: Clear, engaging, includes primary keyword (50-60 chars)
- [ ] **Slug**: Short, descriptive, lowercase with hyphens
- [ ] **Excerpt**: Compelling summary with keywords (150-160 chars)
- [ ] **Meta Title**: If different from title, optimized for search
- [ ] **Meta Description**: Action-oriented, includes call-to-action
- [ ] **Featured Image**: High quality, 1200x630px for social sharing
- [ ] **Image Alt Text**: Descriptive, includes keywords naturally

### Rich Snippets

#### FAQ Schema

Add FAQ items when the article answers common questions:

```
Example FAQ Item:
- Question: "¿Con qué frecuencia debo bañar a mi perro?"
- Answer: [Rich text with detailed answer]
```

This generates FAQ rich snippets in Google search results.

#### HowTo Schema

Add HowTo steps for instructional content:

```
Example HowTo Steps:
1. Preparar los materiales necesarios
2. Cepillar el pelaje para eliminar nudos
3. Mojar al perro con agua tibia
...
```

This generates HowTo rich snippets with step-by-step instructions.

### Image Optimization

Storyblok automatically optimizes images. The code transforms URLs to:

- WebP format for better compression
- Responsive sizes for different devices
- Quality optimization (80% by default)

```
Original: https://a.storyblok.com/f/123/image.jpg
Optimized: https://a.storyblok.com/f/123/m/1200x630/filters:format(webp):quality(80)/image.jpg
```

## Testing Your Setup

### 1. Create Test Content

1. **Create a category**:
   - Go to `categorias/` folder
   - Create new story with `blog_category` type
   - Fill in: name, slug, description

2. **Create an author**:
   - Go to `autores/` folder
   - Create new story with `blog_author` type
   - Fill in: name, slug, avatar, bio

3. **Create a blog post**:
   - Go to `blog/` folder
   - Create new story with `blog_post` type
   - Fill in all required fields
   - **Publish** the content

### 2. Verify in Application

1. Start your development server: `pnpm dev`
2. Visit `http://localhost:3000/blog`
3. Verify:
   - [ ] Blog listing shows your test post
   - [ ] Article page renders correctly
   - [ ] Category page works
   - [ ] Author page works
   - [ ] Images load and are optimized
   - [ ] Table of contents generates from headings

### 3. Check SEO

1. View page source or use browser DevTools
2. Verify:
   - [ ] Title tag is correct
   - [ ] Meta description is present
   - [ ] Open Graph tags are set
   - [ ] JSON-LD structured data is present

### Common Issues

| Issue | Solution |
|-------|----------|
| Content not showing | Ensure content is **Published** in Storyblok |
| 404 on article page | Check slug matches exactly (lowercase, hyphens) |
| Images not loading | Verify asset is uploaded and URL is accessible |
| Category/Author not linking | Ensure slug in post matches slug in category/author story |

## Next Steps

- Set up webhooks for automatic revalidation on publish
- Configure the Visual Editor for live preview
- Add analytics tracking to blog pages
- Set up a content calendar in Storyblok

---

**Related Documentation**:
- [Storyblok Overview](./README.md)
- [Content Types Reference](./CONTENT_TYPES.md)
- [Support Page Setup](./SUPPORT_PAGE_SETUP.md)
