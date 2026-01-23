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

/**
 * Formats a Date object as local time string for FullCalendar.
 * FullCalendar with timeZone='local' needs dates without Z indicator
 * to interpret them correctly in the local timezone.
 */
function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

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

export const useCalendar = (initialView: CalendarView = 'timeGridWeek', enabled: boolean = true): UseCalendarReturn => {
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
        // Adjust for Monday-based week (Spanish locale)
        // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
        // For Monday start: Sun becomes day 6, Mon becomes day 0
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(start.getDate() - adjustedDay);
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
    // Colors optimized for both light and dark mode with high contrast text
    const colors = {
      SCHEDULED: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' },
      CONFIRMED: { bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
      CHECKED_IN: { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
      IN_PROGRESS: { bg: '#f3e8ff', border: '#a855f7', text: '#581c87' },
      COMPLETED: { bg: '#ccfbf1', border: '#14b8a6', text: '#134e4a' },
      CANCELLED_CLIENT: { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
      CANCELLED_CLINIC: { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
      NO_SHOW: { bg: '#e5e7eb', border: '#6b7280', text: '#374151' },
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
      // Usar formato local sin Z para que FullCalendar interprete correctamente
      start: formatLocalDateTime(startTime),
      end: formatLocalDateTime(endTime),
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

      // Send dates as ISO (UTC) for the API query
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
        // Parse dates from JSON - new Date() correctly interprets UTC (with Z) and converts to local
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
    if (enabled) {
      fetchEvents();
    }
  }, [fetchEvents, currentDate, currentView, enabled]);

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