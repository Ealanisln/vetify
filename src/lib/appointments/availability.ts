/**
 * Availability Utility Functions
 *
 * Extracted from src/app/api/appointments/availability/route.ts
 * for better testability and reusability.
 */

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
 * Formats a Date as an ISO-like local datetime string without the 'Z' suffix.
 * This prevents automatic UTC conversion when sending to the client.
 *
 * @param date - The date to format
 * @returns String in format "YYYY-MM-DDTHH:mm:ss"
 *
 * @example
 * formatLocalDateTime(new Date(2026, 0, 15, 10, 30, 0))
 * // Returns: "2026-01-15T10:30:00"
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Generates available time slots for a given date based on business hours.
 *
 * Slots are generated from the start of business hours to the end,
 * excluding the lunch break period if configured.
 *
 * @param date - The date to generate slots for
 * @param businessHours - Business hours configuration
 * @returns Array of TimeSlot objects with dateTime and period
 *
 * @example
 * const slots = generateDaySlots(new Date(2026, 0, 15), {
 *   start: 9, startMinute: 0,
 *   end: 17, endMinute: 0,
 *   lunchStart: 12, lunchStartMinute: 0,
 *   lunchEnd: 13, lunchEndMinute: 0,
 *   slotDuration: 30
 * });
 * // Returns slots from 9:00-12:00 (morning) and 13:00-17:00 (afternoon)
 */
export function generateDaySlots(date: Date, businessHours: BusinessHours): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Create a new date using the exact year, month, day to avoid timezone issues
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Morning slots (start - lunch or end if no lunch)
  const morningEnd = businessHours.lunchStart ? businessHours.lunchStart : businessHours.end;
  for (let hour = businessHours.start; hour < morningEnd; hour++) {
    const startMinute = hour === businessHours.start ? businessHours.startMinute : 0;
    // For morning slots, always go to full hour unless it's the last hour before lunch
    const endMinute = 60;

    for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
      // Create slot time with explicit year, month, day to maintain local timezone
      const slotTime = new Date(year, month, day, hour, minute, 0, 0);

      slots.push({
        dateTime: slotTime,
        period: 'morning'
      });
    }
  }

  // Afternoon slots (lunch end - end) - only if there's a lunch break
  if (businessHours.lunchStart && businessHours.lunchEnd) {
    for (let hour = businessHours.lunchEnd; hour < businessHours.end; hour++) {
      const startMinute = hour === businessHours.lunchEnd ? businessHours.lunchEndMinute : 0;
      // For afternoon slots, always go to full hour except for the last hour
      // If endMinute is 0 (meaning end at the top of the hour), treat it as if it goes to the full previous hour
      const endMinute = hour === businessHours.end - 1 ? (businessHours.endMinute || 60) : 60;

      for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
        // Create slot time with explicit year, month, day to maintain local timezone
        const slotTime = new Date(year, month, day, hour, minute, 0, 0);

        slots.push({
          dateTime: slotTime,
          period: 'afternoon'
        });
      }
    }
  }

  return slots;
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
 * Checks if a given time falls within business hours.
 *
 * @param date - The date/time to check
 * @param businessHours - Business hours configuration
 * @returns true if the time is within business hours (excluding lunch)
 */
export function isWithinBusinessHours(date: Date, businessHours: BusinessHours): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
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
