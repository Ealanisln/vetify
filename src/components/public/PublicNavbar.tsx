'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import {
  Phone,
  MapPin,
  Menu,
  X,
  ImageIcon,
  Sun,
  Moon,
  Users,
  Stethoscope,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface PublicNavbarProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    publicPhone?: string | null;
    publicAddress?: string | null;
    publicThemeColor?: string | null;
    hasGallery?: boolean;
    hasTeam?: boolean;
  };
}

export function PublicNavbar({ tenant }: PublicNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const themeColor = tenant.publicThemeColor || '#75a99c';

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen, handleEscape]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Generate lighter shade for backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre */}
            <Link href={`/${tenant.slug}`} className="flex items-center space-x-3 group">
              {tenant.logo ? (
                <Image
                  src={tenant.logo}
                  alt={`Logo de ${tenant.name}`}
                  width={40}
                  height={40}
                  className="rounded-xl transition-transform group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-105"
                  style={{ backgroundColor: themeColor }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {tenant.name}
              </span>
            </Link>

            {/* Información de contacto (desktop) */}
            <div className="hidden lg:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              {tenant.publicPhone && (
                <a
                  href={`tel:${tenant.publicPhone}`}
                  className="flex items-center space-x-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  <Phone className="h-4 w-4" style={{ color: themeColor }} />
                  <span>{tenant.publicPhone}</span>
                </a>
              )}
              {tenant.publicAddress && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" style={{ color: themeColor }} />
                  <span className="max-w-xs truncate">{tenant.publicAddress}</span>
                </div>
              )}
            </div>

            {/* Botones de acción (desktop) */}
            <div className="hidden lg:flex items-center space-x-2">
              <Link href={`/${tenant.slug}/servicios`}>
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Servicios
                </Button>
              </Link>
              {tenant.hasGallery && (
                <Link href={`/${tenant.slug}/galeria`}>
                  <Button variant="ghost" className="gap-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ImageIcon className="h-4 w-4" />
                    Galería
                  </Button>
                </Link>
              )}
              {tenant.hasTeam && (
                <Link href={`/${tenant.slug}/equipo`}>
                  <Button variant="ghost" className="gap-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Users className="h-4 w-4" />
                    Equipo
                  </Button>
                </Link>
              )}

              {/* Theme toggle button */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}

              <Link href={`/${tenant.slug}/agendar`}>
                <Button
                  className="text-white shadow-md hover:shadow-lg transition-shadow ml-2"
                  style={{ backgroundColor: themeColor }}
                >
                  Agendar Cita
                </Button>
              </Link>
            </div>

            {/* Botón menú móvil */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
        />

        {/* Menu Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Menu Content */}
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <Link href={`/${tenant.slug}`} className="flex items-center space-x-3" onClick={closeMenu}>
                {tenant.logo ? (
                  <Image
                    src={tenant.logo}
                    alt={`Logo de ${tenant.name}`}
                    width={44}
                    height={44}
                    className="rounded-xl"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                    style={{ backgroundColor: themeColor }}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {tenant.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clínica Veterinaria</p>
                </div>
              </Link>
              <button
                onClick={closeMenu}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Contact Info Section */}
              {(tenant.publicPhone || tenant.publicAddress) && (
                <div className="p-5 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Contacto
                  </p>

                  {tenant.publicPhone && (
                    <a
                      href={`tel:${tenant.publicPhone}`}
                      className="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                        style={{ backgroundColor: hexToRgba(themeColor, 0.15) }}
                      >
                        <Phone className="h-5 w-5" style={{ color: themeColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tenant.publicPhone}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Llamar ahora</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </a>
                  )}

                  {tenant.publicAddress && (
                    <div className="flex items-start p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                        style={{ backgroundColor: hexToRgba(themeColor, 0.15) }}
                      >
                        <MapPin className="h-5 w-5" style={{ color: themeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          {tenant.publicAddress}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dirección</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

              {/* Navigation Section */}
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Navegación
                </p>

                <nav className="space-y-1">
                  <Link
                    href={`/${tenant.slug}/servicios`}
                    onClick={closeMenu}
                    className="flex items-center p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <Stethoscope className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    <span className="font-medium">Servicios</span>
                    <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  </Link>

                  {tenant.hasGallery && (
                    <Link
                      href={`/${tenant.slug}/galeria`}
                      onClick={closeMenu}
                      className="flex items-center p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <ImageIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      <span className="font-medium">Galería</span>
                      <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </Link>
                  )}

                  {tenant.hasTeam && (
                    <Link
                      href={`/${tenant.slug}/equipo`}
                      onClick={closeMenu}
                      className="flex items-center p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <Users className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      <span className="font-medium">Nuestro Equipo</span>
                      <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </Link>
                  )}
                </nav>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-5" />

              {/* Theme Toggle Section */}
              {mounted && (
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Apariencia
                  </p>

                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        {resolvedTheme === 'dark' ? (
                          <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        ) : (
                          <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {resolvedTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Toca para cambiar
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch Visual */}
                    <div
                      className={`w-12 h-7 rounded-full p-1 transition-colors ${
                        resolvedTheme === 'dark'
                          ? 'bg-gray-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          resolvedTheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* CTA Button - Fixed at bottom */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Link href={`/${tenant.slug}/agendar`} onClick={closeMenu} className="block">
                <button
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                  style={{ backgroundColor: themeColor }}
                >
                  <Calendar className="h-5 w-5" />
                  Agendar Cita
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
