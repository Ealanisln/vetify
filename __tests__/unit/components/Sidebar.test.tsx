import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { UserWithTenant, TenantWithPlan } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock useStaffPermissions hook
const mockCanAccess = jest.fn();
const mockUseStaffPermissions = {
  canAccess: mockCanAccess,
  isLoading: false,
  staff: null,
  position: 'MANAGER' as const,
  error: null,
  accessibleFeatures: [],
  isAdmin: true,
  isVeterinarian: false,
  isReceptionist: false,
  isAssistant: false,
  isTechnician: false,
  refresh: jest.fn(),
};

jest.mock('@/hooks/useStaffPermissions', () => ({
  useStaffPermissions: jest.fn(() => mockUseStaffPermissions),
}));

import { useStaffPermissions } from '@/hooks/useStaffPermissions';
const mockUseStaffPermissionsHook = useStaffPermissions as jest.MockedFunction<typeof useStaffPermissions>;

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, onClick, className }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="logo-image" />
  ),
}));

// Mock LocationSwitcher
jest.mock('@/components/locations/LocationSwitcher', () => ({
  LocationSwitcher: () => <div data-testid="location-switcher">Location Switcher</div>,
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  HomeIcon: () => <svg data-testid="home-icon" />,
  UserGroupIcon: () => <svg data-testid="user-group-icon" />,
  CalendarIcon: () => <svg data-testid="calendar-icon" />,
  CubeIcon: () => <svg data-testid="cube-icon" />,
  ChartBarIcon: () => <svg data-testid="chart-icon" />,
  CogIcon: () => <svg data-testid="cog-icon" />,
  XMarkIcon: () => <svg data-testid="x-mark-icon" />,
  CreditCardIcon: () => <svg data-testid="credit-card-icon" />,
  DocumentTextIcon: () => <svg data-testid="document-icon" />,
  CurrencyDollarIcon: () => <svg data-testid="currency-icon" />,
  UsersIcon: () => <svg data-testid="users-icon" />,
  MapPinIcon: () => <svg data-testid="map-pin-icon" />,
  StarIcon: () => <svg data-testid="star-icon" />,
}));

