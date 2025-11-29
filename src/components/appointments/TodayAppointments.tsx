'use client';

import { useTodayAppointments, AppointmentWithDetails } from '../../hooks/useAppointments';
import { QuickActions } from './QuickActions';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Clock, AlertCircle, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAppointmentStatusLabel } from '../../lib/validations/appointments';
import { cn } from '../../lib/utils';

interface TodayAppointmentsProps {
  onQuickAction: (appointmentId: string, action: string) => Promise<void>;
  onWhatsApp: (phone: string, appointment: AppointmentWithDetails) => void;
}

export function TodayAppointments({
  onQuickAction,
  onWhatsApp
}: TodayAppointmentsProps) {
  const {
    appointments,
    loading,
    error,
    refresh
  } = useTodayAppointments();

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const sortedAppointments = appointments.sort((a, b) =>
    a.dateTime.getTime() - b.dateTime.getTime()
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'SCHEDULED':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'COMPLETED':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700';
      case 'IN_PROGRESS':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700';
      case 'CANCELLED_CLIENT':
      case 'CANCELLED_CLINIC':
        return 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700';
      case 'NO_SHOW':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  if (error) {
    return (
      <Card className="h-fit">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Citas de Hoy
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {capitalizedDate}
              </p>
            </div>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>
      </CardHeader>

      <CardContent>
        {/* Content */}
        {loading && appointments.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <div className="text-4xl mb-4">📅</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Sin citas programadas
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              No hay citas programadas para hoy
            </p>
          </div>
        ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {sortedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-stone-50 dark:bg-gray-800/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg border border-stone-100 dark:border-gray-700"
            >
              {/* Top section: Time, Status, Duration, Vet */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Clock icon in circle */}
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      {/* Time */}
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                        {format(appointment.dateTime, 'HH:mm')}
                      </span>

                      {/* Status badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full border",
                          getStatusBadgeStyle(appointment.status)
                        )}
                      >
                        {getAppointmentStatusLabel(appointment.status)}
                      </Badge>
                    </div>

                    {/* Duration */}
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {appointment.duration} minutos
                    </p>
                  </div>
                </div>

                {/* Veterinarian */}
                {appointment.staff && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{appointment.staff.name}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-stone-200 dark:border-gray-600 my-4" />

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {/* Cliente */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Cliente
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {appointment.customer.name}
                  </p>
                </div>

                {/* Tipo de cita */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Tipo de Cita
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {appointment.reason}
                  </p>
                </div>

                {/* Mascota */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Mascota
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1.5">
                    <span>🐾</span>
                    {appointment.pet.name}
                    {appointment.pet.breed && (
                      <span className="text-gray-500 dark:text-gray-400">
                        - {appointment.pet.breed}
                      </span>
                    )}
                  </p>
                </div>

                {/* Contacto */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Contacto
                  </p>
                  {appointment.customer.phone ? (
                    <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1.5">
                      <span>📞</span>
                      {appointment.customer.phone}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      Sin teléfono
                    </p>
                  )}
                </div>
              </div>

              {/* Notes if any */}
              {appointment.notes && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-stone-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Notas
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Quick actions */}
              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-gray-600">
                <QuickActions
                  appointment={appointment}
                  onStatusChange={onQuickAction}
                  onWhatsApp={appointment.customer.phone ? onWhatsApp : undefined}
                  size="sm"
                  variant="compact"
                  showWhatsApp={!!appointment.customer.phone}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {sortedAppointments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {sortedAppointments.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {sortedAppointments.filter(a => a.status === 'CONFIRMED').length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Confirmadas
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {sortedAppointments.filter(a => a.status === 'SCHEDULED').length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Pendientes
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {sortedAppointments.filter(a => a.status === 'COMPLETED').length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Completadas
              </p>
            </div>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
