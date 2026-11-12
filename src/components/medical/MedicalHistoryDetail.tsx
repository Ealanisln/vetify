import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  HeartIcon,
  UserIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon as PrescriptionIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { mapSpeciesToSpanish } from '@/lib/utils/pet-enum-mapping';
import { getMedicalHistoryById } from '@/lib/medical-history';
import { formatClinicDate, getTenantTimeZone } from '@/lib/clinical-dates';
import type { MedicalHistoryWithDetails } from '@/types';

// Appointment reasons accept up to 500 characters; keep the suggestion short
const FOLLOW_UP_REASON_MAX = 200;

interface MedicalHistoryDetailProps {
  tenantId: string;
  historyId: string;
}

async function loadMedicalHistory(tenantId: string, historyId: string): Promise<MedicalHistoryWithDetails | null> {
  try {
    // Server component: read the data directly (tenant-scoped) instead of
    // fetching our own API, which arrives without the user's session cookies
    return await getMedicalHistoryById(tenantId, historyId);
  } catch (error) {
    console.error('Error fetching medical history detail:', error);
    return null;
  }
}

export async function MedicalHistoryDetail({ tenantId, historyId }: MedicalHistoryDetailProps) {
  const [history, timeZone] = await Promise.all([
    loadMedicalHistory(tenantId, historyId),
    getTenantTimeZone(tenantId),
  ]);

  if (!history) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 dark:text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Historia clínica no encontrada</p>
          <Link href="/dashboard/medical-history">
            <Button>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a Historia Clínica
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const petWeight = history.pet.weight === null ? null : Number(history.pet.weight);

  // Opens the regular appointment form (slot still required) prefilled for this patient
  const followUpHref = `/dashboard/appointments/new?${new URLSearchParams({
    customerId: history.pet.customer.id,
    petId: history.pet.id,
    reason: `Seguimiento: ${history.reasonForVisit}`.slice(0, FOLLOW_UP_REASON_MAX),
  }).toString()}`;

  const getDiagnosisColor = (diagnosis?: string | null) => {
    if (!diagnosis) return 'secondary';
    const lower = diagnosis.toLowerCase();
    if (lower.includes('emergencia') || lower.includes('urgente')) return 'destructive';
    if (lower.includes('vacuna') || lower.includes('prevención')) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/dashboard/medical-history" className="hover:text-blue-600 dark:hover:text-blue-400">
          Historia Clínica
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Consulta del {formatClinicDate(history.visitDate, timeZone, 'dd/MM/yyyy')}</span>
      </div>

      {/* Información de la mascota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-red-500" />
            Información de la Mascota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {history.pet.name}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Especie:</span>
                  <span className="font-medium">{mapSpeciesToSpanish(history.pet.species)}</span>
                </div>
                {history.pet.breed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Raza:</span>
                    <span className="font-medium">{history.pet.breed}</span>
                  </div>
                )}
                {petWeight !== null && !isNaN(petWeight) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Peso:</span>
                    <span className="font-medium">{petWeight} {history.pet.weightUnit || 'kg'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Propietario
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                  <span className="font-medium">{history.pet.customer.name}</span>
                </div>
                {history.pet.customer.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Teléfono:</span>
                    <span className="font-medium">{history.pet.customer.phone}</span>
                  </div>
                )}
                {history.pet.customer.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium">{history.pet.customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3">
              <Link href={followUpHref}>
                <Button size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Agendar seguimiento
                </Button>
              </Link>
              <Link href={`/dashboard/pets/${history.pet.id}`}>
                <Button variant="outline" size="sm">
                  Ver Perfil de Mascota
                </Button>
              </Link>
              <Link href={`/dashboard/customers/${history.pet.customer.id}`}>
                <Button variant="outline" size="sm">
                  Ver Cliente
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            Información de la Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fecha y Hora
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatClinicDate(history.visitDate, timeZone, 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
            {history.staff && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Atendido por
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">{history.staff.name}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Motivo de Consulta
            </label>
            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              {history.reasonForVisit}
            </p>
          </div>

          {history.diagnosis && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Diagnóstico
              </label>
              <div className="flex items-center gap-2">
                <Badge variant={getDiagnosisColor(history.diagnosis)}>
                  {history.diagnosis}
                </Badge>
              </div>
            </div>
          )}

          {history.treatment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Tratamiento
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-line">
                {history.treatment}
              </p>
            </div>
          )}

          {history.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Notas Adicionales
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-line">
                {history.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescripciones */}
      {history.medicalOrder?.prescriptions && history.medicalOrder.prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PrescriptionIcon className="h-5 w-5 text-green-500" />
              Prescripciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.medicalOrder.prescriptions.map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {prescription.product?.name}
                    </h4>
                    <Badge variant="outline">
                      Cantidad: {Number(prescription.quantity)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    {prescription.dosage && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Dosis:</span>
                        <p className="font-medium">{prescription.dosage}</p>
                      </div>
                    )}
                    {prescription.frequency && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Frecuencia:</span>
                        <p className="font-medium">{prescription.frequency}</p>
                      </div>
                    )}
                    {prescription.duration && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Duración:</span>
                        <p className="font-medium">{prescription.duration}</p>
                      </div>
                    )}
                    {prescription.instructions && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Instrucciones:</span>
                        <p className="font-medium">{prescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex justify-between">
        <Link href="/dashboard/medical-history">
          <Button variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Historia Clínica
          </Button>
        </Link>
        
        <div className="flex gap-3">
          <Link href={`/dashboard/pets/${history.pet.id}/consultation/new`}>
            <Button>
              Nueva Consulta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 