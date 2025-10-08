"use client";

import { usePathname } from 'next/navigation';
import Nav from './navbar/Nav';
// import Footer from './footer/Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * ConditionalLayout component that conditionally renders navbar and footer
 * based on the current route. Excludes them from dashboard and onboarding routes.
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Hide navbar and footer on dashboard and onboarding routes
  const shouldHideNavAndFooter = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/admin');
  
  return (
    <>
      {/* Re-enabled Nav, Footer still disabled for now */}
      {!shouldHideNavAndFooter && <Nav />}
      {children}
      {/* {!shouldHideNavAndFooter && <Footer />} */}
      

    </>
  );
} 