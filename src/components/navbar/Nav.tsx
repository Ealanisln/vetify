"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, User, LogOut, Zap } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
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

  if (!mounted) {
    return null;
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
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <Image
                    src="/logo/capybara-green.png"
                    alt="Vetify"
                    width={48}
                    height={48}
                    className="h-12 w-auto"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Vetify
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    WhatsApp automático
                  </span>
                </div>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden lg:ml-12 lg:flex lg:items-center lg:space-x-1">
              <Link
                href="/funcionalidades"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Funcionalidades
              </Link>
              <div className="relative">
                <Link
                  href="/precios"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Precios
                </Link>
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                  35% OFF
                </span>
              </div>
              <Link
                href="/contacto"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Contacto
              </Link>
            </div>
          </div>
          
          {/* Right side buttons - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {/* Launch offer badge */}
            <div className="hidden xl:flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full border border-green-200 dark:border-green-700">
              <Zap className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Oferta de lanzamiento
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 w-10 h-10 flex items-center justify-center"
              aria-label="Cambiar tema"
            >
              {resolvedTheme === "dark" ? "☀️" : "🌙"}
            </button>
            
            {/* Show user menu if authenticated, otherwise show login/signup buttons */}
            {!isLoading && isAuthenticated && user ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm font-medium">{getUserDisplayName()}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                    <LogoutLink className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-left transition-colors">
                      <LogOut className="h-4 w-4 mr-3" />
                      Cerrar sesión
                    </LogoutLink>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Probar GRATIS
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 focus:outline-none transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div 
        className={`
          lg:hidden absolute top-full left-0 right-0 
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50
          shadow-xl z-40 
          transition-all duration-300 ease-in-out
          ${mobileMenuOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}
      >
        <div className="px-4 pt-4 pb-6 space-y-2">
          {/* Launch offer banner - mobile */}
          <div className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl border border-green-200 dark:border-green-700 mb-4">
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              🚀 Oferta de lanzamiento: 35% OFF
            </span>
          </div>

          <Link
            href="/funcionalidades"
            className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Funcionalidades
          </Link>
          <div className="relative">
            <Link
              href="/precios"
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Precios
            </Link>
            <span className="absolute top-2 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
              35% OFF
            </span>
          </div>
          <Link
            href="/contacto"
            className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contacto
          </Link>

          <div className="pt-2">
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-left transition-all duration-200"
            >
              {resolvedTheme === "dark" ? "🌞 Modo claro" : "🌙 Modo oscuro"}
            </button>
          </div>
        </div>
        
        {/* Mobile user section */}
        <div className="pt-4 pb-6 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 space-y-3">
            {!isLoading && isAuthenticated && user ? (
              <>
                {/* User info */}
                <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {getUserInitials()}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                {/* Dashboard link */}
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-gray-300 dark:border-gray-600 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {/* Logout button */}
                <LogoutLink className="block w-full px-4 py-3 text-center text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-red-300 dark:border-red-600 transition-all duration-200">
                  Cerrar sesión
                </LogoutLink>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-gray-300 dark:border-gray-600 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign-up"
                  className="block w-full px-4 py-3 text-center text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Probar GRATIS
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 