'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CurrencyDollarIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useLocation } from '@/components/providers/LocationProvider';
import { CashDrawerSelector } from './CashDrawerSelector';

interface CashDrawerMainProps {
  tenantId: string;
  canOperate?: boolean;
}

interface CashDrawer {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  openedAt: Date;
  closedAt?: Date;
  initialAmount: number;
  finalAmount?: number;
  expectedAmount?: number;
  difference?: number;
  openedBy: {
    name: string;
  };
  closedBy?: {
    name: string;
  };
  location?: {
    id: string;
    name: string;
  } | null;
}

interface TransactionSummary {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  transactionCount: number;
}

export function CashDrawerMain({ tenantId, canOperate = true }: CashDrawerMainProps) {
  const { currentLocation } = useLocation();
  const [drawers, setDrawers] = useState<CashDrawer[]>([]);
  const [selectedDrawerId, setSelectedDrawerId] = useState<string | null>(null);
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [initialAmount, setInitialAmount] = useState<string>('1000');
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  // Staff selection for opening drawer
  const [staffList, setStaffList] = useState<Array<{id: string; name: string; position: string}>>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loadingStaff, setLoadingStaff] = useState(false);

  const fetchCurrentDrawer = useCallback(async () => {
    try {
      const locationParam = currentLocation?.id ? `&locationId=${currentLocation.id}` : '';
      const response = await fetch(`/api/caja?tenantId=${tenantId}${locationParam}`);
      if (response.ok) {
        const data = await response.json();
        const openDrawers = (data.drawers || []).filter(
          (d: CashDrawer) => d.status === 'OPEN'
        );
        setDrawers(openDrawers);

        // Auto-select first drawer if none selected or current selection is invalid
        if (openDrawers.length > 0) {
          const validSelection = openDrawers.find(
            (d: CashDrawer) => d.id === selectedDrawerId
          );
          if (!validSelection) {
            setSelectedDrawerId(openDrawers[0].id);
            setCurrentDrawer(openDrawers[0]);
          } else {
            setCurrentDrawer(validSelection);
          }
        } else {
          setSelectedDrawerId(null);
          setCurrentDrawer(null);
        }
      }
    } catch (error) {
      console.error('Error fetching drawer:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, currentLocation?.id, selectedDrawerId]);

  const fetchTransactionSummary = useCallback(async () => {
    try {
      const locationParam = currentLocation?.id ? `&locationId=${currentLocation.id}` : '';
      const response = await fetch(`/api/caja/transactions?tenantId=${tenantId}${locationParam}&summary=true`);
      if (response.ok) {
        const data = await response.json();
        setTransactionSummary(data);
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  }, [tenantId, currentLocation?.id]);

  useEffect(() => {
    fetchCurrentDrawer();
    fetchTransactionSummary();
  }, [fetchCurrentDrawer, fetchTransactionSummary]);

  // Fetch active staff for drawer opening
  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const response = await fetch('/api/staff?isActive=true');
        if (response.ok) {
          const data = await response.json();
          setStaffList(data.staff || []);
          // Pre-select first staff as default
          if (data.staff?.length > 0) {
            setSelectedStaffId(data.staff[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, []);

  const openDrawer = async () => {
    if (!initialAmount || parseFloat(initialAmount) < 0) {
      alert('Ingresa un monto inicial válido');
      return;
    }

    setIsOpening(true);
    try {
      const response = await fetch('/api/caja/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          locationId: currentLocation?.id,
          initialAmount: parseFloat(initialAmount),
          staffId: selectedStaffId || undefined
        })
      });

      if (response.ok) {
        await fetchCurrentDrawer();
        await fetchTransactionSummary();
        setShowOpenForm(false);
        setInitialAmount('1000');
      } else {
        throw new Error('Error abriendo caja');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error abriendo la caja');
    } finally {
      setIsOpening(false);
    }
  };

  const closeDrawer = async () => {
    if (!finalAmount || parseFloat(finalAmount) < 0) {
      alert('Ingresa el monto final de efectivo');
      return;
    }

    if (!currentDrawer) {
      alert('No hay caja seleccionada para cerrar');
      return;
    }

    setIsClosing(true);
    try {
      const response = await fetch('/api/caja/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          drawerId: currentDrawer.id,
          finalAmount: parseFloat(finalAmount)
        })
      });

      if (response.ok) {
        await fetchCurrentDrawer();
        await fetchTransactionSummary();
        setShowCloseForm(false);
        setFinalAmount('');
      } else {
        throw new Error('Error cerrando caja');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error cerrando la caja');
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-foreground">Cargando estado de caja...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const drawerStatus = currentDrawer?.status || 'CLOSED';
  const isOpen = drawerStatus === 'OPEN';

  // Check if open drawer is from a previous day
  const drawerOpenedAt = currentDrawer?.openedAt ? new Date(currentDrawer.openedAt) : null;
  const isDrawerFromPreviousDay = isOpen && drawerOpenedAt && !isToday(drawerOpenedAt);

  return (
    <div className="space-y-6">
      {/* Estado actual de la caja */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5" />
              Estado de Caja
            </CardTitle>
            <div className="flex items-center gap-3">
              {drawers.length > 1 && (
                <CashDrawerSelector
                  drawers={drawers}
                  selectedDrawerId={selectedDrawerId}
                  onSelect={(id) => {
                    setSelectedDrawerId(id);
                    const selected = drawers.find((d) => d.id === id);
                    setCurrentDrawer(selected || null);
                  }}
                />
              )}
              <Badge variant={isOpen ? 'default' : 'secondary'}>
                {isOpen ? (
                  <>
                    <LockOpenIcon className="h-3 w-3 mr-1" />
                    ABIERTA
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    CERRADA
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Warning: Drawer from previous day */}
          {isDrawerFromPreviousDay && (
            <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Caja de un día anterior
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Esta caja fue abierta el {format(drawerOpenedAt!, "d 'de' MMMM", { locale: es })}.
                  Para procesar ventas en efectivo hoy, cierre esta caja y abra una nueva.
                </p>
              </div>
            </div>
          )}

          {currentDrawer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Abierta por</p>
                  <p className="font-medium text-foreground">{currentDrawer.openedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha y hora de apertura</p>
                  <p className="font-medium text-foreground">
                    {isToday(new Date(currentDrawer.openedAt))
                      ? format(new Date(currentDrawer.openedAt), 'HH:mm', { locale: es })
                      : format(new Date(currentDrawer.openedAt), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto inicial</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    ${currentDrawer.initialAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ventas del día</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    ${transactionSummary?.totalSales.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {currentDrawer.status === 'CLOSED' && (
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Resumen de Cierre</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Efectivo esperado</p>
                      <p className="font-medium text-foreground">${currentDrawer.expectedAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Efectivo contado</p>
                      <p className="font-medium text-foreground">${currentDrawer.finalAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Diferencia</p>
                      <p className={`font-medium ${
                        (currentDrawer.difference || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${Math.abs(currentDrawer.difference || 0).toLocaleString()}
                        {(currentDrawer.difference || 0) >= 0 ? ' (sobrante)' : ' (faltante)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cerrada por</p>
                      <p className="font-medium text-foreground">{currentDrawer.closedBy?.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No hay caja abierta</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones de caja */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isOpen ? (
              <>
                {!showOpenForm ? (
                  <Button
                    onClick={() => setShowOpenForm(true)}
                    className="w-full"
                    size="lg"
                    disabled={!canOperate}
                    title={!canOperate ? 'No tienes permisos para operar la caja' : undefined}
                  >
                    <LockOpenIcon className="h-4 w-4 mr-2" />
                    Abrir Caja
                  </Button>
                ) : (
                  <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-medium text-foreground">Abrir Caja</h4>
                    <div>
                      <label className="form-label">
                        Cajero Responsable
                      </label>
                      <select
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="form-input"
                        disabled={loadingStaff}
                      >
                        {loadingStaff ? (
                          <option>Cargando...</option>
                        ) : staffList.length === 0 ? (
                          <option value="">No hay personal activo</option>
                        ) : (
                          staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name} - {staff.position}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">
                        Monto inicial en efectivo
                      </label>
                      <input
                        type="number"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        placeholder="1000.00"
                        className="form-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={openDrawer} 
                        disabled={isOpening}
                        className="flex-1"
                      >
                        {isOpening ? 'Abriendo...' : 'Confirmar Apertura'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowOpenForm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {!showCloseForm ? (
                  <Button
                    onClick={() => setShowCloseForm(true)}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                    disabled={!canOperate}
                    title={!canOperate ? 'No tienes permisos para operar la caja' : undefined}
                  >
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    Cerrar Caja
                  </Button>
                ) : (
                  <div className="space-y-4 border border-destructive/50 rounded-lg p-4 bg-card">
                    <h4 className="font-medium text-destructive">Cerrar Caja</h4>

                    {transactionSummary && (
                      <div className="bg-muted rounded p-3 text-sm">
                        <p className="text-foreground"><strong>Efectivo esperado:</strong> ${(
                          currentDrawer!.initialAmount +
                          transactionSummary.totalCash
                        ).toLocaleString()}</p>
                        <p className="text-muted-foreground">
                          (Inicial: ${currentDrawer!.initialAmount.toLocaleString()} +
                          Ventas en efectivo: ${transactionSummary.totalCash.toLocaleString()})
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="form-label">
                        Efectivo contado en caja
                      </label>
                      <input
                        type="number"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        placeholder="0.00"
                        className="form-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={closeDrawer} 
                        disabled={isClosing}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isClosing ? 'Cerrando...' : 'Confirmar Cierre'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCloseForm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 