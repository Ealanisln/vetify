/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * "Citas de hoy" shows the clinic's date and the clinic's wall-clock times,
 * even when the browser runs in another timezone.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TodayAppointments } from '@/components/appointments/TodayAppointments';
import type { AppointmentWithDetails } from '@/lib/appointments/fetchers';

const mockContext: { current: Record<string, unknown> | null } = { current: null };

jest.mock('@/components/providers/AppointmentsProvider', () => ({
  useSafeAppointmentsContext: () => mockContext.current,
}));

jest.mock('@/components/appointments/QuickActions', () => ({
  QuickActions: () => null,
}));

// Sunday 2026-11-15 08:00 in Mexico City, 23:00 in Tokyo
const sundayMorning = {
  id: 'sunday-morning',
  dateTime: new Date('2026-11-15T14:00:00Z'),
  duration: 30,
  reason: 'Consulta',
  status: 'SCHEDULED',
  createdAt: new Date('2026-11-01T00:00:00Z'),
  updatedAt: new Date('2026-11-01T00:00:00Z'),
  customer: { id: 'c1', name: 'Ana' },
  pet: { id: 'p1', name: 'Firulais', species: 'dog' },
} as AppointmentWithDetails;

function renderWithClinic(timeZone: string | null) {
  mockContext.current = {
    todayAppointments: [sundayMorning],
    clinicSettings: { days: null, timeZone },
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  };
  render(<TodayAppointments onQuickAction={jest.fn()} onWhatsApp={jest.fn()} />);
}

describe('TodayAppointments in the clinic timezone', () => {
  beforeEach(() => {
    // Sunday 21:00 in Mexico City, Monday 12:00 in Tokyo
    jest.useFakeTimers({ now: new Date('2026-11-16T03:00:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the clinic's date and time", () => {
    renderWithClinic('America/Mexico_City');
    expect(screen.getByText('Domingo, 15 de noviembre de 2026')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-time')).toHaveTextContent('08:00');
  });

  it('falls back to Mexico City until the zone loads', () => {
    renderWithClinic(null);
    expect(screen.getByText('Domingo, 15 de noviembre de 2026')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-time')).toHaveTextContent('08:00');
  });
});
