/**
 * @jest-environment jsdom
 *
 * Auth links must not be prefetched.
 *
 * `/api/auth/login` and `/api/auth/register` are Kinde route handlers that only
 * answer with a redirect to the Kinde issuer. When Next.js `Link` prefetches
 * them, the browser follows the redirect off-origin and the request is blocked
 * by the CSP `connect-src` directive, producing console noise on every public
 * page. These tests pin `prefetch={false}` on every auth link rendered by the
 * public navigation components.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: jest.fn() }),
}));

jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({
    mounted: true,
    theme: 'light',
    rawTheme: 'light',
    setTheme: jest.fn(),
    isLight: true,
    isDark: false,
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority: _priority, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />;
  },
}));

// Surface the `prefetch` prop as a data attribute so the DOM can be asserted on.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean | null;
  }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@kinde-oss/kinde-auth-nextjs/components', () => ({
  LogoutLink: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className}>{children}</button>
  ),
}));

import Nav from '@/components/navbar/Nav';
import { Navigation } from '@/components/navigation';

const AUTH_HREFS = ['/api/auth/login', '/api/auth/register'];

const getAuthLinks = () =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/api/auth/"]'));

describe('Auth links prefetch', () => {
  beforeEach(() => {
    // Unauthenticated visitor: every profile fetch fails, so Nav renders the auth buttons.
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('Nav renders login/register links (desktop and mobile) with prefetch disabled', async () => {
    const user = userEvent.setup();
    render(<Nav />);

    // Wait for the unauthenticated state to settle (desktop links).
    await waitFor(() => {
      expect(screen.getAllByText('Iniciar sesión').length).toBeGreaterThan(0);
    });

    // Open the mobile menu so the mobile auth links are mounted too.
    const menuButton = screen.getByRole('button', { name: /abrir menú/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(getAuthLinks().length).toBe(4);
    });

    const links = getAuthLinks();
    expect(links.map((a) => a.getAttribute('href')).sort()).toEqual(
      [...AUTH_HREFS, ...AUTH_HREFS].sort()
    );
    links.forEach((link) => {
      expect(link).toHaveAttribute('data-prefetch', 'false');
    });
  });

  it('Navigation renders its login link with prefetch disabled', () => {
    render(<Navigation />);

    const links = getAuthLinks();
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/api/auth/login');
    expect(links[0]).toHaveAttribute('data-prefetch', 'false');
  });
});
