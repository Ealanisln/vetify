'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Badge } from '../ui/badge';
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Phone,
  Edit,
  Trash,
  UserCheck,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { AppointmentWithDetails } from '../../hooks/useAppointments';
import { getAppointmentStatusLabel, getAppointmentStatusColor, getNextAppointmentStatus } from '../../lib/validations/appointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface QuickActionsProps {
  appointment: AppointmentWithDetails;
  onStatusChange: (appointmentId: string, action: string) => Promise<void>;
  onEdit?: (appointment: AppointmentWithDetails) => void;
  onDelete?: (appointmentId: string) => void;
  onWhatsApp?: (phone: string, appointment: AppointmentWithDetails) => void;
  showWhatsApp?: boolean;
  size?: 'sm' | 'default';
  variant?: 'compact' | 'full';
}

export function QuickActions({
  appointment,
  onStatusChange,
  onEdit,
  onDelete,
  onWhatsApp,
  showWhatsApp = true,
  size = 'default',
  variant = 'full'
}: QuickActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const nextStatuses = getNextAppointmentStatus(appointment.status);
  const canEdit = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const canCancel = !['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'].includes(appointment.status);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      await onStatusChange(appointment.id, action);
      toast.success('Estado actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error('Error in quick action:', error);
    } finally {
      setLoading(null);
    }
  };

  const getActionButton = (status: string) => {
    const actions = {
      CONFIRMED: {
        icon: CheckCircle,
        label: 'Confirmar',
        action: 'confirm',
        variant: 'default' as const,
        className: 'bg-green-600 hover:bg-green-700'
      },
      CHECKED_IN: {
        icon: UserCheck,
        label: 'Registrar',
        action: 'checkin',
        variant: 'default' as const,
        className: 'bg-purple-600 hover:bg-purple-700'
      },
      IN_PROGRESS: {
        icon: PlayCircle,
        label: 'Iniciar',
        action: 'start',
        variant: 'default' as const,
        className: 'bg-orange-600 hover:bg-orange-700'
      },
      COMPLETED: {
        icon: CheckCircle,
        label: 'Completar',
        action: 'complete',
        variant: 'default' as const,
        className: 'bg-emerald-600 hover:bg-emerald-700'
      }
    };

    return actions[status as keyof typeof actions];
  };

  // const formatWhatsAppMessage = (appointment: AppointmentWithDetails) => {
  //   return `Hola ${appointment.customer.name}, recordamos tu cita para ${appointment.pet.name} el ${format(appointment.dateTime, 'PPP', { locale: es })} a las ${format(appointment.dateTime, 'HH:mm')}. Motivo: ${appointment.reason}`;
  // };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Menu as="div" className="relative ml-auto">
          <Menu.Button as={Button}
            variant="ghost"
            size={size}
            className="h-8 w-8 p-0"
            disabled={loading !== null}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {/* Status Actions */}
                {nextStatuses.map((status) => {
                  const actionConfig = getActionButton(status);
                  if (!actionConfig) return null;
                  
                  const Icon = actionConfig.icon;
                  return (
                    <Menu.Item key={status}>
                      {({ active }) => (
                        <button
                          onClick={() => handleAction(actionConfig.action)}
                          className={cn(
                            'flex w-full items-center px-4 py-2 text-sm',
                            active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {actionConfig.label}
                        </button>
                      )}
                    </Menu.Item>
                  );
                })}
                
                {canCancel && nextStatuses.length > 0 && <div className="border-t border-gray-100 dark:border-gray-600 my-1" />}
                
                {canCancel && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleAction('cancel')}
                        className={cn(
                          'flex w-full items-center px-4 py-2 text-sm text-red-600',
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        )}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                      </button>
                    )}
                  </Menu.Item>
                )}
                
                <div className="border-t border-gray-100 dark:border-gray-600 my-1" />
                
                {/* Other Actions */}
                {canEdit && onEdit && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onEdit(appointment)}
                        className={cn(
                          'flex w-full items-center px-4 py-2 text-sm',
                          active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </button>
                    )}
                  </Menu.Item>
                )}
                
                {showWhatsApp && appointment.customer.phone && onWhatsApp && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onWhatsApp(appointment.customer.phone!, appointment)}
                        className={cn(
                          'flex w-full items-center px-4 py-2 text-sm',
                          active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        WhatsApp
                      </button>
                    )}
                  </Menu.Item>
                )}
                
                {onDelete && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-600 my-1" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onDelete(appointment.id)}
                          className={cn(
                            'flex w-full items-center px-4 py-2 text-sm text-red-600',
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          )}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Eliminar
                        </button>
                      )}
                    </Menu.Item>
                  </>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-white",
            `bg-${getAppointmentStatusColor(appointment.status)}-500`
          )}
        >
          {getAppointmentStatusLabel(appointment.status)}
        </Badge>
        
        <div className="text-xs text-gray-500">
          {format(appointment.dateTime, 'HH:mm')} - {appointment.duration}min
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex gap-2">
        {nextStatuses.slice(0, 2).map((status) => {
          const actionConfig = getActionButton(status);
          if (!actionConfig) return null;
          
          const Icon = actionConfig.icon;
          return (
            <Button
              key={status}
              size={size}
              onClick={() => handleAction(actionConfig.action)}
              disabled={loading !== null}
              className={cn(actionConfig.className, "flex-1")}
            >
              {loading === actionConfig.action ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Icon className="h-4 w-4 mr-2" />
              )}
              {actionConfig.label}
            </Button>
          );
        })}
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-2">
        {showWhatsApp && appointment.customer.phone && onWhatsApp && (
          <Button
            variant="outline"
            size={size}
            onClick={() => onWhatsApp(appointment.customer.phone!, appointment)}
            className="flex-1"
          >
            <Phone className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        )}
        
        {canEdit && onEdit && (
          <Button
            variant="outline"
            size={size}
            onClick={() => onEdit(appointment)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        
        {canCancel && (
          <Button
            variant="outline"
            size={size}
            onClick={() => handleAction('cancel')}
            disabled={loading !== null}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {loading === 'cancel' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente específico para el botón de WhatsApp
export function WhatsAppButton({ 
  phone, 
  appointment, 
  size = 'default' 
}: { 
  phone: string; 
  appointment: AppointmentWithDetails; 
  size?: 'sm' | 'default';
}) {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola ${appointment.customer.name}, recordamos tu cita para ${appointment.pet.name} el ${format(appointment.dateTime, 'PPP', { locale: es })} a las ${format(appointment.dateTime, 'HH:mm')}. Motivo: ${appointment.reason}`
    );
    
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleWhatsApp}
      className="text-green-600 hover:text-green-700 hover:bg-green-50"
    >
      <Phone className="h-4 w-4 mr-2" />
      WhatsApp
    </Button>
  );
}

// Componente para mostrar el próximo estado posible
export function NextStatusIndicator({ currentStatus }: { currentStatus: string }) {
  const nextStatuses = getNextAppointmentStatus(currentStatus as 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_CLIENT' | 'CANCELLED_CLINIC' | 'NO_SHOW');
  
  if (nextStatuses.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        Estado final
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500">
      Siguiente: {getAppointmentStatusLabel(nextStatuses[0])}
    </div>
  );
}