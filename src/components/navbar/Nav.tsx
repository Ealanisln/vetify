"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useThemeAware } from "@/hooks/useThemeAware";

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mounted, theme, setTheme } = useThemeAware();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <>
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-[#d5e3df] dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={120}
                  height={40}
                  className="h-8 w-auto transition-transform group-hover:scale-105"
                />
                <span className="ml-2 text-xl font-semibold text-[#45635C] dark:text-[#75a99c] transition-colors">
                  Vetify
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:space-x-8">
              <Link
                href="/funcionalidades"
                className="text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] px-3 py-2 text-lg font-medium transition-colors duration-200 relative group"
              >
                Funcionalidades
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#5b9788] dark:bg-[#75a99c] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </Link>
              <Link
                href="/precios"
                className="text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] px-3 py-2 text-lg font-medium transition-colors duration-200 relative group"
              >
                Precios
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#5b9788] dark:bg-[#75a99c] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </Link>
            </div>

            {/* Right side items */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-105 focus:ring-2 focus:ring-[#75a99c] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Cambiar tema"
              >
                <span className="text-base transition-transform duration-200 hover:rotate-12">
                  {theme === "dark" ? "☀️" : "🌙"}
                </span>
              </button>
              
              {/* Auth buttons */}
              <div className="flex items-center space-x-4">
                <Link
                  href="/api/auth/login"
                  className="text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] px-4 py-2 text-lg font-medium transition-colors duration-200 hover:bg-[#e5f1ee]/50 dark:hover:bg-[#2a3630]/30 rounded-lg"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="bg-[#75a99c] hover:bg-[#5b9788] text-white px-6 py-2 rounded-lg text-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-[#75a99c] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  Comenzar gratis
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 transition-all duration-200 focus:ring-2 focus:ring-[#75a99c] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
              >
                <div className="relative w-6 h-6">
                  <Menu 
                    className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                    }`} 
                  />
                  <X 
                    className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                    }`} 
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 sm:hidden transition-opacity duration-300 ${
          mobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
        
        {/* Mobile Navigation Panel */}
        <div
          ref={mobileMenuRef}
          className={`absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 shadow-xl transform transition-all duration-300 ease-out ${
            mobileMenuOpen 
              ? 'translate-y-0 opacity-100' 
              : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="px-4 pt-4 pb-6 space-y-2">
            {/* Navigation Links */}
            <Link
              href="/funcionalidades"
              className="flex items-center px-4 py-3 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
              onClick={closeMobileMenu}
            >
              <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                Funcionalidades
              </span>
            </Link>
            <Link
              href="/precios"
              className="flex items-center px-4 py-3 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
              onClick={closeMobileMenu}
            >
              <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                Precios
              </span>
            </Link>
            
            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>
            
            {/* Theme Toggle for Mobile */}
            <button
              onClick={() => {
                toggleTheme();
                closeMobileMenu();
              }}
              className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg mr-3 transition-transform duration-200 group-hover:rotate-12">
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </span>
            </button>
            
            {/* Auth section */}
            <div className="pt-4 space-y-2">
              <Link
                href="/api/auth/login"
                className="flex items-center px-4 py-3 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
                onClick={closeMobileMenu}
              >
                <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                  Iniciar sesión
                </span>
              </Link>
              <Link
                href="/registro"
                className="flex items-center px-4 py-3 text-base font-medium bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] mx-2"
                onClick={closeMobileMenu}
              >
                <span className="w-full text-center">
                  Comenzar gratis
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 