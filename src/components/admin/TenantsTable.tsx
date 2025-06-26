'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { clsx } from 'clsx';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING_SETUP';
  createdAt: Date;
  isTrialPeriod: boolean;
  tenantSubscription: {
    plan: {
      name: string;
      key: string;
    };
    status: string;
  } | null;
  _count: {
    users: number;
    pets: number;
    appointments: number;
  };
}

interface TenantsTableProps {
  tenants: Tenant[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

function getStatusBadge(status: Tenant['status']) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Activo
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Suspendido
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <XCircleIcon className="w-3 h-3 mr-1" />
          Cancelado
        </span>
      );
    case 'PENDING_SETUP':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Configurando
        </span>
      );
  }
}

function TenantActionsMenu({ tenant }: { tenant: Tenant }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (action: 'activate' | 'suspend' | 'delete') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/${action}`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to update tenant status');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <EllipsisHorizontalIcon className="h-5 w-5" />
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
                <Link
                  href={`/admin/tenants/${tenant.id}`}
                  className={clsx(
                    'flex items-center px-4 py-2 text-sm',
                    active
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <EyeIcon className="mr-3 h-4 w-4" />
                  Ver detalles
                </Link>
              )}
            </Menu.Item>

            {tenant.status === 'ACTIVE' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleStatusChange('suspend')}
                    disabled={isLoading}
                    className={clsx(
                      'flex items-center w-full px-4 py-2 text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <PauseIcon className="mr-3 h-4 w-4" />
                    Suspender
                  </button>
                )}
              </Menu.Item>
            )}

            {tenant.status === 'SUSPENDED' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleStatusChange('activate')}
                    disabled={isLoading}
                    className={clsx(
                      'flex items-center w-full px-4 py-2 text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <PlayIcon className="mr-3 h-4 w-4" />
                    Activar
                  </button>
                )}
              </Menu.Item>
            )}

            <div className="border-t border-gray-100 dark:border-gray-700" />
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleStatusChange('delete')}
                  disabled={isLoading}
                  className={clsx(
                    'flex items-center w-full px-4 py-2 text-sm',
                    active
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  <TrashIcon className="mr-3 h-4 w-4" />
                  Eliminar
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function Pagination({ pagination }: { pagination: TenantsTableProps['pagination'] }) {
  const router = useRouter();
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`/admin/tenants?${params.toString()}`);
  };

  const pages = [];
  const startPage = Math.max(1, pagination.currentPage - 2);
  const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        Mostrando {(pagination.currentPage - 1) * 20 + 1} a{' '}
        {Math.min(pagination.currentPage * 20, pagination.total)} de {pagination.total} resultados
      </div>
      
      <div className="flex space-x-1">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Anterior
        </button>
        
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={clsx(
              'px-3 py-1 text-sm border rounded-md',
              page === pagination.currentPage
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export function TenantsTable({ tenants, pagination }: TenantsTableProps) {
  if (tenants.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay clínicas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron clínicas con los filtros aplicados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clínica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuarios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mascotas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Creado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenant.name}
                      </div>
                      {tenant.isTrialPeriod && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          Trial
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.slug}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(tenant.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {tenant.tenantSubscription?.plan.name || 'Sin plan'}
                  </span>
                  {tenant.tenantSubscription?.status && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tenant.tenantSubscription.status}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {tenant._count.users}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {tenant._count.pets}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(tenant.createdAt), 'dd MMM yyyy', { locale: es })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <TenantActionsMenu tenant={tenant} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Pagination pagination={pagination} />
    </div>
  );
} 