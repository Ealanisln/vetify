/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { UpcomingAppointmentsCard } from '@/components/dashboard/UpcomingAppointmentsCard';

type CardAppointments = Parameters<typeof UpcomingAppointmentsCard>[0]['appointments'];

function appointment(id: string, status: string, dateTime: string) {
  return {
    id,
    status,
    dateTime: new Date(dateTime),
    reason: 'Consulta general',
    pet: { id: 'p1', name: 'Firulais', customer: { firstName: null, name: 'Ana López' } },
  };
}

describe('UpcomingAppointmentsCard', () => {
  it('shows statuses in Spanish', () => {
    const appointments = [
      appointment('a1', 'CHECKED_IN', '2026-11-16T16:00:00.000Z'),
      appointment('a2', 'CONFIRMED', '2026-11-16T17:00:00.000Z'),
    ] as unknown as CardAppointments;

    render(<UpcomingAppointmentsCard appointments={appointments} timeZone="America/Mexico_City" />);

    expect(screen.getByText('Registrado')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.queryByText('CHECKED_IN')).not.toBeInTheDocument();
  });

  // Lima (UTC-5) differs from both UTC (servers) and Mexico City (the usual
  // dev machine), so these only pass when the clinic zone is applied.
  it('shows the time in the clinic timezone, not the server one', () => {
    // 16:00Z is 11:00 in Lima
    const appointments = [appointment('a1', 'SCHEDULED', '2026-11-16T16:00:00.000Z')] as unknown as CardAppointments;

    render(<UpcomingAppointmentsCard appointments={appointments} timeZone="America/Lima" />);

    expect(screen.getByText(/11:00/)).toBeInTheDocument();
  });

  it('uses the clinic calendar day near midnight', () => {
    // 03:00Z on the 17th is still the 16th (22:00) in Lima
    const appointments = [appointment('a1', 'SCHEDULED', '2026-11-17T03:00:00.000Z')] as unknown as CardAppointments;

    render(<UpcomingAppointmentsCard appointments={appointments} timeZone="America/Lima" />);

    expect(screen.getByText(/lun 16 de nov/)).toBeInTheDocument();
    expect(screen.getByText(/22:00/)).toBeInTheDocument();
  });
});