import { usePathname } from 'next/navigation';
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Sidebar', () => {
  const defaultProps = {
    user: {
      id: 'user-123',
      kindeId: 'kinde-123',
      email: 'test@example.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      name: 'Juan Pérez',
      picture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserWithTenant,
    tenant: {
      id: 'tenant-123',
      name: 'Veterinaria Test',
      slug: 'vet-test',
      planId: 'plan-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TenantWithPlan,
    sidebarOpen: false,
    setSidebarOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    // Reset body overflow
    document.body.style.overflow = '';
    // Reset permissions mock - default to admin with full access
    mockCanAccess.mockReturnValue(true);
    mockUseStaffPermissionsHook.mockReturnValue({
      ...mockUseStaffPermissions,
      isLoading: false,
      canAccess: mockCanAccess,
    });
  });

  describe('Desktop Sidebar Rendering', () => {
    it('should render desktop sidebar', () => {
      render(<Sidebar {...defaultProps} />);

      // Desktop sidebar has specific class
      const desktopSidebar = document.querySelector('.hidden.lg\\:fixed');
      expect(desktopSidebar).toBeInTheDocument();
    });

    it('should render logo in desktop sidebar', () => {
      render(<Sidebar {...defaultProps} />);

      const logoImages = screen.getAllByTestId('logo-image');
      expect(logoImages.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Vetify text', () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getAllByText('Vetify').length).toBeGreaterThanOrEqual(1);
    });

    it('should render LocationSwitcher', () => {
      render(<Sidebar {...defaultProps} />);

      const locationSwitchers = screen.getAllByTestId('location-switcher');
      expect(locationSwitchers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mobile Sidebar', () => {
    it('should hide mobile sidebar when closed', () => {
      render(<Sidebar {...defaultProps} sidebarOpen={false} />);

      // Mobile sidebar should have 'hidden' class when closed
      const mobileContainer = document.querySelector('.relative.z-50.lg\\:hidden');
      expect(mobileContainer).toHaveClass('hidden');
    });

    it('should show mobile sidebar when open', () => {
      render(<Sidebar {...defaultProps} sidebarOpen={true} />);

      // Mobile sidebar should have 'fixed inset-0' when open
      const mobileContainer = document.querySelector('.relative.z-50.lg\\:hidden');
      expect(mobileContainer).toHaveClass('fixed', 'inset-0');
    });

    it('should render close button when sidebar is open', () => {
      render(<Sidebar {...defaultProps} sidebarOpen={true} />);

      const closeButton = screen.getByLabelText('Cerrar sidebar');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call setSidebarOpen(false) when close button clicked', () => {
      const setSidebarOpen = jest.fn();
      render(<Sidebar {...defaultProps} sidebarOpen={true} setSidebarOpen={setSidebarOpen} />);

      const closeButton = screen.getByLabelText('Cerrar sidebar');
      fireEvent.click(closeButton);

      expect(setSidebarOpen).toHaveBeenCalledWith(false);
    });

    it('should call setSidebarOpen(false) when overlay clicked', () => {
      const setSidebarOpen = jest.fn();
      render(<Sidebar {...defaultProps} sidebarOpen={true} setSidebarOpen={setSidebarOpen} />);

      // Find the overlay (aria-hidden div)
      const overlay = document.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      expect(setSidebarOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Navigation Items', () => {
    it('should render all navigation items', () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Clientes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mascotas').length).toBeGreaterThanOrEqual(1);
      // Note: "Personal" was moved from sidebar to Settings page
      expect(screen.getAllByText('Ubicaciones').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Punto de Venta').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Caja').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inventario').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Historia Clínica').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Citas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Reportes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Configuración').length).toBeGreaterThanOrEqual(1);
    });

    it('should render navigation links with correct hrefs', () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getAllByTestId('link-/dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('link-/dashboard/customers').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('link-/dashboard/pets').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('link-/dashboard/settings').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight Dashboard when on /dashboard', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<Sidebar {...defaultProps} />);

      // Find dashboard links - they should have active styling
      const dashboardLinks = screen.getAllByTestId('link-/dashboard');
      const hasActiveLink = dashboardLinks.some(link =>
        link.className.includes('bg-[#75a99c]') && link.className.includes('text-white')
      );
      expect(hasActiveLink).toBe(true);
    });

    it('should highlight Clientes when on /dashboard/customers', () => {
      mockUsePathname.mockReturnValue('/dashboard/customers');
      render(<Sidebar {...defaultProps} />);

      const customerLinks = screen.getAllByTestId('link-/dashboard/customers');
      const hasActiveLink = customerLinks.some(link =>
        link.className.includes('bg-[#75a99c]') && link.className.includes('text-white')
      );
      expect(hasActiveLink).toBe(true);
    });

    it('should NOT highlight Dashboard when on /dashboard/customers', () => {
      mockUsePathname.mockReturnValue('/dashboard/customers');
      render(<Sidebar {...defaultProps} />);

      const dashboardLinks = screen.getAllByTestId('link-/dashboard');
      // Dashboard links should NOT have active styling
      const hasActiveLink = dashboardLinks.some(link =>
        link.className.includes('bg-[#75a99c]') && link.className.includes('text-white')
      );
      expect(hasActiveLink).toBe(false);
    });
  });

  describe('User Info Display', () => {
    it('should display user first name', () => {
      render(<Sidebar {...defaultProps} />);

      // User name appears in both mobile and desktop sidebars
      expect(screen.getAllByText('Juan').length).toBeGreaterThanOrEqual(1);
    });

    it('should display tenant name', () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getAllByText('Veterinaria Test').length).toBeGreaterThanOrEqual(1);
    });

    it('should display user initial in avatar', () => {
      render(<Sidebar {...defaultProps} />);

      // Avatar shows first letter of firstName
      expect(screen.getAllByText('J').length).toBeGreaterThanOrEqual(1);
    });

    it('should fallback to name if firstName is not available', () => {
      const propsWithoutFirstName = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          firstName: null,
          name: 'Test User',
        },
      };

      render(<Sidebar {...propsWithoutFirstName} />);

      expect(screen.getAllByText('Test User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('T').length).toBeGreaterThanOrEqual(1);
    });

    it('should show U as fallback when no name available', () => {
      const propsWithoutName = {
        ...defaultProps,
        user: {
          ...defaultProps.user,
          firstName: null,
          name: null,
        },
      };

      render(<Sidebar {...propsWithoutName} />);

      // Should show 'U' as fallback initial
      expect(screen.getAllByText('U').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close sidebar on Escape key press', () => {
      const setSidebarOpen = jest.fn();
      render(<Sidebar {...defaultProps} sidebarOpen={true} setSidebarOpen={setSidebarOpen} />);

      // Trigger escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(setSidebarOpen).toHaveBeenCalledWith(false);
    });

    it('should NOT respond to Escape when sidebar is closed', () => {
      const setSidebarOpen = jest.fn();
      render(<Sidebar {...defaultProps} sidebarOpen={false} setSidebarOpen={setSidebarOpen} />);

      // Trigger escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(setSidebarOpen).not.toHaveBeenCalled();
    });
  });

  describe('Body Overflow Management', () => {
    it('should set body overflow to hidden when sidebar opens', () => {
      const { rerender } = render(<Sidebar {...defaultProps} sidebarOpen={false} />);

      expect(document.body.style.overflow).toBe('');

      rerender(<Sidebar {...defaultProps} sidebarOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unset body overflow when sidebar closes', () => {
      const { rerender } = render(<Sidebar {...defaultProps} sidebarOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Sidebar {...defaultProps} sidebarOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should clean up body overflow on unmount', () => {
      const { unmount } = render(<Sidebar {...defaultProps} sidebarOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Mobile Navigation Click Behavior', () => {
    it('should close sidebar when navigation item is clicked on mobile', () => {
      const setSidebarOpen = jest.fn();
      render(<Sidebar {...defaultProps} sidebarOpen={true} setSidebarOpen={setSidebarOpen} />);

      // Find a mobile sidebar link and click it
      const mobileContainer = document.querySelector('.relative.z-50.lg\\:hidden');
      const links = mobileContainer?.querySelectorAll('a');

      if (links && links.length > 0) {
        fireEvent.click(links[0]);
        expect(setSidebarOpen).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have navigation landmark with aria-label', () => {
      render(<Sidebar {...defaultProps} />);

      const navElements = screen.getAllByLabelText('Navegación principal');
      expect(navElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have close button with accessible label', () => {
      render(<Sidebar {...defaultProps} sidebarOpen={true} />);

      const closeButton = screen.getByLabelText('Cerrar sidebar');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Navigation Icon Rendering', () => {
    it('should render navigation icons', () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getAllByTestId('home-icon').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('cog-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Loading State (Skeleton)', () => {
    it('should show skeleton when permissions are loading', () => {
      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: true,
        canAccess: mockCanAccess,
      });

      render(<Sidebar {...defaultProps} />);

      // Should show skeleton elements (animated placeholder divs)
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);

      // Should NOT show navigation items while loading
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
      expect(screen.queryByText('Mascotas')).not.toBeInTheDocument();
    });

    it('should NOT show all navigation items during loading (prevents flash)', () => {
      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: true,
        canAccess: mockCanAccess,
      });

      render(<Sidebar {...defaultProps} />);

      // This is the key test - we should NOT see full navigation during loading
      // Previously, all items were shown during loading causing a "flash"
      const allNavItems = ['Dashboard', 'Clientes', 'Mascotas', 'Ubicaciones',
        'Punto de Venta', 'Caja', 'Inventario', 'Historia Clínica', 'Citas',
        'Testimonios', 'Reportes', 'Equipo', 'Configuración'];

      allNavItems.forEach(item => {
        expect(screen.queryByText(item)).not.toBeInTheDocument();
      });
    });

    it('should show navigation items after loading completes', () => {
      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: false,
        canAccess: mockCanAccess,
      });

      render(<Sidebar {...defaultProps} />);

      // Should NOT show skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBe(0);

      // Should show navigation items
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });

    it('should render 5 skeleton items during loading', () => {
      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: true,
        canAccess: mockCanAccess,
      });

      render(<Sidebar {...defaultProps} />);

      // Desktop sidebar shows 5 skeleton items, mobile shows 5 when open
      const skeletonContainers = document.querySelectorAll('.animate-pulse');
      // At least 5 for desktop sidebar
      expect(skeletonContainers.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Permission-Based Navigation Filtering', () => {
    it('should filter navigation based on user permissions', () => {
      // Mock limited permissions - only dashboard, pets, and appointments
      mockCanAccess.mockImplementation((feature: string) => {
        return ['dashboard', 'pets', 'appointments'].includes(feature);
      });

      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: false,
        canAccess: mockCanAccess,
      });

      render(<Sidebar {...defaultProps} />);

      // Should show permitted items
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mascotas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Citas').length).toBeGreaterThanOrEqual(1);

      // Should NOT show restricted items
      expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
      expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
      expect(screen.queryByText('Reportes')).not.toBeInTheDocument();
    });

    it('should show all navigation items for admin users', () => {
      // Mock admin with full access
      mockCanAccess.mockReturnValue(true);

      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: false,
        canAccess: mockCanAccess,
        isAdmin: true,
      });

      render(<Sidebar {...defaultProps} />);

      // Should show all navigation items
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Clientes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mascotas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inventario').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Reportes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Configuración').length).toBeGreaterThanOrEqual(1);
    });

    it('should show fallback navigation if no items are accessible', () => {
      // Mock no permissions (edge case - shouldn't happen for valid users)
      mockCanAccess.mockReturnValue(false);

      // Spy on console.warn to verify fallback warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: false,
        canAccess: mockCanAccess,
      });

      render(<Sidebar {...defaultProps} />);

      // Fallback: should show all items and log a warning
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sidebar] No accessible navigation items - showing all items as fallback'
      );

      consoleSpy.mockRestore();
    });

    it('should transition from skeleton to filtered items without flash', async () => {
      // Start with loading
      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: true,
        canAccess: mockCanAccess,
      });

      const { rerender } = render(<Sidebar {...defaultProps} />);

      // During loading - skeleton shown, no nav items
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

      // Complete loading with limited permissions
      mockCanAccess.mockImplementation((feature: string) => {
        return ['dashboard', 'pets', 'appointments'].includes(feature);
      });

      mockUseStaffPermissionsHook.mockReturnValue({
        ...mockUseStaffPermissions,
        isLoading: false,
        canAccess: mockCanAccess,
      });

      rerender(<Sidebar {...defaultProps} />);

      // After loading - should show only permitted items, no skeleton
      expect(document.querySelectorAll('.animate-pulse').length).toBe(0);
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Mascotas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Citas').length).toBeGreaterThanOrEqual(1);

      // Should NOT have shown all items at any point (no flash)
      expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
      expect(screen.queryByText('Reportes')).not.toBeInTheDocument();
    });
  });
});
