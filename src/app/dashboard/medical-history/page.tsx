import { Suspense } from 'react';
import { requireActiveSubscription } from '../../../lib/auth';
import { MedicalHistoryMain } from '../../../components/medical/MedicalHistoryMain';
import { MedicalHistoryStats } from '../../../components/medical/MedicalHistoryStats';

export default async function MedicalHistoryPage() {
  const { tenant } = await requireActiveSubscription();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Historia Clínica
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gestiona el historial médico de las mascotas y registra nuevas consultas
        </p>
      </div>

      {/* Estadísticas médicas */}
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
        <MedicalHistoryStats tenantId={tenant.id} />
      </Suspense>

      {/* Contenido principal */}
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
        <MedicalHistoryMain tenantId={tenant.id} />
      </Suspense>
    </div>
  );
} 