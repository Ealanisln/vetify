import { MedicalHistory, Staff } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Plus, Stethoscope, FileText, Activity, StickyNote, User, Calendar } from 'lucide-react';

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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" data-testid="medical-history-card">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#75a99c]/10 dark:bg-[#75a99c]/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-[#5b9788] dark:text-[#75a99c]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Historial Médico
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {histories.length} {histories.length === 1 ? 'consulta' : 'consultas'} registradas
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/pets/${pet.id}/consultation/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#75a99c] hover:bg-[#5b9788] text-white transition-colors shadow-sm"
            data-testid="new-consultation-button"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Consulta</span>
            <span className="sm:hidden">Consulta</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {histories.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Sin historial médico
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto">
              Comienza registrando la primera consulta de {pet.name}.
            </p>
            <Link
              href={`/dashboard/pets/${pet.id}/consultation/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#75a99c] hover:bg-[#5b9788] text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Primera Consulta
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((history, historyIdx) => (
              <div
                key={history.id}
                className={`relative ${historyIdx !== histories.length - 1 ? 'pb-4' : ''}`}
              >
                {/* Timeline connector */}
                {historyIdx !== histories.length - 1 && (
                  <span
                    className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#75a99c]/40 to-gray-200 dark:to-gray-700"
                    aria-hidden="true"
                  />
                )}

                {/* Card for each consultation */}
                <div className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-[#75a99c] flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-sm">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {history.reasonForVisit}
                      </h4>
                      <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <time dateTime={history.visitDate.toISOString()}>
                          {format(new Date(history.visitDate), 'dd MMM yyyy', { locale: es })}
                        </time>
                      </div>
                    </div>

                    {/* Info blocks with proper spacing */}
                    <div className="space-y-3">
                      {history.diagnosis && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                              Diagnóstico
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed pl-6">
                            {history.diagnosis}
                          </p>
                        </div>
                      )}

                      {history.treatment && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                              Tratamiento
                            </span>
                          </div>
                          <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed pl-6">
                            {history.treatment}
                          </p>
                        </div>
                      )}

                      {history.notes && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                              Notas
                            </span>
                          </div>
                          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed pl-6">
                            {history.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer - Staff info */}
                    {history.staff && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        <span>Atendido por</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{history.staff.name}</span>
                        <span className="mx-1">•</span>
                        <span>{format(new Date(history.visitDate), 'HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 