import { render, screen } from '@testing-library/react';
import { AppCapabilitiesSection } from '@/components/marketing/app-capabilities-section';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="next-image" />
  ),
}));

describe('AppCapabilitiesSection', () => {
  describe('Basic Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render the badge', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Tecnología moderna')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<AppCapabilitiesSection />);
      expect(
        screen.getByRole('heading', { name: /accede desde cualquier lugar/i })
      ).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<AppCapabilitiesSection />);
      expect(
        screen.getByText(/vetify es una aplicación web progresiva/i)
      ).toBeInTheDocument();
    });
  });

  describe('Capability Cards', () => {
    it('should render "Instala como app" capability', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Instala como app')).toBeInTheDocument();
      expect(screen.getByText('Agrega Vetify a tu pantalla de inicio como una aplicación nativa')).toBeInTheDocument();
    });

    it('should render "Funciona sin conexión" capability', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Funciona sin conexión')).toBeInTheDocument();
      expect(screen.getByText('Consulta información básica incluso sin internet')).toBeInTheDocument();
    });

    it('should render "Modo oscuro" capability', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Modo oscuro')).toBeInTheDocument();
      expect(screen.getByText('Interfaz adaptable para trabajar de día o de noche')).toBeInTheDocument();
    });

    it('should render "Carga ultrarrápida" capability', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Carga ultrarrápida')).toBeInTheDocument();
      expect(screen.getByText('Experiencia fluida gracias a optimizaciones avanzadas')).toBeInTheDocument();
    });

    it('should render "Sincronización automática" capability', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Sincronización automática')).toBeInTheDocument();
      expect(screen.getByText('Tus datos se actualizan cuando recuperas conexión')).toBeInTheDocument();
    });

    it('should render "Notificaciones por email" capability', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByText('Notificaciones por email')).toBeInTheDocument();
      expect(screen.getByText('Recordatorios automáticos de citas y tratamientos')).toBeInTheDocument();
    });

    it('should render 6 capability cards', () => {
      const { container } = render(<AppCapabilitiesSection />);
      // Each card has the CardContent class with p-6
      const cards = container.querySelectorAll('.p-6');
      expect(cards.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Capability Icons', () => {
    it('should render smartphone icon', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('.lucide-smartphone')).toBeInTheDocument();
    });

    it('should render wifi-off icon', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('.lucide-wifi-off')).toBeInTheDocument();
    });

    it('should render moon icon', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('.lucide-moon')).toBeInTheDocument();
    });

    it('should render zap icon', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('.lucide-zap')).toBeInTheDocument();
    });

    it('should render refresh-cw icon', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('.lucide-refresh-cw')).toBeInTheDocument();
    });

    it('should render mail icon', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('.lucide-mail')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Showcase', () => {
    it('should render the dark mode screenshot', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByAltText('Dashboard de Vetify en modo oscuro')).toBeInTheDocument();
    });

    it('should have correct src for dark mode screenshot', () => {
      render(<AppCapabilitiesSection />);

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('src', '/images/marketing/dark-mode.png');
    });
  });

  describe('Layout', () => {
    it('should use grid layout for capabilities', () => {
      const { container } = render(<AppCapabilitiesSection />);
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeInTheDocument();
    });

    it('should have responsive column layout', () => {
      const { container } = render(<AppCapabilitiesSection />);
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const { container } = render(<AppCapabilitiesSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<AppCapabilitiesSection />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have background class for visual distinction', () => {
      const { container } = render(<AppCapabilitiesSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-secondary/30');
    });

    it('should have h3 headings for each capability', () => {
      render(<AppCapabilitiesSection />);
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBe(6);
    });
  });
});
