import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { MedicalHistoryDetail } from '@/components/medical/MedicalHistoryDetail';

interface MedicalHistoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MedicalHistoryDetailPage({ params }: MedicalHistoryDetailPageProps) {
  const { tenant } = await requireAuth();
  const { id } = await params;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Detalle de Historia Clínica
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Información detallada de la consulta médica
        </p>
      </div>

      {/* Contenido */}
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
        <MedicalHistoryDetail tenantId={tenant.id} historyId={id} />
      </Suspense>
    </div>
  );
} 