'use client';

import { useState } from 'react';
import { CashDrawerMain } from './CashDrawerMain';
import { CashStats } from './CashStats';
import { TransactionHistory } from './TransactionHistory';
import { MultiCashDrawerManager } from './MultiCashDrawerManager';
import { ShiftManagement } from './ShiftManagement';
import { CajaReportsMain } from './reports/CajaReportsMain';
import { CurrencyDollarIcon, Cog6ToothIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface CajaPageClientProps {
  tenantId: string;
}

export function CajaPageClient({ tenantId }: CajaPageClientProps) {
  const [view, setView] = useState<'operation' | 'management' | 'shifts' | 'reports'>('operation');

  return (
    <div className="space-y-6">
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
              <CashDrawerMain tenantId={tenantId} />
            </div>

            {/* Historial de transacciones */}
            <div>
              <TransactionHistory tenantId={tenantId} />
            </div>
          </div>
        </>
      )}

      {view === 'management' && (
        <MultiCashDrawerManager tenantId={tenantId} />
      )}

      {view === 'shifts' && (
        <ShiftManagement tenantId={tenantId} />
      )}

      {view === 'reports' && (
        <CajaReportsMain tenantId={tenantId} />
      )}
    </div>
  );
}
