import { render, screen, fireEvent } from '@testing-library/react';
import { PublicPagesSection } from '@/components/marketing/public-pages-section';

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

describe('PublicPagesSection', () => {
  describe('Basic Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<PublicPagesSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render the badge', () => {
      render(<PublicPagesSection />);
      expect(screen.getByText('Páginas públicas')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<PublicPagesSection />);
      expect(
        screen.getByRole('heading', { name: /tu clínica, visible para todos/i })
      ).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<PublicPagesSection />);
      expect(
        screen.getByText(/crea una presencia profesional en línea/i)
      ).toBeInTheDocument();
    });
  });

  describe('URL Examples', () => {
    it('should render URL examples section', () => {
      render(<PublicPagesSection />);
      expect(screen.getByText('URLs de ejemplo:')).toBeInTheDocument();
    });

    it('should render services URL example', () => {
      render(<PublicPagesSection />);
      expect(screen.getByText('vetify.pro/tu-clinica/servicios')).toBeInTheDocument();
    });

    it('should render team URL example', () => {
      render(<PublicPagesSection />);
      expect(screen.getByText('vetify.pro/tu-clinica/equipo')).toBeInTheDocument();
    });
  });

  describe('Features List', () => {
    it('should render all feature items', () => {
      render(<PublicPagesSection />);

      expect(screen.getByText('Página de servicios con descripción y precios')).toBeInTheDocument();
      expect(screen.getByText('Perfil del equipo con fotos profesionales')).toBeInTheDocument();
      expect(screen.getByText('Reserva de citas online para clientes')).toBeInTheDocument();
      expect(screen.getByText('Galería de imágenes de tu clínica')).toBeInTheDocument();
      expect(screen.getByText('Testimonios y calificaciones de clientes')).toBeInTheDocument();
      expect(screen.getByText('Tema personalizable con tu marca')).toBeInTheDocument();
    });

    it('should render checkmark icons for features', () => {
      const { container } = render(<PublicPagesSection />);
      const checkIcons = container.querySelectorAll('.lucide-circle-check');
      expect(checkIcons.length).toBe(6);
    });
  });

  describe('Tab Navigation', () => {
    it('should render both tab buttons', () => {
      render(<PublicPagesSection />);

      expect(screen.getByRole('button', { name: 'Servicios' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Equipo' })).toBeInTheDocument();
    });

    it('should have "Servicios" tab active by default', () => {
      render(<PublicPagesSection />);

      const servicesTab = screen.getByRole('button', { name: 'Servicios' });
      expect(servicesTab).toHaveClass('bg-primary');
    });

    it('should switch to "Equipo" tab when clicked', () => {
      render(<PublicPagesSection />);

      const teamTab = screen.getByRole('button', { name: 'Equipo' });
      fireEvent.click(teamTab);

      expect(teamTab).toHaveClass('bg-primary');
    });

    it('should switch back to "Servicios" tab when clicked', () => {
      render(<PublicPagesSection />);

      const teamTab = screen.getByRole('button', { name: 'Equipo' });
      const servicesTab = screen.getByRole('button', { name: 'Servicios' });

      fireEvent.click(teamTab);
      fireEvent.click(servicesTab);

      expect(servicesTab).toHaveClass('bg-primary');
    });
  });

  describe('Screenshots', () => {
    it('should render images for both tabs', () => {
      render(<PublicPagesSection />);

      const images = screen.getAllByTestId('next-image');
      expect(images.length).toBe(2);
    });

    it('should have correct src for services screenshot', () => {
      render(<PublicPagesSection />);

      const images = screen.getAllByTestId('next-image');
      const servicesImage = images.find(img => img.getAttribute('src')?.includes('public-services'));
      expect(servicesImage).toBeInTheDocument();
    });

    it('should have correct src for team screenshot', () => {
      render(<PublicPagesSection />);

      const images = screen.getAllByTestId('next-image');
      const teamImage = images.find(img => img.getAttribute('src')?.includes('public-team'));
      expect(teamImage).toBeInTheDocument();
    });

    it('should have correct alt text for images', () => {
      render(<PublicPagesSection />);

      expect(screen.getByAltText('Página pública de servicios veterinarios')).toBeInTheDocument();
      expect(screen.getByAltText('Página pública del equipo veterinario')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const { container } = render(<PublicPagesSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<PublicPagesSection />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<PublicPagesSection />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('should have background class for visual distinction', () => {
      const { container } = render(<PublicPagesSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-secondary/30');
    });
  });
});
