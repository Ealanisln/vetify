/**
 * Utilidades centralizadas para formateo de fechas y horas
 * Locale: es-MX (México)
 */

const LOCALE = 'es-MX';

/**
 * Convierte string o Date a objeto Date
 */
function toDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/*
 * The optional `timeZone` (IANA, e.g. the clinic's from getClinicTimeZone)
 * pins the output to that zone. Without it the runtime's zone is used, which
 * is fine in the browser but means UTC on the server: anything rendered
 * server-side for a person (emails, PDFs) must pass the clinic timezone.
 */

/**
 * Formato corto de fecha: "4 dic 2025"
 */
export function formatDate(date: Date | string, timeZone?: string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  });
}

/**
 * Formato largo de fecha: "jueves, 4 de diciembre de 2025"
 */
export function formatDateLong(date: Date | string, timeZone?: string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  });
}

/**
 * Solo hora en formato 24h: "10:30"
 */
export function formatTime(date: Date | string, timeZone?: string): string {
  return toDate(date).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
}

/**
 * Fecha y hora combinadas: "4 dic 2025, 10:30"
 */
export function formatDateTime(date: Date | string, timeZone?: string): string {
  const d = toDate(date);
  return `${formatDate(d, timeZone)}, ${formatTime(d, timeZone)}`;
}

/**
 * Fecha y hora en formato largo: "jueves, 4 de diciembre de 2025, 10:30"
 */
export function formatDateTimeLong(date: Date | string, timeZone?: string): string {
  const d = toDate(date);
  return `${formatDateLong(d, timeZone)}, ${formatTime(d, timeZone)}`;
}

/**
 * Formato para inputs HTML de tipo date: "2025-12-04"
 */
export function formatDateForInput(date: Date | string): string {
  return toDate(date).toISOString().split('T')[0];
}

/**
 * Formato con día de la semana corto: "jue, 4 dic"
 */
export function formatDateWithWeekday(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formato para calendario (día de la semana y hora): "jue 4 dic, 10:30"
 */
export function formatCalendarDateTime(date: Date | string): string {
  const d = toDate(date);
  return `${formatDateWithWeekday(d)}, ${formatTime(d)}`;
}

/**
 * Formato relativo simple para fechas cercanas
 * Hoy, Mañana, o la fecha normal
 */
export function formatRelativeDate(date: Date | string): string {
  const d = toDate(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Comparar solo fechas sin horas
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Hoy';
  }
  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return 'Mañana';
  }
  return formatDate(d);
}

/**
 * Formato de moneda MXN
 */
export function formatCurrency(amount: number, currency: string = 'MXN'): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
  }).format(amount);
}
