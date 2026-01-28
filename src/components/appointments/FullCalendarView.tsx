'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { DateSelectArg, EventClickArg, EventDropArg, EventContentArg, EventApi } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { useCalendar, useCalendarConfig, CalendarView } from '../../hooks/useCalendar';
import { useAppointments, AppointmentWithDetails } from '../../hooks/useAppointments';
import { useSafeAppointmentsContext } from '../providers/AppointmentsProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Calendar, Clock, User, Phone, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAppointmentStatusLabel, getAppointmentStatusColor } from '../../lib/validations/appointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { mapSpeciesToSpanish } from '@/lib/utils/pet-enum-mapping';

interface FullCalendarViewProps {
  onEventClick?: (appointmentId: string) => void;
  onEventEdit?: (appointment: AppointmentWithDetails) => void;
  onDateSelect?: (selectInfo: DateSelectArg) => void;
  onEventDrop?: (dropInfo: EventDropArg) => void;
  onEventResize?: (dropInfo: EventDropArg) => void;
  className?: string;
  defaultView?: CalendarView;
  showToolbar?: boolean;
  editable?: boolean;
  selectable?: boolean;
  refreshTrigger?: number; // Increment to trigger a refresh from parent
}

export function FullCalendarView({
  onEventClick,
  onEventEdit,
  onDateSelect,
  onEventDrop,
  onEventResize,
  className,
  defaultView = 'timeGridWeek',
  showToolbar = true,
  editable = true,
  selectable = true,
  refreshTrigger,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Always call all hooks unconditionally (React rules of hooks)
  // Context-based data (no API calls - uses shared data)
  const contextData = useSafeAppointmentsContext();

  // Prefer context data when in provider, fallback to legacy otherwise
  const isInProvider = contextData !== null;

  // Legacy hooks - ALWAYS disabled since this component is only used inside AppointmentsProvider
  // This prevents duplicate API calls and infinite re-render loops
  const legacyCalendarData = useCalendar(defaultView, false);
  const legacyAppointmentData = useAppointments(undefined, false);

  // IMPORTANT: Create stable fallback functions to prevent infinite re-render loops
  // Without these, inline arrow functions create new references on every render,
  // which triggers useEffect dependencies and causes "Maximum update depth exceeded"
  const noopPromise = useCallback(() => Promise.resolve(), []);
  const noopVoid = useCallback(() => {}, []);
  const noopThrowAsync = useCallback(async (): Promise<AppointmentWithDetails> => {
    throw new Error('Not available');
  }, []);

  // Unified data access - context takes priority
  const events = isInProvider ? (contextData?.calendarEvents ?? []) : (legacyCalendarData?.events ?? []);
  const loading = isInProvider ? (contextData?.isLoading ?? false) : (legacyCalendarData?.loading ?? false);
  const error = isInProvider ? contextData?.error : (legacyCalendarData?.error ? new Error(legacyCalendarData.error) : null);
  const currentDate = isInProvider ? (contextData?.currentDate ?? new Date()) : (legacyCalendarData?.currentDate ?? new Date());
  const currentView = isInProvider ? (contextData?.currentView ?? defaultView) : (legacyCalendarData?.currentView ?? defaultView);
  const setCurrentDate = isInProvider ? (contextData?.setCurrentDate ?? noopVoid) : (legacyCalendarData?.setCurrentDate ?? noopVoid);
  const setCurrentView = isInProvider ? (contextData?.setCurrentView ?? noopVoid) : (legacyCalendarData?.setCurrentView ?? noopVoid);
  const refresh = isInProvider ? (contextData?.refresh ?? noopPromise) : (legacyCalendarData?.refresh ?? noopPromise);
  const updateAppointment = isInProvider ? (contextData?.updateAppointment ?? noopThrowAsync) : (legacyAppointmentData?.updateAppointment ?? noopThrowAsync);

  // Refresh calendar when refreshTrigger changes (controlled by parent)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Switch to day view on mobile for better readability
  // Week view shows all 7 days compressed, making content unreadable on small screens
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      const targetView = isMobile ? 'timeGridDay' : defaultView;
      // Only change if on mobile and not already in day view
      if (isMobile && api.view.type !== 'timeGridDay') {
        api.changeView('timeGridDay');
        setCurrentView('timeGridDay');
      }
    }
  }, [isMobile, defaultView, setCurrentView]);

  const calendarConfig = useCalendarConfig();

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const appointment = clickInfo.event.extendedProps.appointment;
    setSelectedEvent(clickInfo.event);
    setIsEventModalOpen(true);
    
    if (onEventClick) {
      onEventClick(appointment.id);
    }
  }, [onEventClick]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    }
  }, [onDateSelect]);

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const appointment = dropInfo.event.extendedProps.appointment;
    const newDateTime = dropInfo.event.start;
    
    if (!newDateTime || !appointment.canEdit) {
      dropInfo.revert();
      toast.error('No se puede mover esta cita');
      return;
    }

    try {
      await updateAppointment(appointment.id, {
        dateTime: newDateTime,
      });
      
      toast.success('Cita reprogramada exitosamente');
      refresh();
      
      if (onEventDrop) {
        onEventDrop(dropInfo);
      }
    } catch {
      dropInfo.revert();
      toast.error('Error al reprogramar la cita');
      // Error is already shown to user via toast
    }
  }, [updateAppointment, refresh, onEventDrop]);

  const handleEventResize = useCallback(async (resizeInfo: EventDropArg) => {
    const appointment = resizeInfo.event.extendedProps.appointment;
    const newEnd = resizeInfo.event.end;
    const start = resizeInfo.event.start;
    
    if (!newEnd || !start || !appointment.canEdit) {
      resizeInfo.revert();
      toast.error('No se puede cambiar la duración de esta cita');
      return;
    }

    const newDuration = Math.round((newEnd.getTime() - start.getTime()) / 60000);
    
    if (newDuration < 15 || newDuration > 300) {
      resizeInfo.revert();
      toast.error('La duración debe estar entre 15 minutos y 5 horas');
      return;
    }

    try {
      await updateAppointment(appointment.id, {
        duration: newDuration,
      });
      
      toast.success('Duración actualizada exitosamente');
      refresh();
      
      if (onEventResize) {
        onEventResize(resizeInfo);
      }
    } catch {
      resizeInfo.revert();
      toast.error('Error al actualizar la duración');
      // Error is already shown to user via toast
    }
  }, [updateAppointment, refresh, onEventResize]);

  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  }, [setCurrentView]);

  const handleNavigation = useCallback((direction: 'prev' | 'next' | 'today') => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    switch (direction) {
      case 'prev':
        calendarApi.prev();
        break;
      case 'next':
        calendarApi.next();
        break;
      case 'today':
        calendarApi.today();
        break;
    }
    
    setCurrentDate(calendarApi.getDate());
  }, [setCurrentDate]);

  if (error) {
    return (
      <Card className={cn("w-full border-gray-200 dark:border-gray-800", className)}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar el calendario</h3>
            <p className="text-sm text-gray-600 mb-4">{error?.message}</p>
            <Button onClick={refresh} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full border-gray-200 dark:border-gray-800", className)}>
      {showToolbar && (
        <CardHeader className="pb-2">
          {/* Mobile header - Stack vertically */}
          <div className="block sm:hidden">
            <CardTitle className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5" />
              Calendario de Citas
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
            
            {/* Mobile navigation */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('prev')}
                  className="px-2"
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('today')}
                  className="px-3 text-xs"
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('next')}
                  className="px-2"
                >
                  ›
                </Button>
              </div>
            </div>
            
            {/* Mobile view selector */}
            <div className="flex items-center gap-1">
              <Button
                variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('dayGridMonth')}
                className="flex-1 text-xs"
              >
                Mes
              </Button>
              <Button
                variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('timeGridWeek')}
                className="flex-1 text-xs"
              >
                Semana
              </Button>
              <Button
                variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('timeGridDay')}
                className="flex-1 text-xs"
              >
                Día
              </Button>
            </div>
          </div>

          {/* Desktop header - Keep existing layout */}
          <div className="hidden sm:flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Citas
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('prev')}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('today')}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('next')}
                >
                  ›
                </Button>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('dayGridMonth')}
                >
                  Mes
                </Button>
                <Button
                  variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('timeGridWeek')}
                >
                  Semana
                </Button>
                <Button
                  variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('timeGridDay')}
                >
                  Día
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-1 sm:p-2">
        <div className="h-[500px] sm:h-[600px]">
          {/* @ts-expect-error - FullCalendar types are complex and this works fine */}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={currentView}
            initialDate={currentDate}
            locale={esLocale}
            events={events}
            editable={editable}
            selectable={selectable}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            headerToolbar={false} // Usamos nuestro toolbar personalizado
            height="100%"
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            businessHours={calendarConfig.businessHours}
            slotDuration={calendarConfig.slotDuration}
            slotMinTime={calendarConfig.slotMinTime}
            slotMaxTime={calendarConfig.slotMaxTime}
            eventTimeFormat={calendarConfig.eventTimeFormat}
            slotLabelFormat={calendarConfig.slotLabelFormat}
            timeZone="local"
            nowIndicator={true}
            scrollTime="08:00:00"
            slotLabelInterval="01:00:00"
            // Mobile optimizations
            dayMaxEventRows={isMobile ? 2 : 3}
            moreLinkClick="popover"
            handleWindowResize={true}
            aspectRatio={isMobile ? 0.75 : 1.35}
            contentHeight={isMobile ? 400 : 600}
            expandRows={true}
            // Touch optimizations
            longPressDelay={1000}
            eventLongPressDelay={1000}
            selectLongPressDelay={1000}
            eventContent={(eventInfo) => (
              <EventContent event={eventInfo} />
            )}
            moreLinkContent={(info) => (
              <span className="text-xs font-medium">
                +{info.num} más
              </span>
            )}
            dayHeaderContent={(info) => (
              <div className="text-sm font-medium">
                <div>{format(info.date, 'EEE', { locale: es })}</div>
                <div className="text-xs text-gray-500">
                  {format(info.date, 'd MMM', { locale: es })}
                </div>
              </div>
            )}
            eventClassNames={(info) => {
              const appointment = info.event.extendedProps?.appointment;
              const priority = info.event.extendedProps?.priority;

              return [
                'cursor-pointer',
                'transition-all',
                'hover:opacity-80',
                'rounded-md',
                'border-l-4',
                priority === 'emergency' && 'animate-pulse',
                appointment && !appointment.canEdit && 'opacity-60',
              ].filter(Boolean);
            }}
            eventDidMount={(info) => {
              const appointment = info.event.extendedProps?.appointment;
              if (appointment) {
                info.el.setAttribute('title',
                  `${appointment.pet.name} (${appointment.customer.name})\n` +
                  `${appointment.reason}\n` +
                  `Estado: ${getAppointmentStatusLabel(appointment.status)}`
                );
              }
            }}
          />
        </div>
      </CardContent>

      {/* Event Details Modal */}
      {isEventModalOpen && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setIsEventModalOpen(false)}
          onUpdate={refresh}
          onEdit={onEventEdit}
        />
      )}
    </Card>
  );
}

