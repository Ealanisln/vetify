"use client";

import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useEffect, useState } from "react";

export default function SignIn() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-10 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md w-full mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Bienvenido a Vetify
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Inicia sesión para acceder a tu clínica veterinaria
            </p>
          </div>
          
          <div className="space-y-4">
            <LoginLink className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#75a99c] hover:bg-[#5b9788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] transition-colors duration-200">
              Iniciar Sesión
            </LoginLink>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Primera vez? Tu cuenta se creará automáticamente al iniciar sesión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 