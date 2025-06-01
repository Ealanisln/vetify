"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import Image from "next/image";
import { useThemeAware } from "@/hooks/useThemeAware";
import { useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { mounted, theme, setTheme } = useThemeAware();
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

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

  const getUserDisplayName = () => {
    if (user?.given_name && user?.family_name) {
      return `${user.given_name} ${user.family_name}`;
    }
    if (user?.given_name) {
      return user.given_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  };

  const getUserInitials = () => {
    if (user?.given_name && user?.family_name) {
      return `${user.given_name[0]}${user.family_name[0]}`.toUpperCase();
    }
    if (user?.given_name) {
      return user.given_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

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
            
            {/* Show user menu if authenticated, otherwise show login/signup buttons */}
            {!isLoading && isAuthenticated && user ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold text-sm">
                    {getUserInitials()}
                  </div>
                  <span className="text-lg font-medium">{getUserDisplayName()}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                    <LogoutLink className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <LogOut className="h-4 w-4 mr-3" />
                      Cerrar sesión
                    </LogoutLink>
                  </div>
                )}
              </div>
            ) : (
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
            )}
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

      {/* Mobile menu */}
      <div 
        className={`
          sm:hidden absolute top-full left-0 right-0 
          bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 
          pb-4 shadow-lg z-40 
          transition-all duration-200 ease-in-out
          ${mobileMenuOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}
      >
        <div className="px-4 pt-4 pb-4 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg text-left"
          >
            {theme === "dark" ? "🌞" : "🌙"}
          </button>
          <Link
            href="/funcionalidades"
            className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            Funcionalidades
          </Link>
          <Link
            href="/precios"
            className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            Precios
          </Link>
          
          {!isLoading && isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <LogoutLink className="block w-full text-left px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg">
                Cerrar sesión
              </LogoutLink>
            </>
          ) : (
            <>
              <Link
                href="/api/auth/login"
                className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="block px-5 py-3 text-base font-medium bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-lg text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Comenzar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 