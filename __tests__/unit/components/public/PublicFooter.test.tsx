import { render, screen } from '@testing-library/react';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  createMockPublicTenant,
  createMinimalPublicTenant,
  createMockPublicHours,
  createMockPublicSocialMedia,
} from '../../../utils/public-test-factories';

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

describe('PublicFooter', () => {
  describe('Basic Rendering', () => {
    it('should render footer element', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should render clinic name', () => {
      const tenant = createMockPublicTenant({ name: 'Mi Veterinaria' });
      render(<PublicFooter tenant={tenant} />);
      expect(screen.getByText('Mi Veterinaria')).toBeInTheDocument();
    });

    it('should render clinic description', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);
      expect(
        screen.getByText(/Cuidamos de tu mascota con amor y profesionalismo/i)
      ).toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('should render phone with tel: link', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 9999 8888' });
      render(<PublicFooter tenant={tenant} />);

      const phoneLink = screen.getByRole('link', { name: '+52 55 9999 8888' });
      expect(phoneLink).toHaveAttribute('href', 'tel:+52 55 9999 8888');
    });

    it('should render email with mailto: link', () => {
      const tenant = createMockPublicTenant({ publicEmail: 'test@clinic.com' });
      render(<PublicFooter tenant={tenant} />);

      const emailLink = screen.getByRole('link', { name: 'test@clinic.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:test@clinic.com');
    });

    it('should render address', () => {
      const tenant = createMockPublicTenant({ publicAddress: 'Av. Principal 456' });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('Av. Principal 456')).toBeInTheDocument();
    });

    it('should not render phone when null', () => {
      const tenant = createMockPublicTenant({ publicPhone: null });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.queryByRole('link', { name: /^\+52/ })).not.toBeInTheDocument();
    });

    it('should not render email when null', () => {
      const tenant = createMockPublicTenant({ publicEmail: null });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
    });
  });

  describe('Hours Display', () => {
    it('should render Horarios heading', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('Horarios')).toBeInTheDocument();
    });

    it('should render custom hours when provided', () => {
      const tenant = createMockPublicTenant({
        publicHours: createMockPublicHours({
          weekdays: '8:00 - 20:00',
          saturday: '9:00 - 15:00',
          sunday: 'Cerrado',
        }),
      });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('8:00 - 20:00')).toBeInTheDocument();
      expect(screen.getByText('9:00 - 15:00')).toBeInTheDocument();
      expect(screen.getByText('Cerrado')).toBeInTheDocument();
    });

    it('should render default hours when publicHours is null', () => {
      const tenant = createMockPublicTenant({ publicHours: null });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('9:00 - 18:00')).toBeInTheDocument();
      expect(screen.getByText('9:00 - 14:00')).toBeInTheDocument();
    });

    it('should render day labels', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('Lun - Vie:')).toBeInTheDocument();
    });
  });

  describe('Quick Links', () => {
    it('should render Enlaces heading', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('Enlaces')).toBeInTheDocument();
    });

    it('should render Inicio link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<PublicFooter tenant={tenant} />);

      const inicioLink = screen.getByRole('link', { name: 'Inicio' });
      expect(inicioLink).toHaveAttribute('href', '/mi-clinica');
    });

    it('should render Servicios link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<PublicFooter tenant={tenant} />);

      const serviciosLink = screen.getByRole('link', { name: 'Servicios' });
      expect(serviciosLink).toHaveAttribute('href', '/mi-clinica/servicios');
    });

    it('should render Agendar Cita link', () => {
      const tenant = createMockPublicTenant({ slug: 'mi-clinica' });
      render(<PublicFooter tenant={tenant} />);

      const agendarLink = screen.getByRole('link', { name: 'Agendar Cita' });
      expect(agendarLink).toHaveAttribute('href', '/mi-clinica/agendar');
    });

    it('should render Contacto link when phone exists', () => {
      const tenant = createMockPublicTenant({ publicPhone: '+52 55 1234 5678' });
      render(<PublicFooter tenant={tenant} />);

      const contactoLink = screen.getByRole('link', { name: 'Contacto' });
      expect(contactoLink).toHaveAttribute('href', 'tel:+52 55 1234 5678');
    });

    it('should not render Contacto link when phone is null', () => {
      const tenant = createMockPublicTenant({ publicPhone: null });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.queryByRole('link', { name: 'Contacto' })).not.toBeInTheDocument();
    });
  });

  describe('Copyright', () => {
    it('should render current year', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      const currentYear = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('should render clinic name in copyright', () => {
      const tenant = createMockPublicTenant({ name: 'Veterinaria Test' });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText(/Veterinaria Test\./)).toBeInTheDocument();
    });

    it('should render "Hecho con" text', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('Hecho con')).toBeInTheDocument();
    });

    it('should render Vetify link', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      const vetifyLink = screen.getByRole('link', { name: 'Vetify' });
      expect(vetifyLink).toHaveAttribute('href', 'https://vetify.app');
    });
  });

  describe('Social Media Links', () => {
    it('should render Facebook link when provided', () => {
      const tenant = createMockPublicTenant({
        publicSocialMedia: createMockPublicSocialMedia({
          facebook: 'https://facebook.com/myclinic',
        }),
      });
      render(<PublicFooter tenant={tenant} />);

      const fbLink = screen.getByRole('link', { name: 'Facebook' });
      expect(fbLink).toHaveAttribute('href', 'https://facebook.com/myclinic');
      expect(fbLink).toHaveAttribute('target', '_blank');
      expect(fbLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render Instagram link when provided', () => {
      const tenant = createMockPublicTenant({
        publicSocialMedia: createMockPublicSocialMedia({
          instagram: 'https://instagram.com/myclinic',
        }),
      });
      render(<PublicFooter tenant={tenant} />);

      const igLink = screen.getByRole('link', { name: 'Instagram' });
      expect(igLink).toHaveAttribute('href', 'https://instagram.com/myclinic');
    });

    it('should render WhatsApp link with wa.me format', () => {
      const tenant = createMockPublicTenant({
        publicSocialMedia: createMockPublicSocialMedia({
          whatsapp: '5551234567',
        }),
      });
      render(<PublicFooter tenant={tenant} />);

      const waLink = screen.getByRole('link', { name: 'WhatsApp' });
      expect(waLink).toHaveAttribute('href', 'https://wa.me/5551234567');
    });

    it('should not render social links when publicSocialMedia is null', () => {
      const tenant = createMockPublicTenant({ publicSocialMedia: null });
      render(<PublicFooter tenant={tenant} />);

      expect(screen.queryByRole('link', { name: 'Facebook' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument();
    });
  });

  describe('Theme Color Application', () => {
    it('should apply theme color to heart icon', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      const { container } = render(<PublicFooter tenant={tenant} />);

      const heartIcon = container.querySelector('.lucide-heart');
      expect(heartIcon).toHaveStyle({ color: 'rgb(255, 85, 0)' });
    });

    it('should render Vetify link in copyright section', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: '#ff5500' });
      render(<PublicFooter tenant={tenant} />);

      const vetifyLink = screen.getByRole('link', { name: 'Vetify' });
      expect(vetifyLink).toHaveAttribute('href', 'https://vetify.app');
    });

    it('should use default theme color when not provided', () => {
      const tenant = createMockPublicTenant({ publicThemeColor: null });
      const { container } = render(<PublicFooter tenant={tenant} />);

      const heartIcon = container.querySelector('.lucide-heart');
      expect(heartIcon).toHaveStyle({ color: 'rgb(117, 169, 156)' });
    });
  });

  describe('Minimal Data Handling', () => {
    it('should render with minimal tenant data', () => {
      const tenant = createMinimalPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('Minimal Clinic')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should show default hours with minimal data', () => {
      const tenant = createMinimalPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.getByText('9:00 - 18:00')).toBeInTheDocument();
    });

    it('should not show contact links with minimal data', () => {
      const tenant = createMinimalPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      expect(screen.queryByRole('link', { name: 'Contacto' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const tenant = createMockPublicTenant();
      render(<PublicFooter tenant={tenant} />);

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThanOrEqual(2);
    });

    it('should have external links with proper rel attribute', () => {
      const tenant = createMockPublicTenant({
        publicSocialMedia: createMockPublicSocialMedia(),
      });
      render(<PublicFooter tenant={tenant} />);

      const fbLink = screen.getByRole('link', { name: 'Facebook' });
      expect(fbLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
