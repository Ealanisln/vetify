/**
 * Component tests for FAQSection
 * Tests FAQ accordion behavior and structured data generation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { FAQSection } from '../FAQSection';

// Mock storyblok-rich-text-react-renderer
jest.mock('storyblok-rich-text-react-renderer', () => ({
  render: (content: unknown) => {
    if (!content || typeof content !== 'object') return null;
    const node = content as { type?: string; text?: string; content?: unknown[] };
    if (node.type === 'text' && node.text) return node.text;
    return 'Rendered content';
  },
}));

// Mock StructuredData component - captures the data prop for assertions
let capturedSchemaData: unknown = null;
jest.mock('@/components/seo/StructuredData', () => ({
  StructuredData: ({ data }: { data: unknown }) => {
    capturedSchemaData = data;
    return <div data-testid="structured-data" />;
  },
}));

describe('FAQSection', () => {
  const mockItems = [
    {
      _uid: 'faq-1',
      question: '¿Con qué frecuencia debo vacunar a mi perro?',
      answer: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Los perros adultos deben vacunarse anualmente.' },
            ],
          },
        ],
      },
    },
    {
      _uid: 'faq-2',
      question: '¿Cuántas veces al día debo alimentar a mi gato?',
      answer: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Los gatos adultos deben comer 2-3 veces al día.' },
            ],
          },
        ],
      },
    },
    {
      _uid: 'faq-3',
      question: '¿Es necesario desparasitar a mi mascota?',
      answer: {
        type: 'text',
        text: 'Sí, la desparasitación regular es muy importante.',
      },
    },
  ];

  beforeEach(() => {
    capturedSchemaData = null;
  });

  it('should render nothing when items array is empty', () => {
    const { container } = render(<FAQSection items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when items is undefined', () => {
    // @ts-expect-error - Testing with undefined items
    const { container } = render(<FAQSection items={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the section title', () => {
    render(<FAQSection items={mockItems} />);
    expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument();
  });

  it('should render all FAQ questions', () => {
    render(<FAQSection items={mockItems} />);

    mockItems.forEach((item) => {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    });
  });

  it('should have first item open by default', () => {
    render(<FAQSection items={mockItems} />);

    const firstButton = screen.getByRole('button', { name: /vacunar/i });
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should toggle FAQ item when clicked', () => {
    render(<FAQSection items={mockItems} />);

    // First item should be open initially
    const firstButton = screen.getByRole('button', { name: /vacunar/i });
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    // Click to close
    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open again
    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should only allow one item open at a time', () => {
    render(<FAQSection items={mockItems} />);

    const firstButton = screen.getByRole('button', { name: /vacunar/i });
    const secondButton = screen.getByRole('button', { name: /alimentar/i });

    // First is open initially
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondButton).toHaveAttribute('aria-expanded', 'false');

    // Click second item
    fireEvent.click(secondButton);

    // Now second should be open, first closed
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    expect(secondButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should render structured data component', () => {
    render(<FAQSection items={mockItems} />);

    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
  });

  it('should generate correct structured data schema', () => {
    render(<FAQSection items={mockItems} />);

    const schema = capturedSchemaData as {
      '@context': string;
      '@type': string;
      mainEntity: Array<{
        '@type': string;
        name: string;
        acceptedAnswer: {
          '@type': string;
          text: string;
        };
      }>;
    };

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(3);
  });

  it('should have correct Question/Answer structure in schema', () => {
    render(<FAQSection items={mockItems} />);

    const schema = capturedSchemaData as {
      mainEntity: Array<{
        '@type': string;
        name: string;
        acceptedAnswer: {
          '@type': string;
          text: string;
        };
      }>;
    };

    schema.mainEntity.forEach((entity, index) => {
      expect(entity['@type']).toBe('Question');
      expect(entity.name).toBe(mockItems[index].question);
      expect(entity.acceptedAnswer['@type']).toBe('Answer');
      expect(typeof entity.acceptedAnswer.text).toBe('string');
    });
  });

  it('should render FAQ items with correct styling', () => {
    render(<FAQSection items={mockItems} />);

    // Check for section styling
    const title = screen.getByText('Preguntas Frecuentes');
    const section = title.closest('section');
    expect(section).toHaveClass('bg-gray-50');
  });

  it('should have accessible button with aria-expanded', () => {
    render(<FAQSection items={mockItems} />);

    const buttons = screen.getAllByRole('button');

    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-expanded');
    });
  });

  it('should handle items without _uid', () => {
    const itemsWithoutUid = [
      {
        question: 'Test question',
        answer: { type: 'text', text: 'Test answer' },
      },
    ];

    // @ts-expect-error - Testing without _uid
    render(<FAQSection items={itemsWithoutUid} />);

    expect(screen.getByText('Test question')).toBeInTheDocument();
  });

  it('should extract text correctly from nested rich text for schema', () => {
    const nestedItem = [
      {
        _uid: 'nested-1',
        question: 'Nested question',
        answer: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'First part ' },
                { type: 'text', text: 'second part' },
              ],
            },
          ],
        },
      },
    ];

    render(<FAQSection items={nestedItem} />);

    const schema = capturedSchemaData as {
      mainEntity: Array<{
        acceptedAnswer: {
          text: string;
        };
      }>;
    };

    // Text should be extracted from nested content
    expect(schema.mainEntity[0].acceptedAnswer.text).toContain('First part');
  });

  it('should handle empty answer content gracefully', () => {
    const itemWithEmptyAnswer = [
      {
        _uid: 'empty-1',
        question: 'Empty answer question',
        answer: {},
      },
    ];

    // @ts-expect-error - Testing with empty answer
    render(<FAQSection items={itemWithEmptyAnswer} />);

    expect(screen.getByText('Empty answer question')).toBeInTheDocument();
  });

  it('should close current item when clicking it again', () => {
    render(<FAQSection items={mockItems} />);

    const firstButton = screen.getByRole('button', { name: /vacunar/i });

    // Initially open
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    // Click to close
    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
  });
});
