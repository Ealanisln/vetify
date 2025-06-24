'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CurrencyDollarIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CashDrawerMainProps {
  tenantId: string;
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
}

interface TransactionSummary {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  transactionCount: number;
}

export function CashDrawerMain({ tenantId }: CashDrawerMainProps) {
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [initialAmount, setInitialAmount] = useState<string>('1000');
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  const fetchCurrentDrawer = useCallback(async () => {
    try {
      const response = await fetch(`/api/caja?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentDrawer(data.drawer);
      }
    } catch (error) {
      console.error('Error fetching drawer:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const fetchTransactionSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/caja/transactions?tenantId=${tenantId}&summary=true`);
      if (response.ok) {
        const data = await response.json();
        setTransactionSummary(data);
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCurrentDrawer();
    fetchTransactionSummary();
  }, [fetchCurrentDrawer, fetchTransactionSummary]);

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
          initialAmount: parseFloat(initialAmount)
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

    setIsClosing(true);
    try {
      const response = await fetch('/api/caja/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Cargando estado de caja...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const drawerStatus = currentDrawer?.status || 'CLOSED';
  const isOpen = drawerStatus === 'OPEN';

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
        </CardHeader>
        <CardContent>
          {currentDrawer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Abierta por</p>
                  <p className="font-medium">{currentDrawer.openedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hora de apertura</p>
                  <p className="font-medium">
                    {format(new Date(currentDrawer.openedAt), 'HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monto inicial</p>
                  <p className="font-medium text-green-600">
                    ${currentDrawer.initialAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ventas del día</p>
                  <p className="font-medium text-blue-600">
                    ${transactionSummary?.totalSales.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {currentDrawer.status === 'CLOSED' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Resumen de Cierre</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Efectivo esperado</p>
                      <p className="font-medium">${currentDrawer.expectedAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Efectivo contado</p>
                      <p className="font-medium">${currentDrawer.finalAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Diferencia</p>
                      <p className={`font-medium ${
                        (currentDrawer.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${Math.abs(currentDrawer.difference || 0).toLocaleString()}
                        {(currentDrawer.difference || 0) >= 0 ? ' (sobrante)' : ' (faltante)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cerrada por</p>
                      <p className="font-medium">{currentDrawer.closedBy?.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No hay caja abierta</p>
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
                  >
                    <LockOpenIcon className="h-4 w-4 mr-2" />
                    Abrir Caja
                  </Button>
                ) : (
                  <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium">Abrir Caja</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto inicial en efectivo
                      </label>
                      <input
                        type="number"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        placeholder="1000.00"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                  >
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    Cerrar Caja
                  </Button>
                ) : (
                  <div className="space-y-4 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900">Cerrar Caja</h4>
                    
                    {transactionSummary && (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <p><strong>Efectivo esperado:</strong> ${(
                          currentDrawer!.initialAmount + 
                          transactionSummary.totalCash
                        ).toLocaleString()}</p>
                        <p className="text-gray-600">
                          (Inicial: ${currentDrawer!.initialAmount.toLocaleString()} + 
                          Ventas en efectivo: ${transactionSummary.totalCash.toLocaleString()})
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Efectivo contado en caja
                      </label>
                      <input
                        type="number"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
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