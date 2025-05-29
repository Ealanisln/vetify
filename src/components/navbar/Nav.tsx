"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
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
    <nav className="bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 shadow-smooth relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={160}
                  height={60}
                  className="h-12 w-auto hidden dark:block"
                />
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={160}
                  height={60}
                  className="h-12 w-auto block dark:hidden"
                />
                <span className="text-2xl font-semibold text-[#45635C] dark:text-[#75a99c]">Vetify</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-12 sm:flex sm:items-center sm:space-x-2">
              <Link
                href="/funcionalidades"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Funcionalidades
              </Link>
              <Link
                href="/precios"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Precios
              </Link>
              {/* <Link
                href="/blog"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Blog
              </Link> */}
              <Link
                href="/contacto"
                className="px-5 py-3 text-lg font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] transition-colors rounded-lg mx-1 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
              >
                Contacto
              </Link>
            </div>
          </div>
          
          {/* Right side buttons - Desktop */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] transition-colors w-10 h-10 flex items-center justify-center"
              aria-label="Cambiar tema"
            >
              {resolvedTheme === "dark" ? "☀️" : "🌙"}
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
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[#d5e3df] dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#d5e3df] dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                    <LogoutLink className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 text-left">
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
                  className="text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c] px-6 py-3 rounded-lg text-lg font-medium border-2 border-[#d5e3df] dark:border-gray-700 hover:border-[#75a99c] dark:hover:border-[#5b9788] transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-[#75a99c] hover:bg-[#5b9788] text-white px-6 py-3 rounded-lg text-lg font-bold shadow-card hover:shadow-card-hover transform hover:translate-y-[-1px] transition-all duration-200 border-2 border-[#65998c]"
                >
                  Prueba gratuita
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-3 rounded-md text-[#5b9788] hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:text-[#75a99c] dark:hover:text-[#8cbcb0] dark:hover:bg-[#2a3630]/30 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Menu className="h-8 w-8" aria-hidden="true" />
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
            {resolvedTheme === "dark" ? "🌞" : "🌙"}
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
          {/* <Link
            href="/blog"
            className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            Blog
          </Link> */}
          <Link
            href="/contacto"
            className="block px-5 py-3 text-base font-medium text-gray-800 hover:text-[#5b9788] dark:text-gray-200 dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contacto
          </Link>
        </div>
        
        {/* Mobile user section */}
        <div className="pt-4 pb-3 border-t border-[#d5e3df] dark:border-gray-800">
          <div className="px-4 space-y-3">
            {!isLoading && isAuthenticated && user ? (
              <>
                {/* User info */}
                <div className="flex items-center px-5 py-3">
                  <div className="h-10 w-10 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold">
                    {getUserInitials()}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-800 dark:text-gray-200">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                {/* Dashboard link */}
                <Link
                  href="/dashboard"
                  className="block w-full px-5 py-3 text-center text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg border-2 border-[#d5e3df] dark:border-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {/* Logout button */}
                <LogoutLink className="block w-full px-5 py-3 text-center text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                  Cerrar sesión
                </LogoutLink>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block w-full px-5 py-3 text-center text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg border-2 border-[#d5e3df] dark:border-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/sign-up"
                  className="block w-full px-5 py-3 text-center text-base font-bold text-white bg-[#75a99c] hover:bg-[#5b9788] rounded-lg shadow-card border-2 border-[#65998c]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Prueba gratuita
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 