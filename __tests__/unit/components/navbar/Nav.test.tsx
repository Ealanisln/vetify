/**
 * @jest-environment jsdom
 *
 * Unit tests for Nav component - Mobile Menu Scroll Prevention & Z-Index
 *
 * These tests verify the iOS scroll prevention fixes:
 * 1. Body position is set to fixed when menu opens
 * 2. Scroll position is preserved and restored
 * 3. Mobile overlay has correct z-index (z-[110])
 * 4. Dark mode skeleton renders correctly
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next-themes
const mockSetTheme = jest.fn();
let mockTheme = 'light';
let mockResolvedTheme = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme,
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

// Track useThemeAware mounted state for testing skeleton
let mockMounted = true;

jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({
    mounted: mockMounted,
    theme: mockResolvedTheme,
    rawTheme: mockTheme,
    setTheme: mockSetTheme,
    isLight: mockResolvedTheme === 'light',
    isDark: mockResolvedTheme === 'dark',
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority: _priority, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Kinde auth
jest.mock('@kinde-oss/kinde-auth-nextjs/components', () => ({
  LogoutLink: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className}>{children}</button>
  ),
}));

// Import Nav after mocks
import Nav from '@/components/navbar/Nav';

// Helper to get the mobile hamburger button
const getMobileMenuButton = () => {
  // Look for the button with aria-label containing "menú"
  const buttons = screen.getAllByRole('button');
  return buttons.find(
    (btn) =>
      btn.getAttribute('aria-label')?.includes('menú') ||
      btn.getAttribute('aria-label')?.includes('menu')
  );
};

describe('Nav Component - Mobile Menu Scroll Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'light';
    mockResolvedTheme = 'light';
    mockMounted = true;
    // Reset body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    window.scrollTo = jest.fn();
  });

  describe('iOS Scroll Lock', () => {
    it('should set body position to fixed when menu opens', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      expect(menuButton).toBeInTheDocument();

      // Initially body should not have fixed position
      expect(document.body.style.position).toBe('');

      await user.click(menuButton!);

      // Body should have fixed position after menu opens
      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
      });
    });

    it('should preserve scroll position when menu opens', async () => {
      const user = userEvent.setup();

      // Set initial scroll position
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });

      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        // Body top should be set to negative scroll position
        expect(document.body.style.top).toBe('-200px');
      });
    });

    it('should restore scroll position when menu closes', async () => {
      const user = userEvent.setup();

      // Set initial scroll position
      Object.defineProperty(window, 'scrollY', { value: 300, writable: true });

      render(<Nav />);

      const menuButton = getMobileMenuButton();

      // Open menu
      await user.click(menuButton!);

      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
      });

      // Close menu by clicking the button again
      await user.click(menuButton!);

      await waitFor(() => {
        // Body position should be restored
        expect(document.body.style.position).toBe('');
        // window.scrollTo should be called to restore position
        expect(window.scrollTo).toHaveBeenCalledWith(0, 300);
      });
    });

    it('should set body width to 100% when menu opens', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        expect(document.body.style.width).toBe('100%');
      });
    });

    it('should set body overflow to hidden when menu opens', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('should clean up body styles on unmount', async () => {
      const user = userEvent.setup();

      // Set initial scroll position
      Object.defineProperty(window, 'scrollY', { value: 150, writable: true });

      const { unmount } = render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
      });

      // Unmount the component
      unmount();

      // Body styles should be cleaned up
      await waitFor(() => {
        expect(document.body.style.position).toBe('');
        expect(document.body.style.top).toBe('');
        expect(document.body.style.width).toBe('');
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('should restore body styles when clicking outside menu', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        expect(document.body.style.position).toBe('fixed');
      });

      // Click outside to close menu (on document body)
      await user.click(document.body);

      await waitFor(() => {
        expect(document.body.style.position).toBe('');
      });
    });
  });

  describe('Mobile Overlay Z-Index', () => {
    it('should render mobile overlay with z-[110] class', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        // Find the mobile overlay container
        const overlay = document.querySelector('.z-\\[110\\]');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should have navbar with z-[100] class', () => {
      render(<Nav />);

      // Find the main nav element
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('z-[100]');
    });

    it('should have mobile overlay z-index higher than navbar', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        const overlay = document.querySelector('.z-\\[110\\]');
        const nav = document.querySelector('.z-\\[100\\]');

        expect(overlay).toBeInTheDocument();
        expect(nav).toBeInTheDocument();

        // z-[110] > z-[100], meaning overlay appears above navbar
        // This is verified by the presence of both classes
      });
    });
  });

  describe('Dark Mode Skeleton', () => {
    it('should render skeleton with dark mode classes before mount', () => {
      // Set mounted to false to see skeleton
      mockMounted = false;

      render(<Nav />);

      // Find the skeleton nav element
      const nav = screen.getByRole('navigation');

      // Should have dark mode background class
      expect(nav).toHaveClass('dark:bg-gray-900/95');
    });

    it('should include dark:border-gray-700 in skeleton', () => {
      mockMounted = false;

      render(<Nav />);

      const nav = screen.getByRole('navigation');

      // Should have dark mode border class
      expect(nav).toHaveClass('dark:border-gray-700');
    });

    it('should show loading skeleton for user section before mount', () => {
      mockMounted = false;

      render(<Nav />);

      // Should show animated pulse skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render full nav after mount', () => {
      mockMounted = true;

      render(<Nav />);

      // Should show navigation links
      expect(screen.getByText('Funcionalidades')).toBeInTheDocument();
      expect(screen.getByText('Precios')).toBeInTheDocument();
    });
  });

  describe('Mobile Menu Toggle', () => {
    it('should toggle menu open state on button click', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();

      // Initially aria-expanded should be false
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      await user.click(menuButton!);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });

      // Click to close
      await user.click(menuButton!);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should show menu overlay when open', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        // Mobile overlay should be visible
        const overlay = document.querySelector('.z-\\[110\\]');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should hide menu overlay when closed', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();

      // Open menu
      await user.click(menuButton!);

      await waitFor(() => {
        const overlay = document.querySelector('.z-\\[110\\]');
        expect(overlay).toBeInTheDocument();
      });

      // Close menu
      await user.click(menuButton!);

      await waitFor(() => {
        const overlay = document.querySelector('.z-\\[110\\]');
        expect(overlay).not.toBeInTheDocument();
      });
    });

    it('should update aria-label based on menu state', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();

      // Initially should say "Abrir menú"
      expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú');

      // Click to open
      await user.click(menuButton!);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-label', 'Cerrar menú');
      });

      // Click to close
      await user.click(menuButton!);

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú');
      });
    });
  });

  describe('Mobile Menu Navigation Links', () => {
    it('should show navigation links when menu is open', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        // Find navigation links in mobile menu
        const funcionalidadesLinks = screen.getAllByText('Funcionalidades');
        const preciosLinks = screen.getAllByText('Precios');

        // Should have multiple (desktop + mobile)
        expect(funcionalidadesLinks.length).toBeGreaterThanOrEqual(1);
        expect(preciosLinks.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should close menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const menuButton = getMobileMenuButton();
      await user.click(menuButton!);

      await waitFor(() => {
        const overlay = document.querySelector('.z-\\[110\\]');
        expect(overlay).toBeInTheDocument();
      });

      // Click on a navigation link (get the one in the mobile menu)
      const funcionalidadesLinks = screen.getAllByText('Funcionalidades');
      const mobileLink = funcionalidadesLinks[funcionalidadesLinks.length - 1]; // Last one is usually in mobile menu
      await user.click(mobileLink);

      await waitFor(() => {
        expect(document.body.style.position).toBe('');
      });
    });
  });
});

describe('Nav Component - Scroll Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'light';
    mockResolvedTheme = 'light';
    mockMounted = true;
    // Reset body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
  });

  it('should apply scrolled styles when page is scrolled', async () => {
    render(<Nav />);

    // Simulate scroll event
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      const nav = screen.getByRole('navigation');
      // Should have scrolled styling classes
      expect(nav.className).toContain('shadow-lg');
    });
  });

  it('should remove scrolled styles when at top of page', async () => {
    render(<Nav />);

    // First scroll down
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    // Then scroll back to top
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      const nav = screen.getByRole('navigation');
      // Should have non-scrolled styling
      expect(nav.className).toContain('shadow-md');
    });
  });
});
