import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TestimonialsSection } from '@/components/public/TestimonialsSection';
import {
  createMockPublicTenant,
  createMinimalPublicTenant,
} from '../../../utils/public-test-factories';

// Helper to filter framer-motion props
const filterMotionProps = (props: Record<string, unknown>) => {
  const motionProps = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
    'viewport', 'onAnimationStart', 'onAnimationComplete',
    'layout', 'layoutId', 'drag', 'dragConstraints',
  ];
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!motionProps.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
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

// Mock useThemeAware hook
jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({ isDark: false }),
}));

// Mock theme utilities
jest.mock('@/lib/themes', () => ({
  getTheme: () => ({
    id: 'modern',
    name: 'Modern',
    colors: {
      primary: '#75a99c',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      cardBg: '#ffffff',
      border: '#e5e7eb',
      primaryLight: '#e8f0ee',
      background: '#ffffff',
      backgroundAlt: '#f3f4f6',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      headingWeight: 700,
    },
    layout: {
      borderRadius: '0.5rem',
    },
  }),
}));

// Mock color-utils
jest.mock('@/lib/color-utils', () => ({
  generateDarkColors: () => ({
    text: '#f9fafb',
    textMuted: '#9ca3af',
    cardBg: '#1f2937',
    border: '#374151',
    primaryLight: '#1a2e28',
    backgroundAlt: '#1f2937',
  }),
}));

// Test data factories
function createMockTestimonial(overrides: Partial<{
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  submittedAt: Date;
  isFeatured: boolean;
}> = {}) {
  return {
    id: 'testimonial-1',
    reviewerName: 'Juan Pérez',
    rating: 5,
    text: 'Excelente atención para mi mascota. Muy profesionales y amables.',
    submittedAt: new Date('2024-01-15'),
    isFeatured: true,
    ...overrides,
  };
}

function createMockTestimonials(count: number = 3) {
  const names = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Pedro Sánchez'];
  const texts = [
    'Excelente atención para mi mascota. Muy profesionales y amables.',
    'El mejor servicio veterinario de la zona. Muy recomendado.',
    'Mi perrito quedó muy bien después de su cirugía. Gracias!',
    'Personal muy capacitado y atento. Volveremos sin duda.',
    'Increíble servicio. Mi gato ya está mucho mejor.',
  ];

  return Array.from({ length: count }, (_, i) =>
    createMockTestimonial({
      id: `testimonial-${i + 1}`,
      reviewerName: names[i % names.length],
      text: texts[i % texts.length],
      rating: 4 + (i % 2), // 4 or 5 stars
      submittedAt: new Date(`2024-01-${15 + i}`),
    })
  );
}

function createMockStats(overrides: Partial<{
  averageRating: number;
  totalCount: number;
}> = {}) {
  return {
    averageRating: 4.8,
    totalCount: 25,
    ...overrides,
  };
}

