/**
 * Component tests for RelatedPosts
 * Tests related posts section rendering and post card display
 */

import { render, screen } from '@testing-library/react';
import { RelatedPosts } from '../RelatedPosts';
import type { BlogPost } from '@/lib/storyblok/types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
  }) => (
    <img
      src={props.src}
      alt={props.alt}
      data-testid="post-image"
      className={props.className}
    />
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
    <a href={href} className={className} data-testid="post-link">
      {children}
    </a>
  ),
}));

// Factory function for creating mock blog posts
const createMockBlogPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: '1',
  uuid: 'uuid-1',
  slug: 'test-post',
  fullSlug: 'blog/test-post',
  title: 'Test Post Title',
  excerpt: 'Test excerpt for the post',
  content: { type: 'doc', content: [] },
  featuredImage: {
    url: 'https://example.com/image.jpg',
    alt: 'Test image alt',
  },
  category: 'cuidado-mascotas',
  tags: ['perros', 'gatos'],
  author: 'Dr. Test Author',
  publishedAt: '2024-01-15',
  updatedAt: '2024-01-15',
  readingTimeMinutes: 5,
  showToc: true,
  keywords: ['veterinario', 'mascotas'],
  noIndex: false,
  faqItems: [],
  howToSteps: [],
  relatedPosts: [],
  ...overrides,
});

