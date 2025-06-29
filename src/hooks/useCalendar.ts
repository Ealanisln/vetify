import { useState, useEffect, useCallback } from 'react';
import { AppointmentWithDetails } from './useAppointments';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    appointment: AppointmentWithDetails;
    customerPhone?: string;
    priority: 'low' | 'medium' | 'high' | 'emergency';
    canEdit: boolean;
    canCancel: boolean;
  };
}

export interface AvailableSlot {
  dateTime: string;
  time: string;
  displayTime: string;
  period: 'morning' | 'afternoon';
}

export interface AvailabilityData {
  date: string;
  duration: number;
  availableSlots: AvailableSlot[];
  totalSlots: number;
  availableCount: number;
  occupiedCount: number;
  businessHours: {
    start: number;
    end: number;
    lunchStart: number;
    lunchEnd: number;
    slotDuration: number;
    workingDays: number[];
  };
  staffStats?: {
    totalAppointments: number;
    busyMinutes: number;
    availableSlots: number;
  };
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentDate: Date;
  currentView: CalendarView;
  setCurrentDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  fetchEvents: (start?: Date, end?: Date) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCalendar = (initialView: CalendarView = 'timeGridWeek'): UseCalendarReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);

  const getViewDateRange = useCallback((date: Date, view: CalendarView) => {
    const start = new Date(date);
    const end = new Date(date);

    switch (view) {
      case 'dayGridMonth':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'timeGridWeek':
      case 'listWeek':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        break;
      case 'timeGridDay':
        end.setDate(start.getDate());
        break;
      default:
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      SCHEDULED: { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },
      CONFIRMED: { bg: '#e8f5e8', border: '#4caf50', text: '#388e3c' },
      CHECKED_IN: { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' },
      IN_PROGRESS: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
      COMPLETED: { bg: '#e0f2f1', border: '#009688', text: '#00695c' },
      CANCELLED_CLIENT: { bg: '#ffebee', border: '#f44336', text: '#d32f2f' },
      CANCELLED_CLINIC: { bg: '#ffebee', border: '#f44336', text: '#d32f2f' },
      NO_SHOW: { bg: '#fafafa', border: '#9e9e9e', text: '#616161' },
    };

    return colors[status as keyof typeof colors] || colors.SCHEDULED;
  }, []);

  const convertAppointmentToEvent = useCallback((appointment: AppointmentWithDetails): CalendarEvent => {
    const startTime = new Date(appointment.dateTime);
    const endTime = new Date(startTime.getTime() + appointment.duration * 60000);
    const colors = getStatusColor(appointment.status);

    const priority = getPriority(appointment.reason);
    const canEdit = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
    const canCancel = !['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'].includes(appointment.status);

    return {
      id: appointment.id,
      title: `${appointment.pet.name} - ${appointment.customer.name}`,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        appointment,
        customerPhone: appointment.customer.phone,
        priority,
        canEdit,
        canCancel,
      },
    };
  }, [getStatusColor]);

  const fetchEvents = useCallback(async (start?: Date, end?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const { start: startDate, end: endDate } = start && end 
        ? { start, end }
        : getViewDateRange(currentDate, currentView);

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      const response = await fetch(`/api/appointments?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar las citas');
      }

      const appointments: AppointmentWithDetails[] = result.data.map((appointment: AppointmentWithDetails & { dateTime: string; createdAt: string; updatedAt: string }) => ({
        ...appointment,
        dateTime: new Date(appointment.dateTime),
        createdAt: new Date(appointment.createdAt),
        updatedAt: new Date(appointment.updatedAt),
      }));

      const calendarEvents = appointments.map(convertAppointmentToEvent);
      setEvents(calendarEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, currentView, getViewDateRange, convertAppointmentToEvent]);

  const refresh = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, currentDate, currentView]);

  return {
    events,
    loading,
    error,
    currentDate,
    currentView,
    setCurrentDate,
    setCurrentView,
    fetchEvents,
    refresh,
  };
};

export const useAvailability = () => {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (
    date: string,
    duration: number = 30,
    staffId?: string,
    excludeAppointmentId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        date,
        duration: duration.toString(),
      });

      if (staffId) params.append('staffId', staffId);
      if (excludeAppointmentId) params.append('excludeAppointmentId', excludeAppointmentId);

      const response = await fetch(`/api/appointments/availability?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al verificar disponibilidad');
      }

      setAvailability(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSpecificSlot = useCallback(async (
    dateTime: string,
    duration: number = 30,
    staffId?: string,
    excludeAppointmentId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateTime,
          duration,
          staffId,
          excludeAppointmentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al verificar disponibilidad');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    availability,
    loading,
    error,
    checkAvailability,
    checkSpecificSlot,
  };
};

function getPriority(reason: string): 'low' | 'medium' | 'high' | 'emergency' {
  const emergencyKeywords = ['emergencia', 'urgente', 'accidente', 'grave'];
  const highKeywords = ['cirugía', 'operación', 'consulta especial'];
  const lowKeywords = ['vacuna', 'revisión', 'control', 'baño'];

  const lowerReason = reason.toLowerCase();

  if (emergencyKeywords.some(keyword => lowerReason.includes(keyword))) {
    return 'emergency';
  }
  if (highKeywords.some(keyword => lowerReason.includes(keyword))) {
    return 'high';
  }
  if (lowKeywords.some(keyword => lowerReason.includes(keyword))) {
    return 'low';
  }

  return 'medium';
}

export const useCalendarConfig = () => {
  return {
    locale: 'es',
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '08:00',
      endTime: '18:00'
    },
    slotDuration: '00:15:00',
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    expandRows: true,
    eventDisplay: 'block',
    dayMaxEvents: true,
    moreLinkClick: 'popover',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
  };
};