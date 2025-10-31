'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { AppointmentFormData } from '@/lib/validations/appointments';
import { useAppointments } from '@/hooks/useAppointments';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  customerId: string;
}

interface Staff {
  id: string;
  name: string;
  position: string;
}

interface NewAppointmentClientProps {
  customers: Customer[];
  pets: Pet[];
  staff: Staff[];
}

export default function NewAppointmentClient({
  customers,
  pets,
  staff,
}: NewAppointmentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAppointment } = useAppointments();

  // Get customerId and petId from URL params
  const customerId = searchParams.get('customerId');
  const petId = searchParams.get('petId');

  // Prepare initial data if customerId and petId are provided
  const initialData = useMemo(() => {
    if (customerId) {
      const initialValues: Partial<AppointmentFormData> = {
        customerId,
      };
      if (petId) {
        initialValues.petId = petId;
      }
      return initialValues;
    }
    return undefined;
  }, [customerId, petId]);

  // Find customer name for display
  const customerName = useMemo(() => {
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      return customer?.name;
    }
    return null;
  }, [customerId, customers]);

  const handleSubmit = async (data: AppointmentFormData) => {
    try {
      await createAppointment(data);
      toast.success('Cita creada exitosamente');
      router.push('/dashboard/appointments');
    } catch (error) {
      toast.error('Error al crear la cita');
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/appointments');
  };

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al calendario
      </Link>

      {customerName && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Creando cita para {customerName}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                El cliente y la mascota ya están preseleccionados. Solo completa los detalles de la cita.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <AppointmentForm
            customers={customers}
            pets={pets}
            staff={staff}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
