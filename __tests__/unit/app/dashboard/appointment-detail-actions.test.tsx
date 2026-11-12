/**
 * Appointment detail page actions.
 *
 * The page always showed "Editar" and "Eliminar", even for completed or
 * cancelled appointments, and its toast said "eliminada" although the API only
 * cancels. Actions must match the appointment's status.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockRefresh = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));

const mockDeleteAppointment = jest.fn();
const mockQuickAction = jest.fn();
jest.mock('@/hooks/useAppointments', () => ({
  useAppointments: () => ({
    updateAppointment: jest.fn(),
    deleteAppointment: mockDeleteAppointment,
    quickAction: mockQuickAction,
  }),
}));

jest.mock('@/components/appointments/AppointmentForm', () => ({
  AppointmentForm: () => <div data-testid="appointment-form" />,
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import { toast } from 'sonner';
import AppointmentDetailClient from '@/app/dashboard/appointments/[id]/AppointmentDetailClient';
import type { AppointmentWithDetails } from '@/hooks/useAppointments';

function appointmentWith(status: AppointmentWithDetails['status']): AppointmentWithDetails {
  return {
    id: 'appt-12345678',
    dateTime: new Date('2099-01-15T15:00:00.000Z'),
    duration: 30,
    reason: 'Consulta general',
    status,
    createdAt: new Date('2099-01-01T00:00:00.000Z'),
    updatedAt: new Date('2099-01-01T00:00:00.000Z'),
    customer: { id: 'c1', name: 'Ana López' },
    pet: { id: 'p1', name: 'Firulais', species: 'dog' },
  };
}

function renderDetail(status: AppointmentWithDetails['status']) {
  return render(
    <AppointmentDetailClient appointment={appointmentWith(status)} customers={[]} pets={[]} staff={[]} />
  );
}

describe('AppointmentDetailClient actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('never offers "Eliminar": the API only cancels', () => {
    renderDetail('SCHEDULED');

    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('offers edit and cancel for a scheduled appointment', () => {
    renderDetail('SCHEDULED');

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /cancelar cita/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /confirmar cita/i })).toBeInTheDocument();
  });

  it.each(['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'] as const)(
    'offers no edit, cancel or status actions for a %s appointment',
    (status) => {
      renderDetail(status);

      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancelar cita/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Acciones Rápidas')).not.toBeInTheDocument();
    }
  );

  it('lets an in-progress appointment be completed or cancelled but not edited', () => {
    renderDetail('IN_PROGRESS');

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /marcar como completada/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar cita/i })).toBeInTheDocument();
  });

  it('lets a checked-in appointment start the consultation', () => {
    renderDetail('CHECKED_IN');

    expect(screen.getByRole('button', { name: /iniciar consulta/i })).toBeInTheDocument();
  });

  it('confirms and reports a cancellation, not a deletion', async () => {
    const user = userEvent.setup();
    mockDeleteAppointment.mockResolvedValue(undefined);
    renderDetail('CONFIRMED');

    await user.click(screen.getByRole('button', { name: /cancelar cita/i }));
    expect(screen.queryByText(/eliminar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no se puede deshacer/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sí, cancelar cita/i }));

    await waitFor(() => expect(mockDeleteAppointment).toHaveBeenCalledWith('appt-12345678'));
    expect(toast.success).toHaveBeenCalledWith('Cita cancelada');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows the server message when the cancellation fails', async () => {
    const user = userEvent.setup();
    mockDeleteAppointment.mockRejectedValue(new Error('No tienes permiso para cancelar citas'));
    renderDetail('SCHEDULED');

    await user.click(screen.getByRole('button', { name: /cancelar cita/i }));
    await user.click(screen.getByRole('button', { name: /sí, cancelar cita/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No tienes permiso para cancelar citas'));
  });
});