// Componente para renderizar el contenido de cada evento
function EventContent({ event }: { event: EventContentArg }) {
  const appointment = event.event.extendedProps?.appointment;
  const priority = event.event.extendedProps?.priority;
  // Use the text color from the event for consistent styling
  const textColor = event.event.textColor || '#1f2937';

  // If no appointment data, show basic event info
  if (!appointment) {
    return (
      <div className="px-1 py-0.5 h-full flex items-center">
        <span className="text-xs truncate" style={{ color: textColor }}>
          {event.event.title || 'Evento'}
        </span>
      </div>
    );
  }

  // Check if this is a short appointment (30 min or less)
  const duration = appointment.duration || 30;
  const isShort = duration <= 30;

  // For short appointments, show condensed single-line view
  if (isShort) {
    return (
      <div className="px-1 py-0.5 h-full flex items-center gap-1 overflow-hidden">
        {priority === 'emergency' && (
          <AlertCircle className="h-3 w-3 flex-shrink-0" style={{ color: textColor }} />
        )}
        <span
          className="text-[10px] font-bold flex-shrink-0"
          style={{ color: textColor }}
        >
          {event.event.start ? format(new Date(event.event.start), 'HH:mm') : ''}
        </span>
        <span
          className="text-[10px] font-semibold truncate"
          style={{ color: textColor }}
        >
          {appointment.pet.name}
        </span>
        <span
          className="text-[10px] truncate opacity-75 hidden sm:inline"
          style={{ color: textColor }}
        >
          - {appointment.customer.name?.split(' ')[0]}
        </span>
      </div>
    );
  }

  // Standard view for longer appointments
  return (
    <div className="p-1 h-full flex flex-col justify-center">
      <div className="flex items-center gap-1 mb-0.5">
        {priority === 'emergency' && (
          <AlertCircle className="h-3 w-3" style={{ color: textColor }} />
        )}
        <span
          className="text-xs font-bold truncate"
          style={{ color: textColor }}
        >
          {event.event.start ? format(new Date(event.event.start), 'HH:mm') : ''}
        </span>
      </div>

      <div
        className="text-xs truncate font-semibold"
        style={{ color: textColor }}
      >
        {appointment.pet.name}
      </div>

      <div
        className="text-xs truncate"
        style={{ color: textColor }}
      >
        {appointment.customer.name}
      </div>

      <div
        className="text-xs truncate opacity-90"
        style={{ color: textColor }}
      >
        {appointment.reason}
      </div>
    </div>
  );
}

