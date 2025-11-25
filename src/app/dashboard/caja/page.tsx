import { Suspense } from 'react';
import { requireActiveSubscription } from '../../../lib/auth';
import { CashDrawerMain } from '../../../components/caja/CashDrawerMain';
import { CashStats } from '../../../components/caja/CashStats';
import { TransactionHistory } from '../../../components/caja/TransactionHistory';

export default async function CajaPage() {
  const { tenant } = await requireActiveSubscription();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Gestión de Caja
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Controla el flujo de efectivo y las transacciones diarias de la clínica
        </p>
      </div>

      {/* Estadísticas de caja */}
      <Suspense 
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow p-6 animate-pulse border border-border">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        }
      >
        <CashStats tenantId={tenant.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel principal de caja */}
        <div className="lg:col-span-2">
          <Suspense
            fallback={
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </div>
            }
          >
            <CashDrawerMain tenantId={tenant.id} />
          </Suspense>
        </div>

        {/* Historial de transacciones */}
        <div>
          <Suspense
            fallback={
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <TransactionHistory tenantId={tenant.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 