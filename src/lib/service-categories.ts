import type { ServiceCategory } from '@prisma/client';

/**
 * Dashboard labels for the ServiceCategory enum. Single source for the
 * settings list, its filter and the service modal.
 *
 * Kept as a plain record (type-only Prisma import) so client bundles and
 * jsdom tests don't depend on the runtime `@prisma/client` enum object.
 */
export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CONSULTATION: 'Consultas',
  SURGERY: 'Cirugías',
  VACCINATION: 'Vacunación',
  DEWORMING: 'Desparasitación',
  PREVENTATIVE_CARE: 'Medicina Preventiva',
  GROOMING: 'Estética',
  BOARDING: 'Pensión / Hotel',
  DENTAL_CARE: 'Cuidado Dental',
  LABORATORY_TEST: 'Análisis de Laboratorio',
  IMAGING_RADIOLOGY: 'Radiografías/Imágenes',
  HOSPITALIZATION: 'Hospitalización',
  EMERGENCY_CARE: 'Atención de Emergencia',
  EUTHANASIA: 'Eutanasia',
  OTHER: 'Otros',
};

/** Enum values in display order. */
export const SERVICE_CATEGORIES = Object.keys(SERVICE_CATEGORY_LABELS) as [
  ServiceCategory,
  ...ServiceCategory[],
];

export function getServiceCategoryLabel(category: ServiceCategory | string): string {
  return SERVICE_CATEGORY_LABELS[category as ServiceCategory] ?? category;
}
