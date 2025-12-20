'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/outline';

interface CashDrawer {
  id: string;
  status: string;
  openedAt: string;
  initialAmount: number;
  openedBy?: { id: string; firstName: string; lastName: string } | null;
}

interface Staff {
  id: string;
  name: string;
  position: string;
  isActive: boolean;
}

interface StartShiftDialogProps {
  open: boolean;
  onClose: () => void;
  onShiftStarted: () => void;
  tenantId: string;
}

export function StartShiftDialog({
  open,
  onClose,
  onShiftStarted,
  tenantId
}: StartShiftDialogProps) {
  const [drawers, setDrawers] = useState<CashDrawer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDrawerId, setSelectedDrawerId] = useState('');
  const [selectedCashierId, setSelectedCashierId] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, tenantId]);

  const fetchData = async () => {
    setFetchingData(true);
    setError('');
    try {
      // Fetch open drawers without active shifts
      const drawersRes = await fetch(`/api/caja?status=OPEN`);
      const drawersData = await drawersRes.json();

      // Filter drawers that don't have active shifts
      const shiftsRes = await fetch('/api/caja/shifts?status=ACTIVE');
      const shiftsData = await shiftsRes.json();
      const drawersWithActiveShifts = new Set(
        shiftsData.shifts?.map((s: { drawer: { id: string } }) => s.drawer.id) || []
      );

      const availableDrawers = (drawersData.drawers || []).filter(
        (d: CashDrawer) => !drawersWithActiveShifts.has(d.id)
      );
      setDrawers(availableDrawers);

      // Fetch active staff
      const staffRes = await fetch('/api/staff?isActive=true');
      const staffData = await staffRes.json();

      // Filter staff that don't have active shifts
      const staffWithActiveShifts = new Set(
        shiftsData.shifts?.map((s: { cashier: { id: string } }) => s.cashier.id) || []
      );

      const availableStaff = (staffData.staff || staffData || []).filter(
        (s: Staff) => s.isActive && !staffWithActiveShifts.has(s.id)
      );
      setStaff(availableStaff);

      // Pre-select if only one option
      if (availableDrawers.length === 1) {
        setSelectedDrawerId(availableDrawers[0].id);
        setStartingBalance(String(availableDrawers[0].initialAmount || 0));
      }
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

  const handleDrawerChange = (drawerId: string) => {
    setSelectedDrawerId(drawerId);
    const drawer = drawers.find(d => d.id === drawerId);
    if (drawer) {
      setStartingBalance(String(drawer.initialAmount || 0));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrawerId || !selectedCashierId) {
      setError('Selecciona una caja y un cajero');
      return;
    }

    const balance = parseFloat(startingBalance);
    if (isNaN(balance) || balance < 0) {
      setError('El balance inicial debe ser un número válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/caja/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawerId: selectedDrawerId,
          cashierId: selectedCashierId,
          startingBalance: balance
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar turno');
      }

      onShiftStarted();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDrawerId('');
    setSelectedCashierId('');
    setStartingBalance('');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Iniciar Turno</h2>
            <button
              onClick={handleClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
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

              {drawers.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
                  No hay cajas disponibles. Abre una caja primero o termina los turnos activos.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <BanknotesIcon className="h-4 w-4 inline mr-1" />
                      Caja
                    </label>
                    <select
                      value={selectedDrawerId}
                      onChange={(e) => handleDrawerChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Seleccionar caja...</option>
                      {drawers.map((drawer) => (
                        <option key={drawer.id} value={drawer.id}>
                          Caja #{drawer.id.slice(0, 8)} - ${drawer.initialAmount}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Cajero
                    </label>
                    {staff.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay personal disponible
                      </p>
                    ) : (
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
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Balance Inicial
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={startingBalance}
                        onChange={(e) => setStartingBalance(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Monto inicial heredado de la caja o turno anterior
                    </p>
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
                      disabled={loading || !selectedDrawerId || !selectedCashierId}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Iniciando...' : 'Iniciar Turno'}
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
