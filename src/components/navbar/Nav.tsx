"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useThemeAware } from "@/hooks/useThemeAware";

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mounted, theme, setTheme } = useThemeAware();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-semibold text-[#45635C]">
                  Vetify
                </span>
              </Link>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/capybara-green.png"
                alt="Vetify"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-semibold text-[#45635C] dark:text-[#75a99c]">
                Vetify
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link
              href="/funcionalidades"
              className="text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] px-3 py-2 text-lg font-medium transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="/precios"
              className="text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] px-3 py-2 text-lg font-medium transition-colors"
            >
              Precios
            </Link>
          </div>

          {/* Right side items */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] transition-colors w-10 h-10 flex items-center justify-center"
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            
            {/* Simplified auth buttons without Kinde for now */}
            <div className="flex items-center space-x-4">
              <Link
                href="/api/auth/login"
                className="text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] px-4 py-2 text-lg font-medium transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="bg-[#75a99c] hover:bg-[#5b9788] text-white px-6 py-2 rounded-lg text-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/funcionalidades"
              className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Funcionalidades
            </Link>
            <Link
              href="/precios"
              className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Precios
            </Link>
            
            {/* Mobile auth section */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <Link
                href="/api/auth/login"
                className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="block px-3 py-2 text-base font-medium bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-md transition-colors mx-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 