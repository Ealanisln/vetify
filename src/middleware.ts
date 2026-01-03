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
import { createCSRFMiddleware } from './lib/security/csrf-protection';

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

    // SECURITY FIX: Initialize CSRF middleware for state-changing requests
    const csrfMiddleware = createCSRFMiddleware({
      skipForMethods: ['GET', 'HEAD', 'OPTIONS'],
      skipForPaths: ['/api/webhooks/', '/api/auth/', '/api/public/'],
    });

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

      // SECURITY FIX: Apply CSRF protection for state-changing API requests
      // This checks origin headers to prevent cross-site request forgery
      const csrfResult = await csrfMiddleware(req);
      if (csrfResult) {
        await logSecurityEvent(req, 'security_event', userId, {
          reason: 'CSRF validation failed',
          endpoint: pathname,
        });
        return csrfResult;
      }
    }

    // Allow public access to webhook routes (bypass auth protection but still apply rate limiting)
    if (pathname.startsWith('/api/webhooks/')) {
      const response = NextResponse.next();

      // SECURITY FIX: Remove CORS wildcard - webhooks are server-to-server calls
      // CORS doesn't apply to server-to-server requests (only browser → server)
      // Having Access-Control-Allow-Origin: * is unnecessary and potentially confusing
      // Each webhook endpoint verifies requests via signatures (Stripe, Resend, etc.)

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

            // NOTE: Subscription/trial access validation is handled at the page level
            // via requireAuth() and server components, not in middleware.
            //
            // REASON: Middleware runs on Edge Runtime which doesn't support Prisma.
            // Attempting database queries here causes "PrismaClient is unable to run
            // in this browser environment" errors.
            //
            // VALIDATION LAYERS:
            // 1. Middleware: Authentication only (via Kinde)
            // 2. Pages: Subscription/trial checks via requireAuth() + server components
            // 3. API Routes: Plan limit enforcement via checkFeatureAccess()
            //
            // This approach:
            // - Avoids Edge Runtime limitations
            // - Maintains security (auth required at middleware level)
            // - Allows flexible subscription checks in server components
            // - Prevents error noise from Prisma in middleware

            // Protected routes require authentication (handled by withAuth wrapper)
            // Subscription validation happens when the page loads via server components
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

        // SECURITY FIX: Return redirect to login on error to prevent unintended access
        // Previously this catch block didn't return, potentially allowing requests through
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
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

        // SECURITY FIX: Return redirect to login on error to prevent unintended access
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
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
     * Webhooks (/api/webhooks/*) and public API routes (/api/public/*) are excluded
     * to remain publicly accessible.
     * Add any other routes that should be protected here.
     *
     * IMPORTANT: /api/:path* is included to enable rate limiting on all API routes.
     * The middleware handles public routes (webhooks, etc.) internally with proper bypass logic.
     *
     * NOTE: /api/public/* is excluded from the matcher to allow unauthenticated access
     * to public endpoints like /api/public/promotion
     */
    '/dashboard/:path*',
    '/onboarding',
    '/admin/:path*',
    '/api/((?!public/).*)',
  ],
};