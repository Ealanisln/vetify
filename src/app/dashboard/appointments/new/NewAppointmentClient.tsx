'use client';

import { useRouter } from 'next/navigation';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { AppointmentFormData } from '@/lib/validations/appointments';
import { useAppointments } from '@/hooks/useAppointments';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  const { createAppointment } = useAppointments();

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

      <Card>
        <CardContent className="pt-6">
          <AppointmentForm
            customers={customers}
            pets={pets}
            staff={staff}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
