/**
 * Date handling for clinical records (vaccinations, treatments, visits).
 *
 * Clinical forms send two kinds of values:
 * - date-only pickers (`<input type="date">` + `new Date(value)`), which arrive
 *   as UTC midnight of the picked day;
 * - real instants (defaults such as `new Date()`, or datetime-local values
 *   converted in the browser).
 *
 * Date-only values are stored at noon in the clinic timezone so that the
 * calendar day survives any formatter, including the UTC ones still used by
 * some email templates.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma';
import { clinicDateTime, getClinicTimeZone } from './clinic-timezone';

type TenantReader = Pick<PrismaClient, 'tenant'> | Prisma.TransactionClient;

/** Clinic timezone of an already-loaded tenant ({ countryCode, tenantSettings }). */
export const getClinicTimeZoneFor = getClinicTimeZone;

/** Resolves a tenant's clinic timezone (TenantSettings.timezone, else its country). */
export async function getTenantTimeZone(tenantId: string, db: TenantReader = prisma): Promise<string> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { countryCode: true, tenantSettings: { select: { timezone: true } } },
  });
  return getClinicTimeZone(tenant);
}

function isUtcMidnight(value: Date): boolean {
  return (
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

/**
 * The clinic calendar day (yyyy-MM-dd) a form date refers to. UTC midnight is
 * read as a date-only picker value; anything else is converted to the clinic day.
 */
export function clinicCalendarDate(value: Date, timeZone: string): string {
  if (isUtcMidnight(value)) return value.toISOString().slice(0, 10);
  return formatInTimeZone(value, timeZone, 'yyyy-MM-dd');
}

/** Normalizes a form date to noon of its clinic calendar day. */
export function clinicDateAtNoon(value: Date, timeZone: string): Date {
  return clinicDateTime(clinicCalendarDate(value, timeZone), '12:00', timeZone);
}

/** Whole clinic calendar days from `from` to `to` (negative when `to` is earlier). */
export function clinicDaysBetween(from: Date, to: Date, timeZone: string): number {
  const toUtcDay = (value: Date) => {
    const [y, m, d] = formatInTimeZone(value, timeZone, 'yyyy-MM-dd').split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtcDay(to) - toUtcDay(from)) / (24 * 60 * 60 * 1000));
}

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;

/**
 * Parses a visit date sent by a form. A wall-clock value without offset
 * (`datetime-local`, e.g. "2026-11-10T10:30") is read in the clinic timezone;
 * a value with an offset or `Z` is taken as is. Returns null when invalid.
 */
export function parseClinicDateTimeInput(value: string, timeZone: string): Date | null {
  const parsed = LOCAL_DATE_TIME.test(value) ? fromZonedTime(value, timeZone) : new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a clinical date in the clinic timezone (Spanish locale).
 * With `dateOnly`, legacy rows saved as UTC midnight by date-only pickers keep
 * their calendar day instead of shifting to the previous one.
 */
export function formatClinicDate(
  value: Date | string,
  timeZone: string,
  pattern: string,
  options: { dateOnly?: boolean } = {}
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const zone = options.dateOnly && isUtcMidnight(date) ? 'UTC' : timeZone;
  return formatInTimeZone(date, zone, pattern, { locale: es });
}
