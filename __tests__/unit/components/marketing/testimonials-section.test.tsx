import { render, screen, fireEvent } from '@testing-library/react';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';

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

describe('TestimonialsSection', () => {
  describe('Basic Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<TestimonialsSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render the badge', () => {
      render(<TestimonialsSection />);
      expect(screen.getByText('Reputación online')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<TestimonialsSection />);
      expect(
        screen.getByRole('heading', { name: /testimonios que generan confianza/i })
      ).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<TestimonialsSection />);
      expect(
        screen.getByText(/permite que tus clientes satisfechos/i)
      ).toBeInTheDocument();
    });

    it('should render 5 star rating', () => {
      const { container } = render(<TestimonialsSection />);
      const stars = container.querySelectorAll('.lucide-star');
      expect(stars.length).toBe(5);
    });

    it('should render "Calificaciones verificadas" text', () => {
      render(<TestimonialsSection />);
      expect(screen.getByText('Calificaciones verificadas')).toBeInTheDocument();
    });
  });

  describe('Features List', () => {
    it('should render all feature items', () => {
      render(<TestimonialsSection />);

      expect(screen.getByText('Recibe testimonios directamente de tus clientes')).toBeInTheDocument();
      expect(screen.getByText('Modera y aprueba antes de publicar')).toBeInTheDocument();
      expect(screen.getByText('Calificaciones con estrellas (1-5)')).toBeInTheDocument();
      expect(screen.getByText('Muestra los mejores en tu página pública')).toBeInTheDocument();
      expect(screen.getByText('Carrusel automático con animaciones')).toBeInTheDocument();
      expect(screen.getByText('Aumenta la confianza de nuevos clientes')).toBeInTheDocument();
    });

    it('should render checkmark icons for features', () => {
      const { container } = render(<TestimonialsSection />);
      const checkIcons = container.querySelectorAll('.lucide-circle-check');
      expect(checkIcons.length).toBe(6);
    });
  });

  describe('Tab Navigation', () => {
    it('should render both tab buttons', () => {
      render(<TestimonialsSection />);

      expect(screen.getByRole('button', { name: 'Panel Admin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Vista Pública' })).toBeInTheDocument();
    });

    it('should have "Panel Admin" tab active by default', () => {
      render(<TestimonialsSection />);

      const adminTab = screen.getByRole('button', { name: 'Panel Admin' });
      expect(adminTab).toHaveClass('bg-primary');
    });

    it('should switch to "Vista Pública" tab when clicked', () => {
      render(<TestimonialsSection />);

      const publicTab = screen.getByRole('button', { name: 'Vista Pública' });
      fireEvent.click(publicTab);

      expect(publicTab).toHaveClass('bg-primary');
    });

    it('should switch back to "Panel Admin" tab when clicked', () => {
      render(<TestimonialsSection />);

      const publicTab = screen.getByRole('button', { name: 'Vista Pública' });
      const adminTab = screen.getByRole('button', { name: 'Panel Admin' });

      fireEvent.click(publicTab);
      fireEvent.click(adminTab);

      expect(adminTab).toHaveClass('bg-primary');
    });
  });

  describe('Screenshots', () => {
    it('should render images for both tabs', () => {
      render(<TestimonialsSection />);

      const images = screen.getAllByTestId('next-image');
      expect(images.length).toBe(2);
    });

    it('should have correct src for admin screenshot', () => {
      render(<TestimonialsSection />);

      const images = screen.getAllByTestId('next-image');
      const adminImage = images.find(img => img.getAttribute('src')?.includes('testimonials-admin'));
      expect(adminImage).toBeInTheDocument();
    });

    it('should have correct src for public screenshot', () => {
      render(<TestimonialsSection />);

      const images = screen.getAllByTestId('next-image');
      const publicImage = images.find(img => img.getAttribute('src')?.includes('testimonials-public'));
      expect(publicImage).toBeInTheDocument();
    });

    it('should have correct alt text for images', () => {
      render(<TestimonialsSection />);

      expect(screen.getByAltText('Panel de administración de testimonios')).toBeInTheDocument();
      expect(screen.getByAltText('Testimonios en página pública')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const { container } = render(<TestimonialsSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<TestimonialsSection />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<TestimonialsSection />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });
  });
});
