'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { AppointmentFormData } from '@/lib/validations/appointments';
import { useAppointments, AppointmentWithDetails } from '@/hooks/useAppointments';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, User, FileText, AlertCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface AppointmentDetailClientProps {
  appointment: AppointmentWithDetails;
  customers: Customer[];
  pets: Pet[];
  staff: Staff[];
}

const statusConfig = {
  SCHEDULED: {
    label: 'Programada',
    icon: Calendar,
    color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900',
  },
  CONFIRMED: {
    label: 'Confirmada',
    icon: CheckCircle,
    color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  },
  CHECKED_IN: {
    label: 'Check-in',
    icon: Clock,
    color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    icon: Clock,
    color: 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900',
  },
  COMPLETED: {
    label: 'Completada',
    icon: CheckCircle,
    color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  },
  CANCELLED_CLIENT: {
    label: 'Cancelada por Cliente',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30 border-red-200 dark:border-red-900',
  },
  CANCELLED_CLINIC: {
    label: 'Cancelada por Clínica',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30 border-red-200 dark:border-red-900',
  },
  NO_SHOW: {
    label: 'No Asistió',
    icon: AlertCircle,
    color: 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
  },
} as const;

export default function AppointmentDetailClient({
  appointment,
  customers,
  pets,
  staff,
}: AppointmentDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { updateAppointment, deleteAppointment, quickAction } = useAppointments();
  const [loading, setLoading] = useState(false);

  const statusInfo = statusConfig[appointment.status];
  const StatusIcon = statusInfo.icon;

  const handleUpdate = async (data: AppointmentFormData) => {
    setLoading(true);
    try {
      await updateAppointment(appointment.id, data);
      toast.success('Cita actualizada exitosamente');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error('Error al actualizar la cita');
      console.error('Error updating appointment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAppointment(appointment.id);
      toast.success('Cita eliminada exitosamente');
      router.push('/dashboard/appointments');
    } catch (error) {
      toast.error('Error al eliminar la cita');
      console.error('Error deleting appointment:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setLoading(true);
    try {
      await quickAction(appointment.id, action);
      toast.success('Estado actualizado exitosamente');
      router.refresh();
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error('Error with quick action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Cita</h1>
            <p className="text-muted-foreground mt-2">
              Modifica los detalles de la cita
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <AppointmentForm
              customers={customers}
              pets={pets}
              staff={staff}
              initialData={{
                customerId: appointment.customer.id,
                petId: appointment.pet.id,
                dateTime: appointment.dateTime,
                duration: appointment.duration,
                reason: appointment.reason,
                notes: appointment.notes || undefined,
                staffId: appointment.staff?.id || undefined,
                status: appointment.status,
              }}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al calendario
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Detalle de Cita</h1>
          <p className="text-muted-foreground">
            Cita #{appointment.id.slice(0, 8)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border', statusInfo.color)}>
          <StatusIcon className="h-4 w-4" />
          {statusInfo.label}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Cliente y Mascota */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">Cliente y Mascota</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cliente</p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{appointment.customer.name}</p>
              {appointment.customer.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.customer.email}</p>
              )}
              {appointment.customer.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.customer.phone}</p>
              )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mascota</p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{appointment.pet.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {appointment.pet.species} {appointment.pet.breed && `· ${appointment.pet.breed}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información de la Cita */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">Detalles de la Cita</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha y Hora</p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {format(new Date(appointment.dateTime), 'PPP', { locale: es })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(appointment.dateTime), 'HH:mm')} · {appointment.duration} minutos
              </p>
            </div>
            {appointment.staff && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Veterinario</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{appointment.staff.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.staff.position}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivo de Consulta */}
        <Card className="md:col-span-2 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">Motivo de Consulta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">{appointment.reason}</p>
            {appointment.notes && (
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notas adicionales</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {appointment.status !== 'COMPLETED' &&
       appointment.status !== 'CANCELLED_CLIENT' &&
       appointment.status !== 'CANCELLED_CLINIC' && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {appointment.status === 'SCHEDULED' && (
              <Button
                variant="outline"
                onClick={() => handleQuickAction('confirm')}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Cita
              </Button>
            )}
            {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
              <Button
                variant="outline"
                onClick={() => handleQuickAction('start')}
                disabled={loading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Iniciar Consulta
              </Button>
            )}
            {appointment.status === 'IN_PROGRESS' && (
              <Button
                variant="outline"
                onClick={() => handleQuickAction('complete')}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Completada
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleQuickAction('cancel')}
              disabled={loading}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Cita
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metadata */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Creada</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{format(new Date(appointment.createdAt), 'PPP HH:mm', { locale: es })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Última actualización</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{format(new Date(appointment.updatedAt), 'PPP HH:mm', { locale: es })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
