/**
 * Availability Utility Functions
 *
 * Shared by the dashboard and public availability routes. All wall-clock
 * values (business hours, slot labels) are clinic time; all Dates are
 * absolute instants.
 */

import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { clinicDateTime } from '../clinic-timezone';

export interface BusinessHours {
  start: number;
  startMinute: number;
  end: number;
  endMinute: number;
  lunchStart: number | null;
  lunchStartMinute: number;
  lunchEnd: number | null;
  lunchEndMinute: number;
  slotDuration: number;
}

export interface TimeSlot {
  dateTime: Date;
  period: 'morning' | 'afternoon';
}

/**
 * Default business hours configuration.
 * Used as fallback when database configuration is unavailable.
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  start: 8,
  startMinute: 0,
  end: 18,
  endMinute: 0,
  lunchStart: 13,
  lunchStartMinute: 0,
  lunchEnd: 14,
  lunchEndMinute: 0,
  slotDuration: 15,
};

/**
 * Generates the time slots of a clinic calendar day.
 *
 * Business hours are clinic wall-clock times, so every slot is built in the
 * clinic timezone and returned as an absolute instant. Never build slots with
 * `new Date(y, m, d, h)`: that uses the server timezone (UTC in production).
 *
 * @param date - Clinic calendar date, yyyy-MM-dd
 * @param businessHours - Business hours configuration (clinic wall-clock)
 * @param timeZone - IANA timezone of the clinic
 *
 * @example
 * generateDaySlots('2026-11-16', { start: 9, ... }, 'America/Mexico_City')[0].dateTime
 * // 2026-11-16T15:00:00.000Z
 */
export function generateDaySlots(
  date: string,
  businessHours: BusinessHours,
  timeZone: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const at = (hour: number, minute: number) =>
    clinicDateTime(date, `${pad(hour)}:${pad(minute)}`, timeZone);

  // Morning slots (start - lunch or end if no lunch)
  const morningEnd = businessHours.lunchStart ? businessHours.lunchStart : businessHours.end;
  for (let hour = businessHours.start; hour < morningEnd; hour++) {
    const startMinute = hour === businessHours.start ? businessHours.startMinute : 0;
    const endMinute = 60;

    for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
      slots.push({ dateTime: at(hour, minute), period: 'morning' });
    }
  }

  // Afternoon slots (lunch end - end) - only if there's a lunch break
  if (businessHours.lunchStart && businessHours.lunchEnd) {
    for (let hour = businessHours.lunchEnd; hour < businessHours.end; hour++) {
      const startMinute = hour === businessHours.lunchEnd ? businessHours.lunchEndMinute : 0;
      // If endMinute is 0 (closing on the hour), the previous hour runs to its end
      const endMinute = hour === businessHours.end - 1 ? (businessHours.endMinute || 60) : 60;

      for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
        slots.push({ dateTime: at(hour, minute), period: 'afternoon' });
      }
    }
  }

  return slots;
}

export interface SerializedSlot {
  /** Absolute instant, ISO-8601 with Z. Send it back as-is when booking. */
  dateTime: string;
  /** Clinic wall-clock label, HH:mm */
  time: string;
  /** Clinic wall-clock label, 12h */
  displayTime: string;
  period: TimeSlot['period'];
}

/** Serializes a slot for the API: absolute instant plus clinic-time labels. */
export function serializeSlot(slot: TimeSlot, timeZone: string): SerializedSlot {
  return {
    dateTime: slot.dateTime.toISOString(),
    time: formatInTimeZone(slot.dateTime, timeZone, 'HH:mm'),
    displayTime: formatInTimeZone(slot.dateTime, timeZone, 'h:mm a', { locale: es }),
    period: slot.period,
  };
}

export interface BusyInterval {
  start: Date;
  durationMinutes: number;
}

/**
 * Removes slots that overlap a busy interval (half-open: a slot may start
 * exactly when an appointment ends) or start at/before `notBefore`.
 */
export function filterAvailableSlots(
  slots: TimeSlot[],
  options: { durationMinutes: number; busy: BusyInterval[]; notBefore?: Date }
): TimeSlot[] {
  const { durationMinutes, busy, notBefore } = options;
  return slots.filter((slot) => {
    const slotStart = slot.dateTime.getTime();
    if (notBefore && slotStart <= notBefore.getTime()) return false;
    const slotEnd = slotStart + durationMinutes * 60_000;
    return !busy.some(({ start, durationMinutes: busyMinutes }) => {
      const busyStart = start.getTime();
      const busyEnd = busyStart + busyMinutes * 60_000;
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Parses a time string in HH:mm format to hours and minutes.
 *
 * @param timeString - Time string in "HH:mm" format
 * @returns Object with hour and minute properties
 *
 * @example
 * parseTimeString("09:30") // { hour: 9, minute: 30 }
 * parseTimeString("14:00") // { hour: 14, minute: 0 }
 */
export function parseTimeString(timeString: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = timeString.split(':');
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10),
  };
}

/**
 * Checks if an instant falls within business hours, read in clinic time.
 *
 * @param date - The instant to check
 * @param businessHours - Business hours configuration (clinic wall-clock)
 * @param timeZone - IANA timezone of the clinic
 * @returns true if the time is within business hours (excluding lunch)
 */
export function isWithinBusinessHours(
  date: Date,
  businessHours: BusinessHours,
  timeZone: string
): boolean {
  const [hour, minute] = formatInTimeZone(date, timeZone, 'H:m').split(':').map(Number);
  const totalMinutes = hour * 60 + minute;

  const startMinutes = businessHours.start * 60 + businessHours.startMinute;
  const endMinutes = businessHours.end * 60 + businessHours.endMinute;

  // Check if outside business hours
  if (totalMinutes < startMinutes || totalMinutes >= endMinutes) {
    return false;
  }

  // Check if during lunch break
  if (businessHours.lunchStart !== null && businessHours.lunchEnd !== null) {
    const lunchStartMinutes = businessHours.lunchStart * 60 + businessHours.lunchStartMinute;
    const lunchEndMinutes = businessHours.lunchEnd * 60 + businessHours.lunchEndMinute;

    if (totalMinutes >= lunchStartMinutes && totalMinutes < lunchEndMinutes) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates the total number of available slot minutes in a day.
 *
 * @param businessHours - Business hours configuration
 * @returns Total available minutes (excluding lunch)
 */
export function calculateAvailableMinutes(businessHours: BusinessHours): number {
  const startMinutes = businessHours.start * 60 + businessHours.startMinute;
  const endMinutes = businessHours.end * 60 + businessHours.endMinute;

  let totalMinutes = endMinutes - startMinutes;

  // Subtract lunch break if configured
  if (businessHours.lunchStart !== null && businessHours.lunchEnd !== null) {
    const lunchStartMinutes = businessHours.lunchStart * 60 + businessHours.lunchStartMinute;
    const lunchEndMinutes = businessHours.lunchEnd * 60 + businessHours.lunchEndMinute;
    totalMinutes -= (lunchEndMinutes - lunchStartMinutes);
  }

  return totalMinutes;
}
