'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChartBarIcon, BuildingStorefrontIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { PeriodSelector, getPeriodDates, type PeriodValue } from './PeriodSelector';
import { SummaryCards } from './SummaryCards';
import { TransactionBreakdown } from './TransactionBreakdown';
import { DrawerComparison } from './DrawerComparison';
import { CashierPerformance } from './CashierPerformance';
import { ShiftDetailModal } from './ShiftDetailModal';
import { ExportButton } from './ExportButton';

interface CajaReportsMainProps {
  tenantId: string;
}

interface ReportData {
  period: { start: string; end: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netTotal: number;
    transactionCount: number;
    avgTransactionValue: number;
  };
  byTransactionType: Record<string, { count: number; total: number }>;
  discrepancies: {
    totalDifference: number;
    shiftsWithDifference: number;
    worstDiscrepancy: number;
  };
  byDrawer?: Array<{
    drawerId: string;
    locationId: string | null;
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
    shiftCount: number;
    totalDifference: number;
  }>;
  byCashier?: Array<{
    cashierId: string;
    cashierName: string;
    shiftCount: number;
    totalHours: number;
    transactionCount: number;
    totalDifference: number;
    accuracy: number;
  }>;
  shifts: Array<{
    id: string;
    cashier: { id: string; name: string };
    drawer: { id: string; locationId: string | null };
    startedAt: string;
    endedAt: string | null;
    startingBalance: number;
    endingBalance: number | null;
    expectedBalance: number | null;
    difference: number | null;
    status: string;
    transactionCount: number;
  }>;
}

type TabType = 'summary' | 'drawers' | 'cashiers' | 'shifts';

export function CajaReportsMain({ tenantId }: CajaReportsMainProps) {
  const [period, setPeriod] = useState<PeriodValue>(getPeriodDates('day'));
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Suppress unused variable warning - tenantId is available for future multi-tenant features
  void tenantId;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        period: period.type,
        startDate: period.startDate,
        endDate: period.endDate
      });

      const res = await fetch(`/api/caja/reports?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError('plan_required');
        } else {
          throw new Error(result.error || 'Error al cargar reportes');
        }
        return;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleShiftClick = (shiftId: string) => {
    setSelectedShiftId(shiftId);
  };

  // Plan required message
  if (error === 'plan_required') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <ChartBarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Reportes Avanzados
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

  const tabs: { key: TabType; label: string; icon: typeof ChartBarIcon }[] = [
    { key: 'summary', label: 'Resumen', icon: ChartBarIcon },
    { key: 'drawers', label: 'Por Caja', icon: BuildingStorefrontIcon },
    { key: 'cashiers', label: 'Por Cajero', icon: UserGroupIcon },
    { key: 'shifts', label: 'Turnos', icon: ClockIcon }
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-primary" />
            Reportes de Caja
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analiza el rendimiento de tus cajas y cajeros
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ExportButton data={data} loading={loading} />
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Reporte de Caja</h1>
        <p className="text-sm text-gray-600">
          Período: {period.label}
        </p>
      </div>

      {/* Error State */}
      {error && error !== 'plan_required' && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards - Always visible */}
      <SummaryCards
        data={data?.summary || {
          totalIncome: 0,
          totalExpenses: 0,
          netTotal: 0,
          transactionCount: 0,
          avgTransactionValue: 0
        }}
        discrepancies={data?.discrepancies || {
          totalDifference: 0,
          shiftsWithDifference: 0,
          worstDiscrepancy: 0
        }}
        loading={loading}
      />

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionBreakdown
            data={data?.byTransactionType || {}}
            loading={loading}
          />
          <div className="space-y-6">
            {data?.byDrawer && data.byDrawer.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Resumen por Caja</h3>
                <div className="space-y-2">
                  {data.byDrawer.slice(0, 3).map((drawer, i) => (
                    <div key={drawer.drawerId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Caja {i + 1}</span>
                      <span className={`font-medium ${
                        drawer.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(drawer.net)}
                      </span>
                    </div>
                  ))}
                </div>
                {(data.byDrawer.length > 3) && (
                  <button
                    onClick={() => setActiveTab('drawers')}
                    className="mt-3 text-sm text-primary hover:underline"
                  >
                    Ver todas las cajas →
                  </button>
                )}
              </div>
            )}
            {data?.byCashier && data.byCashier.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Top Cajeros</h3>
                <div className="space-y-2">
                  {data.byCashier.slice(0, 3).map((cashier) => (
                    <div key={cashier.cashierId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{cashier.cashierName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cashier.accuracy >= 95
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : cashier.accuracy >= 80
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {cashier.accuracy}% precisión
                      </span>
                    </div>
                  ))}
                </div>
                {(data.byCashier.length > 3) && (
                  <button
                    onClick={() => setActiveTab('cashiers')}
                    className="mt-3 text-sm text-primary hover:underline"
                  >
                    Ver todos los cajeros →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'drawers' && (
        <DrawerComparison
          data={data?.byDrawer || []}
          loading={loading}
        />
      )}

      {activeTab === 'cashiers' && (
        <CashierPerformance
          data={data?.byCashier || []}
          loading={loading}
        />
      )}

      {activeTab === 'shifts' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-foreground">Turnos del Período</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data?.shifts && data.shifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Cajero</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Horario</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Estado</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Txns</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Diferencia</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{shift.cashier.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(shift.startedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        {shift.endedAt && (
                          <> - {new Date(shift.endedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          shift.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : shift.status === 'HANDED_OFF'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {shift.status === 'ACTIVE' ? 'Activo' : shift.status === 'HANDED_OFF' ? 'Entregado' : 'Finalizado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">{shift.transactionCount}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        shift.difference === null || shift.difference === 0
                          ? 'text-green-600 dark:text-green-400'
                          : shift.difference > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {shift.difference !== null
                          ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(shift.difference)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleShiftClick(shift.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No hay turnos en este período</p>
            </div>
          )}
        </div>
      )}

      {/* Shift Detail Modal */}
      <ShiftDetailModal
        shiftId={selectedShiftId}
        open={!!selectedShiftId}
        onClose={() => setSelectedShiftId(null)}
      />
    </div>
  );
}
