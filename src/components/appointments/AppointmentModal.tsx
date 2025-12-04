'use client';

import { useState } from 'react';
// Modal component will use custom pattern
import { AppointmentForm } from './AppointmentForm';
import { AppointmentFormData } from '../../lib/validations/appointments';
import { useAppointments, AppointmentWithDetails } from '../../hooks/useAppointments';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  customerId: string;
}

interface Staff {
  id: string;
  name: string;
  position: string;
}

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: AppointmentWithDetails;
  customers: Customer[];
  pets: Pet[];
  staff: Staff[];
  onSuccess?: () => void;
  initialDate?: Date;
}

export function AppointmentModal({
  open,
  onOpenChange,
  appointment,
  customers,
  pets,
  staff,
  onSuccess,
  initialDate,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const { createAppointment, updateAppointment } = useAppointments();

  const isEditing = !!appointment;

  const handleSubmit = async (data: AppointmentFormData) => {
    setLoading(true);

    try {
      if (isEditing) {
        await updateAppointment(appointment.id, data);
        toast.success('Cita actualizada exitosamente');
      } else {
        await createAppointment(data);
        toast.success('Cita creada exitosamente');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Show the specific error message from the server
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
      console.error('Error handling appointment:', error);
      throw error; // Re-throw para que AppointmentForm maneje el estado de error
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getInitialData = (): Partial<AppointmentFormData> | undefined => {
    if (appointment) {
      return {
        customerId: appointment.customer.id,
        petId: appointment.pet.id,
        dateTime: appointment.dateTime,
        duration: appointment.duration,
        reason: appointment.reason,
        notes: appointment.notes || undefined,
        staffId: appointment.staff?.id || undefined,
        status: appointment.status,
      };
    }
    
    if (initialDate) {
      return {
        dateTime: initialDate,
      };
    }
    
    return undefined;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border-0">
        <div className="relative h-[90vh] overflow-y-auto">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <AppointmentForm
            customers={customers}
            pets={pets}
            staff={staff}
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}