'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Phone, MapPin, Menu, X, ImageIcon, Sun, Moon, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
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

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y nombre */}
          <div className="flex items-center">
            <Link href={`/${tenant.slug}`} className="flex items-center space-x-3">
              {tenant.logo ? (
                <Image
                  src={tenant.logo}
                  alt={`Logo de ${tenant.name}`}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {tenant.name}
              </span>
            </Link>
          </div>

          {/* Información de contacto (desktop) */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            {tenant.publicPhone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" style={{ color: themeColor }} />
                <span>{tenant.publicPhone}</span>
              </div>
            )}
            {tenant.publicAddress && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" style={{ color: themeColor }} />
                <span className="max-w-xs truncate">{tenant.publicAddress}</span>
              </div>
            )}
          </div>

          {/* Botones de acción (desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href={`/${tenant.slug}/servicios`}>
              <Button variant="ghost" className="dark:text-gray-300 dark:hover:bg-gray-800">
                Servicios
              </Button>
            </Link>
            {tenant.hasGallery && (
              <Link href={`/${tenant.slug}/galeria`}>
                <Button variant="ghost" className="gap-1 dark:text-gray-300 dark:hover:bg-gray-800">
                  <ImageIcon className="h-4 w-4" />
                  Galería
                </Button>
              </Link>
            )}
            {tenant.hasTeam && (
              <Link href={`/${tenant.slug}/equipo`}>
                <Button variant="ghost" className="gap-1 dark:text-gray-300 dark:hover:bg-gray-800">
                  <Users className="h-4 w-4" />
                  Equipo
                </Button>
              </Link>
            )}

            {/* Theme toggle button */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 dark:text-gray-300 dark:hover:bg-gray-800"
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
                className="text-white"
                style={{ backgroundColor: themeColor }}
              >
                Agendar Cita
              </Button>
            </Link>
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              {/* Información de contacto móvil */}
              {tenant.publicPhone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" style={{ color: themeColor }} />
                  <span>{tenant.publicPhone}</span>
                </div>
              )}
              {tenant.publicAddress && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" style={{ color: themeColor }} />
                  <span>{tenant.publicAddress}</span>
                </div>
              )}
              
              {/* Enlaces móviles */}
              <div className="flex flex-col space-y-2 pt-2">
                <Link href={`/${tenant.slug}/servicios`}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Servicios
                  </Button>
                </Link>
                {tenant.hasGallery && (
                  <Link href={`/${tenant.slug}/galeria`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Galería
                    </Button>
                  </Link>
                )}
                {tenant.hasTeam && (
                  <Link href={`/${tenant.slug}/equipo`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      Equipo
                    </Button>
                  </Link>
                )}

                {/* Theme toggle button (mobile) */}
                {mounted && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={toggleTheme}
                    aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  >
                    {resolvedTheme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Modo Claro
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Modo Oscuro
                      </>
                    )}
                  </Button>
                )}

                <Link href={`/${tenant.slug}/agendar`}>
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: themeColor }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Agendar Cita
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 