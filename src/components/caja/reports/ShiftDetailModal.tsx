'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, BanknotesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShiftDetailModalProps {
  shiftId: string | null;
  open: boolean;
  onClose: () => void;
}

interface ShiftReport {
  shift: {
    id: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    durationHours: number;
    notes: string | null;
    cashier: { id: string; name: string; position: string };
    handedOffTo: { id: string; name: string } | null;
  };
  summary: {
    startingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netTotal: number;
    expectedBalance: number;
    actualBalance: number | null;
    difference: number | null;
    transactionCount: number;
  };
  byTransactionType: Record<string, { count: number; total: number }>;
  hourlyBreakdown: Array<{ hour: number; count: number; income: number; expenses: number; net: number }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    createdAt: string;
    saleInfo: { saleNumber: string; customerName: string | null } | null;
  }>;
}

const TRANSACTION_LABELS: Record<string, string> = {
  SALE_CASH: 'Venta',
  DEPOSIT: 'Depósito',
  ADJUSTMENT_IN: 'Ajuste (+)',
  REFUND_CASH: 'Devolución',
  WITHDRAWAL: 'Retiro',
  ADJUSTMENT_OUT: 'Ajuste (-)'
};

export function ShiftDetailModal({ shiftId, open, onClose }: ShiftDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ShiftReport | null>(null);

  useEffect(() => {
    if (open && shiftId) {
      fetchShiftReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shiftId]);

  const fetchShiftReport = async () => {
    if (!shiftId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/caja/reports/shift/${shiftId}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al cargar reporte');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: es });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Detalle del Turno</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Shift Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Cajero</p>
                    <p className="text-sm font-medium text-foreground">{data.shift.cashier.name}</p>
                    <p className="text-xs text-muted-foreground">{data.shift.cashier.position}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Duración</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatTime(data.shift.startedAt)}
                      {data.shift.endedAt && ` - ${formatTime(data.shift.endedAt)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{data.shift.durationHours} horas</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Ingresos</p>
                    <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                      {formatCurrency(data.summary.totalIncome)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Egresos</p>
                    <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                      {formatCurrency(data.summary.totalExpenses)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Neto</p>
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {formatCurrency(data.summary.netTotal)}
                    </p>
                  </div>
                </div>

                {/* Balance Reconciliation */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <BanknotesIcon className="h-4 w-4" />
                    Cuadre de Caja
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance inicial:</span>
                      <span className="font-medium">{formatCurrency(data.summary.startingBalance)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>+ Ingresos:</span>
                      <span>{formatCurrency(data.summary.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>- Egresos:</span>
                      <span>{formatCurrency(data.summary.totalExpenses)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-medium">
                      <span>Balance esperado:</span>
                      <span>{formatCurrency(data.summary.expectedBalance)}</span>
                    </div>
                    {data.summary.actualBalance !== null && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance reportado:</span>
                          <span className="font-medium">{formatCurrency(data.summary.actualBalance)}</span>
                        </div>
                        <div className={`flex justify-between font-semibold ${
                          data.summary.difference === 0
                            ? 'text-green-600 dark:text-green-400'
                            : data.summary.difference! > 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}>
                          <span className="flex items-center gap-1">
                            {data.summary.difference === 0 ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : (
                              <ExclamationTriangleIcon className="h-4 w-4" />
                            )}
                            Diferencia:
                          </span>
                          <span>{formatCurrency(data.summary.difference!)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Hourly Breakdown */}
                {data.hourlyBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Desglose por Hora</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                      {data.hourlyBreakdown.map((h) => (
                        <div
                          key={h.hour}
                          className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            {h.hour.toString().padStart(2, '0')}:00
                          </p>
                          <p className="text-sm font-semibold text-foreground">{h.count}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            +{formatCurrency(h.income).replace('MX$', '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions List */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Transacciones ({data.summary.transactionCount})
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Hora</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Tipo</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Descripción</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 text-muted-foreground">
                              {formatTime(t.createdAt)}
                            </td>
                            <td className="px-3 py-2">
                              {TRANSACTION_LABELS[t.type] || t.type}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {t.saleInfo
                                ? `Venta #${t.saleInfo.saleNumber}${t.saleInfo.customerName ? ` - ${t.saleInfo.customerName}` : ''}`
                                : t.description || '-'}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              ['SALE_CASH', 'DEPOSIT', 'ADJUSTMENT_IN'].includes(t.type)
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCurrency(t.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
