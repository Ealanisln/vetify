/**
 * Editing an appointment from the calendar modal.
 *
 * The modal used to render AppointmentForm without appointmentId, so the
 * appointment's own slot showed as taken and Save stayed disabled, and the
 * location selector replaced the stored location with the primary one.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCheckAvailability = jest.fn().mockResolvedValue({});

jest.mock('@/hooks/useCalendar', () => ({
  useAvailability: () => ({
    checkAvailability: mockCheckAvailability,
    availability: {
      timeZone: 'America/Mexico_City',
      availableSlots: [
        { dateTime: '2099-01-15T15:00:00.000Z', time: '09:00', period: 'morning' },
        { dateTime: '2099-01-15T15:30:00.000Z', time: '09:30', period: 'morning' },
      ],
      totalSlots: 2,
      availableCount: 2,
      occupiedCount: 0,
    },
    loading: false,
  }),
}));

// Behaves like the real selector: with defaultToPrimary and no value it picks
// the primary location.
jest.mock('@/components/locations/LocationSelector', () => {
  const { useEffect } = jest.requireActual('react');
  return function MockLocationSelector({
    value,
    onChange,
    defaultToPrimary = true,
  }: {
    value: string;
    onChange: (v: string) => void;
    defaultToPrimary?: boolean;
  }) {
    useEffect(() => {
      if (defaultToPrimary && !value) onChange('loc-primary');
    }, [defaultToPrimary, value, onChange]);
    return (
      <select data-testid="location-selector" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccionar ubicación</option>
        <option value="loc-primary">Principal</option>
        <option value="loc-2">Sucursal Norte</option>
      </select>
    );
  };
});

const mockUpdateAppointment = jest.fn().mockResolvedValue({});
const mockCreateAppointment = jest.fn().mockResolvedValue({});

jest.mock('@/hooks/useAppointments', () => ({
  useAppointments: () => ({
    updateAppointment: mockUpdateAppointment,
    createAppointment: mockCreateAppointment,
  }),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import { AppointmentModal } from '@/components/appointments/AppointmentModal';

const customers = [{ id: 'cust-1', name: 'Ana López' }];
const pets = [{ id: 'pet-1', name: 'Firulais', species: 'dog', customerId: 'cust-1' }];
const staff = [{ id: 'staff-1', name: 'Dra. López', position: 'VETERINARIAN' }];

const appointment = {
  id: 'appt-1',
  dateTime: new Date('2099-01-15T15:00:00.000Z'),
  duration: 30,
  reason: 'Consulta general',
  notes: 'Primera visita',
  status: 'CONFIRMED' as const,
  createdAt: new Date('2099-01-01T00:00:00.000Z'),
  updatedAt: new Date('2099-01-01T00:00:00.000Z'),
  customer: { id: 'cust-1', name: 'Ana López' },
  pet: { id: 'pet-1', name: 'Firulais', species: 'dog' },
  staff: { id: 'staff-1', name: 'Dra. López', position: 'VETERINARIAN' },
  location: { id: 'loc-2', name: 'Sucursal Norte' },
};

function renderModal(props: Partial<React.ComponentProps<typeof AppointmentModal>> = {}) {
  return render(
    <AppointmentModal
      open
      onOpenChange={jest.fn()}
      customers={customers}
      pets={pets}
      staff={staff}
      {...props}
    />
  );
}

describe('AppointmentModal editing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('excludes the appointment itself from the availability check', async () => {
    renderModal({ appointment });

    await waitFor(() => expect(mockCheckAvailability).toHaveBeenCalled());
    const calls = mockCheckAvailability.mock.calls;
    expect(calls[calls.length - 1][3]).toBe('appt-1');
  });

  it('lets the user save a notes-only edit, keeping time and location', async () => {
    const user = userEvent.setup();
    renderModal({ appointment });

    const submit = screen.getByTestId('submit-appointment-button');
    expect(submit).not.toBeDisabled();
    expect(screen.getByTestId('location-selector')).toHaveValue('loc-2');

    const notes = screen.getByTestId('appointment-notes-input');
    await user.clear(notes);
    await user.type(notes, 'Traer cartilla');
    await user.click(submit);

    await waitFor(() => expect(mockUpdateAppointment).toHaveBeenCalled());
    const [id, data] = mockUpdateAppointment.mock.calls[0];
    expect(id).toBe('appt-1');
    expect(data.notes).toBe('Traer cartilla');
    expect(new Date(data.dateTime).toISOString()).toBe('2099-01-15T15:00:00.000Z');
    expect(data.locationId).toBe('loc-2');
  });

  it('keeps an appointment without location without assigning the primary one', async () => {
    const user = userEvent.setup();
    renderModal({ appointment: { ...appointment, location: undefined } });

    await user.click(screen.getByTestId('submit-appointment-button'));

    await waitFor(() => expect(mockUpdateAppointment).toHaveBeenCalled());
    expect(mockUpdateAppointment.mock.calls[0][1].locationId).toBeNull();
  });

  it('labels the button "Crear Cita" when creating from a calendar click', () => {
    renderModal({ initialDate: new Date('2099-01-15T15:00:00.000Z') });

    expect(screen.getByTestId('submit-appointment-button')).toHaveTextContent('Crear Cita');
  });

  it('labels the button "Actualizar Cita" when editing', () => {
    renderModal({ appointment });

    expect(screen.getByTestId('submit-appointment-button')).toHaveTextContent('Actualizar Cita');
  });
});
