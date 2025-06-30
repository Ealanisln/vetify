"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { UserWithTenant, TenantWithPlan } from '@/types';

interface SidebarProps {
  user: UserWithTenant;
  tenant: TenantWithPlan;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clientes', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'Mascotas', href: '/dashboard/pets', icon: UserGroupIcon },
  { name: 'Personal', href: '/dashboard/staff', icon: UsersIcon },
  { name: 'Punto de Venta', href: '/dashboard/sales', icon: CreditCardIcon },
  { name: 'Caja', href: '/dashboard/caja', icon: CurrencyDollarIcon },
  { name: 'Inventario', href: '/dashboard/inventory', icon: CubeIcon },
  { name: 'Historia Clínica', href: '/dashboard/medical-history', icon: DocumentTextIcon },
  { name: 'Citas', href: '/dashboard/appointments', icon: CalendarIcon },
  { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'Configuración', href: '/dashboard/settings', icon: CogIcon },
];

export function Sidebar({ user, tenant, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  // Manejar escape key para cerrar sidebar
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevenir scroll del body cuando el sidebar está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? 'fixed inset-0' : 'hidden'}`}>
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        
        {/* Sidebar panel */}
        <div className="fixed inset-0 flex">
          <div className={`relative mr-16 flex w-full max-w-xs flex-1 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Close button */}
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-white hover:text-gray-300 transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar sidebar"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            {/* Sidebar content */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4 shadow-xl">
              {/* Logo */}
              <div className="flex h-16 shrink-0 items-center">
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
              </div>
              
              {/* Navigation */}
              <nav className="flex flex-1 flex-col" aria-label="Navegación principal">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                                isActive
                                  ? 'bg-[#75a99c] text-white shadow-sm'
                                  : 'text-gray-700 hover:text-[#5b9788] hover:bg-[#e5f1ee] hover:scale-[1.02] dark:text-gray-300 dark:hover:text-[#75a99c] dark:hover:bg-[#2a3630]/30'
                              }`}
                            >
                              <item.icon className={`h-6 w-6 shrink-0 transition-colors ${
                                isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#5b9788] dark:text-gray-500 dark:group-hover:text-[#75a99c]'
                              }`} />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  
                  {/* User info section */}
                  <li className="-mx-6 mt-auto">
                    <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 border-t border-[#d5e3df] dark:border-gray-800">
                      <div className="h-8 w-8 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold">
                        {user.firstName?.[0] || user.name?.[0] || 'U'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{user.firstName || user.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.name}</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[#d5e3df] dark:border-gray-800 bg-white dark:bg-gray-900 px-6">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
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
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-1 flex-col" aria-label="Navegación principal">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-[#75a99c] text-white shadow-sm'
                              : 'text-gray-700 hover:text-[#5b9788] hover:bg-[#e5f1ee] hover:scale-[1.02] dark:text-gray-300 dark:hover:text-[#75a99c] dark:hover:bg-[#2a3630]/30'
                          }`}
                        >
                          <item.icon className={`h-6 w-6 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#5b9788] dark:text-gray-500 dark:group-hover:text-[#75a99c]'
                          }`} />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              {/* User info section */}
              <li className="-mx-6 mt-auto">
                <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 border-t border-[#d5e3df] dark:border-gray-800">
                  <div className="h-8 w-8 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold">
                    {user.firstName?.[0] || user.name?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{user.firstName || user.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.name}</span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
} 