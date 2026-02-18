import { render, screen } from '@testing-library/react';
import { ConditionalLayout } from '@/components/ConditionalLayout';

// Mock next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock the Nav component
jest.mock('@/components/navbar/Nav', () => {
  return function MockNav() {
    return <nav data-testid="nav">Navigation</nav>;
  };
});

describe('ConditionalLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navigation Visibility', () => {
    it('should render Nav on the home page', () => {
      mockPathname.mockReturnValue('/');

      render(
        <ConditionalLayout>
          <div>Content</div>
        </ConditionalLayout>
      );

      expect(screen.getByTestId('nav')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render Nav on public routes', () => {
      const publicRoutes = [
        '/funcionalidades',
        '/precios',
        '/contacto',
        '/privacidad',
        '/sign-in',
        '/sign-up',
        '/blog',
      ];

      publicRoutes.forEach((route) => {
        mockPathname.mockReturnValue(route);

        const { unmount } = render(
          <ConditionalLayout>
            <div>Content</div>
          </ConditionalLayout>
        );

        expect(screen.getByTestId('nav')).toBeInTheDocument();
        unmount();
      });
    });

    it('should hide Nav on dashboard routes', () => {
      mockPathname.mockReturnValue('/dashboard');

      render(
        <ConditionalLayout>
          <div>Dashboard Content</div>
        </ConditionalLayout>
      );

      expect(screen.queryByTestId('nav')).not.toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should hide Nav on nested dashboard routes', () => {
      mockPathname.mockReturnValue('/dashboard/pets');

      render(
        <ConditionalLayout>
          <div>Pets Content</div>
        </ConditionalLayout>
      );

      expect(screen.queryByTestId('nav')).not.toBeInTheDocument();
    });

    it('should hide Nav on admin routes', () => {
      mockPathname.mockReturnValue('/admin');

      render(
        <ConditionalLayout>
          <div>Admin Content</div>
        </ConditionalLayout>
      );

      expect(screen.queryByTestId('nav')).not.toBeInTheDocument();
    });

    it('should hide Nav on onboarding routes', () => {
      mockPathname.mockReturnValue('/onboarding');

      render(
        <ConditionalLayout>
          <div>Onboarding Content</div>
        </ConditionalLayout>
      );

      expect(screen.queryByTestId('nav')).not.toBeInTheDocument();
    });

    it('should hide Nav on unknown routes (tenant slug pages)', () => {
      mockPathname.mockReturnValue('/some-clinic-slug');

      render(
        <ConditionalLayout>
          <div>Clinic Page</div>
        </ConditionalLayout>
      );

      expect(screen.queryByTestId('nav')).not.toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should always render children regardless of route', () => {
      const routes = ['/', '/dashboard', '/admin', '/some-unknown-route'];

      routes.forEach((route) => {
        mockPathname.mockReturnValue(route);

        const { unmount } = render(
          <ConditionalLayout>
            <div data-testid="child">Child Content</div>
          </ConditionalLayout>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        unmount();
      });
    });
  });
});
