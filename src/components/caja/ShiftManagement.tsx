'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ShiftCard } from './shifts/ShiftCard';
import { StartShiftDialog } from './shifts/StartShiftDialog';
import { EndShiftDialog } from './shifts/EndShiftDialog';
import { HandoffDialog } from './shifts/HandoffDialog';
import { ShiftHistoryTable } from './shifts/ShiftHistoryTable';

interface CashShift {
  id: string;
  status: 'ACTIVE' | 'ENDED' | 'HANDED_OFF';
  startedAt: string;
  endedAt: string | null;
  startingBalance: number;
  endingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  notes: string | null;
  cashierId: string;
  cashier: {
    id: string;
    name: string;
    position: string;
  };
  drawer: {
    id: string;
    status: string;
    openedAt: string;
    initialAmount: number;
  };
  handedOffTo: {
    id: string;
    name: string;
  } | null;
  _count?: {
    transactions: number;
  };
}

interface ShiftManagementProps {
  tenantId: string;
}

export function ShiftManagement({ tenantId }: ShiftManagementProps) {
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [view, setView] = useState<'active' | 'history'>('active');

  // Dialog states
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showHandoffDialog, setShowHandoffDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CashShift | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (view === 'active') {
        params.set('status', 'ACTIVE');
      } else {
        params.set('date', selectedDate);
      }

      const res = await fetch(`/api/caja/shifts?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError('Esta función requiere Plan Profesional o superior');
        } else {
          throw new Error(data.error || 'Error al cargar turnos');
        }
        return;
      }

      setShifts(data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError('Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  }, [view, selectedDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const activeShifts = shifts.filter((s) => s.status === 'ACTIVE');

  const handleEndShift = (shift: CashShift) => {
    setSelectedShift(shift);
    setShowEndDialog(true);
  };

  const handleHandoff = (shift: CashShift) => {
    setSelectedShift(shift);
    setShowHandoffDialog(true);
  };

  const handleShiftAction = () => {
    fetchShifts();
  };

  const handleShiftClick = (shift: CashShift) => {
    // TODO: Could open a detail modal
    console.log('View shift details:', shift.id);
  };

  if (error === 'Esta función requiere Plan Profesional o superior') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <UserGroupIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Gestión de Turnos
        </h3>
        <p className="text-muted-foreground mb-4">
          Esta función está disponible en Plan Profesional o superior.
        </p>
        <Link
          href="/dashboard/settings?tab=subscription"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
        >
          Ver Planes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-primary" />
            Gestión de Turnos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los turnos de cajeros y su rendimiento
          </p>
        </div>

        <button
          onClick={() => setShowStartDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Iniciar Turno
        </button>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setView('active')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Activos ({activeShifts.length})
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'history'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Historial
          </button>
        </div>

        {view === 'history' && (
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Error State */}
      {error && error !== 'Esta función requiere Plan Profesional o superior' && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {view === 'active' ? (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activeShifts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <ClockIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay turnos activos
              </h3>
              <p className="text-muted-foreground mb-4">
                Inicia un turno para comenzar a registrar transacciones
              </p>
              <button
                onClick={() => setShowStartDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
              >
                <PlusIcon className="h-4 w-4" />
                Iniciar Turno
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onEnd={() => handleEndShift(shift)}
                  onHandoff={() => handleHandoff(shift)}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-foreground">
              Turnos del {format(new Date(selectedDate), "d 'de' MMMM, yyyy", { locale: es })}
            </h3>
          </div>
          <ShiftHistoryTable
            shifts={shifts}
            loading={loading}
            onShiftClick={handleShiftClick}
          />
        </div>
      )}

      {/* Dialogs */}
      <StartShiftDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        onShiftStarted={handleShiftAction}
        tenantId={tenantId}
      />

      <EndShiftDialog
        open={showEndDialog}
        shift={selectedShift}
        onClose={() => {
          setShowEndDialog(false);
          setSelectedShift(null);
        }}
        onShiftEnded={handleShiftAction}
      />

      <HandoffDialog
        open={showHandoffDialog}
        shift={selectedShift}
        onClose={() => {
          setShowHandoffDialog(false);
          setSelectedShift(null);
        }}
        onHandoffComplete={handleShiftAction}
      />
    </div>
  );
}
