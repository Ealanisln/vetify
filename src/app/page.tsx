"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import WaitingList from "@/components/WaitingList";

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
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo con gradiente animado */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-br from-beigeD via-grayD to-gray-900"
            : "bg-gradient-to-br from-beige via-white to-gray-100"
        }`}
      />

      {/* Botón de tema */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-brown/90 text-white dark:bg-brownD/90 hover:opacity-90 transition-all duration-300 hover:scale-105"
          aria-label="Cambiar tema"
        >
          {resolvedTheme === "dark" ? "🌞" : "🌙"}
        </button>
      </div>

      {/* Contenedor principal absolutamente centrado */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-12">
          {/* Logo */}
          <div className="relative w-full max-w-sm transform transition-transform duration-500 hover:scale-105">
            <Image
              src={
                resolvedTheme === "dark"
                  ? "/vetify-logo-dark.png"
                  : "/vetify-logo.png"
              }
              alt="Vetify Logo"
              width={600}
              height={300}
              priority
              className="w-full h-auto"
            />
          </div>

          {/* Waiting List Container con animación de entrada */}
          <div className="w-full animate-fadeIn">
            <WaitingList />
          </div>
        </div>
      </div>
    </div>
  );
}
