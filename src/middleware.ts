import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  isRateLimitingEnabled
} from './lib/security/rate-limiter';
import {
  logSecurityEvent,
  createAuditMiddleware
} from './lib/security/audit-logger';
import { securityHeaders } from './lib/security/input-sanitization';

/**
 * Protected routes that require trial/subscription access
 * All operational features require active subscription
 * Only Dashboard and Settings are accessible without active plan
 *
 * Routes are organized by feature with bilingual support (English/Spanish)
 * Pattern: Both language variants map to the same feature for consistent access control
 */
const PROTECTED_ROUTES = {
  // Customers (Clientes)
  '/dashboard/customers/new': 'customers',
  '/dashboard/customers': 'customers',
  '/dashboard/clientes': 'customers',

  // Pets (Mascotas)
  '/dashboard/pets/new': 'pets',
  '/dashboard/pets': 'pets',
  '/dashboard/mascotas': 'pets',

  // Appointments (Citas)
  '/dashboard/appointments/new': 'appointments',
  '/dashboard/appointments': 'appointments',
  '/dashboard/citas': 'appointments',

  // Medical History (Historia Clínica)
  '/dashboard/medical-history': 'medical_history',
  '/dashboard/historia-clinica': 'medical_history',

  // Point of Sale (Punto de Venta)
  '/dashboard/pos': 'pos',
  '/dashboard/sales': 'pos',
  '/dashboard/punto-de-venta': 'pos',

  // Staff/Personnel (Personal)
  '/dashboard/staff': 'staff',
  '/dashboard/personal': 'staff',

  // Cash Register (Caja)
  '/dashboard/cash-register': 'cash_register',
  '/dashboard/caja': 'cash_register',

  // Inventory (Inventario)
  '/dashboard/inventory': 'inventory',
  '/dashboard/inventario': 'inventory',

  // Locations (Ubicaciones) - Multi-location feature
  '/dashboard/locations': 'multiLocation',
  '/dashboard/ubicaciones': 'multiLocation',

  // Reports (Reportes)
  '/dashboard/reports': 'reports',
  '/dashboard/reportes': 'reports',

  // FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented
  // '/dashboard/settings/automations': 'automations'
} as const;

// Routes that are always accessible even without active subscription
// Only Dashboard and Settings remain accessible for navigation and subscription renewal
const ALLOWED_WITHOUT_PLAN = [
  '/dashboard',          // Main dashboard - needed to show subscription banner
  '/dashboard/settings', // Settings - needed to renew subscription
  '/precios',            // Pricing page
  '/checkout'            // Checkout flow
] as const;

