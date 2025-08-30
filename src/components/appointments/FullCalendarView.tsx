'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { DateSelectArg, EventClickArg, EventDropArg, EventContentArg, EventApi } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { useCalendar, useCalendarConfig, CalendarView } from '../../hooks/useCalendar';
import { useAppointments } from '../../hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Calendar, Clock, User, Phone, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAppointmentStatusLabel, getAppointmentStatusColor } from '../../lib/validations/appointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface FullCalendarViewProps {
  onEventClick?: (appointmentId: string) => void;
  onDateSelect?: (selectInfo: DateSelectArg) => void;
  onEventDrop?: (dropInfo: EventDropArg) => void;
  onEventResize?: (dropInfo: EventDropArg) => void;
  className?: string;
  defaultView?: CalendarView;
  showToolbar?: boolean;
  editable?: boolean;
  selectable?: boolean;
}

export function FullCalendarView({
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  className,
  defaultView = 'timeGridWeek',
  showToolbar = true,
  editable = true,
  selectable = true,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { 
    events, 
    loading, 
    error, 
    currentDate, 
    currentView, 
    setCurrentDate, 
    setCurrentView,
    refresh 
  } = useCalendar(defaultView);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const { updateAppointment } = useAppointments();
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
    } catch (error) {
      dropInfo.revert();
      toast.error('Error al reprogramar la cita');
      console.error('Error updating appointment:', error);
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
    } catch (error) {
      resizeInfo.revert();
      toast.error('Error al actualizar la duración');
      console.error('Error updating appointment duration:', error);
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
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar el calendario</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
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
              const appointment = info.event.extendedProps.appointment;
              const priority = info.event.extendedProps.priority;
              
              return [
                'cursor-pointer',
                'transition-all',
                'hover:opacity-80',
                'rounded-md',
                'border-l-4',
                priority === 'emergency' && 'animate-pulse',
                !appointment.canEdit && 'opacity-60',
              ].filter(Boolean);
            }}
            eventDidMount={(info) => {
              const appointment = info.event.extendedProps.appointment;
              info.el.setAttribute('title', 
                `${appointment.pet.name} (${appointment.customer.name})\n` +
                `${appointment.reason}\n` +
                `Estado: ${getAppointmentStatusLabel(appointment.status)}`
              );
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
        />
      )}
    </Card>
  );
}

// Componente para renderizar el contenido de cada evento
function EventContent({ event }: { event: EventContentArg }) {
  const appointment = event.event.extendedProps.appointment;
  const priority = event.event.extendedProps.priority;
  
  return (
    <div className="p-1 h-full flex flex-col justify-center">
      <div className="flex items-center gap-1 mb-1">
        {priority === 'emergency' && (
          <AlertCircle className="h-3 w-3 text-red-200" />
        )}
        <span className="text-xs font-medium truncate">
          {event.event.start ? format(new Date(event.event.start), 'HH:mm') : ''}
        </span>
      </div>
      
      <div className="text-xs truncate font-medium">
        {appointment.pet.name}
      </div>
      
      <div className="text-xs truncate opacity-90">
        {appointment.customer.name}
      </div>
      
      <div className="text-xs truncate opacity-75">
        {appointment.reason}
      </div>
    </div>
  );
}

// Modal de detalles del evento
function EventDetailsModal({ 
  event, 
  onClose, 
  onUpdate 
}: { 
  event: EventApi; 
  onClose: () => void; 
  onUpdate: () => void; 
}) {
  const appointment = event.extendedProps.appointment;
  const { quickAction } = useAppointments();
  const [loading, setLoading] = useState(false);

  const handleQuickAction = async (action: string) => {
    setLoading(true);
    try {
      await quickAction(appointment.id, action);
      toast.success('Estado actualizado exitosamente');
      onUpdate();
      onClose();
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detalles de la Cita</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <p className="font-medium">{appointment.customer.name}</p>
              <p className="text-sm text-gray-600">{appointment.pet.name} ({appointment.pet.species})</p>
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
          
          {appointment.canEdit && (
            <div className="flex gap-2 pt-4">
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
              
              {appointment.canCancel && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}