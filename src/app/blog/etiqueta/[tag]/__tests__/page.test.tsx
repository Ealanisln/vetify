/**
 * Integration tests for Blog Tag Page
 */

import { render, screen } from '@testing-library/react';
import TagPage, { generateMetadata, generateStaticParams } from '../page';
import type { BlogPost } from '@/lib/storyblok/types';

// Mock Storyblok API
jest.mock('@/lib/storyblok/api', () => ({
  getBlogPosts: jest.fn(),
  getAllTags: jest.fn(),
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

import { getBlogPosts, getAllTags } from '@/lib/storyblok/api';

const mockGetBlogPosts = getBlogPosts as jest.MockedFunction<typeof getBlogPosts>;
const mockGetAllTags = getAllTags as jest.MockedFunction<typeof getAllTags>;

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

describe('TagPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render tag page with tag name', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'perros' }) });
    render(page);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('perros');
  });

  it('should display hashtag symbol', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'mascotas' }) });
    render(page);

    // Check for the # in the breadcrumb or heading area
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveTextContent('#mascotas');
  });

  it('should decode URL-encoded tag', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await TagPage({
      params: Promise.resolve({ tag: 'cuidado%20de%20mascotas' }),
    });
    render(page);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'cuidado de mascotas'
    );
  });

  it('should render posts count', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [createMockPost()],
      total: 8,
      page: 1,
      perPage: 12,
      totalPages: 1,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'salud' }) });
    render(page);

    expect(screen.getByText(/8 artículos con esta etiqueta/i)).toBeInTheDocument();
  });

  it('should render single article text when one post', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [createMockPost()],
      total: 1,
      page: 1,
      perPage: 12,
      totalPages: 1,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'raro' }) });
    render(page);

    expect(screen.getByText(/1 artículo con esta etiqueta/i)).toBeInTheDocument();
  });

  it('should render posts grid when posts exist', async () => {
    const mockPosts = [
      createMockPost({ uuid: '1', title: 'Post One' }),
      createMockPost({ uuid: '2', title: 'Post Two' }),
    ];

    mockGetBlogPosts.mockResolvedValue({
      items: mockPosts,
      total: 2,
      page: 1,
      perPage: 12,
      totalPages: 1,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'perros' }) });
    render(page);

    expect(screen.getByText('Post One')).toBeInTheDocument();
    expect(screen.getByText('Post Two')).toBeInTheDocument();
  });

  it('should render empty state when no posts', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'empty' }) });
    render(page);

    expect(
      screen.getByText('No hay artículos con esta etiqueta todavía.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos los artículos' })).toHaveAttribute(
      'href',
      '/blog'
    );
  });

  it('should render breadcrumbs', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await TagPage({ params: Promise.resolve({ tag: 'gatos' }) });
    render(page);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
  });

  it('should fetch posts with tag filter', async () => {
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    await TagPage({ params: Promise.resolve({ tag: 'vacunas' }) });

    expect(mockGetBlogPosts).toHaveBeenCalledWith({
      perPage: 12,
      filters: { tag: 'vacunas' },
    });
  });
});

describe('generateStaticParams', () => {
  it('should return encoded params for all tags', async () => {
    mockGetAllTags.mockResolvedValue(['perros', 'cuidado de mascotas']);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { tag: 'perros' },
      { tag: 'cuidado%20de%20mascotas' },
    ]);
  });

  it('should return empty array when no tags', async () => {
    mockGetAllTags.mockResolvedValue([]);

    const params = await generateStaticParams();

    expect(params).toEqual([]);
  });
});
