"use client";

import { useThemeAware } from '../../hooks/useThemeAware';
import { usePathname, useRouter } from 'next/navigation';
import { Bars3Icon, BellIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { UserWithTenant, TenantWithPlan } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface DashboardHeaderProps {
  user: UserWithTenant;
  tenant: TenantWithPlan;
  onMenuClick: () => void;
}

// Mapeo de rutas a títulos
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/customers': 'Clientes',
    '/dashboard/pets': 'Mascotas',
    '/dashboard/staff': 'Personal',
    '/dashboard/sales': 'Punto de Venta',
    '/dashboard/caja': 'Caja',
    '/dashboard/inventory': 'Inventario',
    '/dashboard/medical-history': 'Historia Clínica',
    '/dashboard/appointments': 'Citas',
    '/dashboard/reports': 'Reportes',
    '/dashboard/settings': 'Configuración',
  };

  // Buscar coincidencia exacta primero
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Buscar coincidencia parcial para rutas anidadas
  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route) && route !== '/dashboard') {
      return title;
    }
  }

  return 'Dashboard';
};

export function DashboardHeader({ user, tenant, onMenuClick }: DashboardHeaderProps) {
  const { mounted, theme, setTheme } = useThemeAware();
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    // Cerrar el dropdown
    setIsDropdownOpen(false);
    // Redirigir a la ruta de logout de Kinde que luego redirige al home
    window.location.href = '/api/auth/logout';
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const loading = !mounted;

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#d5e3df] dark:border-gray-800 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
      >
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Page title and tenant info */}
        <div className="relative flex flex-1 items-center min-w-0">
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {pageTitle}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate lg:hidden">
              {tenant.name}
            </p>
          </div>
          
          {/* Tenant info for desktop */}
          <div className="hidden lg:block ml-auto">
            <div className="flex items-center gap-x-2 text-sm text-gray-500 dark:text-gray-400">
                             <span className="font-medium">{tenant.name}</span>
               {tenant.tenantSubscription?.plan && (
                 <>
                   <span>•</span>
                   <span className="inline-flex items-center rounded-full bg-[#e5f1ee] dark:bg-[#2a3630] px-2 py-1 text-xs font-medium text-[#5b9788] dark:text-[#75a99c]">
                     {tenant.tenantSubscription.plan.name}
                   </span>
                 </>
               )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-x-2 lg:gap-x-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            disabled={loading}
            className={`p-2 rounded-lg transition-all duration-200 w-10 h-10 flex items-center justify-center ${
              loading 
                ? 'bg-gray-200 dark:bg-gray-700 animate-pulse' 
                : 'bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] hover:scale-105 active:scale-95'
            }`}
            aria-label={loading ? "Cargando..." : "Cambiar tema"}
          >
            {loading ? (
              <div className="w-4 h-4 bg-gray-400 rounded-full" />
            ) : (
              <span className="text-sm">{theme === "dark" ? "☀️" : "🌙"}</span>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Ver notificaciones"
          >
            <BellIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div
            className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              id="user-menu-button"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Menú de usuario"
              onClick={toggleDropdown}
            >
              <div className="h-8 w-8 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold text-sm">
                {user.firstName?.[0] || user.email?.[0] || 'U'}
              </div>
              <div className="hidden sm:flex sm:flex-col sm:items-start sm:min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                  {user.firstName || user.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email?.split('@')[0] || 'usuario'}
                </span>
              </div>
              <ChevronDownIcon 
                className={`hidden sm:block h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} 
                aria-hidden="true" 
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
                <div className="py-1">
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.firstName || user.email?.split('@')[0] || 'Usuario'
                      }
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/dashboard/settings');
                      }}
                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <UserIcon className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400" aria-hidden="true" />
                      Mi perfil
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="group flex w-full items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-red-500 dark:text-red-400" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 