/** Spanish labels for clinical enums shown to users. */
import type { DewormingType, VaccinationStage } from '@prisma/client';

export const VACCINE_STAGE_LABELS: Record<VaccinationStage, string> = {
  PUPPY_KITTEN: 'Cachorro/Gatito',
  ADULT: 'Adulto',
  SENIOR: 'Senior',
  BOOSTER: 'Refuerzo',
};

export const DEWORMING_TYPE_LABELS: Record<DewormingType, string> = {
  INTERNAL: 'Interna',
  EXTERNAL: 'Externa',
  BOTH: 'Interna y externa',
};

/** Label for a stored enum value; unknown values are shown as stored. */
export function labelFor(labels: Record<string, string>, value: string): string {
  return labels[value] ?? value;
}

/**
 * reasonForVisit of the MedicalHistory rows that hold vital signs (there is no
 * dedicated model); stats use it to leave them out of consultations.
 */
export const VITAL_SIGNS_REASON = 'Registro de Signos Vitales';
