"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, Settings, LogOut, Building2, ChevronDown, Sparkles } from "lucide-react";
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
function UserSection({ onNavigate }: { onNavigate?: () => void }) {
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
      <div className="flex items-center space-x-3">
        <Link
          href="/api/auth/login"
          onClick={onNavigate}
          className="relative text-gray-700 hover:text-[#4DB8A3] dark:text-gray-200 dark:hover:text-[#4DB8A3] px-5 py-2.5 text-base font-medium transition-all duration-300 hover:bg-[#4DB8A3]/5 dark:hover:bg-[#4DB8A3]/10 rounded-xl group overflow-hidden"
        >
          <span className="relative z-10">Iniciar sesión</span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#4DB8A3]/0 via-[#4DB8A3]/10 to-[#4DB8A3]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </Link>
        <Link
          href="/api/auth/register"
          onClick={onNavigate}
          className="relative bg-gradient-to-r from-[#4DB8A3] to-[#45635C] hover:from-[#45635C] hover:to-[#4DB8A3] text-white px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-500 shadow-lg shadow-[#4DB8A3]/30 hover:shadow-xl hover:shadow-[#4DB8A3]/40 hover:scale-105 focus:ring-2 focus:ring-[#4DB8A3] focus:ring-offset-2 dark:focus:ring-offset-gray-900 group overflow-hidden"
        >
          <span className="relative z-10 flex items-center">
            Comenzar gratis
            <Sparkles className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
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
        className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-br from-[#4DB8A3]/10 to-[#75a99c]/5 hover:from-[#4DB8A3]/15 hover:to-[#75a99c]/10 dark:from-[#2a3630] dark:to-[#1a2620] dark:hover:from-[#3a4640] dark:hover:to-[#2a3630] transition-all duration-300 focus:ring-2 focus:ring-[#4DB8A3] focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:scale-105 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center space-x-2">
          {user.picture ? (
            <div className="relative">
              <Image
                src={user.picture}
                alt={displayName}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-[#4DB8A3]/30"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4DB8A3]/20 to-transparent"></div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-[#4DB8A3] to-[#45635C] rounded-full flex items-center justify-center shadow-md">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
              <Building2 className="h-3 w-3 mr-1" />
              {clinicName}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
            userDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {userDropdownOpen && (
        <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-[#4DB8A3]/5 to-transparent">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {user.email}
            </div>
            <div className="text-xs text-[#4DB8A3] dark:text-[#4DB8A3] flex items-center mt-1.5 font-medium">
              <Building2 className="h-3 w-3 mr-1" />
              {clinicName}
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-[#4DB8A3] dark:hover:text-[#4DB8A3] hover:bg-[#4DB8A3]/10 dark:hover:bg-[#4DB8A3]/20 transition-all duration-200 group"
              onClick={() => setUserDropdownOpen(false)}
            >
              <User className="h-4 w-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-[#4DB8A3] dark:hover:text-[#4DB8A3] hover:bg-[#4DB8A3]/10 dark:hover:bg-[#4DB8A3]/20 transition-all duration-200 group"
              onClick={() => setUserDropdownOpen(false)}
            >
              <Settings className="h-4 w-4 mr-3 transition-transform duration-200 group-hover:rotate-90" />
              <span className="font-medium">Configuración</span>
            </Link>
          </div>

          <div className="border-t border-gray-200/50 dark:border-gray-700/50 mt-1 pt-1">
            <LogoutLink className="flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full text-left group rounded-lg mx-1">
              <LogOut className="h-4 w-4 mr-3 transition-transform duration-200 group-hover:translate-x-1" />
              <span className="font-medium">Cerrar sesión</span>
            </LogoutLink>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { mounted, theme, setTheme } = useThemeAware();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  // Detect scroll for navbar background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Don't close if clicking on the menu itself or the hamburger button
      if (
        (mobileMenuRef.current && mobileMenuRef.current.contains(target)) ||
        (hamburgerButtonRef.current && hamburgerButtonRef.current.contains(target))
      ) {
        return;
      }

      closeMobileMenu();
    };

    if (mobileMenuOpen) {
      // Use both mouse and touch events for better mobile support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm min-h-[4rem] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:grid sm:grid-cols-3 sm:items-center h-20">
            {/* Left section - Logo */}
            <div className="flex items-center justify-start">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="ml-3 text-2xl font-bold text-[#45635C] tracking-tight">
                  Vetify
                </span>
              </Link>
            </div>

            {/* Center section - Desktop Navigation */}
            <div className="flex items-center justify-center space-x-2">
              <Link
                href="/funcionalidades"
                className="text-gray-700 hover:text-[#4DB8A3] px-4 py-2.5 text-base font-medium transition-all duration-200 rounded-lg hover:bg-[#4DB8A3]/5"
              >
                Funcionalidades
              </Link>
              <Link
                href="/precios"
                className="text-gray-700 hover:text-[#4DB8A3] px-4 py-2.5 text-base font-medium transition-all duration-200 rounded-lg hover:bg-[#4DB8A3]/5"
              >
                Precios
              </Link>
            </div>

            {/* Right section - User section placeholder */}
            <div className="flex items-center justify-end">
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex sm:hidden justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/logo/capybara-green.png"
                  alt="Vetify"
                  width={100}
                  height={33}
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-bold text-[#45635C] tracking-tight">
                  Vetify
                </span>
              </Link>
            </div>

            <button
              onClick={() => {
                if (window.innerWidth < 640) {
                  setMobileMenuOpen(!mobileMenuOpen);
                }
              }}
              className="p-2 rounded-lg text-gray-700 hover:text-[#4DB8A3] hover:bg-[#4DB8A3]/5 transition-all duration-200"
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
      <nav className={`sticky top-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-md border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:grid sm:grid-cols-3 sm:items-center h-20">
            {/* Left section - Logo */}
            <div className="flex items-center justify-start">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <Image
                    src="/logo/capybara-green.png"
                    alt="Vetify"
                    width={120}
                    height={40}
                    className="h-10 w-auto transition-all duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[#4DB8A3]/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-[#45635C] to-[#4DB8A3] dark:from-[#75a99c] dark:to-[#4DB8A3] bg-clip-text text-transparent tracking-tight transition-all duration-300 group-hover:tracking-wide">
                  Vetify
                </span>
              </Link>
            </div>

            {/* Center section - Desktop Navigation */}
            <div className="flex items-center justify-center space-x-2">
              <Link
                href="/funcionalidades"
                className="text-gray-700 hover:text-[#4DB8A3] dark:text-gray-200 dark:hover:text-[#4DB8A3] px-4 py-2.5 text-base font-medium transition-all duration-300 rounded-lg hover:bg-[#4DB8A3]/10 dark:hover:bg-[#4DB8A3]/20 relative group"
              >
                Funcionalidades
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#4DB8A3] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
              <Link
                href="/precios"
                className="text-gray-700 hover:text-[#4DB8A3] dark:text-gray-200 dark:hover:text-[#4DB8A3] px-4 py-2.5 text-base font-medium transition-all duration-300 rounded-lg hover:bg-[#4DB8A3]/10 dark:hover:bg-[#4DB8A3]/20 relative group"
              >
                Precios
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#4DB8A3] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
            </div>

            {/* Right section - User section */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gradient-to-br from-[#4DB8A3]/10 to-[#75a99c]/5 hover:from-[#4DB8A3]/20 hover:to-[#75a99c]/10 dark:from-[#2a3630] dark:to-[#1a2620] dark:hover:from-[#3a4640] dark:hover:to-[#2a3630] transition-all duration-300 w-10 h-10 flex items-center justify-center hover:scale-110 hover:rotate-12 focus:ring-2 focus:ring-[#4DB8A3] focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-sm hover:shadow-md group"
                aria-label="Cambiar tema"
              >
                <Sparkles className={`h-4 w-4 transition-all duration-300 ${
                  theme === "dark"
                    ? "text-yellow-400 group-hover:text-yellow-300"
                    : "text-[#4DB8A3] group-hover:text-[#45635C]"
                }`} />
              </button>

              <UserSection />
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex sm:hidden justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <Image
                    src="/logo/capybara-green.png"
                    alt="Vetify"
                    width={100}
                    height={33}
                    className="h-8 w-auto transition-all duration-300 group-hover:scale-110"
                  />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-[#45635C] to-[#4DB8A3] dark:from-[#75a99c] dark:to-[#4DB8A3] bg-clip-text text-transparent tracking-tight">
                  Vetify
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gradient-to-br from-[#4DB8A3]/10 to-[#75a99c]/5 hover:from-[#4DB8A3]/20 hover:to-[#75a99c]/10 dark:from-[#2a3630] dark:to-[#1a2620] transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-[#4DB8A3] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Cambiar tema"
              >
                <Sparkles className={`h-4 w-4 transition-colors duration-300 ${
                  theme === "dark" ? "text-yellow-400" : "text-[#4DB8A3]"
                }`} />
              </button>

              <button
                ref={hamburgerButtonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (mobileMenuOpen) {
                    closeMobileMenu();
                  } else {
                    openMobileMenu();
                  }
                }}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:text-[#4DB8A3] dark:hover:text-[#4DB8A3] hover:bg-[#4DB8A3]/10 dark:hover:bg-[#4DB8A3]/20 transition-all duration-300 focus:ring-2 focus:ring-[#4DB8A3] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
                type="button"
              >
                <div className="relative w-6 h-6">
                  <svg
                    className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          aria-hidden={!mobileMenuOpen}
        >
          {/* Backdrop with enhanced blur */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30 dark:from-black/50 dark:via-black/40 dark:to-black/50 backdrop-blur-md animate-in fade-in duration-300"
            onClick={closeMobileMenu}
          />

          {/* Mobile Navigation Panel */}
          <div
            ref={mobileMenuRef}
            className={`absolute top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-2xl transform transition-all duration-500 ease-out ${
              mobileMenuOpen
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            }`}
          >
            <div className="px-4 pt-6 pb-8 space-y-2">
              {/* Navigation Links */}
              <Link
                href="/funcionalidades"
                className="flex items-center px-5 py-3.5 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-[#4DB8A3] dark:hover:text-[#4DB8A3] hover:bg-gradient-to-r hover:from-[#4DB8A3]/10 hover:to-[#4DB8A3]/5 dark:hover:from-[#4DB8A3]/20 dark:hover:to-[#4DB8A3]/10 rounded-xl transition-all duration-300 group relative overflow-hidden"
                onClick={closeMobileMenu}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#4DB8A3]/0 via-[#4DB8A3]/10 to-[#4DB8A3]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="transform group-hover:translate-x-2 transition-transform duration-300 relative z-10">
                  Funcionalidades
                </span>
              </Link>
              <Link
                href="/precios"
                className="flex items-center px-5 py-3.5 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-[#4DB8A3] dark:hover:text-[#4DB8A3] hover:bg-gradient-to-r hover:from-[#4DB8A3]/10 hover:to-[#4DB8A3]/5 dark:hover:from-[#4DB8A3]/20 dark:hover:to-[#4DB8A3]/10 rounded-xl transition-all duration-300 group relative overflow-hidden"
                onClick={closeMobileMenu}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#4DB8A3]/0 via-[#4DB8A3]/10 to-[#4DB8A3]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="transform group-hover:translate-x-2 transition-transform duration-300 relative z-10">
                  Precios
                </span>
              </Link>

              {/* Divider with gradient */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-4"></div>

              {/* User Section for Mobile */}
              <div className="pt-2">
                <UserSection onNavigate={closeMobileMenu} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 