import { render, screen } from '@testing-library/react';
import { StaffSection } from '@/components/marketing/staff-section';

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

describe('StaffSection', () => {
  describe('Basic Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<StaffSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render the badge', () => {
      render(<StaffSection />);
      expect(screen.getByText('Gestión de equipo')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<StaffSection />);
      expect(
        screen.getByRole('heading', { name: /tu equipo, con los permisos correctos/i })
      ).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<StaffSection />);
      expect(
        screen.getByText(/invita a veterinarios, recepcionistas y administradores/i)
      ).toBeInTheDocument();
    });
  });

  describe('Features List', () => {
    it('should render all feature items', () => {
      render(<StaffSection />);

      expect(screen.getByText('Invita a tu equipo con enlaces seguros')).toBeInTheDocument();
      expect(screen.getByText('Asigna roles automáticamente al registrarse')).toBeInTheDocument();
      expect(screen.getByText('Control de permisos granular por módulo')).toBeInTheDocument();
      expect(screen.getByText('Veterinarios, recepcionistas, administradores')).toBeInTheDocument();
      expect(screen.getByText('Revoca accesos en cualquier momento')).toBeInTheDocument();
      expect(screen.getByText('Historial de actividad por usuario')).toBeInTheDocument();
    });

    it('should render checkmark icons for features', () => {
      const { container } = render(<StaffSection />);
      const checkIcons = container.querySelectorAll('.lucide-circle-check');
      expect(checkIcons.length).toBe(6);
    });
  });

  describe('Role Badges', () => {
    it('should render Admin role badge', () => {
      render(<StaffSection />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render Veterinario role badge', () => {
      render(<StaffSection />);
      expect(screen.getByText('Veterinario')).toBeInTheDocument();
    });

    it('should render Recepción role badge', () => {
      render(<StaffSection />);
      expect(screen.getByText('Recepción')).toBeInTheDocument();
    });

    it('should render role icons', () => {
      const { container } = render(<StaffSection />);

      // Shield icon for Admin
      expect(container.querySelector('.lucide-shield')).toBeInTheDocument();
      // Users icon for Veterinario
      expect(container.querySelector('.lucide-users')).toBeInTheDocument();
      // UserPlus icon for Recepción
      expect(container.querySelector('.lucide-user-plus')).toBeInTheDocument();
    });
  });

  describe('Invitation Link Example', () => {
    it('should render invitation link example section', () => {
      render(<StaffSection />);
      expect(screen.getByText('Ejemplo de enlace de invitación:')).toBeInTheDocument();
    });

    it('should render example URL', () => {
      render(<StaffSection />);
      expect(screen.getByText('vetify.pro/invite/abc123...')).toBeInTheDocument();
    });
  });

  describe('Screenshot', () => {
    it('should render the staff invitation screenshot', () => {
      render(<StaffSection />);

      const image = screen.getByTestId('next-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/marketing/staff-invitation.png');
    });

    it('should have correct alt text', () => {
      render(<StaffSection />);
      expect(screen.getByAltText('Modal de invitación de personal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic section element', () => {
      const { container } = render(<StaffSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<StaffSection />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have background class for visual distinction', () => {
      const { container } = render(<StaffSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-secondary/30');
    });
  });
});
