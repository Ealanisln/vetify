'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowsRightLeftIcon, UserIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CashShift {
  id: string;
  startingBalance: number;
  cashierId: string;
  cashier: { id: string; name: string };
}

interface Staff {
  id: string;
  name: string;
  position: string;
  isActive: boolean;
}

interface ShiftSummary {
  expectedBalance: number;
  transactionCount: number;
}

interface HandoffDialogProps {
  open: boolean;
  shift: CashShift | null;
  onClose: () => void;
  onHandoffComplete: () => void;
}

export function HandoffDialog({
  open,
  shift,
  onClose,
  onHandoffComplete
}: HandoffDialogProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedCashierId, setSelectedCashierId] = useState('');
  const [countedBalance, setCountedBalance] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ShiftSummary | null>(null);

  useEffect(() => {
    if (open && shift) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift?.id]);

  const fetchData = async () => {
    if (!shift) return;
    setFetchingData(true);
    setError('');

    try {
      // Fetch shift details for expected balance
      const shiftRes = await fetch(`/api/caja/shifts/${shift.id}`);
      const shiftData = await shiftRes.json();
      if (shiftRes.ok && shiftData.summary) {
        setSummary(shiftData.summary);
        setCountedBalance(String(shiftData.summary.expectedBalance));
      }

      // Fetch available staff (excluding current cashier and those with active shifts)
      const staffRes = await fetch('/api/staff?isActive=true');
      const staffData = await staffRes.json();

      const shiftsRes = await fetch('/api/caja/shifts?status=ACTIVE');
      const shiftsData = await shiftsRes.json();
      const staffWithActiveShifts = new Set(
        shiftsData.shifts?.map((s: { cashier: { id: string } }) => s.cashier.id) || []
      );

      const availableStaff = (staffData.staff || staffData || []).filter(
        (s: Staff) => s.isActive && s.id !== shift.cashierId && !staffWithActiveShifts.has(s.id)
      );
      setStaff(availableStaff);

      if (availableStaff.length === 1) {
        setSelectedCashierId(availableStaff[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    } finally {
      setFetchingData(false);
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
    const counted = parseFloat(countedBalance) || 0;
    return counted - summary.expectedBalance;
  };

  const difference = calculateDifference();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift || !selectedCashierId) {
      setError('Selecciona un cajero');
      return;
    }

    const balance = parseFloat(countedBalance);
    if (isNaN(balance) || balance < 0) {
      setError('El conteo verificado debe ser un número válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/caja/shifts/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: shift.id,
          newCashierId: selectedCashierId,
          countedBalance: balance,
          handoffNotes: handoffNotes.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al entregar turno');
      }

      onHandoffComplete();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al entregar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCashierId('');
    setCountedBalance('');
    setHandoffNotes('');
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
            <div className="flex items-center gap-2">
              <ArrowsRightLeftIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Entregar Turno</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              Entregando de: <span className="font-medium text-foreground">{shift.cashier.name}</span>
            </p>
          </div>

          {fetchingData ? (
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

              {staff.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
                  No hay personal disponible para recibir el turno. Todos tienen turnos activos.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Entregar a
                    </label>
                    <select
                      value={selectedCashierId}
                      onChange={(e) => setSelectedCashierId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Seleccionar cajero...</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {s.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  {summary && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
                      <p className="text-blue-700 dark:text-blue-400">
                        Balance esperado: <span className="font-medium">{formatCurrency(summary.expectedBalance)}</span>
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        {summary.transactionCount} transacciones en este turno
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <BanknotesIcon className="h-4 w-4 inline mr-1" />
                      Conteo Verificado
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={countedBalance}
                        onChange={(e) => setCountedBalance(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ambos cajeros deben verificar este conteo
                    </p>
                  </div>

                  {difference !== null && countedBalance && difference !== 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-400">
                        {difference > 0
                          ? `Sobrante de ${formatCurrency(difference)}`
                          : `Faltante de ${formatCurrency(Math.abs(difference))}`}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Notas de Entrega (opcional)
                    </label>
                    <textarea
                      value={handoffNotes}
                      onChange={(e) => setHandoffNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={2}
                      placeholder="Información importante para el siguiente turno..."
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
                      disabled={loading || !selectedCashierId || !countedBalance}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Entregando...' : 'Confirmar Entrega'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