// Modal de detalles del evento
function EventDetailsModal({
  event,
  onClose,
  onUpdate,
  onEdit
}: {
  event: EventApi;
  onClose: () => void;
  onUpdate: () => void;
  onEdit?: (appointment: AppointmentWithDetails) => void;
}) {
  const appointment = event.extendedProps.appointment;
  const canEdit = event.extendedProps.canEdit;
  const canCancel = event.extendedProps.canCancel;

  // Always call both hooks unconditionally (React rules of hooks)
  const contextData = useSafeAppointmentsContext();

  // Prefer context data when in provider
  const isInProvider = contextData !== null;

  // Legacy hook - ALWAYS disabled since this component is only used inside AppointmentsProvider
  // This prevents duplicate API calls and infinite re-render loops
  const legacyData = useAppointments(undefined, false);

  // IMPORTANT: Create stable fallback to prevent infinite re-render loops
  const noopThrowAsync = useCallback(async (): Promise<AppointmentWithDetails> => {
    throw new Error('Not available');
  }, []);
  const quickAction = isInProvider ? (contextData?.quickAction ?? noopThrowAsync) : (legacyData?.quickAction ?? noopThrowAsync);

  const [loading, setLoading] = useState(false);

  const handleQuickAction = async (action: string) => {
    setLoading(true);
    try {
      // Close modal first to prevent state conflicts during update
      onClose();
      await quickAction(appointment.id, action);
      toast.success('Estado actualizado exitosamente');
      // Refresh calendar after modal is closed and action is complete
      onUpdate();
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(appointment);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        // Close when clicking the backdrop (not the modal itself)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <span>Detalles de la Cita</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-lg"
              aria-label="Cerrar"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <p className="font-medium">{appointment.customer.name}</p>
              <p className="text-sm text-gray-600">{appointment.pet.name} ({mapSpeciesToSpanish(appointment.pet.species)})</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <div>
              <p className="font-medium">
                {format(new Date(appointment.dateTime), 'PPP', { locale: es })}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(appointment.dateTime), 'HH:mm')} - {appointment.duration} min
              </p>
            </div>
          </div>
          
          {appointment.customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <p className="text-sm">{appointment.customer.phone}</p>
            </div>
          )}
          
          <div>
            <p className="font-medium">Motivo:</p>
            <p className="text-sm text-gray-600">{appointment.reason}</p>
          </div>
          
          {appointment.notes && (
            <div>
              <p className="font-medium">Notas:</p>
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Estado:</span>
            <Badge variant="secondary" className={cn(
              "text-white",
              `bg-${getAppointmentStatusColor(appointment.status)}-500`
            )}>
              {getAppointmentStatusLabel(appointment.status)}
            </Badge>
          </div>

          {/* Edit Button - Show for editable appointments */}
          {canEdit && onEdit && (
            <div className="pt-4">
              <Button
                variant="default"
                className="w-full"
                onClick={handleEdit}
                disabled={loading}
              >
                Editar Cita
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            {appointment.status === 'SCHEDULED' && (
              <Button
                size="sm"
                onClick={() => handleQuickAction('confirm')}
                disabled={loading}
              >
                Confirmar
              </Button>
            )}

            {appointment.status === 'CONFIRMED' && (
              <Button
                size="sm"
                onClick={() => handleQuickAction('checkin')}
                disabled={loading}
              >
                Registrar
              </Button>
            )}

            {appointment.status === 'CHECKED_IN' && (
              <Button
                size="sm"
                onClick={() => handleQuickAction('start')}
                disabled={loading}
              >
                Iniciar
              </Button>
            )}

            {appointment.status === 'IN_PROGRESS' && (
              <Button
                size="sm"
                onClick={() => handleQuickAction('complete')}
                disabled={loading}
              >
                Completar
              </Button>
            )}

            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('cancel')}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}