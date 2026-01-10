'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  PlusIcon,
  LockOpenIcon,
  LockClosedIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from '@/components/providers/LocationProvider';
import { UpgradeModal } from '@/components/trial/UpgradeModal';

interface CashDrawer {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  openedAt: Date;
  closedAt?: Date;
  initialAmount: number;
  finalAmount?: number;
  expectedAmount?: number;
  difference?: number;
  openedBy: { id: string; name: string };
  closedBy?: { id: string; name: string };
  location?: { id: string; name: string };
}

interface PlanLimits {
  limit: number;
  current: number;
  remaining: number;
  canAdd: boolean;
}

interface MultiCashDrawerManagerProps {
  tenantId: string;
  canOperate?: boolean;
}

export function MultiCashDrawerManager({ tenantId, canOperate = true }: MultiCashDrawerManagerProps) {
  const { currentLocation } = useLocation();
  const [drawers, setDrawers] = useState<CashDrawer[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedDrawer, setSelectedDrawer] = useState<CashDrawer | null>(null);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [initialAmount, setInitialAmount] = useState<string>('1000');
  const [isOpening, setIsOpening] = useState(false);

  const fetchDrawers = useCallback(async () => {
    try {
      const locationParam = currentLocation?.id ? `&locationId=${currentLocation.id}` : '';
      const response = await fetch(`/api/caja?tenantId=${tenantId}${locationParam}&status=ALL`);
      if (response.ok) {
        const data = await response.json();
        setDrawers(data.drawers || []);
        setPlanLimits(data.planLimits);
      }
    } catch (error) {
      console.error('Error fetching drawers:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, currentLocation?.id]);

  useEffect(() => {
    fetchDrawers();
  }, [fetchDrawers]);

  const handleOpenNewDrawer = () => {
    if (planLimits && !planLimits.canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    setShowOpenForm(true);
  };

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
          initialAmount: parseFloat(initialAmount)
        })
      });

      if (response.ok) {
        await fetchDrawers();
        setShowOpenForm(false);
        setInitialAmount('1000');
      } else if (response.status === 402) {
        setShowUpgradeModal(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Error abriendo caja');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error abriendo la caja');
    } finally {
      setIsOpening(false);
    }
  };

  const openCount = drawers.filter((d) => d.status === 'OPEN').length;
  const closedCount = drawers.filter((d) => d.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header con botón Nueva Caja */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gestión de Cajas</h2>
          <p className="text-sm text-muted-foreground">
            {openCount} abierta{openCount !== 1 ? 's' : ''} · {closedCount} cerrada
            {closedCount !== 1 ? 's' : ''} hoy
          </p>
        </div>
        <div className="flex items-center gap-3">
          {planLimits && planLimits.limit > 0 && (
            <span className="text-sm text-muted-foreground">
              {planLimits.current} / {planLimits.limit === -1 ? '∞' : planLimits.limit} cajas
            </span>
          )}
          <Button
            onClick={handleOpenNewDrawer}
            disabled={!canOperate}
            title={!canOperate ? 'No tienes permisos para operar cajas' : undefined}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Caja
          </Button>
        </div>
      </div>

      {/* Formulario para abrir caja */}
      {showOpenForm && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Abrir Nueva Caja</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowOpenForm(false)}>
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="form-label">Monto inicial en efectivo</label>
                <input
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder="1000.00"
                  className="form-input"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={openDrawer} disabled={isOpening} className="flex-1">
                  {isOpening ? 'Abriendo...' : 'Confirmar Apertura'}
                </Button>
                <Button variant="outline" onClick={() => setShowOpenForm(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cajas */}
      <Card>
        <CardHeader>
          <CardTitle>Cajas del Día</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : drawers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay cajas registradas hoy</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleOpenNewDrawer}
                disabled={!canOperate}
                title={!canOperate ? 'No tienes permisos para operar cajas' : undefined}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Abrir primera caja
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {drawers.map((drawer) => (
                <div
                  key={drawer.id}
                  className="py-4 flex items-center justify-between hover:bg-muted/50 -mx-4 px-4 rounded transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={drawer.status === 'OPEN' ? 'default' : 'secondary'}
                      className="min-w-[90px] justify-center"
                    >
                      {drawer.status === 'OPEN' ? (
                        <>
                          <LockOpenIcon className="h-3 w-3 mr-1" /> Abierta
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="h-3 w-3 mr-1" /> Cerrada
                        </>
                      )}
                    </Badge>
                    <div>
                      <p className="font-medium text-foreground">{drawer.openedBy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(drawer.openedAt), "HH:mm 'hrs'", { locale: es })}
                        {drawer.closedAt &&
                          ` → ${format(new Date(drawer.closedAt), "HH:mm 'hrs'", { locale: es })}`}
                      </p>
                    </div>
                    {drawer.location && (
                      <Badge variant="outline" className="ml-2">
                        {drawer.location.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${drawer.initialAmount.toLocaleString()}
                      </p>
                      {drawer.status === 'CLOSED' && drawer.difference !== undefined && (
                        <p
                          className={`text-sm ${
                            drawer.difference >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {drawer.difference >= 0 ? '+' : ''}${drawer.difference.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDrawer(drawer)}>
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      {selectedDrawer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalles de Caja</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDrawer(null)}>
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={selectedDrawer.status === 'OPEN' ? 'default' : 'secondary'}>
                    {selectedDrawer.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Abierta por</p>
                  <p className="font-medium">{selectedDrawer.openedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora apertura</p>
                  <p className="font-medium">
                    {format(new Date(selectedDrawer.openedAt), "HH:mm 'hrs'", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto inicial</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    ${selectedDrawer.initialAmount.toLocaleString()}
                  </p>
                </div>
                {selectedDrawer.status === 'CLOSED' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Hora cierre</p>
                      <p className="font-medium">
                        {selectedDrawer.closedAt &&
                          format(new Date(selectedDrawer.closedAt), "HH:mm 'hrs'", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cerrada por</p>
                      <p className="font-medium">{selectedDrawer.closedBy?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monto esperado</p>
                      <p className="font-medium">
                        ${selectedDrawer.expectedAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monto final</p>
                      <p className="font-medium">
                        ${selectedDrawer.finalAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p
                        className={`font-medium text-lg ${
                          (selectedDrawer.difference || 0) >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {(selectedDrawer.difference || 0) >= 0 ? '+' : ''}$
                        {Math.abs(selectedDrawer.difference || 0).toLocaleString()}
                        <span className="text-sm font-normal ml-2">
                          {(selectedDrawer.difference || 0) >= 0 ? '(sobrante)' : '(faltante)'}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSelectedDrawer(null)}>
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlanId={null}
      />
    </div>
  );
}
