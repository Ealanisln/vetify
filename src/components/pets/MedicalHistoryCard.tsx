import { MedicalHistory, Staff } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type MedicalHistoryWithStaff = MedicalHistory & { staff?: Staff | null };

interface MedicalHistoryCardProps {
  pet: {
    name: string;
    medicalHistories: MedicalHistoryWithStaff[];
  };
}

export function MedicalHistoryCard({ pet }: MedicalHistoryCardProps) {
  const histories = pet.medicalHistories || [];

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Historial Médico
          </h3>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            ➕ Nueva Consulta
          </button>
        </div>
        
        {histories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏥</div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Sin historial médico
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Comienza registrando la primera consulta de {pet.name}.
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Registrar Primera Consulta
            </button>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {histories.map((history, historyIdx) => (
                <li key={history.id}>
                  <div className="relative pb-8">
                    {historyIdx !== histories.length - 1 && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <span className="text-white text-xs">🩺</span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {history.reasonForVisit}
                          </p>
                          
                          {history.diagnosis && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-900">Diagnóstico:</p>
                              <p className="text-sm text-blue-800">{history.diagnosis}</p>
                            </div>
                          )}
                          
                          {history.treatment && (
                            <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm font-medium text-green-900">Tratamiento:</p>
                              <p className="text-sm text-green-800">{history.treatment}</p>
                            </div>
                          )}
                          
                          {history.notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm font-medium text-gray-900">Notas:</p>
                              <p className="text-sm text-gray-700">{history.notes}</p>
                            </div>
                          )}
                          
                          {history.staff && (
                            <p className="mt-2 text-xs text-gray-500">
                              Atendido por: <span className="font-medium">{history.staff.name}</span>
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={history.visitDate.toISOString()}>
                            {format(new Date(history.visitDate), 'dd MMM yyyy', { locale: es })}
                          </time>
                          <p className="text-xs text-gray-400">
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