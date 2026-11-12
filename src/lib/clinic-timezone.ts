/**
 * Clinic timezone resolution and clinic-local date helpers.
 *
 * Servers run in UTC, so anything that turns a clinic wall-clock time
 * ("09:00 on 2026-11-16") into an instant, or an instant into a clinic
 * calendar day, must go through these helpers instead of `new Date(y, m, d, h)`
 * or `setHours`, which silently use the server's timezone.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const DEFAULT_CLINIC_TIME_ZONE = 'America/Mexico_City';

/**
 * Representative timezone per supported onboarding country. Countries that
 * span several zones use the capital's; a clinic elsewhere can override it
 * through TenantSettings.timezone. US is left out on purpose (no sensible
 * single zone) and falls back to the default.
 */
const COUNTRY_TIME_ZONES: Record<string, string> = {
  MX: 'America/Mexico_City',
  AR: 'America/Argentina/Buenos_Aires',
  BO: 'America/La_Paz',
  BR: 'America/Sao_Paulo',
  CL: 'America/Santiago',
  CO: 'America/Bogota',
  CR: 'America/Costa_Rica',
  DO: 'America/Santo_Domingo',
  EC: 'America/Guayaquil',
  GT: 'America/Guatemala',
  PA: 'America/Panama',
  PE: 'America/Lima',
  PY: 'America/Asuncion',
  SV: 'America/El_Salvador',
  UY: 'America/Montevideo',
};

/**
 * Values that mean "nobody chose a timezone". Signup historically stored
 * 'UTC' and the column defaults to it, so it cannot be trusted.
 */
const PLACEHOLDER_TIME_ZONES = new Set(['UTC', 'ETC/UTC', 'GMT', 'ETC/GMT', 'Z']);

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function timeZoneForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return DEFAULT_CLINIC_TIME_ZONE;
  return COUNTRY_TIME_ZONES[countryCode.toUpperCase()] ?? DEFAULT_CLINIC_TIME_ZONE;
}

export interface ClinicTimeZoneSource {
  countryCode?: string | null;
  tenantSettings?: { timezone?: string | null } | null;
}

/**
 * Resolves the timezone a clinic's schedule lives in:
 * a deliberate (non-UTC, valid) TenantSettings.timezone, else the country's
 * zone, else America/Mexico_City.
 */
export function getClinicTimeZone(source: ClinicTimeZoneSource | null | undefined): string {
  const configured = source?.tenantSettings?.timezone?.trim();
  if (
    configured &&
    !PLACEHOLDER_TIME_ZONES.has(configured.toUpperCase()) &&
    isValidTimeZone(configured)
  ) {
    return configured;
  }
  return timeZoneForCountry(source?.countryCode);
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Normalizes a request date to a clinic calendar date (yyyy-MM-dd).
 * A plain date is taken as already being a clinic date; a full timestamp is
 * converted to the clinic's calendar day. Returns null when unparseable.
 */
export function parseClinicDate(input: string, timeZone: string): string | null {
  const match = DATE_ONLY.exec(input);
  if (match) {
    const [, y, m, d] = match.map(Number);
    const probe = new Date(Date.UTC(y, m - 1, d));
    const valid =
      probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
    return valid ? input : null;
  }
  const instant = new Date(input);
  if (isNaN(instant.getTime())) return null;
  return formatInTimeZone(instant, timeZone, 'yyyy-MM-dd');
}

/** Clinic wall-clock date + time (HH:mm) to the absolute instant. */
export function clinicDateTime(date: string, time: string, timeZone: string): Date {
  return fromZonedTime(`${date}T${time}:00`, timeZone);
}

/** First and last millisecond of a clinic calendar day, as instants. */
export function clinicDayRange(date: string, timeZone: string): { start: Date; end: Date } {
  const start = fromZonedTime(`${date}T00:00:00`, timeZone);
  const [y, m, d] = date.split('-').map(Number);
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const end = new Date(fromZonedTime(`${nextDay}T00:00:00`, timeZone).getTime() - 1);
  return { start, end };
}

/** Today's calendar date in the clinic. */
export function clinicToday(timeZone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
}

/** Day of week (0 = Sunday) of a yyyy-MM-dd calendar date. */
export function dayOfWeekForDate(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * The clinic calendar day of an instant, as a browser-local midnight Date.
 * For date pickers, which work in the browser's local dates: the picker
 * shows the clinic day, and format(date, 'yyyy-MM-dd') returns it.
 */
export function clinicPickerDate(instant: Date, timeZone: string): Date {
  const [y, m, d] = formatInTimeZone(instant, timeZone, 'yyyy-MM-dd').split('-').map(Number);
  return new Date(y, m - 1, d);
}
