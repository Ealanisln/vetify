import { render, screen, waitFor } from '@testing-library/react';
import { FeatureGate } from '@/components/features/FeatureGate';

// Mock the server action
jest.mock('@/app/actions/subscription', () => ({
  checkFeatureAccess: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Import after mocking
import { checkFeatureAccess } from '@/app/actions/subscription';
const mockCheckFeatureAccess = checkFeatureAccess as jest.MockedFunction<typeof checkFeatureAccess>;

describe('FeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking access', () => {
      // Never resolve to keep loading state
      mockCheckFeatureAccess.mockImplementation(() => new Promise(() => {}));

      const { container } = render(
        <FeatureGate feature="advancedInventory">
          <div>Protected content</div>
        </FeatureGate>
      );

      // Should show loading spinner (check for animate-spin class)
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      // Should not show protected content
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });
  });

  describe('Access Granted', () => {
    it('should render children when hasAccess is true', async () => {
      mockCheckFeatureAccess.mockResolvedValue(true);

      render(
        <FeatureGate feature="advancedInventory">
          <div data-testid="protected">Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected')).toBeInTheDocument();
      });

      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('should call checkFeatureAccess with correct feature name', async () => {
      mockCheckFeatureAccess.mockResolvedValue(true);

      render(
        <FeatureGate feature="automations">
          <div>Content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(mockCheckFeatureAccess).toHaveBeenCalledWith('automations');
      });
    });
  });

  describe('Access Denied', () => {
    it('should show default upgrade message when hasAccess is false and no fallback', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);

      render(
        <FeatureGate feature="premiumFeature">
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(screen.getByText('Función Premium')).toBeInTheDocument();
      });

      expect(screen.getByText('Requiere plan profesional o superior')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should show custom upgradeMessage when provided', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);

      render(
        <FeatureGate
          feature="analytics"
          upgradeMessage="Esta función requiere el plan Enterprise"
        >
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(screen.getByText('Esta función requiere el plan Enterprise')).toBeInTheDocument();
      });

      expect(screen.queryByText('Requiere plan profesional o superior')).not.toBeInTheDocument();
    });

    it('should render custom fallback when provided and access denied', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);

      const customFallback = <div data-testid="custom-fallback">Custom upgrade UI</div>;

      render(
        <FeatureGate feature="reports" fallback={customFallback}>
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      });

      expect(screen.getByText('Custom upgrade UI')).toBeInTheDocument();
      // Should not show default upgrade message
      expect(screen.queryByText('Función Premium')).not.toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should show Ver Planes link pointing to /precios', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);

      render(
        <FeatureGate feature="inventory">
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Ver Planes' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/precios');
      });
    });

    it('should show lock icon in default upgrade message', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);

      render(
        <FeatureGate feature="inventory">
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(screen.getByText('Función Premium')).toBeInTheDocument();
      });

      // The lock icon should be rendered (we check for the container class)
      const container = screen.getByText('Función Premium').closest('div');
      expect(container?.parentElement).toHaveClass('border-dashed');
    });
  });

  describe('Feature Prop Changes', () => {
    it('should re-fetch access when feature prop changes', async () => {
      mockCheckFeatureAccess
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const { rerender } = render(
        <FeatureGate feature="feature1">
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected content')).toBeInTheDocument();
      });

      expect(mockCheckFeatureAccess).toHaveBeenCalledWith('feature1');

      // Change feature prop
      rerender(
        <FeatureGate feature="feature2">
          <div>Protected content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(mockCheckFeatureAccess).toHaveBeenCalledWith('feature2');
      });

      await waitFor(() => {
        expect(screen.getByText('Función Premium')).toBeInTheDocument();
      });
    });
  });


  describe('Different Feature Types', () => {
    const features = [
      'advancedInventory',
      'automations',
      'analytics',
      'reports',
      'multiLocation',
      'customBranding',
    ];

    features.forEach((feature) => {
      it(`should check access for ${feature} feature`, async () => {
        mockCheckFeatureAccess.mockResolvedValue(true);

        render(
          <FeatureGate feature={feature}>
            <div>Content for {feature}</div>
          </FeatureGate>
        );

        await waitFor(() => {
          expect(mockCheckFeatureAccess).toHaveBeenCalledWith(feature);
        });
      });
    });
  });
});
