'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getThemeClasses } from '../../utils/theme-colors';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  pets?: {
    id: string;
    name: string;
    species: string;
  }[];
  _count?: {
    pets: number;
    appointments: number;
  };
}

interface CustomersListProps {
  customers: Customer[];
}

export function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const handleArchiveCustomer = async () => {
    if (!customerToArchive) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`/api/customers/${customerToArchive.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al archivar cliente');
      }

      toast.success('Cliente archivado correctamente');
      setCustomerToArchive(null);

      // Refresh the server component data without full page reload
      router.refresh();
    } catch (error) {
      console.error('Error archiving customer:', error);
      toast.error('Error al archivar el cliente');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className={`${getThemeClasses('background.card')} shadow rounded-lg border ${getThemeClasses('border.primary')}`}>
      <div className="px-4 py-5 sm:p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 ${getThemeClasses('text.muted')}`} />
            </div>
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${getThemeClasses('input.base')} block w-full pl-10 pr-3 py-2 border rounded-md leading-5 placeholder-opacity-75 focus:outline-none focus:ring-1 ${getThemeClasses('input.focus')}`}
              data-testid="customer-search-input"
            />
          </div>
        </div>

        {/* Customers Table */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8" data-testid="empty-customers-state">
            <div className="text-4xl mb-3">👥</div>
            <h3 className={`text-sm font-medium ${getThemeClasses('text.primary')} mb-1`}>
              {searchTerm ? 'No se encontraron clientes' : 'Sin clientes registrados'}
            </h3>
            <p className={`text-sm ${getThemeClasses('text.muted')} mb-4`}>
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza agregando tu primer cliente'
              }
            </p>
            {!searchTerm && (
              <Link href="/dashboard/customers/new">
                <Button>Agregar Primer Cliente</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" data-testid="customers-table">
                <thead className={`${getThemeClasses('table.header')}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${getThemeClasses('text.secondary')} uppercase tracking-wider`}>
                      Cliente
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${getThemeClasses('text.secondary')} uppercase tracking-wider`}>
                      Contacto
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${getThemeClasses('text.secondary')} uppercase tracking-wider`}>
                      Mascotas
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${getThemeClasses('text.secondary')} uppercase tracking-wider`}>
                      Citas
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${getThemeClasses('text.secondary')} uppercase tracking-wider`}>
                      Estado
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium ${getThemeClasses('text.secondary')} uppercase tracking-wider`}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className={`${getThemeClasses('background.card')} divide-y ${getThemeClasses('border.primary')}`}>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className={`${getThemeClasses('hover.card')}`} data-testid="customer-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${getThemeClasses('text.primary')}`}>
                            {customer.name}
                          </div>
                          {customer.address && (
                            <div className={`text-sm ${getThemeClasses('text.secondary')}`}>
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className={`flex items-center text-sm ${getThemeClasses('text.secondary')}`}>
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className={`flex items-center text-sm ${getThemeClasses('text.secondary')}`}>
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${getThemeClasses('text.primary')}`}>
                          {customer._count?.pets || 0} mascotas
                        </div>
                        {customer.pets && customer.pets.length > 0 && (
                          <div className={`text-xs ${getThemeClasses('text.muted')}`}>
                            {customer.pets.slice(0, 2).map(pet => pet.name).join(', ')}
                            {customer.pets.length > 2 && ` +${customer.pets.length - 2} más`}
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getThemeClasses('text.primary')}`}>
                        {customer._count?.appointments || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.isActive 
                            ? getThemeClasses('status.success')
                            : getThemeClasses('status.error')
                        }`}>
                          {customer.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm" title="Ver cliente" data-testid="view-customer-button">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/customers/${customer.id}?edit=true`}>
                            <Button variant="ghost" size="sm" title="Editar cliente" data-testid="edit-customer-button">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Archivar cliente"
                            onClick={() => setCustomerToArchive(customer)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            data-testid="archive-customer-button"
                          >
                            <ArchiveBoxIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      {customerToArchive && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => !isArchiving && setCustomerToArchive(null)}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                    Archivar Cliente
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ¿Estás seguro de que deseas archivar a <strong>{customerToArchive.name}</strong>?
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                      Las mascotas asociadas también serán archivadas.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Esta acción puede revertirse desde la vista de clientes archivados.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleArchiveCustomer}
                  disabled={isArchiving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isArchiving ? 'Archivando...' : 'Archivar'}
                </Button>
                <Button
                  onClick={() => setCustomerToArchive(null)}
                  disabled={isArchiving}
                  variant="outline"
                  className="mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 