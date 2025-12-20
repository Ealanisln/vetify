'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClockIcon,
  UserIcon,
  BanknotesIcon,
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

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

interface ShiftCardProps {
  shift: CashShift;
  onEnd?: () => void;
  onHandoff?: () => void;
  showActions?: boolean;
}

export function ShiftCard({ shift, onEnd, onHandoff, showActions = true }: ShiftCardProps) {
  const isActive = shift.status === 'ACTIVE';
  const duration = formatDistanceToNow(new Date(shift.startedAt), {
    locale: es,
    addSuffix: false
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusBadge = () => {
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

  const getDifferenceDisplay = () => {
    if (shift.difference === null) return null;
    const diff = Number(shift.difference);
    if (diff === 0) {
      return <span className="text-green-600 dark:text-green-400">Cuadrado</span>;
    } else if (diff > 0) {
      return <span className="text-green-600 dark:text-green-400">+{formatCurrency(diff)} sobrante</span>;
    } else {
      return <span className="text-red-600 dark:text-red-400">{formatCurrency(diff)} faltante</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{shift.cashier.name}</h3>
            <p className="text-sm text-muted-foreground">{shift.cashier.position}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClockIcon className="h-4 w-4" />
          <span>
            {format(new Date(shift.startedAt), 'HH:mm', { locale: es })}
            {shift.endedAt && ` - ${format(new Date(shift.endedAt), 'HH:mm', { locale: es })}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs">Duración:</span>
          <span className="font-medium text-foreground">{duration}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <BanknotesIcon className="h-4 w-4" />
            Balance inicial:
          </span>
          <span className="font-medium text-foreground">{formatCurrency(Number(shift.startingBalance))}</span>
        </div>
        {shift.endingBalance !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance final:</span>
            <span className="font-medium text-foreground">{formatCurrency(Number(shift.endingBalance))}</span>
          </div>
        )}
        {shift.expectedBalance !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Esperado:</span>
            <span className="text-foreground">{formatCurrency(Number(shift.expectedBalance))}</span>
          </div>
        )}
        {shift.difference !== null && (
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Diferencia:</span>
            {getDifferenceDisplay()}
          </div>
        )}
        {shift._count && (
          <div className="flex justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="text-muted-foreground">Transacciones:</span>
            <span className="text-foreground">{shift._count.transactions}</span>
          </div>
        )}
      </div>

      {shift.handedOffTo && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm">
          <span className="text-muted-foreground">Entregado a: </span>
          <span className="font-medium text-foreground">{shift.handedOffTo.name}</span>
        </div>
      )}

      {showActions && isActive && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={onEnd}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Terminar
          </button>
          <button
            onClick={onHandoff}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
            Entregar
          </button>
        </div>
      )}
    </div>
  );
}
