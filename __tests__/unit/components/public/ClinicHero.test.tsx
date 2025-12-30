import { render, screen } from '@testing-library/react';
import { ClinicHero } from '@/components/public/ClinicHero';
import {
  createMockPublicTenant,
  createMinimalPublicTenant,
  createMockPublicHours,
  createMockPublicImages,
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
    h1: ({
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
      <h1 className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </h1>
    ),
    p: ({
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
      <p className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
    style,
  }: {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} style={style} />
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

// Mock ShareButtons component
jest.mock('@/components/public/ShareButtons', () => ({
  ShareButtons: ({
    url,
    title,
    themeColor,
  }: {
    url: string;
    title: string;
    description?: string;
    themeColor?: string;
  }) => (
    <div data-testid="share-buttons" data-url={url} data-title={title} data-theme-color={themeColor}>
      Share Buttons Mock
    </div>
  ),
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
      primaryHover: '#5a8a7d',
      secondary: '#6b7280',
      accent: '#f59e0b',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      cardBg: '#ffffff',
      border: '#e5e7eb',
      primaryLight: '#e8f0ee',
      heroGradientFrom: '#f8faf9',
      heroGradientTo: '#e8f0ee',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      headingWeight: 700,
    },
    layout: {
      borderRadius: '0.5rem',
    },
  }),
  getThemeClasses: () => ({
    button: 'rounded-lg',
    card: 'border',
    input: 'rounded-lg border',
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
    heroGradientFrom: '#1f2937',
    heroGradientTo: '#111827',
  }),
}));

// Mock image-utils
jest.mock('@/lib/image-utils', () => ({
  PLACEHOLDER_BLUR: 'data:image/gif;base64,placeholder',
  imageSizes: {
    hero: '(max-width: 768px) 100vw, 600px',
  },
}));

