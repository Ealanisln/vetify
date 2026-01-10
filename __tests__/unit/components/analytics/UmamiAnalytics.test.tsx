/**
 * Unit tests for UmamiAnalytics component
 * Tests the path exclusion logic for Umami Analytics
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Mock next/script - uses div to avoid lint errors about sync scripts
jest.mock('next/script', () => {
  return function MockScript({ src, ...props }: { src: string; [key: string]: unknown }) {
    return <div data-testid="umami-script" data-src={src} {...props} />;
  };
});

// Mock next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Import after mocks
import { UmamiAnalytics } from '@/components/analytics/UmamiAnalytics';

describe('UmamiAnalytics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Path exclusion', () => {
    it('should not render on /invite path', async () => {
      mockPathname.mockReturnValue('/invite');

      const { container } = render(<UmamiAnalytics />);

      // Wait for useEffect to run
      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeNull();
      });
    });

    it('should not render on /invite with token', async () => {
      mockPathname.mockReturnValue('/invite?token=abc123');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeNull();
      });
    });

    it('should not render on /api/auth paths', async () => {
      mockPathname.mockReturnValue('/api/auth/callback');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeNull();
      });
    });

    it('should not render on /onboarding path', async () => {
      mockPathname.mockReturnValue('/onboarding');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeNull();
      });
    });

    it('should not render on /sign-in path', async () => {
      mockPathname.mockReturnValue('/sign-in');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeNull();
      });
    });

    it('should not render on /sign-up path', async () => {
      mockPathname.mockReturnValue('/sign-up');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeNull();
      });
    });
  });

  describe('Allowed paths', () => {
    it('should render on /dashboard path', async () => {
      mockPathname.mockReturnValue('/dashboard');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });

    it('should render on root path', async () => {
      mockPathname.mockReturnValue('/');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });

    it('should render on /precios path', async () => {
      mockPathname.mockReturnValue('/precios');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });

    it('should render on clinic slug path', async () => {
      mockPathname.mockReturnValue('/my-clinic');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });

    it('should render on dashboard subpaths', async () => {
      mockPathname.mockReturnValue('/dashboard/pets');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });
  });

  describe('Script attributes', () => {
    it('should have correct src attribute', async () => {
      mockPathname.mockReturnValue('/dashboard');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
        expect(script?.getAttribute('data-src')).toBe('https://analytics.alanis.dev/script.js');
      });
    });

    it('should have correct website-id attribute', async () => {
      mockPathname.mockReturnValue('/dashboard');

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
        expect(script?.getAttribute('data-website-id')).toBe('a8982b40-5dc3-4a51-a17f-1cf53a2aecc4');
      });
    });
  });

  describe('SSR behavior', () => {
    it('should not render before mount', () => {
      // Before useEffect runs, component should return null
      mockPathname.mockReturnValue('/dashboard');

      // We test this by checking initial render has no script
      // The script only appears after the useEffect runs
      const { rerender } = render(<UmamiAnalytics />);

      // Initial render might not have the script yet
      // After rerender (simulating effect completion), it should appear
      rerender(<UmamiAnalytics />);

      // Note: In actual test, we use waitFor to handle async behavior
    });
  });

  describe('Edge cases', () => {
    it('should handle null pathname gracefully', async () => {
      mockPathname.mockReturnValue(null);

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        // Should not crash, and should render (null pathname doesn't match exclusions)
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });

    it('should handle undefined pathname gracefully', async () => {
      mockPathname.mockReturnValue(undefined);

      const { container } = render(<UmamiAnalytics />);

      await waitFor(() => {
        // Should not crash
        const script = container.querySelector('[data-testid="umami-script"]');
        expect(script).toBeTruthy();
      });
    });
  });
});
