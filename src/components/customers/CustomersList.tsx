'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { getThemeClasses } from '@/utils/theme-colors';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

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
            />
          </div>
        </div>

        {/* Customers Table */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
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
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                    <tr key={customer.id} className={`${getThemeClasses('hover.card')}`}>
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
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm" title="Editar cliente">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </Link>
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
    </div>
  );
} 