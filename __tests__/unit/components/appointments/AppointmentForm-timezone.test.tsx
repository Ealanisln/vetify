/**
 * @jest-environment ./__tests__/utils/jsdom-timezone-environment.cjs
 * @timezone Asia/Tokyo
 *
 * The form opened from the calendar (a selected slot, or "Editar Cita") gets
 * an absolute instant. It must open on that instant's clinic day, or it asks
 * for the wrong day's slots and the prefilled time never matches one.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';

const mockCheckAvailability = jest.fn().mockResolvedValue({});

jest.mock('@/hooks/useCalendar', () => ({
  useAvailability: () => ({
    checkAvailability: mockCheckAvailability,
    availability: null,
    loading: false,
  }),
}));

jest.mock('@/components/locations/LocationSelector', () => {
  return function MockLocationSelector() {
    return <div data-testid="location-selector" />;
  };
});

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// 18:00 on Monday 2026-11-16 in Mexico City; 09:00 on Tuesday in Tokyo
const SIX_PM_CLINIC = new Date('2026-11-17T00:00:00Z');

const baseProps = {
  customers: [{ id: 'c1', name: 'Ana' }],
  pets: [{ id: 'p1', name: 'Firulais', species: 'DOG', customerId: 'c1' }],
  staff: [],
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
};

describe('AppointmentForm opened from the calendar, browser outside the clinic zone', () => {
  beforeEach(() => {
    mockCheckAvailability.mockClear();
  });

  it('runs in a browser zone different from the clinic', () => {
    expect(SIX_PM_CLINIC.getTimezoneOffset()).toBe(-540);
  });

  it("asks for the selected slot's clinic day", async () => {
    render(
      <AppointmentForm {...baseProps} initialData={{ dateTime: SIX_PM_CLINIC }} timeZone="America/Mexico_City" />
    );

    await waitFor(() => expect(mockCheckAvailability).toHaveBeenCalled());
    expect(mockCheckAvailability.mock.calls[0][0]).toBe('2026-11-16');
  });

  it("asks for the edited appointment's clinic day", async () => {
    render(
      <AppointmentForm
        {...baseProps}
        appointmentId="appt-1"
        initialData={{ dateTime: SIX_PM_CLINIC, customerId: 'c1', petId: 'p1' }}
        timeZone="America/Mexico_City"
      />
    );

    await waitFor(() => expect(mockCheckAvailability).toHaveBeenCalled());
    expect(mockCheckAvailability.mock.calls[0][0]).toBe('2026-11-16');
    expect(mockCheckAvailability.mock.calls[0][3]).toBe('appt-1');
  });
});
