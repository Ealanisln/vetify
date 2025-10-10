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

// Protected routes that require trial/subscription access
const PROTECTED_ROUTES = {
  // Create/Edit operations
  '/dashboard/pets/new': 'pets',
  '/dashboard/appointments/new': 'appointments',

  // Main dashboard sections - require active subscription
  '/dashboard/clientes': 'customers',
  '/dashboard/mascotas': 'pets',
  '/dashboard/citas': 'appointments',
  '/dashboard/inventario': 'inventory',
  '/dashboard/historia-clinica': 'medical_history',
  '/dashboard/reportes': 'reports',
  '/dashboard/punto-de-venta': 'pos',

  // Premium features
  '/dashboard/inventory': 'inventory',
  '/dashboard/reports': 'reports',
  '/dashboard/settings/automations': 'automations'
} as const;

// Routes that are always accessible even without active subscription
const ALLOWED_WITHOUT_PLAN = [
  '/dashboard',
  '/dashboard/settings',
  '/precios',
  '/checkout'
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
    
    // Get user info for authenticated requests
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
          const isAllowedRoute = ALLOWED_WITHOUT_PLAN.some(route =>
            pathname === route || pathname.startsWith(route + '/')
          );

          // Check if this is a protected route requiring trial/subscription access
          const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route =>
            pathname.startsWith(route)
          );

          if (protectedRoute && !isAllowedRoute) {
            // This is a protected route - check trial access via API
            try {
              const baseUrl = req.nextUrl.origin;
              const accessCheckResponse = await fetch(`${baseUrl}/api/trial/check-access`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': req.headers.get('cookie') || '',
                  'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
                  'user-agent': req.headers.get('user-agent') || ''
                },
                body: JSON.stringify({
                  feature: PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES],
                  action: 'create'
                })
              });

              if (accessCheckResponse.ok) {
                const result = await accessCheckResponse.json();
                
                if (!result.allowed) {
                  // Access denied - redirect to settings/subscription page
                  const url = new URL('/dashboard/settings', req.url);
                  url.searchParams.set('tab', 'subscription');
                  url.searchParams.set('reason', 'no_plan');
                  url.searchParams.set('feature', PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES]);
                  url.searchParams.set('from', pathname);
                  
                  await logSecurityEvent(req, 'permission_denied', kindeUser.id, {
                    reason: result.reason,
                    feature: PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES],
                    pathname,
                  });
                  
                  return NextResponse.redirect(url);
                }
              } else {
                // API error - log but allow access to prevent blocking
                console.warn('Trial access check failed:', accessCheckResponse.status);
                
                await logSecurityEvent(req, 'security_event', kindeUser.id, {
                  error: 'Trial access check API error',
                  pathname,
                  status: accessCheckResponse.status
                });
              }
            } catch (error) {
              // Network error - log but allow access to prevent blocking
              console.warn('Trial access check network error:', error);
              
              await logSecurityEvent(req, 'security_event', kindeUser.id, {
                error: 'Trial access check network error',
                pathname,
              });
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