// The `withAuth` middleware automatically handles authentication
// for the routes specified in the `config.matcher` below.
// All other routes will be publicly accessible by default.
export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    let userId: string | undefined;

    // Initialize audit middleware
    const auditMiddleware = createAuditMiddleware();

    // Get user info for authenticated requests (for logging and audit purposes)
    try {
      const { getUser } = getKindeServerSession();
      const kindeUser = await getUser();
      userId = kindeUser?.id;
    } catch {
      // User not authenticated, continue with undefined userId
    }
    
    // Apply rate limiting to all API routes (if enabled)
    if (pathname.startsWith('/api/') && isRateLimitingEnabled()) {
      const clientIdentifier = getClientIdentifier(req, userId);
      const rateLimitResult = await checkRateLimit(clientIdentifier, pathname);
      
      if (!rateLimitResult.success) {
        // Log rate limit exceeded event
        await logSecurityEvent(
          req,
          'rate_limit_exceeded',
          userId,
          {
            clientIdentifier,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            endpoint: pathname,
          }
        );
        
        // Return rate limit exceeded response
        const response = new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...createRateLimitHeaders(rateLimitResult),
              ...securityHeaders,
            },
          }
        );
        
        return response;
      }
    }
    
    // Allow public access to webhook routes (bypass auth protection but still apply rate limiting)
    if (pathname.startsWith('/api/webhooks/')) {
      const response = NextResponse.next();
      
      // Add CORS headers for webhook endpoints
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Log webhook access
      await auditMiddleware(req, userId);
      
      return response;
    }
    
    // Skip auth middleware for certain routes but still apply security headers
    if (
      (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.') ||
      pathname.startsWith('/auth/')
    ) {
      const response = NextResponse.next();
      
      // Add security headers to all responses
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Log API access (but skip static files)
      if (pathname.startsWith('/api/')) {
        await auditMiddleware(req, userId);
      }
      
      return response;
    }

    // For dashboard routes, check if user has completed onboarding and trial access
    if (pathname.startsWith('/dashboard')) {
      try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();
        
        if (kindeUser) {
          // Log dashboard access
          await auditMiddleware(req, kindeUser.id);
          
          // Check if this is an allowed route that doesn't require a subscription
          // Special handling: /dashboard only matches EXACTLY, not subroutes
          const isAllowedRoute = ALLOWED_WITHOUT_PLAN.some(route => {
            if (route === '/dashboard') {
              // Only match /dashboard exactly, not subroutes like /dashboard/staff
              return pathname === '/dashboard';
            }
            // For other routes, allow exact match or subroutes
            return pathname === route || pathname.startsWith(route + '/');
          });

          // Check if this is a protected route requiring trial/subscription access
          const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route =>
            pathname.startsWith(route)
          );

          if (protectedRoute && !isAllowedRoute) {
            // Validate that protectedRoute is actually a key in PROTECTED_ROUTES
            if (!(protectedRoute in PROTECTED_ROUTES)) {
              console.error(`Invalid protected route: ${protectedRoute}`);
              return NextResponse.next();
            }

            // OPTIMIZED: Check trial access directly without API overhead
            // This avoids 300-800ms of fetch() overhead on every protected route access
            try {
              // Import at runtime to avoid edge runtime issues
              const { findUserById } = await import('./lib/db/queries/users');
              const { hasActiveSubscription } = await import('./lib/auth');

              // Get user with tenant in single query
              const dbUser = await findUserById(kindeUser.id);

              if (!dbUser?.tenant) {
                // No tenant - redirect to onboarding
                const url = new URL('/onboarding', req.url);
                await logSecurityEvent(req, 'permission_denied', kindeUser.id, {
                  reason: 'No tenant found',
                  pathname,
                });
                return NextResponse.redirect(url);
              }

              // Check if tenant has active subscription or valid trial
              const hasAccess = hasActiveSubscription(dbUser.tenant);

              if (!hasAccess) {
                // Access denied - redirect to settings/subscription page
                const url = new URL('/dashboard/settings', req.url);
                url.searchParams.set('tab', 'subscription');
                url.searchParams.set('reason', 'no_plan');
                url.searchParams.set('feature', PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES]);
                url.searchParams.set('from', pathname);

                await logSecurityEvent(req, 'permission_denied', kindeUser.id, {
                  reason: 'No active plan or trial',
                  feature: PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES],
                  pathname,
                });

                return NextResponse.redirect(url);
              }

              // Access granted - user has valid trial or paid subscription
              // Note: For more granular feature checks (premium vs trial), the page
              // itself should call /api/trial/check-access for specific features

            } catch (error) {
              // Database error - log but allow access to prevent blocking
              console.warn('Trial access check database error:', error);

              await logSecurityEvent(req, 'security_event', kindeUser.id, {
                error: 'Trial access check database error',
                pathname,
                message: error instanceof Error ? error.message : 'Unknown error'
              });
              // Allow access on error to prevent blocking legitimate users
            }
          }
          
          // Continue with normal flow
          const response = NextResponse.next();
          
          // Add security headers
          Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        }
      } catch (error) {
        console.error('Middleware error:', error);
        
        // Log the error as a security event
        await logSecurityEvent(req, 'security_event', userId, {
          error: 'Dashboard access error',
          pathname,
        });
      }
    }

    // For onboarding route, check if user already has a tenant
    if (pathname === '/onboarding') {
      try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();
        
        if (!kindeUser) {
          // Not authenticated, redirect to sign in
          await logSecurityEvent(req, 'permission_denied', undefined, {
            reason: 'Unauthenticated onboarding access',
            pathname,
          });
          
          return NextResponse.redirect(new URL('/api/auth/login', req.url));
        }
        
        // Log onboarding access
        await auditMiddleware(req, kindeUser.id);
        
        // Let the onboarding page handle the tenant check
        const response = NextResponse.next();
        
        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        return response;
      } catch (error) {
        console.error('Middleware error:', error);
        
        // Log the error as a security event
        await logSecurityEvent(req, 'security_event', userId, {
          error: 'Onboarding access error',
          pathname,
        });
      }
    }

    // For admin routes, ensure user is authenticated
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();
        
        if (!kindeUser) {
          // Not authenticated, redirect to sign in
          await logSecurityEvent(req, 'permission_denied', undefined, {
            reason: 'Unauthenticated admin access attempt',
            pathname,
          });
          
          return NextResponse.redirect(new URL('/api/auth/login', req.url));
        }
        
        // Log admin access attempt
        await logSecurityEvent(req, 'security_event', kindeUser.id, {
          action: 'admin_access_attempt',
          pathname,
        });
        
        // Let the admin layout/API handle the super admin check
        const response = NextResponse.next();
        
        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        return response;
      } catch (error) {
        console.error('Admin middleware error:', error);
        
        // Log the error as a security event
        await logSecurityEvent(req, 'security_event', userId, {
          error: 'Admin access error',
          pathname,
        });
        
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
      }
    }

    // Default response with security headers
    const response = NextResponse.next();
    
    // Add security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Log general access
    await auditMiddleware(req, userId);
    
    return response;
  }
);

// Configuración de las rutas que SÍ requieren autenticación
// Los webhooks NO están incluidos aquí, por lo que serán públicos
export const config = {
  matcher: [
    /*
     * Match all request paths within the /dashboard route and onboarding.
     * Webhooks (/api/webhooks/*) are intentionally excluded to remain public.
     * Add any other routes that should be protected here.
     */
    '/dashboard/:path*',
    '/onboarding',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};