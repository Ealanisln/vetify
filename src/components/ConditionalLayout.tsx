"use client";

import { usePathname } from 'next/navigation';
import Nav from './navbar/Nav';
// import Footer from './footer/Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Known Vetify public routes that should show the main navbar
const VETIFY_PUBLIC_ROUTES = [
  '/',
  '/funcionalidades',
  '/precios',
  '/contacto',
  '/privacidad',
  '/sign-in',
  '/sign-up',
];

/**
 * ConditionalLayout component that conditionally renders navbar and footer
 * based on the current route. Excludes them from dashboard, onboarding,
 * admin routes, and public clinic pages (tenant slugs).
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Hide navbar on dashboard, onboarding, and admin routes
  const isAppRoute = pathname.startsWith('/dashboard') ||
                     pathname.startsWith('/onboarding') ||
                     pathname.startsWith('/admin');

  // Check if this is a known Vetify public route
  const isVetifyPublicRoute = VETIFY_PUBLIC_ROUTES.includes(pathname) ||
                              pathname.startsWith('/api/');

  // Show navbar only on known Vetify public routes
  // Hide it on app routes and clinic public pages (tenant slugs)
  const shouldShowNav = !isAppRoute && isVetifyPublicRoute;

  return (
    <>
      {shouldShowNav && <Nav />}
      {children}
      {/* {shouldShowNav && <Footer />} */}
    </>
  );
} 