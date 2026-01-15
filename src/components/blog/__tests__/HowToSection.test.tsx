/**
 * Component tests for HowToSection
 * Tests step-by-step guide rendering and structured data
 */

import { render, screen } from '@testing-library/react';
import { HowToSection } from '../HowToSection';

// Mock storyblok-rich-text-react-renderer
jest.mock('storyblok-rich-text-react-renderer', () => ({
  render: (content: unknown) => {
    if (!content || typeof content !== 'object') return null;
    const node = content as { type?: string; text?: string; content?: unknown[] };
    if (node.type === 'text' && node.text) return node.text;
    return 'Rendered content';
  },
}));

// Mock StructuredData component
let capturedSchemaData: unknown = null;
jest.mock('@/components/seo/StructuredData', () => ({
  StructuredData: ({ data }: { data: unknown }) => {
    capturedSchemaData = data;
    return <div data-testid="structured-data" />;
  },
}));

// Mock getStoryblokImageUrl
jest.mock('@/lib/storyblok/client', () => ({
  getStoryblokImageUrl: (url: string, options?: { width?: number; height?: number }) => {
    if (!url) return '';
    return `${url}?w=${options?.width || 0}&h=${options?.height || 0}`;
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} data-testid="step-image" />
  ),
}));

describe('HowToSection', () => {
  const mockSteps = [
    {
      _uid: 'step-1',
      step_number: 1,
      title: 'Preparar el área de baño',
      description: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Coloca toallas y ten el champú listo.' },
            ],
          },
        ],
      },
      image: {
        filename: 'https://a.storyblok.com/f/123/step1.jpg',
        alt: 'Paso 1',
      },
    },
    {
      _uid: 'step-2',
      step_number: 2,
      title: 'Mojar el pelaje',
      description: {
        type: 'text',
        text: 'Usa agua tibia para mojar todo el cuerpo.',
      },
    },
    {
      _uid: 'step-3',
      step_number: 3,
      title: 'Aplicar champú',
      description: {
        type: 'text',
        text: 'Masajea suavemente el champú en el pelaje.',
      },
      image: {
        filename: 'https://a.storyblok.com/f/123/step3.jpg',
        alt: 'Paso 3',
      },
    },
  ];

  beforeEach(() => {
    capturedSchemaData = null;
  });

  it('should render nothing when steps array is empty', () => {
    const { container } = render(<HowToSection steps={[]} />);
    expect(container.querySelector('section')).toBeNull();
  });

  it('should render nothing when steps is undefined', () => {
    // @ts-expect-error - Testing with undefined
    const { container } = render(<HowToSection steps={undefined} />);
    expect(container.querySelector('section')).toBeNull();
  });

  it('should render default title', () => {
    render(<HowToSection steps={mockSteps} />);
    expect(screen.getByText('Guía Paso a Paso')).toBeInTheDocument();
  });

  it('should render custom title when provided', () => {
    render(<HowToSection steps={mockSteps} title="Cómo bañar a tu perro" />);
    expect(screen.getByText('Cómo bañar a tu perro')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <HowToSection
        steps={mockSteps}
        description="Sigue estos pasos para bañar a tu mascota."
      />
    );
    expect(screen.getByText('Sigue estos pasos para bañar a tu mascota.')).toBeInTheDocument();
  });

  it('should render all step titles', () => {
    render(<HowToSection steps={mockSteps} />);

    mockSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it('should render step numbers', () => {
    render(<HowToSection steps={mockSteps} />);

    // Step numbers should be displayed
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render step images when provided', () => {
    render(<HowToSection steps={mockSteps} />);

    const images = screen.getAllByTestId('step-image');
    // Only steps 1 and 3 have images
    expect(images).toHaveLength(2);
  });

  it('should generate correct ID anchors for steps', () => {
    render(<HowToSection steps={mockSteps} />);

    expect(document.getElementById('paso-1')).toBeInTheDocument();
    expect(document.getElementById('paso-2')).toBeInTheDocument();
    expect(document.getElementById('paso-3')).toBeInTheDocument();
  });

  it('should render structured data component', () => {
    render(<HowToSection steps={mockSteps} />);
    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
  });

  it('should generate HowTo schema', () => {
    render(<HowToSection steps={mockSteps} title="Cómo bañar" />);

    const schema = capturedSchemaData as {
      '@context': string;
      '@type': string;
      name: string;
      step: Array<{
        '@type': string;
        position: number;
        name: string;
      }>;
    };

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('HowTo');
    expect(schema.name).toBe('Cómo bañar');
    expect(schema.step).toHaveLength(3);
  });

  it('should include step details in schema', () => {
    render(<HowToSection steps={mockSteps} />);

    const schema = capturedSchemaData as {
      step: Array<{
        '@type': string;
        position: number;
        name: string;
        text: string;
      }>;
    };

    schema.step.forEach((step, index) => {
      expect(step['@type']).toBe('HowToStep');
      expect(step.position).toBe(index + 1);
      expect(step.name).toBe(mockSteps[index].title);
      expect(typeof step.text).toBe('string');
    });
  });

  it('should include articleUrl in schema when provided', () => {
    render(
      <HowToSection
        steps={mockSteps}
        articleUrl="https://vetify.mx/blog/como-banar-perro"
      />
    );

    const schema = capturedSchemaData as {
      step: Array<{
        url?: string;
      }>;
    };

    // Steps should have URLs with anchors
    expect(schema.step[0].url).toContain('#paso-1');
    expect(schema.step[1].url).toContain('#paso-2');
  });

  it('should use step_number from data when available', () => {
    const customNumberSteps = [
      {
        _uid: 'step-a',
        step_number: 5,
        title: 'Custom numbered step',
        description: { type: 'text', text: 'Description' },
      },
    ];

    render(<HowToSection steps={customNumberSteps} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should fallback to index when step_number is not provided', () => {
    const stepsWithoutNumbers = [
      {
        _uid: 'step-a',
        title: 'First step',
        description: { type: 'text', text: 'Description' },
      },
      {
        _uid: 'step-b',
        title: 'Second step',
        description: { type: 'text', text: 'Description' },
      },
    ];

    // @ts-expect-error - Testing without step_number
    render(<HowToSection steps={stepsWithoutNumbers} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render connector lines between steps except last', () => {
    render(<HowToSection steps={mockSteps} />);

    // There should be connector lines between steps (3 steps = 2 connectors)
    const stepContainers = document.querySelectorAll('[id^="paso-"]');
    expect(stepContainers).toHaveLength(3);
  });

  it('should handle steps without images', () => {
    const stepsNoImages = [
      {
        _uid: 'step-1',
        step_number: 1,
        title: 'Step without image',
        description: { type: 'text', text: 'No image here' },
      },
    ];

    render(<HowToSection steps={stepsNoImages} />);

    expect(screen.queryByTestId('step-image')).not.toBeInTheDocument();
    expect(screen.getByText('Step without image')).toBeInTheDocument();
  });

  it('should use step title as image alt when image alt is missing', () => {
    const stepWithNoImageAlt = [
      {
        _uid: 'step-1',
        step_number: 1,
        title: 'Step title as alt',
        description: { type: 'text', text: 'Description' },
        image: {
          filename: 'https://a.storyblok.com/f/123/image.jpg',
        },
      },
    ];

    // @ts-expect-error - Testing without image alt
    render(<HowToSection steps={stepWithNoImageAlt} />);

    const image = screen.getByTestId('step-image');
    expect(image).toHaveAttribute('alt', 'Step title as alt');
  });

  it('should apply correct styling classes', () => {
    render(<HowToSection steps={mockSteps} />);

    // Check for main section styling
    const section = screen.getByText('Guía Paso a Paso').closest('section');
    expect(section).toHaveClass('my-12');
  });
});
