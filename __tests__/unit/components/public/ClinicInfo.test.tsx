import { render, screen } from '@testing-library/react';
import { ClinicInfo } from '@/components/public/ClinicInfo';
import {
  createMockPublicTenant,
  createMinimalPublicTenant,
  createMockPublicHours,
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
    background: '#111827',
    backgroundAlt: '#1f2937',
    heroGradientFrom: '#1f2937',
    heroGradientTo: '#111827',
  }),
}));

describe('ClinicInfo', () => {
  describe('Section Rendering', () => {
    it('should render the section title', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Información de Contacto')).toBeInTheDocument();
    });

    it('should render the section description', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(
        screen.getByText(
          'Estamos aquí para cuidar a tu mascota. Contáctanos cuando lo necesites.'
        )
      ).toBeInTheDocument();
    });

    it('should render "Datos de Contacto" heading', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Datos de Contacto')).toBeInTheDocument();
    });
  });

  describe('Phone Card', () => {
    it('should render phone card when publicPhone is provided', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 1234 5678' });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('+52 55 1234 5678')).toBeInTheDocument();
      // There are multiple "Llamar" buttons - phone card has one without "Emergencia"
      const llamarButtons = screen.getAllByRole('button', { name: /llamar/i });
      const phoneCardButton = llamarButtons.find(btn => btn.textContent === 'Llamar');
      expect(phoneCardButton).toBeInTheDocument();
    });

    it('should not render phone card when publicPhone is null', () => {
      const tenant = createMockPublicTenant({ publicPhone: null });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
    });

    it('should have correct tel: link for phone', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 1234 5678' });
      render(<ClinicInfo tenant={tenant} />);

      const phoneLinks = screen.getAllByRole('link', { name: /\+52 55 1234 5678|llamar/i });
      expect(phoneLinks.length).toBeGreaterThanOrEqual(1);
      expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+52 55 1234 5678');
    });
  });

  describe('Email Card', () => {
    it('should render email card when publicEmail is provided', () => {
      const tenant = createMockPublicTenant({
        publicEmail: 'contacto@testclinic.com',
      });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('contacto@testclinic.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /escribir/i })).toBeInTheDocument();
    });

    it('should not render email card when publicEmail is null', () => {
      const tenant = createMockPublicTenant({ publicEmail: null });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });

    it('should have correct mailto: link for email', () => {
      const tenant = createMockPublicTenant({
        publicEmail: 'contacto@testclinic.com',
      });
      render(<ClinicInfo tenant={tenant} />);

      const emailLinks = screen.getAllByRole('link', {
        name: /contacto@testclinic.com|escribir/i,
      });
      expect(emailLinks.length).toBeGreaterThanOrEqual(1);
      expect(emailLinks[0]).toHaveAttribute('href', 'mailto:contacto@testclinic.com');
    });
  });

  describe('Address Card', () => {
    it('should render address card when publicAddress is provided', () => {
      const tenant = createMockPublicTenant({
        publicAddress: 'Av. Ejemplo 123, Col. Centro, CDMX',
      });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Dirección')).toBeInTheDocument();
      expect(
        screen.getByText('Av. Ejemplo 123, Col. Centro, CDMX')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /navegar/i })).toBeInTheDocument();
    });

    it('should not render address card when publicAddress is null', () => {
      const tenant = createMockPublicTenant({ publicAddress: null });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.queryByText('Dirección')).not.toBeInTheDocument();
    });
  });

  describe('Hours Display', () => {
    it('should render hours section title', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Horarios de Atención')).toBeInTheDocument();
    });

    it('should display custom hours when publicHours is provided', () => {
      const tenant = createMockPublicTenant({
        publicHours: createMockPublicHours({
          weekdays: '8:00 - 20:00',
          saturday: '9:00 - 15:00',
          sunday: 'Cerrado',
        }),
      });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Lunes - Viernes')).toBeInTheDocument();
      expect(screen.getByText('8:00 - 20:00')).toBeInTheDocument();
      expect(screen.getByText('Sábado')).toBeInTheDocument();
      expect(screen.getByText('9:00 - 15:00')).toBeInTheDocument();
      expect(screen.getByText('Domingo')).toBeInTheDocument();
      expect(screen.getByText('Cerrado')).toBeInTheDocument();
    });

    it('should display default hours when publicHours is null', () => {
      const tenant = createMockPublicTenant({ publicHours: null });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('Lunes - Viernes')).toBeInTheDocument();
      expect(screen.getByText('9:00 - 18:00')).toBeInTheDocument();
      expect(screen.getByText('Sábado')).toBeInTheDocument();
      expect(screen.getByText('9:00 - 14:00')).toBeInTheDocument();
      expect(screen.getByText('Domingo')).toBeInTheDocument();
      // There should be two "Cerrado" texts - one for hours and one for closed status
      const cerradoElements = screen.getAllByText('Cerrado');
      expect(cerradoElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle partial hours data', () => {
      const tenant = createMockPublicTenant({
        publicHours: createMockPublicHours({
          weekdays: '10:00 - 17:00',
          saturday: undefined,
          sunday: undefined,
        }),
      });
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('10:00 - 17:00')).toBeInTheDocument();
      // Saturday and Sunday should not be rendered when undefined
    });
  });

  describe('CTA Section', () => {
    it('should render CTA heading', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(screen.getByText('¿Listo para agendar tu cita?')).toBeInTheDocument();
    });

    it('should render CTA description', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(
        screen.getByText(
          'Nuestro equipo profesional está esperando para brindar el mejor cuidado a tu mascota.'
        )
      ).toBeInTheDocument();
    });

    it('should render 5 star rating in CTA', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicInfo tenant={tenant} />);

      // CTA section has stars inside flex text-yellow-400
      const ctaStarContainers = container.querySelectorAll('.flex.text-yellow-400');
      // There should be at least one container with 5 stars (h-6 w-6)
      const ctaStars = ctaStarContainers[0]?.querySelectorAll('svg.h-6.w-6');
      expect(ctaStars?.length).toBe(5);
    });

    it('should have "Agendar Ahora" button with correct link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<ClinicInfo tenant={tenant} />);

      const agendarButton = screen.getByRole('button', { name: /agendar ahora/i });
      expect(agendarButton).toBeInTheDocument();

      // Check the parent link
      const link = agendarButton.closest('a');
      expect(link).toHaveAttribute('href', '/mi-clinica/agendar');
    });
  });

  describe('Emergency Section', () => {
    it('should render emergency banner', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      // The component renders "🚨 Emergencias" with emoji
      expect(screen.getByText(/Emergencias/)).toBeInTheDocument();
      expect(
        screen.getByText(
          'Si tu mascota está en peligro inmediato, no dudes en contactarnos inmediatamente.'
        )
      ).toBeInTheDocument();
    });

    it('should render emergency phone button when publicPhone exists', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 9999 8888' });
      render(<ClinicInfo tenant={tenant} />);

      const emergencyButton = screen.getByRole('button', {
        name: /llamar emergencia/i,
      });
      expect(emergencyButton).toBeInTheDocument();

      // Check the parent link
      const link = emergencyButton.closest('a');
      expect(link).toHaveAttribute('href', 'tel:+52 55 9999 8888');
    });

    it('should not render emergency phone button when publicPhone is null', () => {
      const tenant = createMockPublicTenant({ publicPhone: null });
      render(<ClinicInfo tenant={tenant} />);

      expect(
        screen.queryByRole('button', { name: /llamar emergencia/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Testimonials Section', () => {
    it('should render testimonials heading', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(
        screen.getByText('Lo que dicen nuestros clientes')
      ).toBeInTheDocument();
    });

    it('should render two testimonial cards', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      // Testimonials use HTML entities &ldquo; and &rdquo; - use regex to match
      expect(
        screen.getByText(/Excelente atención y profesionalismo\. Mi mascota siempre recibe el mejor cuidado\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Personal muy amable y instalaciones modernas\. Totalmente recomendado\./i)
      ).toBeInTheDocument();
    });

    it('should render testimonial authors', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      const authors = screen.getAllByText('- Cliente satisfecho');
      expect(authors).toHaveLength(2);
    });

    it('should render 5-star ratings for each testimonial', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicInfo tenant={tenant} />);

      // Testimonial stars are h-4 w-4
      const testimonialStarContainers = container.querySelectorAll(
        '.flex.text-yellow-400'
      );
      // Filter to only get containers with small stars
      let testimonialStarCount = 0;
      testimonialStarContainers.forEach((container) => {
        const smallStars = container.querySelectorAll('svg.h-4.w-4');
        testimonialStarCount += smallStars.length;
      });
      // Should have 10 small stars (5 per testimonial)
      expect(testimonialStarCount).toBe(10);
    });
  });

  describe('Minimal Data Handling', () => {
    it('should render with minimal tenant data', () => {
      const tenant = createMinimalPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      // Section should still render
      expect(screen.getByText('Información de Contacto')).toBeInTheDocument();

      // Contact cards should not render
      expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
      expect(screen.queryByText('Dirección')).not.toBeInTheDocument();

      // Default hours should render
      expect(screen.getByText('9:00 - 18:00')).toBeInTheDocument();
    });

    it('should not render emergency button with minimal tenant', () => {
      const tenant = createMinimalPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      expect(
        screen.queryByRole('button', { name: /llamar emergencia/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const tenant = createMockPublicTenant();
      const { container } = render(<ClinicInfo tenant={tenant} />);

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const tenant = createMockPublicTenant();
      render(<ClinicInfo tenant={tenant} />);

      // Main section heading (h2)
      expect(
        screen.getByRole('heading', { name: 'Información de Contacto', level: 2 })
      ).toBeInTheDocument();

      // Subsection headings (h3)
      expect(
        screen.getByRole('heading', { name: 'Datos de Contacto', level: 3 })
      ).toBeInTheDocument();
    });

    it('should have accessible links with proper href attributes', () => {
      const tenant = createMockPublicTenant({
        publicPhone: '+52 55 1234 5678',
        publicEmail: 'test@example.com',
      });
      render(<ClinicInfo tenant={tenant} />);

      // Check that tel: and mailto: links exist
      const allLinks = screen.getAllByRole('link');
      const telLinks = allLinks.filter(
        (link) => link.getAttribute('href')?.startsWith('tel:')
      );
      const mailtoLinks = allLinks.filter(
        (link) => link.getAttribute('href')?.startsWith('mailto:')
      );

      expect(telLinks.length).toBeGreaterThan(0);
      expect(mailtoLinks.length).toBeGreaterThan(0);
    });
  });
});
