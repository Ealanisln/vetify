import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// The `withAuth` middleware automatically handles authentication
// for the routes specified in the `config.matcher` below.
// All other routes will be publicly accessible by default.
export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // Allow public access to webhook routes (bypass all protection)
    if (pathname.startsWith('/api/webhooks/')) {
      const response = NextResponse.next();
      
      // Add CORS headers for webhook endpoints
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    }
    
    // Skip middleware for API routes, static files, and auth routes
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.') ||
      pathname.startsWith('/auth/')
    ) {
      return NextResponse.next();
    }

    // For dashboard routes, check if user has completed onboarding
    if (pathname.startsWith('/dashboard')) {
      try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();
        
        if (kindeUser) {
          // Check if user has a tenant in the database
          // Note: We can't use Prisma directly in middleware due to edge runtime limitations
          // So we'll let the requireAuth function handle the redirect
          return NextResponse.next();
        }
      } catch (error) {
        console.error('Middleware error:', error);
      }
    }

    // For onboarding route, check if user already has a tenant
    if (pathname === '/onboarding') {
      try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();
        
        if (!kindeUser) {
          // Not authenticated, redirect to sign in
          return NextResponse.redirect(new URL('/api/auth/login', req.url));
        }
        
        // Let the onboarding page handle the tenant check
        return NextResponse.next();
      } catch (error) {
        console.error('Middleware error:', error);
      }
    }

    return NextResponse.next();
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
     * Example: '/admin/:path*'
     */
    '/dashboard/:path*',
    '/onboarding',
  ],
};