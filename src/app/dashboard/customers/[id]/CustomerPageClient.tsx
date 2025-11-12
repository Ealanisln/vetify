'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerDetail } from '../../../../components/customers/CustomerDetail';
import { Button } from '../../../../components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dateOfBirth: string;
  gender: string;
  isDeceased: boolean;
}

interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: string;
  pet: {
    id: string;
    name: string;
  };
  staff?: {
    name: string;
  };
}

interface Sale {
  id: string;
  total: number;
  createdAt: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  preferredContactMethod?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  pets?: Pet[];
  appointments?: Appointment[];
  sales?: Sale[];
}

interface CustomerPageClientProps {
  id: string;
}

export function CustomerPageClient({ id }: CustomerPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we should start in edit mode from query parameter
  const shouldStartInEditMode = searchParams.get('edit') === 'true';

  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/customers/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Cliente no encontrado');
          return;
        }
        throw new Error('Error al cargar cliente');
      }

      const customerData = await response.json();
      setCustomer(customerData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Error al cargar los datos del cliente');
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleUpdate = (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer);
  };

  const handleArchive = () => {
    // Redirect to customers list after archiving
    router.push('/dashboard/customers');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {error || 'Cliente no encontrado'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Lo sentimos, no pudimos encontrar el cliente que buscas.
          </p>
          <Link href="/dashboard/customers">
            <Button className="inline-flex items-center">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a Clientes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Link href="/dashboard/customers">
          <Button variant="ghost" className="inline-flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
      </div>

      {/* Customer Detail */}
      <CustomerDetail
        customer={customer}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        initialEditMode={shouldStartInEditMode}
      />
    </div>
  );
} 