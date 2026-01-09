'use client';

import { useState, useEffect, useCallback } from 'react';
import { CustomersList } from '../../../components/customers/CustomersList';
import { CustomerStats } from '../../../components/customers/CustomerStats';
import { Button } from '../../../components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';

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

export function CustomersPageClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentLocation, isAllLocations } = useLocation();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!isAllLocations && currentLocation?.id) {
        params.set('locationId', currentLocation.id);
      }

      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation?.id, isAllLocations]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y dueños de mascotas</p>
          </div>
          <Link href="/dashboard/customers/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y dueños de mascotas</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchCustomers} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y dueños de mascotas</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="inline-flex items-center" data-testid="add-customer-button">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <CustomerStats customers={customers} />

      {/* Customers List */}
      <CustomersList customers={customers} />
    </div>
  );
}
