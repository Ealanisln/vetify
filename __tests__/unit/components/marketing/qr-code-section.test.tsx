import { render, screen } from '@testing-library/react';
import { QrCodeSection } from '@/components/marketing/qr-code-section';

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

describe('QrCodeSection', () => {
  describe('Basic Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<QrCodeSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render the badge', () => {
      render(<QrCodeSection />);
      expect(screen.getByText('Marketing offline')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<QrCodeSection />);
      expect(
        screen.getByRole('heading', { name: /comparte tu clínica con un código qr/i })
      ).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<QrCodeSection />);
      expect(
        screen.getByText(/genera códigos qr profesionales/i)
      ).toBeInTheDocument();
    });
  });

  describe('Download Format Badges', () => {
    it('should render PNG format badge', () => {
      render(<QrCodeSection />);
      expect(screen.getByText('PNG')).toBeInTheDocument();
    });

    it('should render SVG format badge', () => {
      render(<QrCodeSection />);
      expect(screen.getByText('SVG')).toBeInTheDocument();
    });

    it('should render PDF format badge', () => {
      render(<QrCodeSection />);
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('should render download icons', () => {
      const { container } = render(<QrCodeSection />);
      const downloadIcons = container.querySelectorAll('.lucide-download');
      expect(downloadIcons.length).toBe(3);
    });
  });

  describe('Features List', () => {
    it('should render all feature items', () => {
      render(<QrCodeSection />);

      expect(screen.getByText('Genera códigos QR personalizados al instante')).toBeInTheDocument();
      expect(screen.getByText('Descarga en PNG, SVG o PDF')).toBeInTheDocument();
      expect(screen.getByText('Colores personalizables con tu marca')).toBeInTheDocument();
      expect(screen.getByText('Enlaza a tu página, servicios o agenda')).toBeInTheDocument();
      expect(screen.getByText('Perfecto para tarjetas, posters y redes sociales')).toBeInTheDocument();
      expect(screen.getByText('Actualiza el destino sin cambiar el código')).toBeInTheDocument();
    });

    it('should render checkmark icons for features', () => {
      const { container } = render(<QrCodeSection />);
      const checkIcons = container.querySelectorAll('.lucide-circle-check');
      expect(checkIcons.length).toBe(6);
    });
  });

  describe('Screenshots', () => {
    it('should render both QR images (generator and example)', () => {
      render(<QrCodeSection />);

      const images = screen.getAllByTestId('next-image');
      expect(images.length).toBe(2);
    });

    it('should render the QR generator screenshot', () => {
      render(<QrCodeSection />);
      expect(screen.getByAltText('Generador de códigos QR de Vetify')).toBeInTheDocument();
    });

    it('should render the QR example floating card', () => {
      render(<QrCodeSection />);
      expect(screen.getByAltText('Ejemplo de código QR generado')).toBeInTheDocument();
    });

    it('should have correct src for generator screenshot', () => {
      render(<QrCodeSection />);

      const images = screen.getAllByTestId('next-image');
      const generatorImage = images.find(img => img.getAttribute('src')?.includes('qr-generator'));
      expect(generatorImage).toBeInTheDocument();
    });

    it('should have correct src for QR example', () => {
      render(<QrCodeSection />);

      const images = screen.getAllByTestId('next-image');
      const exampleImage = images.find(img => img.getAttribute('src')?.includes('qr-example'));
      expect(exampleImage).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should use grid layout', () => {
      const { container } = render(<QrCodeSection />);
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeInTheDocument();
    });

    it('should have responsive column layout', () => {
      const { container } = render(<QrCodeSection />);
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('lg:grid-cols-2');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const { container } = render(<QrCodeSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<QrCodeSection />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have alt text for all images', () => {
      render(<QrCodeSection />);

      const images = screen.getAllByTestId('next-image');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });
});
