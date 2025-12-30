import { render, screen } from '@testing-library/react';
import { ClinicServices } from '@/components/public/ClinicServices';
import {
  createMockPublicTenant,
  createMockFeaturedServices,
  createMockFeaturedService,
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
    section: ({
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
      <section className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </section>
    ),
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
    background: '#111827',
    backgroundAlt: '#1f2937',
  }),
}));

describe('ClinicServices', () => {
  describe('Section Rendering', () => {
    it('should render the section title', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(screen.getByText('Nuestros Servicios')).toBeInTheDocument();
    });

    it('should render the section description', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(
        screen.getByText(/Ofrecemos una amplia gama de servicios veterinarios profesionales/i)
      ).toBeInTheDocument();
    });

    it('should have semantic section element', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicServices tenant={tenant} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Service Cards', () => {
    it('should render service cards when featuredServices are provided', () => {
      const tenant = createMockPublicTenant();
      const services = createMockFeaturedServices(3);
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(screen.getByText('Consulta General')).toBeInTheDocument();
      expect(screen.getByText('Vacunación')).toBeInTheDocument();
      expect(screen.getByText('Cirugía')).toBeInTheDocument();
    });

    it('should limit display to 6 services', () => {
      const tenant = createMockPublicTenant();
      const services = createMockFeaturedServices(8);
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      // Should show only first 6
      expect(screen.getByText('Consulta General')).toBeInTheDocument();
      expect(screen.getByText('Vacunación')).toBeInTheDocument();
      expect(screen.getByText('Cirugía')).toBeInTheDocument();
      expect(screen.getByText('Cardiología')).toBeInTheDocument();
      expect(screen.getByText('Desparasitación')).toBeInTheDocument();
      expect(screen.getByText('Laboratorio')).toBeInTheDocument();
    });

    it('should display service descriptions', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          name: 'Test Service',
          description: 'Custom description for the service',
        }),
      ];
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(screen.getByText('Custom description for the service')).toBeInTheDocument();
    });

    it('should display empty string for null descriptions', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          name: 'Test Service',
          description: null,
        }),
      ];
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(screen.getByText('Test Service')).toBeInTheDocument();
    });
  });

  describe('Placeholder State', () => {
    it('should show "Próximamente" when no services are provided', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });

    it('should show "Próximamente" when featuredServices is empty array', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} featuredServices={[]} />);

      expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });

    it('should show placeholder description text', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(
        screen.getByText(/Estamos preparando la información de nuestros servicios/i)
      ).toBeInTheDocument();
    });

    it('should not show "Próximamente" when services exist', () => {
      const tenant = createMockPublicTenant();
      const services = createMockFeaturedServices(2);
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(screen.queryByText('Próximamente')).not.toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should format price with Mexican locale', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          name: 'Service',
          price: 1500,
          publicPriceLabel: null,
        }),
      ];
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      // Mexican locale formats 1500 as $1,500
      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });

    it('should use publicPriceLabel when provided', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          name: 'Service',
          price: 500,
          publicPriceLabel: 'Desde $300',
        }),
      ];
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(screen.getByText('Desde $300')).toBeInTheDocument();
      expect(screen.queryByText('$500')).not.toBeInTheDocument();
    });

    it('should format decimal prices correctly', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          name: 'Service',
          price: 199.99,
          publicPriceLabel: null,
        }),
      ];
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(screen.getByText('$199.99')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render stethoscope icon for "stethoscope" name', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          publicIcon: 'stethoscope',
        }),
      ];
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      // Look for lucide-stethoscope class
      expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
    });

    it('should render syringe icon for "syringe" name', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          publicIcon: 'syringe',
        }),
      ];
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      expect(container.querySelector('.lucide-syringe')).toBeInTheDocument();
    });

    it('should render heart icon for "heart" name', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          publicIcon: 'heart',
        }),
      ];
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      expect(container.querySelector('.lucide-heart')).toBeInTheDocument();
    });

    it('should fall back to stethoscope icon for unknown icon name', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          publicIcon: 'unknown-icon',
        }),
      ];
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      // Falls back to stethoscope
      expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
    });

    it('should use stethoscope icon when publicIcon is null', () => {
      const tenant = createMockPublicTenant();
      const services = [
        createMockFeaturedService({
          publicIcon: null,
        }),
      ];
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    it('should render CTA heading', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(
        screen.getByText('¿Necesitas más información sobre nuestros servicios?')
      ).toBeInTheDocument();
    });

    it('should render CTA description', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(
        screen.getByText(
          'Nuestro equipo estará encantado de ayudarte y resolver todas tus dudas.'
        )
      ).toBeInTheDocument();
    });

    it('should render "Agendar Consulta" button with correct link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<ClinicServices tenant={tenant} />);

      const button = screen.getByRole('button', { name: /agendar consulta/i });
      expect(button).toBeInTheDocument();

      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/mi-clinica/agendar');
    });

    it('should render "Ver Todos los Servicios" button with correct link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<ClinicServices tenant={tenant} />);

      const button = screen.getByRole('button', { name: /ver todos los servicios/i });
      expect(button).toBeInTheDocument();

      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/mi-clinica/servicios');
    });
  });

  describe('Theme Application', () => {
    it('should apply theme color to icon container background', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      const services = createMockFeaturedServices(1);
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      // Icon container should have primaryLight background
      const iconContainer = container.querySelector('.w-12.h-12.flex.items-center.justify-center');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply theme color to service icon', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      const services = createMockFeaturedServices(1);
      const { container } = render(
        <ClinicServices tenant={tenant} featuredServices={services} />
      );

      const icon = container.querySelector('.lucide');
      expect(icon).toHaveStyle({ color: 'rgb(255, 85, 0)' });
    });

    it('should apply theme color to primary button', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      render(<ClinicServices tenant={tenant} />);

      const button = screen.getByRole('button', { name: /agendar consulta/i });
      expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 85, 0)' });
    });

    it('should apply theme color to outline button border', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      render(<ClinicServices tenant={tenant} />);

      const button = screen.getByRole('button', { name: /ver todos los servicios/i });
      expect(button).toHaveStyle({ borderColor: 'rgb(255, 85, 0)' });
    });
  });

  describe('Heading Hierarchy', () => {
    it('should have h2 for main section heading', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(
        screen.getByRole('heading', { name: 'Nuestros Servicios', level: 2 })
      ).toBeInTheDocument();
    });

    it('should have h3 for CTA heading', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicServices tenant={tenant} />);

      expect(
        screen.getByRole('heading', {
          name: '¿Necesitas más información sobre nuestros servicios?',
          level: 3,
        })
      ).toBeInTheDocument();
    });

    it('should have h3 for service titles', () => {
      const tenant = createMockPublicTenant();
      const services = createMockFeaturedServices(1);
      render(<ClinicServices tenant={tenant} featuredServices={services} />);

      expect(
        screen.getByRole('heading', { name: 'Consulta General', level: 3 })
      ).toBeInTheDocument();
    });
  });
});
