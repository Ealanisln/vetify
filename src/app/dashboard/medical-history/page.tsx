import { Suspense } from 'react';
import { requireAuth } from '../../../lib/auth';
import { MedicalHistoryMain } from '../../../components/medical/MedicalHistoryMain';
import { MedicalHistoryStats } from '../../../components/medical/MedicalHistoryStats';

export default async function MedicalHistoryPage() {
  const { tenant } = await requireAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Historia Clínica
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestiona el historial médico de las mascotas y registra nuevas consultas
        </p>
      </div>

      {/* Estadísticas médicas */}
      <Suspense 
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        }
      >
        <MedicalHistoryMain tenantId={tenant.id} />
      </Suspense>
    </div>
  );
} 