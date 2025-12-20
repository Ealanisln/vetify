import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShiftCard } from '@/components/caja/shifts/ShiftCard';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 horas'),
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'HH:mm') {
      return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    }
    return '10:00';
  }),
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: () => <span data-testid="clock-icon">Clock</span>,
  UserIcon: () => <span data-testid="user-icon">User</span>,
  BanknotesIcon: () => <span data-testid="banknotes-icon">Banknotes</span>,
  ArrowRightOnRectangleIcon: () => <span data-testid="arrow-right-icon">ArrowRight</span>,
  ArrowsRightLeftIcon: () => <span data-testid="arrows-icon">Arrows</span>,
}));

describe('ShiftCard', () => {
  const baseShift = {
    id: 'shift-1',
    status: 'ACTIVE' as const,
    startedAt: new Date('2024-01-01T08:00:00').toISOString(),
    endedAt: null,
    startingBalance: 1000,
    endingBalance: null,
    expectedBalance: null,
    difference: null,
    notes: null,
    cashier: {
      id: 'cashier-1',
      name: 'María García',
      position: 'Cajera',
    },
    drawer: {
      id: 'drawer-1',
      status: 'OPEN',
      openedAt: new Date('2024-01-01T07:00:00').toISOString(),
      initialAmount: 500,
    },
    handedOffTo: null,
    _count: {
      transactions: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders shift information correctly', () => {
    render(<ShiftCard shift={baseShift} />);

    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Cajera')).toBeInTheDocument();
    expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
  });

  it('shows ACTIVE status badge', () => {
    render(<ShiftCard shift={baseShift} />);

    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('shows ENDED status badge', () => {
    const endedShift = {
      ...baseShift,
      status: 'ENDED' as const,
      endedAt: new Date('2024-01-01T16:00:00').toISOString(),
      endingBalance: 1150,
      expectedBalance: 1120,
      difference: 30,
    };

    render(<ShiftCard shift={endedShift} />);

    expect(screen.getByText('Finalizado')).toBeInTheDocument();
  });

  it('shows HANDED_OFF status badge', () => {
    const handedOffShift = {
      ...baseShift,
      status: 'HANDED_OFF' as const,
      endedAt: new Date('2024-01-01T12:00:00').toISOString(),
      handedOffTo: {
        id: 'cashier-2',
        name: 'Juan Pérez',
      },
    };

    render(<ShiftCard shift={handedOffShift} />);

    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('displays action buttons when showActions=true', () => {
    render(<ShiftCard shift={baseShift} showActions={true} />);

    expect(screen.getByText('Terminar')).toBeInTheDocument();
    expect(screen.getByText('Entregar')).toBeInTheDocument();
  });

  it('hides action buttons when showActions=false', () => {
    render(<ShiftCard shift={baseShift} showActions={false} />);

    expect(screen.queryByText('Terminar')).not.toBeInTheDocument();
    expect(screen.queryByText('Entregar')).not.toBeInTheDocument();
  });

  it('hides action buttons for non-active shifts', () => {
    const endedShift = { ...baseShift, status: 'ENDED' as const };

    render(<ShiftCard shift={endedShift} showActions={true} />);

    expect(screen.queryByText('Terminar')).not.toBeInTheDocument();
    expect(screen.queryByText('Entregar')).not.toBeInTheDocument();
  });

  it('calls onEnd when end button clicked', () => {
    const onEnd = jest.fn();

    render(<ShiftCard shift={baseShift} onEnd={onEnd} showActions={true} />);

    fireEvent.click(screen.getByText('Terminar'));

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onHandoff when handoff button clicked', () => {
    const onHandoff = jest.fn();

    render(<ShiftCard shift={baseShift} onHandoff={onHandoff} showActions={true} />);

    fireEvent.click(screen.getByText('Entregar'));

    expect(onHandoff).toHaveBeenCalledTimes(1);
  });

  it('formats currency correctly', () => {
    const shiftWithBalance = {
      ...baseShift,
      startingBalance: 1500.50,
    };

    render(<ShiftCard shift={shiftWithBalance} />);

    // Check that balance is formatted as MXN currency
    expect(screen.getByText(/\$1,500\.50/)).toBeInTheDocument();
  });

  it('displays duration', () => {
    render(<ShiftCard shift={baseShift} />);

    // Duration is mocked to return '2 horas'
    expect(screen.getByText('2 horas')).toBeInTheDocument();
  });

  it('displays transaction count when available', () => {
    render(<ShiftCard shift={baseShift} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Transacciones:')).toBeInTheDocument();
  });

  it('shows ending balance for ended shifts', () => {
    const endedShift = {
      ...baseShift,
      status: 'ENDED' as const,
      endedAt: new Date('2024-01-01T16:00:00').toISOString(),
      endingBalance: 1200,
    };

    render(<ShiftCard shift={endedShift} />);

    expect(screen.getByText(/\$1,200\.00/)).toBeInTheDocument();
  });

  it('shows expected balance for ended shifts', () => {
    const endedShift = {
      ...baseShift,
      status: 'ENDED' as const,
      endedAt: new Date('2024-01-01T16:00:00').toISOString(),
      endingBalance: 1200,
      expectedBalance: 1180,
    };

    render(<ShiftCard shift={endedShift} />);

    expect(screen.getByText('Esperado:')).toBeInTheDocument();
    expect(screen.getByText(/\$1,180\.00/)).toBeInTheDocument();
  });

  it('shows positive difference (surplus) correctly', () => {
    const shiftWithSurplus = {
      ...baseShift,
      status: 'ENDED' as const,
      endedAt: new Date('2024-01-01T16:00:00').toISOString(),
      endingBalance: 1200,
      expectedBalance: 1150,
      difference: 50,
    };

    render(<ShiftCard shift={shiftWithSurplus} />);

    expect(screen.getByText(/sobrante/)).toBeInTheDocument();
  });

  it('shows negative difference (shortage) correctly', () => {
    const shiftWithShortage = {
      ...baseShift,
      status: 'ENDED' as const,
      endedAt: new Date('2024-01-01T16:00:00').toISOString(),
      endingBalance: 1100,
      expectedBalance: 1150,
      difference: -50,
    };

    render(<ShiftCard shift={shiftWithShortage} />);

    expect(screen.getByText(/faltante/)).toBeInTheDocument();
  });

  it('shows exact match (zero difference) correctly', () => {
    const shiftWithExactMatch = {
      ...baseShift,
      status: 'ENDED' as const,
      endedAt: new Date('2024-01-01T16:00:00').toISOString(),
      endingBalance: 1150,
      expectedBalance: 1150,
      difference: 0,
    };

    render(<ShiftCard shift={shiftWithExactMatch} />);

    expect(screen.getByText('Cuadrado')).toBeInTheDocument();
  });

  it('displays handedOffTo information', () => {
    const handedOffShift = {
      ...baseShift,
      status: 'HANDED_OFF' as const,
      handedOffTo: {
        id: 'cashier-2',
        name: 'Carlos López',
      },
    };

    render(<ShiftCard shift={handedOffShift} />);

    expect(screen.getByText('Entregado a:')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });
});
