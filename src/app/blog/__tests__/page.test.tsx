/**
 * Integration tests for Blog Listing Page
 * Tests blog listing rendering, category filters, and post cards
 */

import { render, screen } from '@testing-library/react';
import BlogPage from '../page';
import type { BlogPost, BlogCategory } from '@/lib/storyblok/types';

// Mock Storyblok API
jest.mock('@/lib/storyblok/api', () => ({
  getBlogPosts: jest.fn(),
  getCategories: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; fill?: boolean }) => (
    <img src={props.src} alt={props.alt} data-testid="post-image" />
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock SEO utilities
jest.mock('@/lib/seo/metadata', () => ({
  generateMetadata: jest.fn(() => ({
    title: 'Blog',
    description: 'Blog description',
  })),
  createPageSEO: jest.fn(() => ({})),
}));

// Mock structured data
jest.mock('@/lib/seo/structured-data', () => ({
  generateWebPageSchema: jest.fn(() => ({ '@type': 'WebPage' })),
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

import { getBlogPosts, getCategories } from '@/lib/storyblok/api';

const mockGetBlogPosts = getBlogPosts as jest.MockedFunction<
  typeof getBlogPosts
>;
const mockGetCategories = getCategories as jest.MockedFunction<
  typeof getCategories
>;

// Factory function for creating mock blog posts
const createMockBlogPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: '1',
  uuid: 'uuid-1',
  slug: 'test-post',
  fullSlug: 'blog/test-post',
  title: 'Test Post Title',
  excerpt: 'This is a test excerpt',
  content: { type: 'doc', content: [] },
  featuredImage: {
    url: 'https://example.com/image.jpg',
    alt: 'Test image',
  },
  category: 'cuidado-mascotas',
  tags: ['perros'],
  author: 'Dr. Test',
  publishedAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  readingTimeMinutes: 5,
  showToc: true,
  keywords: [],
  noIndex: false,
  faqItems: [],
  howToSteps: [],
  relatedPosts: [],
  ...overrides,
});

// Factory function for creating mock categories
const createMockCategory = (
  overrides: Partial<BlogCategory> = {}
): BlogCategory => ({
  id: '1',
  uuid: 'cat-uuid-1',
  slug: 'test-category',
  name: 'Test Category',
  description: 'Test category description',
  icon: undefined,
  color: '#75a99c',
  ...overrides,
});

describe('BlogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render page title', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(
        screen.getByRole('heading', { level: 1, name: /Blog de Vetify/i })
      ).toBeInTheDocument();
    });

    it('should render page description', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(
        screen.getByText(/Descubre artículos, guías y consejos/i)
      ).toBeInTheDocument();
    });

    it('should render structured data', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByTestId('structured-data')).toBeInTheDocument();
    });

    it('should render footer', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    it('should render breadcrumb navigation', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(
        screen.getByRole('navigation', { name: 'Breadcrumb' })
      ).toBeInTheDocument();
    });

    it('should have link to home', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      const homeLink = screen.getByRole('link', { name: 'Inicio' });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should display Blog as current page', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toHaveTextContent('Blog');
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no posts', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText('Próximamente')).toBeInTheDocument();
      expect(
        screen.getByText(/Estamos preparando contenido increíble/i)
      ).toBeInTheDocument();
    });

    it('should not render post grid when no posts', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      const { container } = render(page);

      expect(container.querySelector('.grid.grid-cols-1')).not.toBeInTheDocument();
    });
  });

  describe('Post Cards', () => {
    it('should render post cards when posts exist', async () => {
      const mockPosts = [
        createMockBlogPost({ uuid: '1', title: 'First Post' }),
        createMockBlogPost({ uuid: '2', title: 'Second Post' }),
        createMockBlogPost({ uuid: '3', title: 'Third Post' }),
      ];

      mockGetBlogPosts.mockResolvedValue({
        items: mockPosts,
        total: 3,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    it('should render post featured image', async () => {
      const mockPost = createMockBlogPost({
        featuredImage: {
          url: 'https://example.com/hero.jpg',
          alt: 'Hero image',
        },
      });

      mockGetBlogPosts.mockResolvedValue({
        items: [mockPost],
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      const image = screen.getByTestId('post-image');
      expect(image).toHaveAttribute('src', 'https://example.com/hero.jpg');
      expect(image).toHaveAttribute('alt', 'Hero image');
    });

    it('should render post category badge', async () => {
      const mockPost = createMockBlogPost({ category: 'nutricion' });

      mockGetBlogPosts.mockResolvedValue({
        items: [mockPost],
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText('nutricion')).toBeInTheDocument();
    });

    it('should render post excerpt', async () => {
      const mockPost = createMockBlogPost({
        excerpt: 'This is the post excerpt text',
      });

      mockGetBlogPosts.mockResolvedValue({
        items: [mockPost],
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText('This is the post excerpt text')).toBeInTheDocument();
    });

    it('should render post reading time', async () => {
      const mockPost = createMockBlogPost({ readingTimeMinutes: 7 });

      mockGetBlogPosts.mockResolvedValue({
        items: [mockPost],
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText('7 min de lectura')).toBeInTheDocument();
    });

    it('should link post card to article page', async () => {
      const mockPost = createMockBlogPost({ slug: 'my-test-article' });

      mockGetBlogPosts.mockResolvedValue({
        items: [mockPost],
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      const articleLink = screen.getByRole('link', { name: /Test Post Title/i });
      expect(articleLink).toHaveAttribute('href', '/blog/my-test-article');
    });

    it('should render publish date in Spanish format', async () => {
      const mockPost = createMockBlogPost({
        publishedAt: '2024-03-15T10:00:00.000Z',
      });

      mockGetBlogPosts.mockResolvedValue({
        items: [mockPost],
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText(/15 de marzo de 2024/i)).toBeInTheDocument();
    });
  });

  describe('Category Filter', () => {
    it('should render category filter buttons when categories exist', async () => {
      const mockCategories = [
        createMockCategory({ uuid: '1', slug: 'salud', name: 'Salud' }),
        createMockCategory({ uuid: '2', slug: 'nutricion', name: 'Nutrición' }),
      ];

      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue(mockCategories);

      const page = await BlogPage();
      render(page);

      expect(screen.getByRole('link', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Salud' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Nutrición' })).toBeInTheDocument();
    });

    it('should link Todos to /blog', async () => {
      const mockCategories = [createMockCategory()];

      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue(mockCategories);

      const page = await BlogPage();
      render(page);

      const todosLink = screen.getByRole('link', { name: 'Todos' });
      expect(todosLink).toHaveAttribute('href', '/blog');
    });

    it('should link category to category page', async () => {
      const mockCategories = [
        createMockCategory({ slug: 'cuidado-mascotas', name: 'Cuidado de Mascotas' }),
      ];

      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue(mockCategories);

      const page = await BlogPage();
      render(page);

      const categoryLink = screen.getByRole('link', { name: 'Cuidado de Mascotas' });
      expect(categoryLink).toHaveAttribute('href', '/blog/categoria/cuidado-mascotas');
    });

    it('should not render category filter when no categories', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.queryByRole('link', { name: 'Todos' })).not.toBeInTheDocument();
    });
  });

  describe('Pagination Info', () => {
    it('should show pagination info when multiple pages exist', async () => {
      const mockPosts = Array(12)
        .fill(null)
        .map((_, i) =>
          createMockBlogPost({ uuid: `uuid-${i}`, title: `Post ${i + 1}` })
        );

      mockGetBlogPosts.mockResolvedValue({
        items: mockPosts,
        total: 25,
        page: 1,
        perPage: 12,
        totalPages: 3,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.getByText(/Mostrando 12 de 25 artículos/i)).toBeInTheDocument();
    });

    it('should not show pagination info when single page', async () => {
      const mockPosts = [createMockBlogPost()];

      mockGetBlogPosts.mockResolvedValue({
        items: mockPosts,
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      render(page);

      expect(screen.queryByText(/Mostrando/i)).not.toBeInTheDocument();
    });
  });

  describe('API Calls', () => {
    it('should fetch posts with correct pagination params', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      await BlogPage();

      expect(mockGetBlogPosts).toHaveBeenCalledWith({ page: 1, perPage: 12 });
    });

    it('should fetch categories', async () => {
      mockGetBlogPosts.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 12,
        totalPages: 0,
      });
      mockGetCategories.mockResolvedValue([]);

      await BlogPage();

      expect(mockGetCategories).toHaveBeenCalled();
    });
  });

  describe('Grid Layout', () => {
    it('should render posts in responsive grid', async () => {
      const mockPosts = [createMockBlogPost()];

      mockGetBlogPosts.mockResolvedValue({
        items: mockPosts,
        total: 1,
        page: 1,
        perPage: 12,
        totalPages: 1,
      });
      mockGetCategories.mockResolvedValue([]);

      const page = await BlogPage();
      const { container } = render(page);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });
});
