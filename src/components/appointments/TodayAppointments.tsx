'use client';

import { useTodayAppointments, AppointmentWithDetails } from '../../hooks/useAppointments';
import { QuickActions } from './QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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

  const currentTime = new Date().toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const sortedAppointments = appointments.sort((a, b) => 
    a.dateTime.getTime() - b.dateTime.getTime()
  );

  const getTimeStatus = (appointment: AppointmentWithDetails) => {
    const now = new Date();
    const appointmentTime = appointment.dateTime;
    const appointmentEnd = new Date(appointmentTime.getTime() + appointment.duration * 60000);
    
    if (now < appointmentTime) {
      return 'upcoming';
    } else if (now >= appointmentTime && now <= appointmentEnd) {
      return 'current';
    } else {
      return 'past';
    }
  };

  const getPriorityLevel = (reason: string) => {
    const emergencyKeywords = ['emergencia', 'urgente', 'accidente', 'grave'];
    const highKeywords = ['cirugía', 'operación'];
    
    const lowerReason = reason.toLowerCase();
    
    if (emergencyKeywords.some(keyword => lowerReason.includes(keyword))) {
      return 'emergency';
    }
    if (highKeywords.some(keyword => lowerReason.includes(keyword))) {
      return 'high';
    }
    return 'normal';
  };

  if (error) {
    return (
      <Card className="h-fit">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error</h3>
            <p className="text-sm text-gray-600 dark:text-white/80 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-white/70" />
              <span>Citas de Hoy</span>
            </CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <div className="text-sm text-gray-600 dark:text-white/75 font-medium tabular-nums">
            {currentTime}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading && appointments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-3xl sm:text-4xl mb-3">📅</div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Sin citas programadas
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-white/70">
              No hay citas programadas para hoy
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] sm:max-h-[600px] lg:max-h-[500px] overflow-y-auto pr-1">
            {sortedAppointments.map((appointment) => {
              const timeStatus = getTimeStatus(appointment);
              const priority = getPriorityLevel(appointment.reason);

              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200 hover:shadow-md flex flex-col",
                    timeStatus === 'current' && "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-sm ring-1 ring-blue-200 dark:ring-blue-900",
                    timeStatus === 'upcoming' && "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
                    timeStatus === 'past' && "bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-60",
                    priority === 'emergency' && "border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-900",
                    priority === 'high' && "border-orange-300 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20"
                  )}
                >
                  <div className="space-y-2">
                    {/* Header with time and status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={cn(
                          "text-base font-bold tabular-nums shrink-0",
                          timeStatus === 'current' && "text-blue-700 dark:text-blue-400",
                          timeStatus === 'upcoming' && "text-gray-900 dark:text-white",
                          timeStatus === 'past' && "text-gray-500 dark:text-white/50"
                        )}>
                          {format(appointment.dateTime, 'HH:mm')}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-medium px-2 py-0.5",
                              appointment.status === 'CONFIRMED' && "bg-green-600 dark:bg-green-700 text-white border-green-700 dark:border-green-600",
                              appointment.status === 'SCHEDULED' && "bg-yellow-600 dark:bg-yellow-700 text-white border-yellow-700 dark:border-yellow-600",
                              appointment.status === 'COMPLETED' && "bg-blue-600 dark:bg-blue-700 text-white border-blue-700 dark:border-blue-600",
                              appointment.status === 'IN_PROGRESS' && "bg-purple-600 dark:bg-purple-700 text-white border-purple-700 dark:border-purple-600",
                              appointment.status === 'CANCELLED_CLIENT' && "bg-red-600 dark:bg-red-700 text-white border-red-700 dark:border-red-600",
                              appointment.status === 'CANCELLED_CLINIC' && "bg-red-600 dark:bg-red-700 text-white border-red-700 dark:border-red-600",
                              appointment.status === 'NO_SHOW' && "bg-gray-600 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600"
                            )}
                          >
                            {getAppointmentStatusLabel(appointment.status)}
                          </Badge>

                          {priority === 'emergency' && (
                            <Badge variant="destructive" className="text-xs font-medium px-2 py-0.5 animate-pulse bg-red-600 dark:bg-red-700 border-red-700 dark:border-red-600">
                              🚨 URGENTE
                            </Badge>
                          )}

                          {priority === 'high' && (
                            <Badge className="text-xs font-medium px-2 py-0.5 bg-orange-600 dark:bg-orange-700 text-white border-orange-700 dark:border-orange-600">
                              ⚠️ ALTA
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-white/75 font-medium shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{appointment.duration}min</span>
                      </div>
                    </div>

                    {/* Appointment details */}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {appointment.customer.name} - {appointment.pet.name}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-white/90 leading-snug">
                        {appointment.reason}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-white/80">
                        <span className="inline-flex items-center gap-1">
                          🐾 {appointment.pet.species}{appointment.pet.breed && ` - ${appointment.pet.breed}`}
                        </span>
                        {appointment.customer.phone && (
                          <span className="inline-flex items-center gap-1">📱 {appointment.customer.phone}</span>
                        )}
                        {appointment.staff && (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            👨‍⚕️ {appointment.staff.name}
                          </span>
                        )}
                      </div>
                      {appointment.notes && (
                        <p className="text-xs text-gray-700 dark:text-white/85 italic bg-gray-100/80 dark:bg-gray-800/80 px-2 py-1 rounded-md leading-snug border border-gray-200 dark:border-gray-700">
                          &ldquo;{appointment.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Quick actions */}
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
              );
            })}
          </div>
        )}
        
        {/* Summary */}
        {sortedAppointments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-gray-500 dark:text-white/70 font-medium">Total</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{sortedAppointments.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 dark:text-white/70 font-medium">Confirmadas</p>
                <p className="text-base font-semibold text-green-600 dark:text-green-400">
                  {sortedAppointments.filter(a => a.status === 'CONFIRMED').length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 dark:text-white/70 font-medium">Pendientes</p>
                <p className="text-base font-semibold text-yellow-600 dark:text-yellow-400">
                  {sortedAppointments.filter(a => a.status === 'SCHEDULED').length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 dark:text-white/70 font-medium">Completadas</p>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                  {sortedAppointments.filter(a => a.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}