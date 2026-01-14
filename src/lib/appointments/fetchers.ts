/**
 * Shared fetcher functions for SWR
 *
 * These functions handle all API requests for appointments.
 * They include date transformation and error handling.
 */

import { AppointmentFormData, AppointmentStatus } from '@/lib/validations/appointments';

/**
 * Appointment with all related details
 * Matches the existing AppointmentWithDetails interface
 */
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
  location?: {
    id: string;
    name: string;
  };
}

/**
 * API response structure for appointments list
 */
interface AppointmentsApiResponse {
  data: Array<
    Omit<AppointmentWithDetails, 'dateTime' | 'createdAt' | 'updatedAt'> & {
      dateTime: string;
      createdAt: string;
      updatedAt: string;
    }
  >;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Query parameters for fetching appointments
 */
export interface AppointmentQuery {
  start_date?: string;
  end_date?: string;
  status?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch appointments from API
 * Transforms date strings to Date objects
 */
export async function fetchAppointments(
  query?: AppointmentQuery
): Promise<AppointmentWithDetails[]> {
  const queryParams = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `/api/appointments${queryParams.toString() ? `?${queryParams}` : ''}`;
  const response = await fetch(url);
  const result: AppointmentsApiResponse = await response.json();

  if (!response.ok) {
    throw new Error((result as { error?: string }).error || 'Error al cargar las citas');
  }

  // Transform date strings to Date objects
  return result.data.map(transformAppointmentDates);
}

/**
 * Fetch a single appointment by ID
 */
export async function fetchAppointmentById(
  id: string
): Promise<AppointmentWithDetails> {
  const response = await fetch(`/api/appointments/${id}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Error al cargar la cita');
  }

  return transformAppointmentDates(result.data);
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: AppointmentFormData
): Promise<AppointmentWithDetails> {
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

  return transformAppointmentDates(result.data);
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  id: string,
  data: Partial<AppointmentFormData>
): Promise<AppointmentWithDetails> {
  const updateData: Record<string, unknown> = { ...data };

  // Convert dateTime to ISO string if present
  if (data.dateTime) {
    updateData.dateTime = data.dateTime.toISOString();
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

  return transformAppointmentDates(result.data);
}

/**
 * Delete (cancel) an appointment
 */
export async function deleteAppointment(
  id: string
): Promise<AppointmentWithDetails> {
  const response = await fetch(`/api/appointments/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Error al cancelar la cita');
  }

  return transformAppointmentDates(result.data);
}

/**
 * Quick action to change appointment status
 */
export async function quickActionAppointment(
  id: string,
  action: string,
  notes?: string
): Promise<AppointmentWithDetails> {
  const statusMap: Record<string, AppointmentStatus> = {
    confirm: 'CONFIRMED',
    checkin: 'CHECKED_IN',
    start: 'IN_PROGRESS',
    complete: 'COMPLETED',
    cancel: 'CANCELLED_CLINIC',
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    throw new Error('Accion no valida');
  }

  return updateAppointment(id, { status: newStatus, notes });
}

/**
 * Transform date strings in API response to Date objects
 */
function transformAppointmentDates(
  appointment: Omit<AppointmentWithDetails, 'dateTime' | 'createdAt' | 'updatedAt'> & {
    dateTime: string;
    createdAt: string;
    updatedAt: string;
  }
): AppointmentWithDetails {
  return {
    ...appointment,
    dateTime: new Date(appointment.dateTime),
    createdAt: new Date(appointment.createdAt),
    updatedAt: new Date(appointment.updatedAt),
  };
}

/**
 * Check availability for a specific date
 */
export async function checkAvailability(
  date: string,
  duration: number = 30,
  staffId?: string,
  excludeAppointmentId?: string
) {
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

  return result.data;
}

/**
 * Check if a specific time slot is available
 */
export async function checkSpecificSlot(
  dateTime: string,
  duration: number = 30,
  staffId?: string,
  excludeAppointmentId?: string
) {
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
}
