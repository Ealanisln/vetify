"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Fondo */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-b from-beigeD to-grayD"
            : "bg-gradient-to-b from-beige to-white"
        }`}
      />

      {/* Contenido */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Botón de tema */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-brown text-white dark:bg-brownD hover:opacity-90 transition-opacity"
              aria-label="Cambiar tema"
            >
              {resolvedTheme === "dark" ? "🌞" : "🌙"}
            </button>
          </div>
          {/* Logo */}
          <div className="relative w-full max-w-2xl mx-auto mb-8">
            <Image
              src={
                resolvedTheme === "dark"
                  ? "/vetify-logo-dark.webp"
                  : "/vetify-logo.webp"
              }
              alt="Vetify Logo"
              width={600}
              height={300}
              priority
              className="w-full h-auto"
            />
          </div>

          {/* Subtítulo */}
          <div className="text-center">
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Estamos construyendo el futuro de la gestión veterinaria
            </p>

            {/* Botón de contacto */}
            <a
              href="mailto:contacto@vetify.pro"
              className="inline-block bg-[#45635C] hover:bg-[#45635C]/90 dark:bg-sageD dark:hover:bg-sageD/90 text-white font-medium py-3 px-8 rounded-md transition-colors"
            >
              Contáctanos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
