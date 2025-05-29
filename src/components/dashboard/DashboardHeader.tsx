"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { UserWithTenant, TenantWithPlan } from '@/types';

interface DashboardHeaderProps {
  user: UserWithTenant;
  tenant: TenantWithPlan;
}

export function DashboardHeader({ user, tenant }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#d5e3df] dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
      >
        <span className="sr-only">Abrir sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tenant.name}
          </h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[#75a99c] hover:bg-[#5b9788] text-white dark:bg-[#2a3630] dark:hover:bg-[#1a2620] transition-colors w-10 h-10 flex items-center justify-center"
            aria-label="Cambiar tema"
          >
            {resolvedTheme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
          >
            <span className="sr-only">Ver notificaciones</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="-m-1.5 flex items-center p-1.5"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <div className="h-8 w-8 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold">
                {user.firstName?.[0] || user.name?.[0] || 'U'}
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
                  aria-hidden="true"
                >
                  {user.firstName || user.name}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 