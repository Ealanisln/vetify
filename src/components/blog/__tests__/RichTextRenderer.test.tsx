/**
 * Component tests for RichTextRenderer
 * Tests rich text rendering with custom node and mark resolvers
 */

import { render, screen } from '@testing-library/react';
import { RichTextRenderer } from '../RichTextRenderer';
import { render as storyblokRender } from 'storyblok-rich-text-react-renderer';

// Mock storyblok-rich-text-react-renderer
jest.mock('storyblok-rich-text-react-renderer', () => ({
  render: jest.fn(),
}));

const mockStoryblokRender = storyblokRender as jest.MockedFunction<
  typeof storyblokRender
>;

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <img
      src={props.src}
      alt={props.alt}
      data-testid="next-image"
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
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

// Mock getStoryblokImageUrl
jest.mock('@/lib/storyblok/client', () => ({
  getStoryblokImageUrl: jest.fn(
    (url: string, _options?: { width?: number; quality?: number }) =>
      url ? `${url}?optimized=true` : null
  ),
}));

describe('RichTextRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoryblokRender.mockReturnValue(<div>Rendered content</div>);
  });

  describe('Null Content Handling', () => {
    it('should return null when content is null', () => {
      // @ts-expect-error - Testing null content
      const { container } = render(<RichTextRenderer content={null} />);
      expect(container.firstChild).toBeNull();
      expect(mockStoryblokRender).not.toHaveBeenCalled();
    });

    it('should return null when content is undefined', () => {
      // @ts-expect-error - Testing undefined content
      const { container } = render(<RichTextRenderer content={undefined} />);
      expect(container.firstChild).toBeNull();
      expect(mockStoryblokRender).not.toHaveBeenCalled();
    });
  });

  describe('Basic Rendering', () => {
    it('should render content wrapper with rich-text-content class', () => {
      const mockContent = { type: 'doc', content: [] };

      render(<RichTextRenderer content={mockContent} />);

      const wrapper = screen.getByText('Rendered content').closest('.rich-text-content');
      expect(wrapper).toBeInTheDocument();
    });

    it('should call storyblok render with content and resolvers', () => {
      const mockContent = { type: 'doc', content: [] };

      render(<RichTextRenderer content={mockContent} />);

      expect(mockStoryblokRender).toHaveBeenCalledWith(
        mockContent,
        expect.objectContaining({
          markResolvers: expect.any(Object),
          nodeResolvers: expect.any(Object),
          blokResolvers: expect.any(Object),
        })
      );
    });
  });

  describe('Mark Resolvers', () => {
    let markResolvers: {
      link: (children: React.ReactNode, props: Record<string, unknown>) => JSX.Element;
      bold: (children: React.ReactNode) => JSX.Element;
      italic: (children: React.ReactNode) => JSX.Element;
      code: (children: React.ReactNode) => JSX.Element;
    };

    beforeEach(() => {
      const mockContent = { type: 'doc', content: [] };
      render(<RichTextRenderer content={mockContent} />);

      const call = mockStoryblokRender.mock.calls[0];
      markResolvers = call[1]?.markResolvers as typeof markResolvers;
    });

    describe('link mark', () => {
      it('should render internal link with Next.js Link component', () => {
        const result = markResolvers.link('Click here', {
          href: '/blog/test',
          linktype: 'story',
        });

        render(result);

        const link = screen.getByTestId('next-link');
        expect(link).toHaveAttribute('href', '/blog/test');
        expect(link).toHaveClass('text-[#75a99c]');
      });

      it('should render internal link for relative URLs', () => {
        const result = markResolvers.link('Internal link', {
          href: '/about',
          linktype: 'url',
        });

        render(result);

        const link = screen.getByTestId('next-link');
        expect(link).toHaveAttribute('href', '/about');
      });

      it('should render external link with target blank', () => {
        const result = markResolvers.link('External link', {
          href: 'https://example.com',
          linktype: 'url',
        });

        render(result);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('should use provided target for external links', () => {
        const result = markResolvers.link('External link', {
          href: 'https://example.com',
          linktype: 'url',
          target: '_self',
        });

        render(result);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('target', '_self');
      });

      it('should use # as fallback href for internal link', () => {
        const result = markResolvers.link('Link', {
          href: undefined,
          linktype: 'story',
        });

        render(result);

        const link = screen.getByTestId('next-link');
        expect(link).toHaveAttribute('href', '#');
      });
    });

    describe('bold mark', () => {
      it('should render bold text with strong element', () => {
        const result = markResolvers.bold('Bold text');

        render(result);

        const strong = screen.getByText('Bold text');
        expect(strong.tagName).toBe('STRONG');
        expect(strong).toHaveClass('font-semibold');
      });
    });

    describe('italic mark', () => {
      it('should render italic text with em element', () => {
        const result = markResolvers.italic('Italic text');

        render(result);

        const em = screen.getByText('Italic text');
        expect(em.tagName).toBe('EM');
      });
    });

    describe('code mark', () => {
      it('should render inline code with styling', () => {
        const result = markResolvers.code('const x = 1');

        render(result);

        const code = screen.getByText('const x = 1');
        expect(code.tagName).toBe('CODE');
        expect(code).toHaveClass('bg-gray-100');
        expect(code).toHaveClass('dark:bg-gray-800');
        expect(code).toHaveClass('font-mono');
      });
    });
  });

  describe('Node Resolvers', () => {
    let nodeResolvers: {
      heading: (children: React.ReactNode, props: { level: number }) => JSX.Element;
      paragraph: (children: React.ReactNode) => JSX.Element;
      bullet_list: (children: React.ReactNode) => JSX.Element;
      ordered_list: (children: React.ReactNode) => JSX.Element;
      list_item: (children: React.ReactNode) => JSX.Element;
      blockquote: (children: React.ReactNode) => JSX.Element;
      code_block: (children: React.ReactNode, props: unknown) => JSX.Element;
      horizontal_rule: () => JSX.Element;
      image: (children: React.ReactNode, props: { src?: string; alt?: string; title?: string }) => JSX.Element | null;
    };

    beforeEach(() => {
      const mockContent = { type: 'doc', content: [] };
      render(<RichTextRenderer content={mockContent} />);

      const call = mockStoryblokRender.mock.calls[0];
      nodeResolvers = call[1]?.nodeResolvers as typeof nodeResolvers;
    });

    describe('heading node', () => {
      it('should render h1 with correct classes', () => {
        const result = nodeResolvers.heading('Title', { level: 1 });

        render(result);

        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveClass('text-3xl', 'font-bold');
      });

      it('should render h2 with correct classes', () => {
        const result = nodeResolvers.heading('Section', { level: 2 });

        render(result);

        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveClass('text-2xl', 'font-bold');
      });

      it('should render h3 with correct classes', () => {
        const result = nodeResolvers.heading('Subsection', { level: 3 });

        render(result);

        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toHaveClass('text-xl', 'font-semibold');
      });

      it('should render h4 with correct classes', () => {
        const result = nodeResolvers.heading('Sub-subsection', { level: 4 });

        render(result);

        const heading = screen.getByRole('heading', { level: 4 });
        expect(heading).toHaveClass('text-lg', 'font-semibold');
      });

      it('should render h5 with correct classes', () => {
        const result = nodeResolvers.heading('Minor heading', { level: 5 });

        render(result);

        const heading = screen.getByRole('heading', { level: 5 });
        expect(heading).toHaveClass('text-base', 'font-semibold');
      });

      it('should render h6 with correct classes', () => {
        const result = nodeResolvers.heading('Smallest heading', { level: 6 });

        render(result);

        const heading = screen.getByRole('heading', { level: 6 });
        expect(heading).toHaveClass('text-sm', 'font-semibold');
      });

      it('should generate ID from heading text', () => {
        const result = nodeResolvers.heading('My Section Title', { level: 2 });

        render(result);

        const heading = screen.getByRole('heading');
        expect(heading).toHaveAttribute('id', 'my-section-title');
      });

      it('should generate URL-safe ID from text with accents', () => {
        const result = nodeResolvers.heading('Sección con acentos', {
          level: 2,
        });

        render(result);

        const heading = screen.getByRole('heading');
        expect(heading).toHaveAttribute('id', 'seccion-con-acentos');
      });

      it('should generate ID from text with special characters', () => {
        const result = nodeResolvers.heading('What is React?!', { level: 2 });

        render(result);

        const heading = screen.getByRole('heading');
        expect(heading).toHaveAttribute('id', 'what-is-react');
      });
    });

    describe('paragraph node', () => {
      it('should render paragraph with correct styling', () => {
        const result = nodeResolvers.paragraph('Some text content');

        render(result);

        const paragraph = screen.getByText('Some text content');
        expect(paragraph.tagName).toBe('P');
        expect(paragraph).toHaveClass('mb-4', 'leading-relaxed');
        expect(paragraph).toHaveClass('text-gray-700', 'dark:text-gray-300');
      });
    });

    describe('bullet_list node', () => {
      it('should render unordered list with correct styling', () => {
        const result = nodeResolvers.bullet_list(
          <li>Item 1</li>
        );

        render(result);

        const list = screen.getByRole('list');
        expect(list.tagName).toBe('UL');
        expect(list).toHaveClass('list-disc', 'list-inside');
      });
    });

    describe('ordered_list node', () => {
      it('should render ordered list with correct styling', () => {
        const result = nodeResolvers.ordered_list(
          <li>Item 1</li>
        );

        render(result);

        const list = screen.getByRole('list');
        expect(list.tagName).toBe('OL');
        expect(list).toHaveClass('list-decimal', 'list-inside');
      });
    });

    describe('list_item node', () => {
      it('should render list item with padding', () => {
        const result = nodeResolvers.list_item('List item content');

        render(result);

        const item = screen.getByText('List item content');
        expect(item.tagName).toBe('LI');
        expect(item).toHaveClass('pl-2');
      });
    });

    describe('blockquote node', () => {
      it('should render blockquote with border and styling', () => {
        const result = nodeResolvers.blockquote('Quote content');

        render(result);

        const quote = screen.getByText('Quote content');
        expect(quote.tagName).toBe('BLOCKQUOTE');
        expect(quote).toHaveClass('border-l-4', 'border-[#75a99c]');
        expect(quote).toHaveClass('italic');
        expect(quote).toHaveClass('bg-gray-50', 'dark:bg-gray-800/50');
      });
    });

    describe('code_block node', () => {
      it('should render code block with pre and code tags', () => {
        const result = nodeResolvers.code_block('function hello() {}', {});

        render(result);

        const pre = screen.getByText('function hello() {}').closest('pre');
        expect(pre).toHaveClass('bg-gray-900', 'dark:bg-gray-950');
        expect(pre).toHaveClass('overflow-x-auto');

        const code = screen.getByText('function hello() {}');
        expect(code.tagName).toBe('CODE');
        expect(code).toHaveClass('font-mono');
      });
    });

    describe('horizontal_rule node', () => {
      it('should render horizontal rule with styling', () => {
        const result = nodeResolvers.horizontal_rule();

        const { container } = render(result);

        const hr = container.querySelector('hr');
        expect(hr).toBeInTheDocument();
        expect(hr).toHaveClass('my-8', 'border-t');
        expect(hr).toHaveClass('border-gray-200', 'dark:border-gray-700');
      });
    });

    describe('image node', () => {
      it('should render image with optimized URL', () => {
        const result = nodeResolvers.image(null, {
          src: 'https://example.com/image.jpg',
          alt: 'Test image',
        });

        render(result!);

        const img = screen.getByTestId('next-image');
        expect(img).toHaveAttribute(
          'src',
          'https://example.com/image.jpg?optimized=true'
        );
        expect(img).toHaveAttribute('alt', 'Test image');
      });

      it('should return null when src is empty', () => {
        const result = nodeResolvers.image(null, { src: '' });

        expect(result).toBeNull();
      });

      it('should return null when src is undefined', () => {
        const result = nodeResolvers.image(null, {});

        expect(result).toBeNull();
      });

      it('should render figcaption with title if provided', () => {
        const result = nodeResolvers.image(null, {
          src: 'https://example.com/image.jpg',
          alt: 'Alt text',
          title: 'Image caption',
        });

        render(result!);

        expect(screen.getByText('Image caption')).toBeInTheDocument();
      });

      it('should render figcaption with alt if no title', () => {
        const result = nodeResolvers.image(null, {
          src: 'https://example.com/image.jpg',
          alt: 'Alt text description',
        });

        render(result!);

        expect(screen.getByText('Alt text description')).toBeInTheDocument();
      });

      it('should not render figcaption if no title or alt', () => {
        const result = nodeResolvers.image(null, {
          src: 'https://example.com/image.jpg',
        });

        render(result!);

        expect(screen.queryByRole('figure')?.querySelector('figcaption')).toBeNull();
      });

      it('should render figure with correct layout classes', () => {
        const result = nodeResolvers.image(null, {
          src: 'https://example.com/image.jpg',
          alt: 'Test',
        });

        const { container } = render(result!);

        const figure = container.querySelector('figure');
        expect(figure).toHaveClass('my-8');

        const imageWrapper = figure?.querySelector('.aspect-video');
        expect(imageWrapper).toHaveClass('rounded-lg', 'overflow-hidden');
      });
    });
  });

  describe('Blok Resolvers', () => {
    let blokResolvers: {
      callout_box: (props: {
        type: string;
        title?: string;
        content?: unknown;
      }) => JSX.Element;
    };

    beforeEach(() => {
      const mockContent = { type: 'doc', content: [] };
      render(<RichTextRenderer content={mockContent} />);

      const call = mockStoryblokRender.mock.calls[0];
      blokResolvers = call[1]?.blokResolvers as typeof blokResolvers;
    });

    describe('callout_box blok', () => {
      // Helper to find the outer callout wrapper (the one with bg/border classes)
      const getCalloutWrapper = (titleText: string) => {
        const title = screen.getByText(titleText);
        // Structure: outer div > flex div > span + div > h4
        // So from h4, we need to go up 3 levels to reach the outer wrapper
        return title.closest('.my-6');
      };

      it('should render info callout with correct styling', () => {
        const result = blokResolvers.callout_box({
          type: 'info',
          title: 'Information',
          content: { type: 'doc', content: [] },
        });

        render(result);

        const wrapper = getCalloutWrapper('Information');
        expect(wrapper).toHaveClass('bg-blue-50');
        expect(wrapper).toHaveClass('border-blue-200');
      });

      it('should render warning callout with correct styling', () => {
        const result = blokResolvers.callout_box({
          type: 'warning',
          title: 'Warning!',
          content: { type: 'doc', content: [] },
        });

        render(result);

        const wrapper = getCalloutWrapper('Warning!');
        expect(wrapper).toHaveClass('bg-yellow-50');
        expect(wrapper).toHaveClass('border-yellow-200');
      });

      it('should render tip callout with correct styling', () => {
        const result = blokResolvers.callout_box({
          type: 'tip',
          title: 'Pro Tip',
          content: { type: 'doc', content: [] },
        });

        render(result);

        const wrapper = getCalloutWrapper('Pro Tip');
        expect(wrapper).toHaveClass('bg-green-50');
        expect(wrapper).toHaveClass('border-green-200');
      });

      it('should render important callout with correct styling', () => {
        const result = blokResolvers.callout_box({
          type: 'important',
          title: 'Important',
          content: { type: 'doc', content: [] },
        });

        render(result);

        const wrapper = getCalloutWrapper('Important');
        expect(wrapper).toHaveClass('bg-red-50');
        expect(wrapper).toHaveClass('border-red-200');
      });

      it('should fallback to info style for unknown type', () => {
        const result = blokResolvers.callout_box({
          type: 'unknown',
          title: 'Unknown type',
          content: { type: 'doc', content: [] },
        });

        render(result);

        const wrapper = getCalloutWrapper('Unknown type');
        expect(wrapper).toHaveClass('bg-blue-50');
      });

      it('should render callout without title', () => {
        const result = blokResolvers.callout_box({
          type: 'info',
          content: { type: 'doc', content: [] },
        });

        const { container } = render(result);

        // Should not have h4 element
        expect(container.querySelector('h4')).toBeNull();
      });

      it('should render correct icons for each type', () => {
        const types = [
          { type: 'info', icon: 'ℹ️' },
          { type: 'warning', icon: '⚠️' },
          { type: 'tip', icon: '💡' },
          { type: 'important', icon: '❗' },
        ];

        types.forEach(({ type, icon }) => {
          const result = blokResolvers.callout_box({
            type,
            title: `${type} callout`,
          });

          const { container } = render(result);
          expect(container.textContent).toContain(icon);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty doc content', () => {
      const emptyContent = { type: 'doc', content: [] };

      render(<RichTextRenderer content={emptyContent} />);

      expect(mockStoryblokRender).toHaveBeenCalledWith(
        emptyContent,
        expect.any(Object)
      );
    });

    it('should handle content with only type property', () => {
      const minimalContent = { type: 'doc' };

      render(<RichTextRenderer content={minimalContent} />);

      expect(mockStoryblokRender).toHaveBeenCalled();
    });
  });
});
