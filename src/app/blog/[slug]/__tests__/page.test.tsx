/**
 * Integration tests for Blog Article Page
 * Tests article rendering, metadata generation, and component integration
 */

import { render, screen } from '@testing-library/react';
import BlogArticlePage, { generateMetadata, generateStaticParams } from '../page';
import type { BlogPost } from '@/lib/storyblok/types';

// Mock Storyblok API
jest.mock('@/lib/storyblok/api', () => ({
  getBlogPost: jest.fn(),
  getRelatedPosts: jest.fn(),
  getAllPostSlugs: jest.fn(),
}));

// Mock next/navigation
const mockNotFound = jest.fn();
jest.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; fill?: boolean; priority?: boolean }) => (
    <img
      src={props.src}
      alt={props.alt}
      data-testid="featured-image"
      data-priority={props.priority}
    />
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock SEO utilities
jest.mock('@/lib/seo/metadata', () => ({
  generateMetadata: jest.fn(() => ({
    title: 'Test Title',
    description: 'Test Description',
  })),
  createArticleSEO: jest.fn(() => ({})),
}));

// Mock structured data
jest.mock('@/lib/seo/structured-data', () => ({
  generateArticleSchema: jest.fn(() => ({ '@type': 'Article' })),
}));

jest.mock('@/lib/seo/breadcrumbs', () => ({
  generateBreadcrumbSchema: jest.fn(() => ({ '@type': 'BreadcrumbList' })),
}));

// Mock StructuredData component
jest.mock('@/components/seo/StructuredData', () => ({
  StructuredData: ({ data }: { data: unknown }) => (
    <div data-testid="structured-data" data-schema={JSON.stringify(data)} />
  ),
}));

// Mock Footer
jest.mock('@/components/footer/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock blog components
jest.mock('@/components/blog/RichTextRenderer', () => ({
  RichTextRenderer: ({ content }: { content: unknown }) => (
    <div data-testid="rich-text-renderer">
      {content ? 'Article Content' : 'No Content'}
    </div>
  ),
}));

jest.mock('@/components/blog/TableOfContents', () => ({
  TableOfContents: ({ content }: { content: unknown }) => (
    <nav data-testid="table-of-contents">{content ? 'TOC' : 'No TOC'}</nav>
  ),
}));

jest.mock('@/components/blog/ArticleShare', () => ({
  ArticleShare: ({ title, url }: { title: string; url: string }) => (
    <div data-testid="article-share" data-title={title} data-url={url}>
      Share
    </div>
  ),
}));

jest.mock('@/components/blog/FAQSection', () => ({
  FAQSection: ({ items }: { items: unknown[] }) => (
    <div data-testid="faq-section">FAQ ({items.length} items)</div>
  ),
}));

jest.mock('@/components/blog/RelatedPosts', () => ({
  RelatedPosts: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="related-posts">Related Posts ({posts.length})</div>
  ),
}));

import { getBlogPost, getRelatedPosts, getAllPostSlugs } from '@/lib/storyblok/api';

const mockGetBlogPost = getBlogPost as jest.MockedFunction<typeof getBlogPost>;
const mockGetRelatedPosts = getRelatedPosts as jest.MockedFunction<
  typeof getRelatedPosts
>;
const mockGetAllPostSlugs = getAllPostSlugs as jest.MockedFunction<
  typeof getAllPostSlugs
>;

// Factory function for creating mock blog posts
const createMockBlogPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: '1',
  uuid: 'uuid-1',
  slug: 'test-article',
  fullSlug: 'blog/test-article',
  title: 'Test Article Title',
  excerpt: 'This is a test article excerpt',
  content: { type: 'doc', content: [] },
  featuredImage: {
    url: 'https://example.com/image.jpg',
    alt: 'Featured image',
  },
  category: 'cuidado-mascotas',
  tags: ['perros', 'gatos', 'salud'],
  author: 'Dr. Test Author',
  publishedAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-20T10:00:00.000Z',
  readingTimeMinutes: 5,
  showToc: true,
  keywords: ['veterinario', 'mascotas'],
  noIndex: false,
  faqItems: [],
  howToSteps: [],
  relatedPosts: [],
  ...overrides,
});

