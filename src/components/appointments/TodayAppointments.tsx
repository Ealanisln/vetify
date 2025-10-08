'use client';

import { useTodayAppointments, AppointmentWithDetails } from '../../hooks/useAppointments';
import { QuickActions } from './QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getAppointmentStatusLabel, getAppointmentStatusColor } from '../../lib/validations/appointments';
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="sm:text-lg">Citas de Hoy</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {currentTime}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
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
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              No hay citas programadas para hoy
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] lg:max-h-[500px] overflow-y-auto">
            {sortedAppointments.map((appointment) => {
              const timeStatus = getTimeStatus(appointment);
              const priority = getPriorityLevel(appointment.reason);
              
              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "p-3 sm:p-4 rounded-lg border transition-all duration-200",
                    timeStatus === 'current' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-md",
                    timeStatus === 'upcoming' && "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700",
                    timeStatus === 'past' && "bg-gray-25 dark:bg-gray-900 border-gray-100 dark:border-gray-700 opacity-75",
                    priority === 'emergency' && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20",
                    priority === 'high' && "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                  )}
                >
                  <div className="space-y-2 sm:space-y-3">
                    {/* Header with time and status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn(
                          "text-base sm:text-lg font-semibold",
                          timeStatus === 'current' && "text-blue-700",
                          timeStatus === 'past' && "text-gray-500"
                        )}>
                          {format(appointment.dateTime, 'HH:mm')}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-white text-xs",
                              `bg-${getAppointmentStatusColor(appointment.status)}-500`
                            )}
                          >
                            {getAppointmentStatusLabel(appointment.status)}
                          </Badge>
                          
                          {priority === 'emergency' && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              🚨 URGENTE
                            </Badge>
                          )}
                          
                          {priority === 'high' && (
                            <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                              ⚠️ ALTA
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {appointment.duration}min
                      </div>
                    </div>
                    
                    {/* Appointment details */}
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                        {appointment.customer.name} - {appointment.pet.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {appointment.reason}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>🐾 {appointment.pet.species} {appointment.pet.breed && `- ${appointment.pet.breed}`}</span>
                        {appointment.customer.phone && (
                          <span>📱 {appointment.customer.phone}</span>
                        )}
                        {appointment.staff && (
                          <span className="text-blue-600 dark:text-blue-400">👨‍⚕️ {appointment.staff.name}</span>
                        )}
                      </div>
                      {appointment.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700/50 p-2 rounded mt-2">
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
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 sm:flex sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between sm:block">
                <span className="sm:block">Total:</span>
                <span className="font-medium ml-2 sm:ml-0">{sortedAppointments.length}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="sm:block">Confirmadas:</span>
                <span className="font-medium text-green-600 ml-2 sm:ml-0">
                  {sortedAppointments.filter(a => a.status === 'CONFIRMED').length}
                </span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="sm:block">Pendientes:</span>
                <span className="font-medium text-yellow-600 ml-2 sm:ml-0">
                  {sortedAppointments.filter(a => a.status === 'SCHEDULED').length}
                </span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="sm:block">Completadas:</span>
                <span className="font-medium text-blue-600 ml-2 sm:ml-0">
                  {sortedAppointments.filter(a => a.status === 'COMPLETED').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}