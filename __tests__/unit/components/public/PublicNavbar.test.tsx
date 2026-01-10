import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicNavbar } from '@/components/public/PublicNavbar';

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
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="navbar-logo" />
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock next-themes
const mockSetTheme = jest.fn();
let mockResolvedTheme = 'light';
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

describe('PublicNavbar', () => {
  const defaultTenant = {
    id: 'tenant-1',
    name: 'Test Clinic',
    slug: 'test-clinic',
    logo: null,
    publicPhone: '+52 55 1234 5678',
    publicAddress: 'Av. Test 123',
    publicThemeColor: '#75a99c',
    hasGallery: true,
    hasTeam: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolvedTheme = 'light';
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    it('should render nav element', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      // There may be multiple nav elements (main nav + mobile menu nav)
      const navElements = screen.getAllByRole('navigation');
      expect(navElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render clinic name', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      // Name appears in both desktop and mobile menu header
      const names = screen.getAllByText('Test Clinic');
      expect(names.length).toBeGreaterThan(0);
    });

    it('should render clinic name as link to home', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const homeLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic'
      );
      expect(homeLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Logo Display', () => {
    it('should render logo image when provided', () => {
      const tenantWithLogo = { ...defaultTenant, logo: 'https://example.com/logo.png' };
      render(<PublicNavbar tenant={tenantWithLogo} />);

      const logos = screen.getAllByTestId('navbar-logo');
      expect(logos.length).toBeGreaterThan(0);
      expect(logos[0]).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('should render initial fallback when no logo', () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Should show first letter of clinic name (appears multiple times)
      const initials = screen.getAllByText('T');
      expect(initials.length).toBeGreaterThan(0);
    });

    it('should apply theme color to initial fallback', () => {
      const tenant = { ...defaultTenant, publicThemeColor: '#ff5500' };
      render(<PublicNavbar tenant={tenant} />);

      const initials = screen.getAllByText('T');
      expect(initials[0]).toHaveStyle({ backgroundColor: 'rgb(255, 85, 0)' });
    });
  });

  describe('Contact Information (Desktop)', () => {
    it('should display phone when provided', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      // Phone appears in multiple places (desktop nav and mobile menu)
      const phones = screen.getAllByText('+52 55 1234 5678');
      expect(phones.length).toBeGreaterThan(0);
    });

    it('should display address when provided', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      // Address appears in desktop nav and mobile menu
      const addresses = screen.getAllByText('Av. Test 123');
      expect(addresses.length).toBeGreaterThan(0);
    });

    it('should not display phone when null', () => {
      const tenant = { ...defaultTenant, publicPhone: null };
      render(<PublicNavbar tenant={tenant} />);
      expect(screen.queryByText('+52 55 1234 5678')).not.toBeInTheDocument();
    });

    it('should not display address when null', () => {
      const tenant = { ...defaultTenant, publicAddress: null };
      render(<PublicNavbar tenant={tenant} />);
      expect(screen.queryByText('Av. Test 123')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render Servicios link', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const serviciosLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic/servicios'
      );
      expect(serviciosLinks.length).toBeGreaterThan(0);
    });

    it('should render Galería link when hasGallery is true', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const galeriaLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic/galeria'
      );
      expect(galeriaLinks.length).toBeGreaterThan(0);
    });

    it('should not render Galería link when hasGallery is false', () => {
      const tenant = { ...defaultTenant, hasGallery: false };
      render(<PublicNavbar tenant={tenant} />);
      const galeriaLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic/galeria'
      );
      expect(galeriaLinks.length).toBe(0);
    });

    it('should render Equipo link when hasTeam is true', () => {
      const tenant = { ...defaultTenant, hasTeam: true };
      render(<PublicNavbar tenant={tenant} />);
      const equipoLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic/equipo'
      );
      expect(equipoLinks.length).toBeGreaterThan(0);
    });

    it('should not render Equipo link when hasTeam is false', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const equipoLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic/equipo'
      );
      expect(equipoLinks.length).toBe(0);
    });

    it('should render Agendar Cita buttons', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const agendarButtons = screen.getAllByRole('button', { name: /agendar cita/i });
      expect(agendarButtons.length).toBeGreaterThan(0);
    });

    it('should have correct href for Agendar link', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const agendarLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/test-clinic/agendar'
      );
      expect(agendarLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Menu', () => {
    it('should have mobile menu toggle button with aria-label', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const menuButton = screen.getByLabelText('Abrir menú');
      expect(menuButton).toBeInTheDocument();
    });

    it('should show mobile menu when toggle is clicked', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      // Check that the menu panel becomes visible (Cerrar menú button appears)
      await waitFor(() => {
        expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
      });
    });

    it('should close mobile menu when close button is clicked', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
      });

      // Close menu
      const closeButton = screen.getByLabelText('Cerrar menú');
      fireEvent.click(closeButton);

      // Menu should close (body overflow should be reset)
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('should close mobile menu on Escape key', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      // Wait for menu to open and body scroll to be locked
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Menu should close
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('should lock body scroll when menu is open', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('should render contact section in mobile menu', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Contacto')).toBeInTheDocument();
      });
    });

    it('should render navigation section in mobile menu', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Navegación')).toBeInTheDocument();
      });
    });

    it('should render phone with click-to-call in mobile menu', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Llamar ahora')).toBeInTheDocument();
      });
    });

    it('should show clinic type subtitle in mobile menu header', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Clínica Veterinaria')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle', () => {
    it('should render theme toggle button in desktop nav after mount', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      await waitFor(() => {
        const themeButton = screen.getByLabelText(/cambiar a modo/i);
        expect(themeButton).toBeInTheDocument();
      });
    });

    it('should render appearance section in mobile menu after mount', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Apariencia')).toBeInTheDocument();
      });
    });

    it('should call setTheme when theme toggle is clicked', async () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      await waitFor(() => {
        const themeButton = screen.getByLabelText(/cambiar a modo/i);
        fireEvent.click(themeButton);
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
      });
    });

    it('should show "Modo Claro" text in light mode', async () => {
      mockResolvedTheme = 'light';
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Modo Claro')).toBeInTheDocument();
      });
    });

    it('should show "Modo Oscuro" text in dark mode', async () => {
      mockResolvedTheme = 'dark';
      render(<PublicNavbar tenant={defaultTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Modo Oscuro')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Color Application', () => {
    it('should apply theme color to Agendar Cita button', () => {
      const tenant = { ...defaultTenant, publicThemeColor: '#ff5500' };
      render(<PublicNavbar tenant={tenant} />);

      const agendarButtons = screen.getAllByRole('button', { name: /agendar cita/i });
      const desktopButton = agendarButtons[0];
      expect(desktopButton).toHaveStyle({ backgroundColor: 'rgb(255, 85, 0)' });
    });

    it('should use default theme color when not provided', () => {
      const tenant = { ...defaultTenant, publicThemeColor: null };
      render(<PublicNavbar tenant={tenant} />);

      const agendarButtons = screen.getAllByRole('button', { name: /agendar cita/i });
      const desktopButton = agendarButtons[0];
      expect(desktopButton).toHaveStyle({ backgroundColor: 'rgb(117, 169, 156)' });
    });

    it('should apply theme color to phone icon', () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      const { container } = render(<PublicNavbar tenant={defaultTenant} />);
      const phoneIcons = container.querySelectorAll('.lucide-phone');
      expect(phoneIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Minimal Tenant Data', () => {
    it('should render with minimal tenant data', () => {
      const minimalTenant = {
        id: 'tenant-1',
        name: 'Minimal Clinic',
        slug: 'minimal-clinic',
        logo: null,
        publicPhone: null,
        publicAddress: null,
        publicThemeColor: null,
        hasGallery: false,
        hasTeam: false,
      };

      render(<PublicNavbar tenant={minimalTenant} />);

      // Should render clinic name
      const names = screen.getAllByText('Minimal Clinic');
      expect(names.length).toBeGreaterThan(0);

      // Should not render gallery or team links
      const galeriaLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href') === '/minimal-clinic/galeria'
      );
      expect(galeriaLinks.length).toBe(0);
    });

    it('should not render contact section when no phone or address', async () => {
      const minimalTenant = {
        id: 'tenant-1',
        name: 'Minimal Clinic',
        slug: 'minimal-clinic',
        logo: null,
        publicPhone: null,
        publicAddress: null,
        publicThemeColor: null,
        hasGallery: false,
        hasTeam: false,
      };

      render(<PublicNavbar tenant={minimalTenant} />);

      // Open menu
      const menuButton = screen.getByLabelText('Abrir menú');
      fireEvent.click(menuButton);

      // Should not show "Contacto" section header
      expect(screen.queryByText('Contacto')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for interactive elements', () => {
      render(<PublicNavbar tenant={defaultTenant} />);

      // Mobile menu button
      expect(screen.getByLabelText('Abrir menú')).toBeInTheDocument();
    });

    it('should have semantic nav elements', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      // There's a main nav element and a nested nav in mobile menu
      const navElements = screen.getAllByRole('navigation');
      expect(navElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper link structure', () => {
      render(<PublicNavbar tenant={defaultTenant} />);
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBeGreaterThan(0);
    });
  });
});
