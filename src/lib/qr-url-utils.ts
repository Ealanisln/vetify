/**
 * QR URL Generation Utilities
 *
 * Provides helper functions to generate clinic-specific URLs for QR codes.
 * These URLs point to the public-facing pages of each clinic.
 */

import { getBaseUrl } from '@/lib/seo/config';

/**
 * Generates the landing page URL for a clinic
 * @param clinicSlug - The unique URL slug for the clinic
 * @returns The full URL to the clinic's landing page
 */
export function getClinicUrl(clinicSlug: string): string {
  return `${getBaseUrl()}/${clinicSlug}`;
}

/**
 * Generates the booking/appointments page URL for a clinic
 * @param clinicSlug - The unique URL slug for the clinic
 * @returns The full URL to the clinic's booking page
 */
export function getClinicBookingUrl(clinicSlug: string): string {
  return `${getBaseUrl()}/${clinicSlug}/agendar`;
}

/**
 * Generates the services page URL for a clinic
 * @param clinicSlug - The unique URL slug for the clinic
 * @returns The full URL to the clinic's services page
 */
export function getClinicServicesUrl(clinicSlug: string): string {
  return `${getBaseUrl()}/${clinicSlug}/servicios`;
}

/**
 * Generates a clinic URL based on the target page type
 * @param clinicSlug - The unique URL slug for the clinic
 * @param targetPage - The type of page to link to
 * @returns The full URL to the specified page
 */
export function getClinicPageUrl(
  clinicSlug: string,
  targetPage: 'landing' | 'booking' | 'services'
): string {
  switch (targetPage) {
    case 'landing':
      return getClinicUrl(clinicSlug);
    case 'booking':
      return getClinicBookingUrl(clinicSlug);
    case 'services':
      return getClinicServicesUrl(clinicSlug);
    default:
      return getClinicUrl(clinicSlug);
  }
}

/**
 * Size options for QR codes with descriptions
 */
export const QR_SIZE_OPTIONS = [
  { value: 128, label: 'Pequeño (128px)', description: 'Para tarjetas de presentación' },
  { value: 256, label: 'Mediano (256px)', description: 'Para folletos y flyers' },
  { value: 512, label: 'Grande (512px)', description: 'Para carteles y posters' },
  { value: 1024, label: 'Extra grande (1024px)', description: 'Para impresiones de alta calidad' },
] as const;

/**
 * Target page options for QR codes
 */
export const QR_TARGET_PAGE_OPTIONS = [
  { value: 'landing', label: 'Página Principal', description: 'Página de inicio de la clínica' },
  { value: 'booking', label: 'Agendar Cita', description: 'Página para agendar citas online' },
  { value: 'services', label: 'Servicios', description: 'Lista de servicios ofrecidos' },
] as const;

export type QrTargetPage = (typeof QR_TARGET_PAGE_OPTIONS)[number]['value'];
export type QrSize = (typeof QR_SIZE_OPTIONS)[number]['value'];