describe('ClinicHero', () => {
  describe('Basic Rendering', () => {
    it('should render the clinic name as heading', () => {
      const tenant = createMockPublicTenant({ name: 'Mi Clínica Veterinaria' });
      render(<ClinicHero tenant={tenant} />);

      expect(
        screen.getByRole('heading', { name: 'Mi Clínica Veterinaria', level: 1 })
      ).toBeInTheDocument();
    });

    it('should render semantic section element', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicHero tenant={tenant} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render 5 star rating', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicHero tenant={tenant} />);

      const stars = container.querySelectorAll('.lucide-star');
      expect(stars.length).toBe(5);
    });

    it('should render "Clínica de confianza" text', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByText('Clínica de confianza')).toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('should render description when publicDescription exists', () => {
      const tenant = createMockPublicTenant({
        publicDescription: 'La mejor clínica veterinaria de la ciudad',
      });
      render(<ClinicHero tenant={tenant} />);

      expect(
        screen.getByText('La mejor clínica veterinaria de la ciudad')
      ).toBeInTheDocument();
    });

    it('should not render description when publicDescription is null', () => {
      const tenant = createMockPublicTenant({ publicDescription: null });
      render(<ClinicHero tenant={tenant} />);

      // No extra paragraph with description should exist
      expect(
        screen.queryByText('La mejor clínica veterinaria de la ciudad')
      ).not.toBeInTheDocument();
    });
  });

  describe('Hero Image', () => {
    it('should render hero image when publicImages.hero exists', () => {
      const tenant = createMockPublicTenant({
        publicImages: createMockPublicImages({ hero: 'https://example.com/hero.jpg' }),
      });
      render(<ClinicHero tenant={tenant} />);

      const img = screen.getByRole('img', { name: /clínica veterinaria/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/hero.jpg');
    });

    it('should show fallback paw icon when no hero image', () => {
      const tenant = createMockPublicTenant({ publicImages: null });
      render(<ClinicHero tenant={tenant} />);

      // Should see the paw emoji as fallback
      expect(screen.getByText('🐾')).toBeInTheDocument();
    });

    it('should show fallback text when no hero image', () => {
      const tenant = createMockPublicTenant({ publicImages: null });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByText('Cuidamos a tu mascota')).toBeInTheDocument();
      expect(screen.getByText('Con amor y profesionalismo')).toBeInTheDocument();
    });
  });

  describe('Phone Card', () => {
    it('should render phone card when publicPhone exists', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 1234 5678' });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('+52 55 1234 5678')).toBeInTheDocument();
    });

    it('should not render phone card when publicPhone is null', () => {
      const tenant = createMockPublicTenant({ publicPhone: null });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
    });
  });

  describe('Address Card', () => {
    it('should render address card when publicAddress exists', () => {
      const tenant = createMockPublicTenant({
        publicAddress: 'Av. Principal 123, Col. Centro',
      });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByText('Ubicación')).toBeInTheDocument();
      expect(screen.getByText('Av. Principal 123, Col. Centro')).toBeInTheDocument();
    });

    it('should not render address card when publicAddress is null', () => {
      const tenant = createMockPublicTenant({ publicAddress: null });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.queryByText('Ubicación')).not.toBeInTheDocument();
    });
  });

  describe('Hours Card', () => {
    it('should render hours card when publicHours exists', () => {
      const tenant = createMockPublicTenant({
        publicHours: createMockPublicHours({ weekdays: '8:00 - 20:00' }),
      });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByText('Horarios')).toBeInTheDocument();
      expect(screen.getByText('8:00 - 20:00')).toBeInTheDocument();
    });

    it('should not render hours card when publicHours is null', () => {
      const tenant = createMockPublicTenant({ publicHours: null });
      render(<ClinicHero tenant={tenant} />);

      expect(screen.queryByText('Horarios')).not.toBeInTheDocument();
    });

    it('should use fallback hours text when weekdays is empty', () => {
      const tenant = createMockPublicTenant({
        publicHours: createMockPublicHours({ weekdays: undefined }),
      });
      render(<ClinicHero tenant={tenant} />);

      // Falls back to default text
      expect(screen.getByText('Horarios')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render "Agendar Cita" button with correct link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<ClinicHero tenant={tenant} />);

      const button = screen.getByRole('button', { name: /agendar cita/i });
      expect(button).toBeInTheDocument();

      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/mi-clinica/agendar');
    });

    it('should render "Llamar Ahora" button when phone exists', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 9999 8888' });
      render(<ClinicHero tenant={tenant} />);

      const button = screen.getByRole('button', { name: /llamar ahora/i });
      expect(button).toBeInTheDocument();
    });

    it('should have correct tel: link on "Llamar Ahora" button', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 9999 8888' });
      render(<ClinicHero tenant={tenant} />);

      const button = screen.getByRole('button', { name: /llamar ahora/i });
      const link = button.closest('a');
      expect(link).toHaveAttribute('href', 'tel:+52 55 9999 8888');
    });

    it('should not render "Llamar Ahora" button when phone is null', () => {
      const tenant = createMockPublicTenant({ publicPhone: null });
      render(<ClinicHero tenant={tenant} />);

      expect(
        screen.queryByRole('button', { name: /llamar ahora/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('ShareButtons', () => {
    it('should render ShareButtons component', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByTestId('share-buttons')).toBeInTheDocument();
    });

    it('should pass correct title to ShareButtons', () => {
      const tenant = createMockPublicTenant({ name: 'Veterinaria Ejemplo' });
      render(<ClinicHero tenant={tenant} />);

      const shareButtons = screen.getByTestId('share-buttons');
      expect(shareButtons).toHaveAttribute(
        'data-title',
        'Veterinaria Ejemplo - Clínica Veterinaria'
      );
    });

    it('should pass themeColor to ShareButtons', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      render(<ClinicHero tenant={tenant} />);

      const shareButtons = screen.getByTestId('share-buttons');
      expect(shareButtons).toHaveAttribute('data-theme-color', '#ff5500');
    });
  });

  describe('Theme Application', () => {
    it('should apply theme color to primary button', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      render(<ClinicHero tenant={tenant} />);

      const button = screen.getByRole('button', { name: /agendar cita/i });
      expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 85, 0)' });
    });

    it('should apply theme color to outline button border', () => {
      const tenant = createMockPublicTenant({
        publicPhone: '+52 55 1234 5678',
        publicThemeColor: '#ff5500',
      });
      render(<ClinicHero tenant={tenant} />);

      const button = screen.getByRole('button', { name: /llamar ahora/i });
      expect(button).toHaveStyle({ borderColor: 'rgb(255, 85, 0)' });
    });

    it('should apply gradient background to section', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicHero tenant={tenant} />);

      const section = container.querySelector('section');
      expect(section).toHaveStyle({
        background: 'linear-gradient(135deg, #f8faf9 0%, #e8f0ee 100%)',
      });
    });
  });

  describe('Minimal Data Handling', () => {
    it('should render with minimal tenant data', () => {
      const tenant = createMinimalPublicTenant();
      render(<ClinicHero tenant={tenant} />);

      // Should render clinic name
      expect(
        screen.getByRole('heading', { name: 'Minimal Clinic', level: 1 })
      ).toBeInTheDocument();

      // Contact cards should not render
      expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
      expect(screen.queryByText('Ubicación')).not.toBeInTheDocument();
      expect(screen.queryByText('Horarios')).not.toBeInTheDocument();
    });

    it('should show fallback hero when minimal data', () => {
      const tenant = createMinimalPublicTenant();
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByText('🐾')).toBeInTheDocument();
    });

    it('should still render Agendar Cita button with minimal data', () => {
      const tenant = createMinimalPublicTenant();
      render(<ClinicHero tenant={tenant} />);

      expect(
        screen.getByRole('button', { name: /agendar cita/i })
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have h1 heading for clinic name', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicHero tenant={tenant} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should have alt text for hero image', () => {
      const tenant = createMockPublicTenant({
        name: 'Veterinaria Test',
        publicImages: createMockPublicImages({ hero: 'https://example.com/hero.jpg' }),
      });
      render(<ClinicHero tenant={tenant} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Veterinaria Test - Clínica Veterinaria');
    });

    it('should have proper link structure for buttons', () => {
      const tenant = createMockPublicTenant({
        slug: 'test-clinic',
        publicPhone: '+52 55 1234 5678',
      });
      render(<ClinicHero tenant={tenant} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(2);
    });
  });
});