describe('RelatedPosts', () => {
  describe('Empty States', () => {
    it('should return null when posts array is empty', () => {
      const { container } = render(<RelatedPosts posts={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when posts is undefined', () => {
      // @ts-expect-error - Testing undefined posts
      const { container } = render(<RelatedPosts posts={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when posts is null', () => {
      // @ts-expect-error - Testing null posts
      const { container } = render(<RelatedPosts posts={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Section Rendering', () => {
    const mockPosts = [
      createMockBlogPost({ uuid: 'uuid-1', title: 'First Post', slug: 'first-post' }),
      createMockBlogPost({ uuid: 'uuid-2', title: 'Second Post', slug: 'second-post' }),
      createMockBlogPost({ uuid: 'uuid-3', title: 'Third Post', slug: 'third-post' }),
    ];

    it('should render default title "Artículos Relacionados"', () => {
      render(<RelatedPosts posts={mockPosts} />);

      expect(screen.getByText('Artículos Relacionados')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(<RelatedPosts posts={mockPosts} title="También te puede interesar" />);

      expect(screen.getByText('También te puede interesar')).toBeInTheDocument();
      expect(screen.queryByText('Artículos Relacionados')).not.toBeInTheDocument();
    });

    it('should render section with correct background styling', () => {
      const { container } = render(<RelatedPosts posts={mockPosts} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-gray-50');
      expect(section).toHaveClass('dark:bg-gray-800/50');
    });

    it('should render all posts in a grid', () => {
      render(<RelatedPosts posts={mockPosts} />);

      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    it('should render 3 post cards', () => {
      render(<RelatedPosts posts={mockPosts} />);

      const links = screen.getAllByTestId('post-link');
      expect(links).toHaveLength(3);
    });
  });

  describe('Post Card - Image', () => {
    it('should render featured image when present', () => {
      const post = createMockBlogPost({
        featuredImage: {
          url: 'https://example.com/featured.jpg',
          alt: 'Featured image description',
        },
      });

      render(<RelatedPosts posts={[post]} />);

      const image = screen.getByTestId('post-image');
      expect(image).toHaveAttribute('src', 'https://example.com/featured.jpg');
      expect(image).toHaveAttribute('alt', 'Featured image description');
    });

    it('should not render image section when featuredImage is null', () => {
      const post = createMockBlogPost({ featuredImage: null });

      render(<RelatedPosts posts={[post]} />);

      expect(screen.queryByTestId('post-image')).not.toBeInTheDocument();
    });

    it('should apply hover scale effect class on image', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const image = screen.getByTestId('post-image');
      expect(image).toHaveClass('group-hover:scale-105');
      expect(image).toHaveClass('transition-transform');
    });
  });

  describe('Post Card - Title', () => {
    it('should render post title in h3', () => {
      const post = createMockBlogPost({ title: 'My Amazing Post' });

      render(<RelatedPosts posts={[post]} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('My Amazing Post');
    });

    it('should apply line-clamp-2 for title truncation', () => {
      const post = createMockBlogPost({
        title: 'This is a very long title that should be truncated after two lines',
      });

      render(<RelatedPosts posts={[post]} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('line-clamp-2');
    });

    it('should apply hover color transition on title', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('group-hover:text-[#75a99c]');
      expect(title).toHaveClass('transition-colors');
    });
  });

  describe('Post Card - Category', () => {
    it('should render category badge when present', () => {
      const post = createMockBlogPost({ category: 'nutricion' });

      render(<RelatedPosts posts={[post]} />);

      expect(screen.getByText('nutricion')).toBeInTheDocument();
    });

    it('should apply correct styling to category badge', () => {
      const post = createMockBlogPost({ category: 'salud' });

      render(<RelatedPosts posts={[post]} />);

      const badge = screen.getByText('salud');
      expect(badge).toHaveClass('bg-[#75a99c]/10');
      expect(badge).toHaveClass('text-[#75a99c]');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should not render category badge when category is empty', () => {
      const post = createMockBlogPost({ category: '' });

      render(<RelatedPosts posts={[post]} />);

      // Category should not be rendered
      const badges = screen.queryAllByText(/./);
      const categoryBadges = badges.filter(
        (el) => el.className?.includes('bg-[#75a99c]/10')
      );
      expect(categoryBadges).toHaveLength(0);
    });
  });

  describe('Post Card - Reading Time', () => {
    it('should display reading time in minutes', () => {
      const post = createMockBlogPost({ readingTimeMinutes: 7 });

      render(<RelatedPosts posts={[post]} />);

      expect(screen.getByText('7 min de lectura')).toBeInTheDocument();
    });

    it('should handle different reading times', () => {
      const posts = [
        createMockBlogPost({ uuid: '1', readingTimeMinutes: 1 }),
        createMockBlogPost({ uuid: '2', readingTimeMinutes: 10 }),
        createMockBlogPost({ uuid: '3', readingTimeMinutes: 30 }),
      ];

      render(<RelatedPosts posts={posts} />);

      expect(screen.getByText('1 min de lectura')).toBeInTheDocument();
      expect(screen.getByText('10 min de lectura')).toBeInTheDocument();
      expect(screen.getByText('30 min de lectura')).toBeInTheDocument();
    });
  });

  describe('Post Card - Link', () => {
    it('should link to /blog/{slug}', () => {
      const post = createMockBlogPost({ slug: 'my-awesome-post' });

      render(<RelatedPosts posts={[post]} />);

      const link = screen.getByTestId('post-link');
      expect(link).toHaveAttribute('href', '/blog/my-awesome-post');
    });

    it('should have group class for hover effects', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const link = screen.getByTestId('post-link');
      expect(link).toHaveClass('group');
    });

    it('should have hover shadow effect', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const link = screen.getByTestId('post-link');
      expect(link).toHaveClass('hover:shadow-md');
    });
  });

  describe('Dark Mode Styling', () => {
    it('should apply dark mode background to cards', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const link = screen.getByTestId('post-link');
      expect(link).toHaveClass('dark:bg-gray-800');
    });

    it('should apply dark mode border to cards', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const link = screen.getByTestId('post-link');
      expect(link).toHaveClass('border-gray-200');
      expect(link).toHaveClass('dark:border-gray-700');
    });

    it('should apply dark mode text color to title', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('text-gray-900');
      expect(title).toHaveClass('dark:text-gray-100');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single post', () => {
      const post = createMockBlogPost();

      render(<RelatedPosts posts={[post]} />);

      expect(screen.getAllByTestId('post-link')).toHaveLength(1);
    });

    it('should handle posts with special characters in title', () => {
      const post = createMockBlogPost({
        title: '¿Cómo cuidar a tu mascota? Tips & consejos',
      });

      render(<RelatedPosts posts={[post]} />);

      expect(
        screen.getByText('¿Cómo cuidar a tu mascota? Tips & consejos')
      ).toBeInTheDocument();
    });

    it('should handle posts with very long categories', () => {
      const post = createMockBlogPost({
        category: 'cuidado-de-mascotas-exoticas',
      });

      render(<RelatedPosts posts={[post]} />);

      expect(screen.getByText('cuidado-de-mascotas-exoticas')).toBeInTheDocument();
    });

    it('should use uuid as key for posts', () => {
      const posts = [
        createMockBlogPost({ uuid: 'unique-id-1', title: 'Post 1' }),
        createMockBlogPost({ uuid: 'unique-id-2', title: 'Post 2' }),
      ];

      // This test verifies that posts render correctly - if keys were duplicated,
      // React would warn and potentially not render correctly
      render(<RelatedPosts posts={posts} />);

      expect(screen.getByText('Post 1')).toBeInTheDocument();
      expect(screen.getByText('Post 2')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive grid classes', () => {
      const posts = [createMockBlogPost()];

      const { container } = render(<RelatedPosts posts={posts} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-3');
    });

    it('should have responsive padding on section', () => {
      const posts = [createMockBlogPost()];

      const { container } = render(<RelatedPosts posts={posts} />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('py-12');
      expect(section).toHaveClass('md:py-16');
    });
  });
});
