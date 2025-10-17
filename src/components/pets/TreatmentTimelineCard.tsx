import { TreatmentRecord, Staff } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

type TreatmentRecordWithStaff = TreatmentRecord & { staff?: Staff | null };

interface TreatmentTimelineCardProps {
  pet: {
    id: string;
    treatmentRecords: TreatmentRecordWithStaff[];
  };
}

export function TreatmentTimelineCard({ pet }: TreatmentTimelineCardProps) {
  const treatments = pet.treatmentRecords || [];

  const getTreatmentIcon = (type: string) => {
    switch (type) {
      case 'VACCINATION': return '💉';
      case 'DEWORMING': return '🪱';
      case 'FLEA_TICK': return '🦟';
      default: return '💊';
    }
  };

  const getTreatmentColor = (type: string) => {
    switch (type) {
      case 'VACCINATION': return 'bg-blue-500';
      case 'DEWORMING': return 'bg-yellow-500';
      case 'FLEA_TICK': return 'bg-red-500';
      default: return 'bg-purple-500';
    }
  };

  const getTreatmentName = (type: string) => {
    switch (type) {
      case 'VACCINATION': return 'Vacunación';
      case 'DEWORMING': return 'Desparasitación';
      case 'FLEA_TICK': return 'Antipulgas';
      default: return 'Tratamiento';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Tratamientos y Vacunas
          </h3>
          <Link
            href={`/dashboard/pets/${pet.id}/treatment/new`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            ➕ Nuevo Tratamiento
          </Link>
        </div>
        
        {treatments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💉</div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Sin tratamientos registrados
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Registra vacunas, desparasitaciones y otros tratamientos.
            </p>
            <Link
              href={`/dashboard/pets/${pet.id}/treatment/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              Registrar Primer Tratamiento
            </Link>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {treatments.map((treatment, treatmentIdx) => (
                <li key={treatment.id}>
                  <div className="relative pb-8">
                    {treatmentIdx !== treatments.length - 1 && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full ${getTreatmentColor(treatment.treatmentType)} flex items-center justify-center ring-8 ring-white dark:ring-gray-800`}>
                          <span className="text-white text-xs">
                            {getTreatmentIcon(treatment.treatmentType)}
                          </span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {getTreatmentName(treatment.treatmentType)}: {treatment.productName}
                          </p>

                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {treatment.batchNumber && (
                              <div>
                                <span className="font-medium">Lote:</span> {treatment.batchNumber}
                              </div>
                            )}
                            {treatment.manufacturer && (
                              <div>
                                <span className="font-medium">Laboratorio:</span> {treatment.manufacturer}
                              </div>
                            )}
                            {treatment.vaccineStage && (
                              <div>
                                <span className="font-medium">Etapa:</span> {treatment.vaccineStage}
                              </div>
                            )}
                            {treatment.dewormingType && (
                              <div>
                                <span className="font-medium">Tipo:</span> {treatment.dewormingType}
                              </div>
                            )}
                          </div>

                          {treatment.notes && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{treatment.notes}</p>
                            </div>
                          )}

                          {treatment.staff && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Aplicado por: <span className="font-medium">{treatment.staff.name}</span>
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={treatment.administrationDate.toISOString()}>
                            {format(new Date(treatment.administrationDate), 'dd MMM yyyy', { locale: es })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 