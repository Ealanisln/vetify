'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { clsx } from 'clsx';

interface AdminHeaderProps {
  user: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - could add breadcrumbs here */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Panel Administrativo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona todas las clínicas y usuarios del sistema
            </p>
          </div>

          {/* Right side - notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
              <BellIcon className="h-6 w-6" />
            </button>

            {/* User Menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Super Admin
                  </p>
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={clsx(
                            'flex items-center w-full px-4 py-2 text-sm text-left',
                            active
                              ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <Cog6ToothIcon className="mr-3 h-4 w-4" />
                          Configuración
                        </button>
                      )}
                    </Menu.Item>
                    
                    <div className="border-t border-gray-100 dark:border-gray-700" />
                    
                    <Menu.Item>
                      {({ active }) => (
                        <LogoutLink
                          className={clsx(
                            'flex items-center w-full px-4 py-2 text-sm text-left',
                            active
                              ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                          Cerrar Sesión
                        </LogoutLink>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
} 