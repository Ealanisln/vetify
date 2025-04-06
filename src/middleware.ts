import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

// The `withAuth` middleware automatically handles authentication
// for the routes specified in the `config.matcher` below.
// All other routes will be publicly accessible by default.
export default withAuth;

// Configuración de las rutas que SÍ requieren autenticación
export const config = {
  matcher: [
    /*
     * Match all request paths within the /dashboard route.
     * Add any other routes that should be protected here.
     * Example: '/admin/:path*'
     */
    '/dashboard/:path*',
  ],
};