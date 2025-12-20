'use client';

import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { EyeIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CashShift {
  id: string;
  status: 'ACTIVE' | 'ENDED' | 'HANDED_OFF';
  startedAt: string;
  endedAt: string | null;
  startingBalance: number;
  endingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  cashier: {
    id: string;
    name: string;
  };
  drawer: {
    id: string;
  };
  handedOffTo: {
    id: string;
    name: string;
  } | null;
  _count?: {
    transactions: number;
  };
}

interface ShiftHistoryTableProps {
  shifts: CashShift[];
  loading: boolean;
  onShiftClick: (shift: CashShift) => void;
}

export function ShiftHistoryTable({ shifts, loading, onShiftClick }: ShiftHistoryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusBadge = (shift: CashShift) => {
    switch (shift.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Activo
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Finalizado
          </span>
        );
      case 'HANDED_OFF':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            Entregado
          </span>
        );
    }
  };

  const getDifferenceDisplay = (shift: CashShift) => {
    if (shift.difference === null) return '-';
    const diff = Number(shift.difference);
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircleIcon className="h-4 w-4" />
          Cuadrado
        </span>
      );
    } else if (diff > 0) {
      return (
        <span className="text-green-600 dark:text-green-400">
          +{formatCurrency(diff)}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {formatCurrency(diff)}
        </span>
      );
    }
  };

  const getDuration = (shift: CashShift) => {
    if (!shift.endedAt) {
      return formatDistanceStrict(new Date(shift.startedAt), new Date(), { locale: es });
    }
    return formatDistanceStrict(new Date(shift.startedAt), new Date(shift.endedAt), { locale: es });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay turnos registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cajero
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Horario
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Duración
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estado
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Diferencia
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Txns
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {shifts.map((shift) => (
            <tr
              key={shift.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{shift.cashier.name}</p>
                  {shift.handedOffTo && (
                    <p className="text-xs text-muted-foreground">
                      → {shift.handedOffTo.name}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {format(new Date(shift.startedAt), 'HH:mm', { locale: es })}
                {shift.endedAt && (
                  <> - {format(new Date(shift.endedAt), 'HH:mm', { locale: es })}</>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-foreground">
                {getDuration(shift)}
              </td>
              <td className="px-4 py-3">
                {getStatusBadge(shift)}
              </td>
              <td className="px-4 py-3 text-sm text-right">
                {getDifferenceDisplay(shift)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                {shift._count?.transactions || 0}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onShiftClick(shift)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="Ver detalles"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
