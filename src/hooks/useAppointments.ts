import { useState, useEffect, useCallback, useRef } from 'react';
import { AppointmentFormData, AppointmentQuery, AppointmentStatus } from '../lib/validations/appointments';

export interface AppointmentWithDetails {
  id: string;
  dateTime: Date;
  duration: number;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
  };
  staff?: {
    id: string;
    name: string;
    position: string;
  };
}

interface UseAppointmentsReturn {
  appointments: AppointmentWithDetails[];
  loading: boolean;
  error: string | null;
  fetchAppointments: (query?: Partial<AppointmentQuery>) => Promise<void>;
  createAppointment: (data: AppointmentFormData) => Promise<AppointmentWithDetails>;
  updateAppointment: (id: string, data: Partial<AppointmentFormData>) => Promise<AppointmentWithDetails>;
  deleteAppointment: (id: string) => Promise<void>;
  quickAction: (id: string, action: string, notes?: string) => Promise<AppointmentWithDetails>;
  refresh: () => Promise<void>;
}

export const useAppointments = (initialQuery?: Partial<AppointmentQuery>): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentQueryRef = useRef<Partial<AppointmentQuery>>(initialQuery || {});

  const fetchAppointments = useCallback(async (query?: Partial<AppointmentQuery>) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      const finalQuery = { ...currentQueryRef.current, ...query };

      Object.entries(finalQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/appointments?${queryParams}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar las citas');
      }

      // Convertir fechas de string a Date
      const appointmentsWithDates = result.data.map((appointment: AppointmentWithDetails & { dateTime: string; createdAt: string; updatedAt: string }) => ({
        ...appointment,
        dateTime: new Date(appointment.dateTime),
        createdAt: new Date(appointment.createdAt),
        updatedAt: new Date(appointment.updatedAt),
      }));

      setAppointments(appointmentsWithDates);
      currentQueryRef.current = finalQuery;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (data: AppointmentFormData): Promise<AppointmentWithDetails> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          dateTime: data.dateTime.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la cita');
      }

      const newAppointment = {
        ...result.data,
        dateTime: new Date(result.data.dateTime),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };

      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<AppointmentFormData>): Promise<AppointmentWithDetails> => {
    setLoading(true);
    setError(null);

    try {
      const updateData = { ...data };
      if (updateData.dateTime) {
        updateData.dateTime = updateData.dateTime.toISOString() as unknown as Date;
      }

      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar la cita');
      }

      const updatedAppointment = {
        ...result.data,
        dateTime: new Date(result.data.dateTime),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };

      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === id ? updatedAppointment : appointment
        )
      );

      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cancelar la cita');
      }

      // Actualizar el estado de la cita en lugar de eliminarla
      const cancelledAppointment = {
        ...result.data,
        dateTime: new Date(result.data.dateTime),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };

      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === id ? cancelledAppointment : appointment
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const quickAction = useCallback(async (id: string, action: string, notes?: string): Promise<AppointmentWithDetails> => {
    const statusMap: Record<string, AppointmentStatus> = {
      confirm: 'CONFIRMED',
      checkin: 'CHECKED_IN',
      start: 'IN_PROGRESS',
      complete: 'COMPLETED',
      cancel: 'CANCELLED_CLINIC',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      throw new Error('Acción no válida');
    }

    return updateAppointment(id, { status: newStatus, notes });
  }, [updateAppointment]);

  const refresh = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  // Cargar citas inicialmente - only once on mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]); // Empty dependency array to run only once

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    quickAction,
    refresh,
  };
};

// Hook específico para citas del día
export const useTodayAppointments = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return useAppointments({
    start_date: startOfDay.toISOString(),
    end_date: endOfDay.toISOString(),
  });
};

// Hook para estadísticas de citas
export const useAppointmentStats = () => {
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    completionRate: 0,
    loading: true,
    error: null as string | null,
  });

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Obtener citas de diferentes períodos
      const [todayResult, weekResult, monthResult] = await Promise.all([
        fetch(`/api/appointments?start_date=${today.toISOString()}&end_date=${today.toISOString()}`),
        fetch(`/api/appointments?start_date=${startOfWeek.toISOString()}`),
        fetch(`/api/appointments?start_date=${startOfMonth.toISOString()}`),
      ]);

      const [todayData, weekData, monthData] = await Promise.all([
        todayResult.json(),
        weekResult.json(),
        monthResult.json(),
      ]);

      const todayAppointments = todayData.data || [];
      const weekAppointments = weekData.data || [];
      const monthAppointments = monthData.data || [];

      const completedThisMonth = monthAppointments.filter((apt: { status: string }) => apt.status === 'COMPLETED').length;
      const totalThisMonth = monthAppointments.length;
      const completionRate = totalThisMonth > 0 ? (completedThisMonth / totalThisMonth) * 100 : 0;

      setStats({
        today: todayAppointments.length,
        thisWeek: weekAppointments.length,
        thisMonth: monthAppointments.length,
        completionRate: Math.round(completionRate),
        loading: false,
        error: null,
      });
    } catch (error) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar estadísticas',
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refresh: fetchStats };
};