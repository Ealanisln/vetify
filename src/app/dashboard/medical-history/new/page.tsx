import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { NewMedicalHistoryForm } from '@/components/medical/NewMedicalHistoryForm';

export default async function NewMedicalHistoryPage() {
  const { tenant } = await requireAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Nueva Consulta Médica
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Registra una nueva entrada en la historia clínica de la mascota
        </p>
      </div>

      {/* Formulario */}
      <Suspense 
        fallback={
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        }
      >
        <NewMedicalHistoryForm tenantId={tenant.id} />
      </Suspense>
    </div>
  );
} 