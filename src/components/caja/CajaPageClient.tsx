'use client';

import { useState } from 'react';
import { CashDrawerMain } from './CashDrawerMain';
import { CashStats } from './CashStats';
import { TransactionHistory } from './TransactionHistory';
import { MultiCashDrawerManager } from './MultiCashDrawerManager';
import { ShiftManagement } from './ShiftManagement';
import { CajaReportsMain } from './reports/CajaReportsMain';
import { CurrencyDollarIcon, Cog6ToothIcon, ClockIcon, ChartBarIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

interface CajaPageClientProps {
  tenantId: string;
}

export function CajaPageClient({ tenantId }: CajaPageClientProps) {
  const [view, setView] = useState<'operation' | 'management' | 'shifts' | 'reports'>('operation');
  const { canAccess, isLoading: permissionsLoading } = useStaffPermissions();

  // Check if user can write to sales (operate cash register)
  const canOperateCaja = canAccess('sales', 'write');

  return (
    <div className="space-y-6">
      {/* Read-only alert for users without write permission */}
      {!permissionsLoading && !canOperateCaja && (
        <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 rounded-lg">
          <LockClosedIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Modo de solo lectura</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Tu rol actual no tiene permisos para operar la caja. Solo puedes ver la información de ventas y reportes.
            </p>
          </div>
        </div>
      )}

      {/* Header con tabs */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Caja</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Controla el flujo de efectivo y las transacciones diarias de la clínica
            </p>
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setView('operation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'operation'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CurrencyDollarIcon className="h-4 w-4" />
              Operación
            </button>
            <button
              onClick={() => setView('management')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'management'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4" />
              Gestión
            </button>
            <button
              onClick={() => setView('shifts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'shifts'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              Turnos
            </button>
            <button
              onClick={() => setView('reports')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'reports'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChartBarIcon className="h-4 w-4" />
              Reportes
            </button>
          </div>
        </div>
      </div>

      {view === 'operation' && (
        <>
          {/* Estadísticas de caja */}
          <CashStats tenantId={tenantId} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal de caja */}
            <div className="lg:col-span-2">
              <CashDrawerMain tenantId={tenantId} canOperate={canOperateCaja} />
            </div>

            {/* Historial de transacciones */}
            <div>
              <TransactionHistory tenantId={tenantId} />
            </div>
          </div>
        </>
      )}

      {view === 'management' && (
        <MultiCashDrawerManager tenantId={tenantId} canOperate={canOperateCaja} />
      )}

      {view === 'shifts' && (
        <ShiftManagement tenantId={tenantId} canOperate={canOperateCaja} />
      )}

      {view === 'reports' && (
        <CajaReportsMain tenantId={tenantId} />
      )}
    </div>
  );
}
