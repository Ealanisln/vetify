/**
 * Component tests for HeroSection
 * Tests empathetic hero copy for small veterinary clinics
 */

import { render, screen } from '@testing-library/react';

// Mock the pricing config to avoid async data fetching
jest.mock('@/lib/pricing-config', () => ({
  getActivePromotionFromDB: jest.fn().mockResolvedValue(null),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    href: string;
    'data-testid'?: string;
  }) => (
    <a href={href} data-testid={dataTestId}>
      {children}
    </a>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
    priority,
  }: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-priority={priority} />
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    size,
    className,
  }: {
    children: React.ReactNode;
    size?: string;
    className?: string;
  }) => (
    <button className={className} data-size={size}>
      {children}
    </button>
  ),
}));

// Mock EarlyAdopterBanner
jest.mock('@/components/marketing/EarlyAdopterBanner', () => ({
  EarlyAdopterBanner: () => <div data-testid="early-adopter-banner" />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check">Check</span>,
}));

// Import after mocks
import { HeroSection } from '../hero-section';

describe('HeroSection', () => {
  describe('Rendering', () => {
    it('should render the empathetic headline', async () => {
      render(await HeroSection());

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent(/El sistema sencillo para/i);
      expect(h1).toHaveTextContent(/veterinarias pequeñas/i);
    });

    it('should render the new subheadline', async () => {
      render(await HeroSection());

      expect(
        screen.getByText(
          'Gestiona pacientes, citas y recordatorios sin Excel, sin complicarte y sin perder tiempo.'
        )
      ).toBeInTheDocument();
    });

    it('should render CTA button with correct text', async () => {
      render(await HeroSection());

      expect(
        screen.getByRole('button', { name: 'Comienza tu prueba gratis' })
      ).toBeInTheDocument();
    });

    it('should render trial info text', async () => {
      render(await HeroSection());

      expect(
        screen.getByText('30 días gratis, sin tarjeta de crédito')
      ).toBeInTheDocument();
    });

    it('should render the clarifying subtexto', async () => {
      render(await HeroSection());

      expect(
        screen.getByText(
          'Pensado para clínicas veterinarias pequeñas que quieren enfocarse en atender mejor, no en tareas administrativas.'
        )
      ).toBeInTheDocument();
    });

    it('should render simplified badges (2 instead of 3)', async () => {
      render(await HeroSection());

      expect(screen.getByText('Fácil de usar')).toBeInTheDocument();
      expect(screen.getByText('Soporte incluido')).toBeInTheDocument();
      // Old badges should not be present
      expect(screen.queryByText('Setup en 15 minutos')).not.toBeInTheDocument();
    });

    it('should link CTA to registration page', async () => {
      render(await HeroSection());

      const signupLink = screen.getByTestId('signup-button');
      expect(signupLink).toHaveAttribute('href', '/api/auth/register');
    });

    it('should render dashboard preview images', async () => {
      render(await HeroSection());

      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2); // Light and dark mode versions

      const lightImage = images.find((img) =>
        img.getAttribute('src')?.includes('light')
      );
      const darkImage = images.find((img) =>
        img.getAttribute('src')?.includes('dark')
      );

      expect(lightImage).toBeInTheDocument();
      expect(darkImage).toBeInTheDocument();
    });
  });

  describe('Without promotion', () => {
    it('should NOT render early adopter banner when no promo active', async () => {
      render(await HeroSection());

      expect(screen.queryByTestId('early-adopter-banner')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render as a section element', async () => {
      const { container } = render(await HeroSection());

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should be centered with max-width', async () => {
      const { container } = render(await HeroSection());

      const content = container.querySelector('.max-w-4xl');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('text-center');
    });

    it('should have primary color on highlighted text', async () => {
      const { container } = render(await HeroSection());

      const highlight = container.querySelector('.text-primary');
      expect(highlight).toBeInTheDocument();
      expect(highlight).toHaveTextContent('veterinarias pequeñas');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(await HeroSection());

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have check icons for badge items', async () => {
      render(await HeroSection());

      const checkIcons = screen.getAllByTestId('icon-check');
      expect(checkIcons.length).toBe(2);
    });
  });
});

describe('HeroSection with promotion', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should render early adopter banner when promo is active', async () => {
    // Re-mock with active promotion
    jest.doMock('@/lib/pricing-config', () => ({
      getActivePromotionFromDB: jest.fn().mockResolvedValue({
        badgeText: 'Early Adopter',
        description: '25% off',
        discountPercent: 25,
        durationMonths: 12,
      }),
    }));

    // Re-import with new mock
    jest.isolateModules(async () => {
      const { HeroSection: HeroWithPromo } = await import('../hero-section');
      render(await HeroWithPromo());

      expect(screen.getByTestId('early-adopter-banner')).toBeInTheDocument();
    });
  });
});
