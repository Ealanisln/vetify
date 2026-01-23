import { TreatmentRecord, Staff } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Plus, Syringe, Bug, Shield, Pill, Calendar, User, Tag, Building2, StickyNote, Layers } from 'lucide-react';

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
      case 'VACCINATION': return Syringe;
      case 'DEWORMING': return Bug;
      case 'FLEA_TICK': return Shield;
      default: return Pill;
    }
  };

  const getTreatmentColors = (type: string) => {
    switch (type) {
      case 'VACCINATION': return {
        bg: 'bg-blue-500',
        light: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-100 dark:border-blue-800/50',
        text: 'text-blue-700 dark:text-blue-300',
      };
      case 'DEWORMING': return {
        bg: 'bg-amber-500',
        light: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-100 dark:border-amber-800/50',
        text: 'text-amber-700 dark:text-amber-300',
      };
      case 'FLEA_TICK': return {
        bg: 'bg-rose-500',
        light: 'bg-rose-50 dark:bg-rose-900/20',
        border: 'border-rose-100 dark:border-rose-800/50',
        text: 'text-rose-700 dark:text-rose-300',
      };
      default: return {
        bg: 'bg-purple-500',
        light: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-100 dark:border-purple-800/50',
        text: 'text-purple-700 dark:text-purple-300',
      };
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Syringe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Tratamientos y Vacunas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {treatments.length} {treatments.length === 1 ? 'tratamiento' : 'tratamientos'} registrados
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/pets/${pet.id}/treatment/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#75a99c] hover:bg-[#5b9788] text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Tratamiento</span>
            <span className="sm:hidden">Tratamiento</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {treatments.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <Syringe className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Sin tratamientos registrados
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto">
              Registra vacunas, desparasitaciones y otros tratamientos.
            </p>
            <Link
              href={`/dashboard/pets/${pet.id}/treatment/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#75a99c] hover:bg-[#5b9788] text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Primer Tratamiento
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {treatments.map((treatment, treatmentIdx) => {
              const Icon = getTreatmentIcon(treatment.treatmentType);
              const colors = getTreatmentColors(treatment.treatmentType);
              const hasDetails = treatment.batchNumber || treatment.manufacturer || treatment.vaccineStage || treatment.dewormingType;

              return (
                <div
                  key={treatment.id}
                  className={`relative ${treatmentIdx !== treatments.length - 1 ? 'pb-4' : ''}`}
                >
                  {/* Timeline connector */}
                  {treatmentIdx !== treatments.length - 1 && (
                    <span
                      className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-purple-300/40 to-gray-200 dark:to-gray-700"
                      aria-hidden="true"
                    />
                  )}

                  {/* Card for each treatment */}
                  <div className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.border} ${colors.text} border mb-1.5`}>
                            <Icon className="w-3 h-3" />
                            {getTreatmentName(treatment.treatmentType)}
                          </span>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                            {treatment.productName}
                          </h4>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <time dateTime={treatment.administrationDate.toISOString()}>
                            {format(new Date(treatment.administrationDate), 'dd MMM yyyy', { locale: es })}
                          </time>
                        </div>
                      </div>

                      {/* Details grid */}
                      {hasDetails && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {treatment.batchNumber && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Lote:</span> {treatment.batchNumber}
                              </span>
                            </div>
                          )}
                          {treatment.manufacturer && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Lab:</span> {treatment.manufacturer}
                              </span>
                            </div>
                          )}
                          {treatment.vaccineStage && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                              <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Etapa:</span> {treatment.vaccineStage}
                              </span>
                            </div>
                          )}
                          {treatment.dewormingType && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                              <Bug className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Tipo:</span> {treatment.dewormingType}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {treatment.notes && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                              Notas
                            </span>
                          </div>
                          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed pl-6">
                            {treatment.notes}
                          </p>
                        </div>
                      )}

                      {/* Footer - Staff info */}
                      {treatment.staff && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <User className="w-3.5 h-3.5" />
                          <span>Aplicado por</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{treatment.staff.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 