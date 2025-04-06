import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";
import { syncUser } from "./utils/auth/syncUser";

export default async function middleware(req: NextRequest) {
  const response = await withAuth(req);
  
  // Si la solicitud está autenticada, sincronizamos el usuario
  if (response instanceof NextResponse) {
    await syncUser();
  }
  
  return response;
}

// Configuración de las rutas que requieren autenticación
export const config = {
  matcher: [
    // Proteger todas las rutas excepto las especificadas
    "/((?!api|_next/static|_next/image|favicon.ico|planes|public/|logo|sign-in|sign-up|$).*)",
  ],
};