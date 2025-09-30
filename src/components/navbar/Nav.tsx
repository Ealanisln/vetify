"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, Settings, LogOut, Building2, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useThemeAware } from '../../hooks/useThemeAware';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';

interface User {
  id: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

// Componente separado para la información del usuario que se hidrata después
function UserSection() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Función para obtener datos del usuario
    const fetchUserData = async () => {
      try {
        // Obtener información del usuario
        const userResponse = await fetch('/api/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          // Si hay usuario, obtener información del tenant
          const tenantResponse = await fetch('/api/user/tenant');
          if (tenantResponse.ok) {
            const tenantData = await tenantResponse.json();
            setTenant(tenantData.tenant);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No renderizar hasta que esté montado
  if (!mounted) {
    return <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>;
  }

  // Si está cargando
  if (isLoading) {
    return <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>;
  }

  // Si no hay usuario autenticado, mostrar botones de auth
  if (!user) {
    return (
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
    );
  }

  // Si hay usuario autenticado, mostrar dropdown
  const displayName = user.given_name || user.email?.split('@')[0] || 'Usuario';
  const clinicName = tenant?.name || 'Sin clínica';

  return (
    <div className="relative" ref={userDropdownRef}>
      <button
        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#75a99c]/10 hover:bg-[#75a99c]/20 dark:bg-[#2a3630] dark:hover:bg-[#1a2620] transition-all duration-200 focus:ring-2 focus:ring-[#75a99c] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <div className="flex items-center space-x-2">
          {user.picture ? (
            <Image
              src={user.picture}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-[#75a99c] rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
              <Building2 className="h-3 w-3 mr-1" />
              {clinicName}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            userDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {userDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {user.email}
            </div>
            <div className="text-xs text-[#75a99c] flex items-center mt-1">
              <Building2 className="h-3 w-3 mr-1" />
              {clinicName}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setUserDropdownOpen(false)}
          >
            <User className="h-4 w-4 mr-3" />
            Dashboard
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setUserDropdownOpen(false)}
          >
            <Settings className="h-4 w-4 mr-3" />
            Configuración
          </Link>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <LogoutLink className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
              <LogOut className="h-4 w-4 mr-3" />
              Cerrar sesión
            </LogoutLink>
          </div>
        </div>
      )}
    </div>
  );
}

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
      if (window.innerWidth >= 640) {
        setMobileMenuOpen(false); // Close mobile menu when resizing to desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-[100] bg-white border-b border-gray-100 shadow-lg min-h-[4rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:grid sm:grid-cols-3 sm:items-center h-16">
            {/* Left section - Logo */}
            <div className="flex items-center justify-start">
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

            {/* Center section - Desktop Navigation */}
            <div className="flex items-center justify-center space-x-8">
              <Link
                href="/funcionalidades"
                className="text-gray-900 hover:text-[#5b9788] px-3 py-2 text-lg font-medium transition-colors duration-200"
              >
                Funcionalidades
              </Link>
              <Link
                href="/precios"
                className="text-gray-900 hover:text-[#5b9788] px-3 py-2 text-lg font-medium transition-colors duration-200"
              >
                Precios
              </Link>
            </div>

            {/* Right section - User section placeholder */}
            <div className="flex items-center justify-end">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex sm:hidden justify-between items-center h-16">
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

            <button
              onClick={() => {
                if (window.innerWidth < 640) { // Only allow mobile menu on mobile screens
                  setMobileMenuOpen(!mobileMenuOpen);
                }
              }}
              className="p-2 rounded-md text-gray-900 hover:text-[#5b9788] hover:bg-gray-100 transition-all duration-200"
              aria-label="Abrir menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-[#d5e3df] dark:border-gray-800 shadow-lg min-h-[4rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:grid sm:grid-cols-3 sm:items-center h-16">
            {/* Left section - Logo */}
            <div className="flex items-center justify-start">
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

            {/* Center section - Desktop Navigation */}
            <div className="flex items-center justify-center space-x-8">
              <Link
                href="/funcionalidades"
                className="text-gray-900 hover:text-[#5b9788] dark:text-gray-100 dark:hover:text-[#75a99c] px-3 py-2 text-lg font-medium transition-colors duration-200 relative group"
              >
                Funcionalidades
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#5b9788] dark:bg-[#75a99c] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </Link>
              <Link
                href="/precios"
                className="text-gray-900 hover:text-[#5b9788] dark:text-gray-100 dark:hover:text-[#75a99c] px-3 py-2 text-lg font-medium transition-colors duration-200 relative group"
              >
                Precios
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#5b9788] dark:bg-[#75a99c] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </Link>
            </div>

            {/* Right section - User section */}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] transition-all duration-200 w-10 h-10 flex items-center justify-center hover:scale-105 focus:ring-2 focus:ring-[#75a99c] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Cambiar tema"
              >
                <span className="text-base transition-transform duration-200 hover:rotate-12">
                  {theme === "dark" ? "☀️" : "🌙"}
                </span>
              </button>

              <UserSection />
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex sm:hidden justify-between items-center h-16">
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

            <button
              onClick={() => {
                if (window.innerWidth < 640) { // Only allow mobile menu on mobile screens
                  setMobileMenuOpen(!mobileMenuOpen);
                }
              }}
              className="p-2 rounded-md text-gray-900 dark:text-gray-100 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 transition-all duration-200 focus:ring-2 focus:ring-[#75a99c] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
            >
              <div className="relative w-6 h-6">
                <svg
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className="fixed inset-0 z-50"
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
          className={`absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-[#d5e3df] dark:border-gray-800 shadow-xl transform transition-all duration-300 ease-out z-[95] ${
            mobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="px-4 pt-4 pb-6 space-y-2">
            {/* Navigation Links */}
            <Link
              href="/funcionalidades"
              className="flex items-center px-4 py-3 text-base font-medium text-gray-900 dark:text-gray-100 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
              onClick={closeMobileMenu}
            >
              <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                Funcionalidades
              </span>
            </Link>
            <Link
              href="/precios"
              className="flex items-center px-4 py-3 text-base font-medium text-gray-900 dark:text-gray-100 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
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
              className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-900 dark:text-gray-100 hover:text-[#5b9788] dark:hover:text-[#75a99c] hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg mr-3 transition-transform duration-200 group-hover:rotate-12">
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 