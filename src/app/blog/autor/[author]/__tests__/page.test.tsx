/**
 * Integration tests for Blog Author Page
 */

import { render, screen } from '@testing-library/react';
import AuthorPage, { generateMetadata, generateStaticParams } from '../page';
import type { BlogPost, BlogAuthor } from '@/lib/storyblok/types';

// Mock Storyblok API
jest.mock('@/lib/storyblok/api', () => ({
  getBlogPosts: jest.fn(),
  getAuthor: jest.fn(),
  getAllAuthorSlugs: jest.fn(),
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
    <img src={props.src} alt={props.alt} data-testid="author-image" />
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

jest.mock('@/components/blog/RichTextRenderer', () => ({
  RichTextRenderer: () => <div data-testid="bio-content">Bio content</div>,
}));

import { getBlogPosts, getAuthor, getAllAuthorSlugs } from '@/lib/storyblok/api';

const mockGetBlogPosts = getBlogPosts as jest.MockedFunction<typeof getBlogPosts>;
const mockGetAuthor = getAuthor as jest.MockedFunction<typeof getAuthor>;
const mockGetAllAuthorSlugs = getAllAuthorSlugs as jest.MockedFunction<typeof getAllAuthorSlugs>;

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

const createMockAuthor = (overrides: Partial<BlogAuthor> = {}): BlogAuthor => ({
  id: '1',
  uuid: 'author-1',
  slug: 'dr-maria',
  name: 'Dr. María García',
  role: 'Veterinaria',
  bio: { type: 'doc', content: [] },
  avatar: { url: 'https://example.com/avatar.jpg', alt: 'Dr. María' },
  socialLinks: [],
  ...overrides,
});

describe('AuthorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render author page with name', async () => {
    mockGetAuthor.mockResolvedValue(createMockAuthor({ name: 'Dr. Juan Pérez' }));
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-juan' }) });
    render(page);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dr. Juan Pérez');
  });

  it('should call notFound when author does not exist', async () => {
    mockGetAuthor.mockResolvedValue(null);
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    await expect(
      AuthorPage({ params: Promise.resolve({ author: 'invalid' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should render author role', async () => {
    mockGetAuthor.mockResolvedValue(createMockAuthor({ role: 'Veterinario Especialista' }));
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-maria' }) });
    render(page);

    expect(screen.getByText('Veterinario Especialista')).toBeInTheDocument();
  });

  it('should render author avatar', async () => {
    mockGetAuthor.mockResolvedValue(
      createMockAuthor({
        avatar: { url: 'https://example.com/photo.jpg', alt: 'Author photo' },
      })
    );
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-maria' }) });
    render(page);

    const avatar = screen.getByTestId('author-image');
    expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('should render author bio', async () => {
    mockGetAuthor.mockResolvedValue(
      createMockAuthor({ bio: { type: 'doc', content: [{ type: 'paragraph' }] } })
    );
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-maria' }) });
    render(page);

    expect(screen.getByTestId('bio-content')).toBeInTheDocument();
  });

  it('should render posts count', async () => {
    mockGetAuthor.mockResolvedValue(createMockAuthor());
    mockGetBlogPosts.mockResolvedValue({
      items: [createMockPost()],
      total: 3,
      page: 1,
      perPage: 12,
      totalPages: 1,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-maria' }) });
    render(page);

    expect(screen.getByText('3 artículos publicados')).toBeInTheDocument();
  });

  it('should render empty state when no posts', async () => {
    mockGetAuthor.mockResolvedValue(createMockAuthor());
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-maria' }) });
    render(page);

    expect(
      screen.getByText('Este autor aún no ha publicado artículos.')
    ).toBeInTheDocument();
  });

  it('should render social links when present', async () => {
    mockGetAuthor.mockResolvedValue(
      createMockAuthor({
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com/author' },
          { platform: 'linkedin', url: 'https://linkedin.com/in/author' },
        ],
      })
    );
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-maria' }) });
    render(page);

    expect(screen.getByRole('link', { name: 'twitter' })).toHaveAttribute(
      'href',
      'https://twitter.com/author'
    );
    expect(screen.getByRole('link', { name: 'linkedin' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/author'
    );
  });

  it('should render breadcrumbs', async () => {
    mockGetAuthor.mockResolvedValue(createMockAuthor({ name: 'Dr. Test' }));
    mockGetBlogPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 12,
      totalPages: 0,
    });

    const page = await AuthorPage({ params: Promise.resolve({ author: 'dr-test' }) });
    render(page);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
  });
});

describe('generateMetadata', () => {
  it('should return not found metadata when author does not exist', async () => {
    mockGetAuthor.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ author: 'invalid' }) });

    expect(metadata).toEqual({ title: 'Autor no encontrado' });
  });
});

describe('generateStaticParams', () => {
  it('should return params for all author slugs', async () => {
    mockGetAllAuthorSlugs.mockResolvedValue(['dr-maria', 'dr-juan']);

    const params = await generateStaticParams();

    expect(params).toEqual([{ author: 'dr-maria' }, { author: 'dr-juan' }]);
  });
});
