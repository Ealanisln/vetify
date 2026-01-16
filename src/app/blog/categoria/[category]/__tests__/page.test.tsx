/**
 * Integration tests for Blog Category Page
 */

import { render, screen } from '@testing-library/react';
import CategoryPage, { generateMetadata, generateStaticParams } from '../page';
import type { BlogPost, BlogCategory } from '@/lib/storyblok/types';

// Mock Storyblok API
jest.mock('@/lib/storyblok/api', () => ({
  getBlogPosts: jest.fn(),
  getCategory: jest.fn(),
  getAllCategorySlugs: jest.fn(),
}));

// Mock next/navigation
const mockNotFound = jest.fn();
jest.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

// Mock next/image and next/link
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => (
    <img src={props.src} alt={props.alt} data-testid="post-image" />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock SEO utilities
jest.mock('@/lib/seo/metadata', () => ({
  generateMetadata: jest.fn(() => ({})),
  createPageSEO: jest.fn(() => ({})),
}));

jest.mock('@/lib/seo/structured-data', () => ({
  generateWebPageSchema: jest.fn(() => ({})),
}));

jest.mock('@/lib/seo/breadcrumbs', () => ({
  generateBreadcrumbSchema: jest.fn(() => ({})),
}));

jest.mock('@/components/seo/StructuredData', () => ({
  StructuredData: () => <div data-testid="structured-data" />,
}));

jest.mock('@/components/footer/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}));

import { getBlogPosts, getCategory, getAllCategorySlugs } from '@/lib/storyblok/api';

const mockGetBlogPosts = getBlogPosts as jest.MockedFunction<typeof getBlogPosts>;
const mockGetCategory = getCategory as jest.MockedFunction<typeof getCategory>;
const mockGetAllCategorySlugs = getAllCategorySlugs as jest.MockedFunction<typeof getAllCategorySlugs>;

const createMockPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: '1',
  uuid: 'uuid-1',
  slug: 'test-post',
  fullSlug: 'blog/test-post',
  title: 'Test Post',
  excerpt: 'Test excerpt',
  content: { type: 'doc', content: [] },
  featuredImage: { url: 'https://example.com/img.jpg', alt: 'Test' },
  category: 'test',
  tags: [],
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

const createMockCategory = (overrides: Partial<BlogCategory> = {}): BlogCategory => ({
  id: '1',
  uuid: 'cat-1',
  slug: 'salud',
  name: 'Salud',
  description: 'Category description',
  icon: undefined,
  color: '#75a99c',
  ...overrides,
});

describe('CategoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render category page with name', async () => {
    mockGetCategory.mockResolvedValue(createMockCategory({ name: 'Nutrición' }));
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await CategoryPage({ params: Promise.resolve({ category: 'nutricion' }) });
    render(page);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nutrición');
  });

  it('should call notFound when category does not exist', async () => {
    mockGetCategory.mockResolvedValue(null);
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    await expect(
      CategoryPage({ params: Promise.resolve({ category: 'invalid' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should render category description', async () => {
    mockGetCategory.mockResolvedValue(
      createMockCategory({ description: 'Artículos sobre salud animal' })
    );
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await CategoryPage({ params: Promise.resolve({ category: 'salud' }) });
    render(page);

    expect(screen.getByText('Artículos sobre salud animal')).toBeInTheDocument();
  });

  it('should render posts count', async () => {
    mockGetCategory.mockResolvedValue(createMockCategory());
    mockGetBlogPosts.mockResolvedValue({
      items: [createMockPost()],
      total: 5,
      page: 1,
      perPage: 12,
      totalPages: 1,
    });

    const page = await CategoryPage({ params: Promise.resolve({ category: 'salud' }) });
    render(page);

    expect(screen.getByText('5 artículos')).toBeInTheDocument();
  });

  it('should render empty state when no posts', async () => {
    mockGetCategory.mockResolvedValue(createMockCategory());
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await CategoryPage({ params: Promise.resolve({ category: 'salud' }) });
    render(page);

    expect(
      screen.getByText('No hay artículos en esta categoría todavía.')
    ).toBeInTheDocument();
  });

  it('should render breadcrumbs', async () => {
    mockGetCategory.mockResolvedValue(createMockCategory({ name: 'Salud' }));
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await CategoryPage({ params: Promise.resolve({ category: 'salud' }) });
    render(page);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
  });
});

describe('generateMetadata', () => {
  it('should return not found metadata when category does not exist', async () => {
    mockGetCategory.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ category: 'invalid' }) });

    expect(metadata).toEqual({ title: 'Categoría no encontrada' });
  });
});

describe('generateStaticParams', () => {
  it('should return params for all category slugs', async () => {
    mockGetAllCategorySlugs.mockResolvedValue(['salud', 'nutricion']);

    const params = await generateStaticParams();

    expect(params).toEqual([{ category: 'salud' }, { category: 'nutricion' }]);
  });
});
