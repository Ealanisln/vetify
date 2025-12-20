'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BanknotesIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CashShift {
  id: string;
  startingBalance: number;
  cashier: { name: string };
}

interface ShiftSummary {
  totalIncome: number;
  totalExpenses: number;
  netTotal: number;
  expectedBalance: number;
  transactionCount: number;
}

interface EndShiftDialogProps {
  open: boolean;
  shift: CashShift | null;
  onClose: () => void;
  onShiftEnded: () => void;
}

export function EndShiftDialog({
  open,
  shift,
  onClose,
  onShiftEnded
}: EndShiftDialogProps) {
  const [endingBalance, setEndingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ShiftSummary | null>(null);

  useEffect(() => {
    if (open && shift) {
      fetchShiftDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift?.id]);

  const fetchShiftDetails = async () => {
    if (!shift) return;
    setFetchingDetails(true);
    try {
      const res = await fetch(`/api/caja/shifts/${shift.id}`);
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
        // Pre-fill with expected balance
        setEndingBalance(String(data.summary.expectedBalance));
      }
    } catch (err) {
      console.error('Error fetching shift details:', err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const calculateDifference = () => {
    if (!summary) return null;
    const ending = parseFloat(endingBalance) || 0;
    return ending - summary.expectedBalance;
  };

  const difference = calculateDifference();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;

    const balance = parseFloat(endingBalance);
    if (isNaN(balance) || balance < 0) {
      setError('El balance final debe ser un número válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/caja/shifts/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: shift.id,
          endingBalance: balance,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al terminar turno');
      }

      onShiftEnded();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al terminar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEndingBalance('');
    setNotes('');
    setError('');
    setSummary(null);
    onClose();
  };

  if (!open || !shift) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Terminar Turno</h2>
            <button
              onClick={handleClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              Cajero: <span className="font-medium text-foreground">{shift.cashier.name}</span>
            </p>
          </div>

          {fetchingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                  {error}
                </div>
              )}

              {summary && (
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance inicial:</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(Number(shift.startingBalance))}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>+ Ingresos:</span>
                    <span>{formatCurrency(summary.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>- Egresos:</span>
                    <span>{formatCurrency(summary.totalExpenses)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-medium">
                    <span className="text-foreground">Balance esperado:</span>
                    <span className="text-foreground">{formatCurrency(summary.expectedBalance)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summary.transactionCount} transacciones durante este turno
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <BanknotesIcon className="h-4 w-4 inline mr-1" />
                  Conteo Final
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={endingBalance}
                    onChange={(e) => setEndingBalance(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {difference !== null && endingBalance && (
                <div
                  className={`p-3 rounded-md flex items-center gap-2 ${
                    difference === 0
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : difference > 0
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}
                >
                  {difference === 0 ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">
                    {difference === 0
                      ? '¡Cuadrado!'
                      : difference > 0
                      ? `Sobrante: ${formatCurrency(difference)}`
                      : `Faltante: ${formatCurrency(Math.abs(difference))}`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="Observaciones del turno..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !endingBalance}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Terminando...' : 'Terminar Turno'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