describe('TestimonialsSection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render section title', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText('Lo que dicen nuestros clientes')).toBeInTheDocument();
    });

    it('should render section with correct id for navigation', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      const section = container.querySelector('#testimonios');
      expect(section).toBeInTheDocument();
    });

    it('should render average rating', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats({ averageRating: 4.8 });

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('should render total count text', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats({ totalCount: 25 });

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText(/de 25 reseñas/)).toBeInTheDocument();
    });

    it('should use singular "reseña" when count is 1', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(1);
      const stats = createMockStats({ totalCount: 1 });

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText(/de 1 reseña$/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should return null when no testimonials', () => {
      const tenant = createMockPublicTenant();
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={[]}
          stats={stats}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Testimonial Display', () => {
    it('should display first testimonial text', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText(/Excelente atención para mi mascota/)).toBeInTheDocument();
    });

    it('should display first testimonial author name', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('should render star rating for testimonial', () => {
      const tenant = createMockPublicTenant();
      const testimonials = [createMockTestimonial({ rating: 5 })];
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Should have filled stars (yellow)
      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Controls', () => {
    it('should render navigation arrows when multiple testimonials', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByLabelText('Testimonio anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Siguiente testimonio')).toBeInTheDocument();
    });

    it('should not render navigation arrows for single testimonial', () => {
      const tenant = createMockPublicTenant();
      const testimonials = [createMockTestimonial()];
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.queryByLabelText('Testimonio anterior')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Siguiente testimonio')).not.toBeInTheDocument();
    });

    it('should navigate to next testimonial on arrow click', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Initial testimonial should be visible
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

      // Click next
      const nextButton = screen.getByLabelText('Siguiente testimonio');
      fireEvent.click(nextButton);

      // Second testimonial should now be visible
      await waitFor(() => {
        expect(screen.getByText('María García')).toBeInTheDocument();
      });
    });

    it('should navigate to previous testimonial on arrow click', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Click next to go to second testimonial
      const nextButton = screen.getByLabelText('Siguiente testimonio');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('María García')).toBeInTheDocument();
      });

      // Click previous to go back
      const prevButton = screen.getByLabelText('Testimonio anterior');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });

    it('should wrap to first testimonial after last', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(2);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Go to second (last)
      const nextButton = screen.getByLabelText('Siguiente testimonio');
      fireEvent.click(nextButton);

      // Go past last, should wrap to first
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });
  });

  describe('Dot Navigation', () => {
    it('should render dots for each testimonial', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      const dots = screen.getAllByLabelText(/Ir al testimonio/);
      expect(dots.length).toBe(3);
    });

    it('should not render dots for single testimonial', () => {
      const tenant = createMockPublicTenant();
      const testimonials = [createMockTestimonial()];
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.queryByLabelText(/Ir al testimonio/)).not.toBeInTheDocument();
    });

    it('should navigate to specific testimonial on dot click', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Click on third dot
      const thirdDot = screen.getByLabelText('Ir al testimonio 3');
      fireEvent.click(thirdDot);

      await waitFor(() => {
        expect(screen.getByText('Carlos López')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-rotation', () => {
    it('should auto-rotate to next testimonial', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Initial testimonial
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should have rotated to next
      await waitFor(() => {
        expect(screen.getByText('María García')).toBeInTheDocument();
      });
    });

    it('should pause auto-rotation on hover', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Hover over the carousel
      const carousel = container.querySelector('.max-w-3xl');
      if (carousel) {
        fireEvent.mouseEnter(carousel);
      }

      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should NOT have rotated (still on first)
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('should resume auto-rotation on mouse leave', async () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      const carousel = container.querySelector('.max-w-3xl');
      if (carousel) {
        // Pause
        fireEvent.mouseEnter(carousel);

        // Resume
        fireEvent.mouseLeave(carousel);
      }

      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should have rotated
      await waitFor(() => {
        expect(screen.getByText('María García')).toBeInTheDocument();
      });
    });
  });

  describe('CTA Button', () => {
    it('should render "Deja tu testimonio" button', () => {
      const tenant = createMockPublicTenant({ slug: 'test-clinic' });
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByRole('button', { name: /deja tu testimonio/i })).toBeInTheDocument();
    });

    it('should have correct href for CTA button', () => {
      const tenant = createMockPublicTenant({ slug: 'my-clinic' });
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      const link = screen.getByRole('link', { name: /deja tu testimonio/i });
      expect(link).toHaveAttribute('href', '/my-clinic/testimonios/nuevo');
    });
  });

  describe('Theme Application', () => {
    it('should apply theme color to CTA button border', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      const button = screen.getByRole('button', { name: /deja tu testimonio/i });
      expect(button).toHaveStyle({ borderColor: 'rgb(255, 85, 0)' });
    });

    it('should apply theme color to active dot', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      const firstDot = screen.getByLabelText('Ir al testimonio 1');
      expect(firstDot).toHaveStyle({ backgroundColor: 'rgb(255, 85, 0)' });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have aria-labels for navigation buttons', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByLabelText('Testimonio anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Siguiente testimonio')).toBeInTheDocument();
    });

    it('should have aria-labels for dot navigation', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByLabelText('Ir al testimonio 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir al testimonio 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Ir al testimonio 3')).toBeInTheDocument();
    });

    it('should use blockquote for testimonial text', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats();

      const { container } = render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(container.querySelector('blockquote')).toBeInTheDocument();
    });
  });

  describe('Minimal Data', () => {
    it('should render with minimal tenant data', () => {
      const tenant = createMinimalPublicTenant({ slug: 'minimal' });
      const testimonials = createMockTestimonials(1);
      const stats = createMockStats();

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      expect(screen.getByText('Lo que dicen nuestros clientes')).toBeInTheDocument();
    });

    it('should not render stats when totalCount is 0', () => {
      const tenant = createMockPublicTenant();
      const testimonials = createMockTestimonials(3);
      const stats = createMockStats({ totalCount: 0 });

      render(
        <TestimonialsSection
          tenant={tenant}
          testimonials={testimonials}
          stats={stats}
        />
      );

      // Stats section should not render average rating line
      expect(screen.queryByText(/de 0 reseñas/)).not.toBeInTheDocument();
    });
  });
});
