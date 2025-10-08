import { Suspense } from 'react';
import { requireAuth } from '../../../../lib/auth';
import { NewMedicalHistoryForm } from '../../../../components/medical/NewMedicalHistoryForm';

export default async function NewMedicalHistoryPage() {
  const { tenant } = await requireAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Nueva Consulta Médica
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registra una nueva entrada en la historia clínica de la mascota
        </p>
      </div>

      {/* Formulario */}
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
        <NewMedicalHistoryForm tenantId={tenant.id} />
      </Suspense>
    </div>
  );
} 