describe('BlogArticlePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRelatedPosts.mockResolvedValue([]);
  });

  describe('Page Rendering', () => {
    it('should render article with title', async () => {
      const mockPost = createMockBlogPost({ title: 'My Test Article' });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'My Test Article'
      );
    });

    it('should call notFound when post does not exist', async () => {
      mockGetBlogPost.mockResolvedValue(null);

      await expect(async () => {
        await BlogArticlePage({ params: Promise.resolve({ slug: 'non-existent' }) });
      }).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should render featured image when present', async () => {
      const mockPost = createMockBlogPost({
        featuredImage: {
          url: 'https://example.com/hero.jpg',
          alt: 'Hero image alt',
        },
      });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const image = screen.getByTestId('featured-image');
      expect(image).toHaveAttribute('src', 'https://example.com/hero.jpg');
      expect(image).toHaveAttribute('alt', 'Hero image alt');
      expect(image).toHaveAttribute('data-priority', 'true');
    });

    it('should not render featured image when absent', async () => {
      const mockPost = createMockBlogPost({ featuredImage: null });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.queryByTestId('featured-image')).not.toBeInTheDocument();
    });

    it('should render author name when present', async () => {
      const mockPost = createMockBlogPost({ author: 'Dr. Maria Garcia' });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByText('Dr. Maria Garcia')).toBeInTheDocument();
    });

    it('should render publish date in Spanish format', async () => {
      const mockPost = createMockBlogPost({
        publishedAt: '2024-03-15T10:00:00.000Z',
      });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      // Spanish date format: "15 de marzo de 2024"
      expect(screen.getByText(/15 de marzo de 2024/i)).toBeInTheDocument();
    });

    it('should render reading time', async () => {
      const mockPost = createMockBlogPost({ readingTimeMinutes: 7 });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByText('7 min de lectura')).toBeInTheDocument();
    });
  });

  describe('Category Link', () => {
    it('should render category link when present', async () => {
      const mockPost = createMockBlogPost({ category: 'nutricion' });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const categoryLink = screen.getByRole('link', { name: 'nutricion' });
      expect(categoryLink).toHaveAttribute('href', '/blog/categoria/nutricion');
    });

    it('should not render category link when category is empty', async () => {
      const mockPost = createMockBlogPost({ category: '' });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(
        screen.queryByRole('link', { name: /categoria/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    it('should render breadcrumb navigation', async () => {
      const mockPost = createMockBlogPost({ title: 'Article Title' });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(
        screen.getByRole('navigation', { name: 'Breadcrumb' })
      ).toBeInTheDocument();
    });

    it('should have link to home', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const homeLink = screen.getByRole('link', { name: 'Inicio' });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should have link to blog', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const blogLinks = screen.getAllByRole('link', { name: 'Blog' });
      expect(blogLinks.some((link) => link.getAttribute('href') === '/blog')).toBe(
        true
      );
    });

    it('should display current article title in breadcrumbs', async () => {
      const mockPost = createMockBlogPost({ title: 'My Article Title' });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toHaveTextContent('My Article Title');
    });
  });

  describe('Article Content', () => {
    it('should render RichTextRenderer with content', async () => {
      const mockPost = createMockBlogPost({
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByTestId('rich-text-renderer')).toBeInTheDocument();
    });
  });

  describe('Table of Contents', () => {
    it('should render TOC when showToc is true', async () => {
      const mockPost = createMockBlogPost({ showToc: true });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByTestId('table-of-contents')).toBeInTheDocument();
    });

    it('should not render TOC when showToc is false', async () => {
      const mockPost = createMockBlogPost({ showToc: false });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.queryByTestId('table-of-contents')).not.toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('should render FAQSection when faqItems present', async () => {
      const mockPost = createMockBlogPost({
        faqItems: [
          { _uid: 'faq-1', question: 'Q1', answer: { type: 'doc', content: [] } },
          { _uid: 'faq-2', question: 'Q2', answer: { type: 'doc', content: [] } },
        ],
      });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByTestId('faq-section')).toBeInTheDocument();
      expect(screen.getByTestId('faq-section')).toHaveTextContent('2 items');
    });

    it('should not render FAQSection when faqItems is empty', async () => {
      const mockPost = createMockBlogPost({ faqItems: [] });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.queryByTestId('faq-section')).not.toBeInTheDocument();
    });
  });

  describe('Tags Section', () => {
    it('should render tags when present', async () => {
      const mockPost = createMockBlogPost({
        tags: ['salud', 'nutricion', 'ejercicio'],
      });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByText('Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('#salud')).toBeInTheDocument();
      expect(screen.getByText('#nutricion')).toBeInTheDocument();
      expect(screen.getByText('#ejercicio')).toBeInTheDocument();
    });

    it('should link tags to tag pages', async () => {
      const mockPost = createMockBlogPost({ tags: ['perros'] });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const tagLink = screen.getByRole('link', { name: '#perros' });
      expect(tagLink).toHaveAttribute('href', '/blog/etiqueta/perros');
    });

    it('should not render tags section when tags is empty', async () => {
      const mockPost = createMockBlogPost({ tags: [] });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.queryByText('Etiquetas')).not.toBeInTheDocument();
    });
  });

  describe('Share Component', () => {
    it('should render ArticleShare with title and url', async () => {
      const mockPost = createMockBlogPost({
        title: 'Shareable Article',
        slug: 'shareable-article',
      });
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const shareComponent = screen.getByTestId('article-share');
      expect(shareComponent).toHaveAttribute('data-title', 'Shareable Article');
      expect(shareComponent).toHaveAttribute('data-url', '/blog/shareable-article');
    });
  });

  describe('Related Posts', () => {
    it('should render RelatedPosts when related posts exist', async () => {
      const mockPost = createMockBlogPost();
      const mockRelated = [
        createMockBlogPost({ uuid: 'related-1', title: 'Related 1' }),
        createMockBlogPost({ uuid: 'related-2', title: 'Related 2' }),
      ];
      mockGetBlogPost.mockResolvedValue(mockPost);
      mockGetRelatedPosts.mockResolvedValue(mockRelated);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByTestId('related-posts')).toBeInTheDocument();
      expect(screen.getByTestId('related-posts')).toHaveTextContent('2');
    });

    it('should not render RelatedPosts when no related posts', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);
      mockGetRelatedPosts.mockResolvedValue([]);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.queryByTestId('related-posts')).not.toBeInTheDocument();
    });

    it('should fetch related posts with post and limit', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);
      mockGetRelatedPosts.mockResolvedValue([]);

      await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });

      expect(mockGetRelatedPosts).toHaveBeenCalledWith(mockPost, 3);
    });
  });

  describe('Structured Data', () => {
    it('should render StructuredData component', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByTestId('structured-data')).toBeInTheDocument();
    });
  });

  describe('Back to Blog Link', () => {
    it('should render back to blog link', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      const backLink = screen.getByRole('link', { name: /Volver al Blog/i });
      expect(backLink).toHaveAttribute('href', '/blog');
    });
  });

  describe('Footer', () => {
    it('should render footer', async () => {
      const mockPost = createMockBlogPost();
      mockGetBlogPost.mockResolvedValue(mockPost);

      const page = await BlogArticlePage({ params: Promise.resolve({ slug: 'test' }) });
      render(page);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });
});

describe('generateMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return not found metadata when post does not exist', async () => {
    mockGetBlogPost.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'non-existent' }),
    });

    expect(metadata).toEqual({ title: 'Artículo no encontrado' });
  });

  it('should fetch post with slug', async () => {
    const mockPost = createMockBlogPost();
    mockGetBlogPost.mockResolvedValue(mockPost);

    await generateMetadata({ params: Promise.resolve({ slug: 'my-article' }) });

    expect(mockGetBlogPost).toHaveBeenCalledWith('my-article');
  });
});

describe('generateStaticParams', () => {
  it('should return params for all post slugs', async () => {
    mockGetAllPostSlugs.mockResolvedValue(['post-1', 'post-2', 'post-3']);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { slug: 'post-1' },
      { slug: 'post-2' },
      { slug: 'post-3' },
    ]);
  });

  it('should return empty array when no posts', async () => {
    mockGetAllPostSlugs.mockResolvedValue([]);

    const params = await generateStaticParams();

    expect(params).toEqual([]);
  });
});
