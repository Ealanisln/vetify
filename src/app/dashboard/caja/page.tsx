import { Suspense } from 'react';
import { requireActiveSubscription } from '../../../lib/auth';
import { CajaPageClient } from '../../../components/caja/CajaPageClient';

export default async function CajaPage() {
  const { tenant } = await requireActiveSubscription();

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="border-b border-border pb-4">
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 mt-2 animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-lg shadow p-6 animate-pulse border border-border"
              >
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>

          {/* Main content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-32 bg-muted rounded" />
                </div>
              </div>
            </div>
            <div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CajaPageClient tenantId={tenant.id} />
    </Suspense>
  );
}
