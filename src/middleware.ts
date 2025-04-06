import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  try {
    // Rutas que no requieren autenticación
    const publicPaths = [
      '/',
      '/api/auth',
      '/favicon',
      '/_next',
      '/planes',
      '/contacto',
      '/funcionalidades',
      '/sign-in',
      '/sign-up',
      '/public',
      '/assets'
    ];

    const isPublicPath = publicPaths.some(path => 
      req.nextUrl.pathname === path ||
      (path !== '/' && req.nextUrl.pathname.startsWith(path)) || 
      req.nextUrl.pathname.includes('favicon.ico')
    );

    if (isPublicPath) {
      return NextResponse.next();
    }

    const response = await withAuth(req);
    
    // Comentado temporalmente para depuración
    // if (response instanceof NextResponse && response.status === 200) {
    //   await syncUser();
    // }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Configuración de las rutas que requieren autenticación
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon
     * - public routes
     */
    '/((?!api/auth|_next/static|_next/image|favicon|public|planes|contacto|funcionalidades|sign-in|sign-up|assets).*)',
  ],
};