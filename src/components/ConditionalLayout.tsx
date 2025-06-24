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
  const shouldHideNavAndFooter = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');
  
  return (
    <>
      {/* Re-enabled Nav, Footer still disabled for now */}
      {!shouldHideNavAndFooter && <Nav />}
      {children}
      {/* {!shouldHideNavAndFooter && <Footer />} */}
      
      {/* Debug info */}
      <div style={{padding: '10px', background: '#f0f0f0', fontSize: '12px'}}>
        <p>Path: {pathname}</p>
        <p>Should hide nav/footer: {shouldHideNavAndFooter.toString()}</p>
      </div>
    </>
  );
} 