import { MedicalHistory, Staff } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

type MedicalHistoryWithStaff = MedicalHistory & { staff?: Staff | null };

interface MedicalHistoryCardProps {
  pet: {
    id: string;
    name: string;
    medicalHistories: MedicalHistoryWithStaff[];
  };
}

export function MedicalHistoryCard({ pet }: MedicalHistoryCardProps) {
  const histories = pet.medicalHistories || [];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700" data-testid="medical-history-card">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Historial Médico
          </h3>
          <Link
            href={`/dashboard/pets/${pet.id}/consultation/new`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
            data-testid="new-consultation-button"
          >
            ➕ Nueva Consulta
          </Link>
        </div>
        
        {histories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏥</div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Sin historial médico
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Comienza registrando la primera consulta de {pet.name}.
            </p>
            <Link
              href={`/dashboard/pets/${pet.id}/consultation/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              Registrar Primera Consulta
            </Link>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {histories.map((history, historyIdx) => (
                <li key={history.id}>
                  <div className="relative pb-8">
                    {historyIdx !== histories.length - 1 && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                          <span className="text-white text-xs">🩺</span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {history.reasonForVisit}
                          </p>

                          {history.diagnosis && (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Diagnóstico:</p>
                              <p className="text-sm text-blue-800 dark:text-blue-300">{history.diagnosis}</p>
                            </div>
                          )}

                          {history.treatment && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-sm font-medium text-green-900 dark:text-green-200">Tratamiento:</p>
                              <p className="text-sm text-green-800 dark:text-green-300">{history.treatment}</p>
                            </div>
                          )}

                          {history.notes && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notas:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{history.notes}</p>
                            </div>
                          )}

                          {history.staff && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Atendido por: <span className="font-medium">{history.staff.name}</span>
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={history.visitDate.toISOString()}>
                            {format(new Date(history.visitDate), 'dd MMM yyyy', { locale: es })}
                          </time>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {format(new Date(history.visitDate), 'HH:mm')}
                          </p>
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