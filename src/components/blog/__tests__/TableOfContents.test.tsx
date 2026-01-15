/**
 * Component tests for TableOfContents
 * Tests heading extraction, scroll tracking, and navigation functionality
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { TableOfContents } from '../TableOfContents';

// Mock extractHeadings from client
jest.mock('@/lib/storyblok/client', () => ({
  extractHeadings: jest.fn(),
}));

import { extractHeadings } from '@/lib/storyblok/client';

const mockExtractHeadings = extractHeadings as jest.MockedFunction<
  typeof extractHeadings
>;

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  takeRecords = () => [] as IntersectionObserverEntry[];

  // Helper to simulate intersection
  simulateIntersection(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this);
  }
}

let mockIntersectionObserverInstance: MockIntersectionObserver | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  mockIntersectionObserverInstance = null;

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn((callback) => {
    mockIntersectionObserverInstance = new MockIntersectionObserver(callback);
    return mockIntersectionObserverInstance;
  }) as unknown as typeof IntersectionObserver;

  // Mock window.scrollTo
  global.scrollTo = jest.fn();

  // Mock window.pageYOffset
  Object.defineProperty(window, 'pageYOffset', {
    value: 0,
    writable: true,
  });
});

describe('TableOfContents', () => {
  const mockContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Introduction' }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Overview' }],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Main Content' }],
      },
    ],
  };

  const mockHeadings = [
    { level: 2, text: 'Introduction', id: 'introduction' },
    { level: 3, text: 'Overview', id: 'overview' },
    { level: 2, text: 'Main Content', id: 'main-content' },
  ];

  describe('Rendering', () => {
    it('should render null when content has no headings', () => {
      mockExtractHeadings.mockReturnValue([]);

      const { container } = render(<TableOfContents content={mockContent} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render null when extractHeadings returns empty array', () => {
      mockExtractHeadings.mockReturnValue([]);

      const { container } = render(<TableOfContents content={mockContent} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render the TOC section title', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      expect(screen.getByText('Contenido')).toBeInTheDocument();
    });

    it('should render all h2 and h3 headings', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should filter out h1, h4, h5, h6 headings', () => {
      const headingsWithAllLevels = [
        { level: 1, text: 'H1 Title', id: 'h1-title' },
        { level: 2, text: 'H2 Section', id: 'h2-section' },
        { level: 3, text: 'H3 Subsection', id: 'h3-subsection' },
        { level: 4, text: 'H4 Detail', id: 'h4-detail' },
        { level: 5, text: 'H5 Extra', id: 'h5-extra' },
        { level: 6, text: 'H6 Tiny', id: 'h6-tiny' },
      ];
      mockExtractHeadings.mockReturnValue(headingsWithAllLevels);

      render(<TableOfContents content={mockContent} />);

      // Should only render h2 and h3
      expect(screen.getByText('H2 Section')).toBeInTheDocument();
      expect(screen.getByText('H3 Subsection')).toBeInTheDocument();

      // Should NOT render other levels
      expect(screen.queryByText('H1 Title')).not.toBeInTheDocument();
      expect(screen.queryByText('H4 Detail')).not.toBeInTheDocument();
      expect(screen.queryByText('H5 Extra')).not.toBeInTheDocument();
      expect(screen.queryByText('H6 Tiny')).not.toBeInTheDocument();
    });

    it('should render headings as buttons', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have nav element with aria-label', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const nav = screen.getByRole('navigation', {
        name: 'Tabla de contenidos',
      });
      expect(nav).toBeInTheDocument();
    });

    it('should render heading buttons with accessible text', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      expect(
        screen.getByRole('button', { name: 'Introduction' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Overview' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Main Content' })
      ).toBeInTheDocument();
    });
  });

  describe('Indentation', () => {
    it('should indent h3 headings with paddingLeft', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const listItems = screen.getAllByRole('listitem');

      // h2 items (level 2) should have no indentation
      expect(listItems[0]).toHaveStyle({ paddingLeft: '0' });
      // h3 items (level 3) should be indented
      expect(listItems[1]).toHaveStyle({ paddingLeft: '1rem' });
      // h2 items (level 2) should have no indentation
      expect(listItems[2]).toHaveStyle({ paddingLeft: '0' });
    });

    it('should not indent h2 headings', () => {
      const onlyH2Headings = [
        { level: 2, text: 'First Section', id: 'first-section' },
        { level: 2, text: 'Second Section', id: 'second-section' },
      ];
      mockExtractHeadings.mockReturnValue(onlyH2Headings);

      render(<TableOfContents content={mockContent} />);

      const listItems = screen.getAllByRole('listitem');
      listItems.forEach((item) => {
        expect(item).toHaveStyle({ paddingLeft: '0' });
      });
    });
  });

  describe('Scroll Navigation', () => {
    it('should scroll to section when button is clicked', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      // Create mock element in document
      const mockElement = document.createElement('div');
      mockElement.id = 'introduction';
      mockElement.getBoundingClientRect = jest.fn(() => ({
        top: 500,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));
      document.body.appendChild(mockElement);

      render(<TableOfContents content={mockContent} />);

      const button = screen.getByRole('button', { name: 'Introduction' });
      fireEvent.click(button);

      expect(global.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });

      // Cleanup
      document.body.removeChild(mockElement);
    });

    it('should not throw when clicking on heading with no element in DOM', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const button = screen.getByRole('button', { name: 'Introduction' });

      // Should not throw
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should apply yOffset when scrolling to account for sticky header', () => {
      mockExtractHeadings.mockReturnValue([
        { level: 2, text: 'Test Section', id: 'test-section' },
      ]);

      const mockElement = document.createElement('div');
      mockElement.id = 'test-section';
      mockElement.getBoundingClientRect = jest.fn(() => ({
        top: 200,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));
      document.body.appendChild(mockElement);

      render(<TableOfContents content={mockContent} />);

      const button = screen.getByRole('button', { name: 'Test Section' });
      fireEvent.click(button);

      // scrollTo should be called with offset (200 + 0 - 100 = 100)
      expect(global.scrollTo).toHaveBeenCalledWith({
        top: 100, // 200 (top) + 0 (pageYOffset) - 100 (yOffset)
        behavior: 'smooth',
      });

      document.body.removeChild(mockElement);
    });
  });

  describe('IntersectionObserver', () => {
    it('should create IntersectionObserver when headings exist', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      // Create mock elements in document
      mockHeadings.forEach((heading) => {
        const el = document.createElement('div');
        el.id = heading.id;
        document.body.appendChild(el);
      });

      render(<TableOfContents content={mockContent} />);

      expect(global.IntersectionObserver).toHaveBeenCalled();

      // Cleanup
      mockHeadings.forEach((heading) => {
        const el = document.getElementById(heading.id);
        if (el) document.body.removeChild(el);
      });
    });

    it('should observe all heading elements', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      // Create mock elements in document
      mockHeadings.forEach((heading) => {
        const el = document.createElement('div');
        el.id = heading.id;
        document.body.appendChild(el);
      });

      render(<TableOfContents content={mockContent} />);

      expect(mockObserve).toHaveBeenCalledTimes(3);

      // Cleanup
      mockHeadings.forEach((heading) => {
        const el = document.getElementById(heading.id);
        if (el) document.body.removeChild(el);
      });
    });

    it('should disconnect observer on unmount', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      const { unmount } = render(<TableOfContents content={mockContent} />);

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should highlight active heading when it intersects', async () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      // Create mock elements
      const introElement = document.createElement('div');
      introElement.id = 'introduction';
      document.body.appendChild(introElement);

      render(<TableOfContents content={mockContent} />);

      // Simulate intersection
      await act(async () => {
        mockIntersectionObserverInstance?.simulateIntersection([
          {
            isIntersecting: true,
            target: introElement,
          },
        ]);
      });

      const introButton = screen.getByRole('button', { name: 'Introduction' });
      expect(introButton).toHaveClass('text-[#75a99c]');
      expect(introButton).toHaveClass('font-medium');

      document.body.removeChild(introElement);
    });

    it('should update active heading when scrolling to different section', async () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      // Create mock elements
      const introElement = document.createElement('div');
      introElement.id = 'introduction';
      const mainElement = document.createElement('div');
      mainElement.id = 'main-content';
      document.body.appendChild(introElement);
      document.body.appendChild(mainElement);

      render(<TableOfContents content={mockContent} />);

      // First, introduction is active
      await act(async () => {
        mockIntersectionObserverInstance?.simulateIntersection([
          { isIntersecting: true, target: introElement },
        ]);
      });

      let introButton = screen.getByRole('button', { name: 'Introduction' });
      expect(introButton).toHaveClass('text-[#75a99c]');

      // Then scroll to main content
      await act(async () => {
        mockIntersectionObserverInstance?.simulateIntersection([
          { isIntersecting: true, target: mainElement },
        ]);
      });

      const mainButton = screen.getByRole('button', { name: 'Main Content' });
      expect(mainButton).toHaveClass('text-[#75a99c]');

      // Introduction should no longer be active color (it will have the inactive class)
      introButton = screen.getByRole('button', { name: 'Introduction' });
      expect(introButton).toHaveClass('text-gray-600');

      document.body.removeChild(introElement);
      document.body.removeChild(mainElement);
    });
  });

  describe('Styling', () => {
    it('should apply dark mode classes', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('dark:bg-gray-800');
      expect(nav).toHaveClass('dark:border-gray-700');
    });

    it('should have correct background and border styling', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-gray-50');
      expect(nav).toHaveClass('rounded-lg');
      expect(nav).toHaveClass('border');
      expect(nav).toHaveClass('border-gray-200');
    });

    it('should apply hover styling classes to inactive buttons', () => {
      mockExtractHeadings.mockReturnValue(mockHeadings);

      render(<TableOfContents content={mockContent} />);

      const button = screen.getByRole('button', { name: 'Introduction' });
      expect(button).toHaveClass('hover:text-[#75a99c]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle content with only h3 headings', () => {
      const onlyH3Headings = [
        { level: 3, text: 'Subsection 1', id: 'subsection-1' },
        { level: 3, text: 'Subsection 2', id: 'subsection-2' },
      ];
      mockExtractHeadings.mockReturnValue(onlyH3Headings);

      render(<TableOfContents content={mockContent} />);

      expect(screen.getByText('Subsection 1')).toBeInTheDocument();
      expect(screen.getByText('Subsection 2')).toBeInTheDocument();
    });

    it('should handle single heading', () => {
      mockExtractHeadings.mockReturnValue([
        { level: 2, text: 'Only Section', id: 'only-section' },
      ]);

      render(<TableOfContents content={mockContent} />);

      expect(screen.getByText('Only Section')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('should handle headings with special characters in text', () => {
      mockExtractHeadings.mockReturnValue([
        {
          level: 2,
          text: 'Sección con acentos y ñ',
          id: 'seccion-con-acentos-y-n',
        },
      ]);

      render(<TableOfContents content={mockContent} />);

      expect(screen.getByText('Sección con acentos y ñ')).toBeInTheDocument();
    });

    it('should not create observer if headings array becomes empty after filtering', () => {
      // Only h1 and h4 headings - should be filtered out
      const nonTocHeadings = [
        { level: 1, text: 'Title', id: 'title' },
        { level: 4, text: 'Detail', id: 'detail' },
      ];
      mockExtractHeadings.mockReturnValue(nonTocHeadings);

      const { container } = render(<TableOfContents content={mockContent} />);

      expect(container.firstChild).toBeNull();
      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });
  });
});
