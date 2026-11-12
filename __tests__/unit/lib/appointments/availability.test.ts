/**
 * Availability Utility Tests
 * VETIF-194: Add unit tests for availability slot generation
 *
 * Tests cover:
 * - generateDaySlots() - slot generation in the clinic timezone
 * - serializeSlot() / filterAvailableSlots() - absolute-instant serialization and conflicts
 * - parseTimeString() - time string parsing
 * - isWithinBusinessHours() - business hours validation
 * - calculateAvailableMinutes() - available minutes calculation
 * - Lunch break handling
 * - Edge cases (no lunch break, custom slot durations, etc.)
 */

import { formatInTimeZone } from 'date-fns-tz';
import {
  generateDaySlots,
  serializeSlot,
  filterAvailableSlots,
  parseTimeString,
  isWithinBusinessHours,
  calculateAvailableMinutes,
  DEFAULT_BUSINESS_HOURS,
  type BusinessHours,
} from '@/lib/appointments/availability';
import { clinicDateTime } from '@/lib/clinic-timezone';

// Every expectation is evaluated in the clinic timezone, so these tests hold
// regardless of the process TZ (production runs in UTC).
const TZ = 'America/Mexico_City';
const clinicHour = (d: Date) => Number(formatInTimeZone(d, TZ, 'H'));
const clinicMinute = (d: Date) => Number(formatInTimeZone(d, TZ, 'm'));
const clinicDay = (d: Date) => formatInTimeZone(d, TZ, 'yyyy-MM-dd');
const at = (date: string, time: string) => clinicDateTime(date, time, TZ);

describe('Availability Utilities', () => {
  describe('parseTimeString', () => {
    it('should parse standard time format', () => {
      const result = parseTimeString('09:30');
      expect(result).toEqual({ hour: 9, minute: 30 });
    });

    it('should parse single digit hour', () => {
      const result = parseTimeString('8:00');
      expect(result).toEqual({ hour: 8, minute: 0 });
    });

    it('should parse midnight', () => {
      const result = parseTimeString('00:00');
      expect(result).toEqual({ hour: 0, minute: 0 });
    });

    it('should parse 24-hour format', () => {
      const result = parseTimeString('23:59');
      expect(result).toEqual({ hour: 23, minute: 59 });
    });

    it('should parse afternoon time', () => {
      const result = parseTimeString('14:30');
      expect(result).toEqual({ hour: 14, minute: 30 });
    });
  });

  describe('DEFAULT_BUSINESS_HOURS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_BUSINESS_HOURS).toEqual({
        start: 8,
        startMinute: 0,
        end: 18,
        endMinute: 0,
        lunchStart: 13,
        lunchStartMinute: 0,
        lunchEnd: 14,
        lunchEndMinute: 0,
        slotDuration: 15,
      });
    });
  });

  describe('generateDaySlots', () => {
    const standardBusinessHours: BusinessHours = {
      start: 8,
      startMinute: 0,
      end: 18,
      endMinute: 0,
      lunchStart: 13,
      lunchStartMinute: 0,
      lunchEnd: 14,
      lunchEndMinute: 0,
      slotDuration: 30,
    };

    describe('basic slot generation', () => {
      it('should generate slots for a standard business day', () => {
        const date = '2026-01-15'; // Thursday Jan 15, 2026
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        expect(slots.length).toBeGreaterThan(0);
        expect(slots.every(slot => slot.dateTime instanceof Date)).toBe(true);
        expect(slots.every(slot => ['morning', 'afternoon'].includes(slot.period))).toBe(true);
      });

      it('should generate correct number of slots with 30-minute duration', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        // 8:00-13:00 = 5 hours = 10 slots (morning)
        // 14:00-18:00 = 4 hours = 8 slots (afternoon)
        // Total = 18 slots
        expect(slots.length).toBe(18);
      });

      it('should generate correct number of slots with 15-minute duration', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          ...standardBusinessHours,
          slotDuration: 15,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        // 8:00-13:00 = 5 hours = 20 slots (morning)
        // 14:00-18:00 = 4 hours = 16 slots (afternoon)
        // Total = 36 slots
        expect(slots.length).toBe(36);
      });

      it('should generate correct number of slots with 60-minute duration', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          ...standardBusinessHours,
          slotDuration: 60,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        // 8:00-13:00 = 5 hours = 5 slots (morning)
        // 14:00-18:00 = 4 hours = 4 slots (afternoon)
        // Total = 9 slots
        expect(slots.length).toBe(9);
      });
    });

    describe('morning slots', () => {
      it('should mark morning slots correctly', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);
        const morningSlots = slots.filter(s => s.period === 'morning');

        morningSlots.forEach(slot => {
          const hour = clinicHour(slot.dateTime);
          expect(hour).toBeGreaterThanOrEqual(8);
          expect(hour).toBeLessThan(13);
        });
      });

      it('should start morning slots at business start time', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);
        const firstSlot = slots[0];

        expect(clinicHour(firstSlot.dateTime)).toBe(8);
        expect(clinicMinute(firstSlot.dateTime)).toBe(0);
        expect(firstSlot.period).toBe('morning');
      });

      it('should end morning slots before lunch', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);
        const morningSlots = slots.filter(s => s.period === 'morning');
        const lastMorningSlot = morningSlots[morningSlots.length - 1];

        // With 30-minute slots, last morning slot should be 12:30
        expect(clinicHour(lastMorningSlot.dateTime)).toBe(12);
        expect(clinicMinute(lastMorningSlot.dateTime)).toBe(30);
      });
    });

    describe('afternoon slots', () => {
      it('should mark afternoon slots correctly', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);
        const afternoonSlots = slots.filter(s => s.period === 'afternoon');

        afternoonSlots.forEach(slot => {
          const hour = clinicHour(slot.dateTime);
          expect(hour).toBeGreaterThanOrEqual(14);
          expect(hour).toBeLessThan(18);
        });
      });

      it('should start afternoon slots after lunch', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);
        const afternoonSlots = slots.filter(s => s.period === 'afternoon');
        const firstAfternoonSlot = afternoonSlots[0];

        expect(clinicHour(firstAfternoonSlot.dateTime)).toBe(14);
        expect(clinicMinute(firstAfternoonSlot.dateTime)).toBe(0);
      });

      it('should end afternoon slots at business end time', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);
        const lastSlot = slots[slots.length - 1];

        // With 30-minute slots, last slot should be 17:30
        expect(clinicHour(lastSlot.dateTime)).toBe(17);
        expect(clinicMinute(lastSlot.dateTime)).toBe(30);
      });
    });

    describe('lunch break handling', () => {
      it('should not generate slots during lunch break', () => {
        const date = '2026-01-15';
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        const lunchSlots = slots.filter(slot => {
          const hour = clinicHour(slot.dateTime);
          return hour >= 13 && hour < 14;
        });

        expect(lunchSlots.length).toBe(0);
      });

      it('should handle no lunch break (all morning slots)', () => {
        const date = '2026-01-15';
        const noLunchHours: BusinessHours = {
          start: 8,
          startMinute: 0,
          end: 18,
          endMinute: 0,
          lunchStart: null,
          lunchStartMinute: 0,
          lunchEnd: null,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, noLunchHours, TZ);

        // All slots should be morning since there's no lunch break
        expect(slots.every(s => s.period === 'morning')).toBe(true);
        // 8:00-18:00 = 10 hours = 20 slots
        expect(slots.length).toBe(20);
      });

      it('should handle custom lunch times', () => {
        const date = '2026-01-15';
        const customLunchHours: BusinessHours = {
          start: 9,
          startMinute: 0,
          end: 17,
          endMinute: 0,
          lunchStart: 12,
          lunchStartMinute: 0,
          lunchEnd: 13,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, customLunchHours, TZ);

        // 9:00-12:00 = 3 hours = 6 slots (morning)
        // 13:00-17:00 = 4 hours = 8 slots (afternoon)
        expect(slots.length).toBe(14);

        // Verify no slots during 12:00-13:00
        const lunchSlots = slots.filter(slot => {
          const hour = clinicHour(slot.dateTime);
          return hour >= 12 && hour < 13;
        });
        expect(lunchSlots.length).toBe(0);
      });

      it('should handle lunch break with non-zero minutes', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          start: 9,
          startMinute: 0,
          end: 17,
          endMinute: 0,
          lunchStart: 12,
          lunchStartMinute: 30,
          lunchEnd: 13,
          lunchEndMinute: 30,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        // First afternoon slot should start at 13:30
        const afternoonSlots = slots.filter(s => s.period === 'afternoon');
        expect(clinicHour(afternoonSlots[0].dateTime)).toBe(13);
        expect(clinicMinute(afternoonSlots[0].dateTime)).toBe(30);
      });
    });

    describe('custom business hours', () => {
      it('should handle early start time', () => {
        const date = '2026-01-15';
        const earlyHours: BusinessHours = {
          start: 6,
          startMinute: 0,
          end: 14,
          endMinute: 0,
          lunchStart: 11,
          lunchStartMinute: 0,
          lunchEnd: 12,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, earlyHours, TZ);

        expect(clinicHour(slots[0].dateTime)).toBe(6);
      });

      it('should handle late end time', () => {
        const date = '2026-01-15';
        const lateHours: BusinessHours = {
          start: 12,
          startMinute: 0,
          end: 22,
          endMinute: 0,
          lunchStart: null,
          lunchStartMinute: 0,
          lunchEnd: null,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, lateHours, TZ);

        const lastSlot = slots[slots.length - 1];
        expect(clinicHour(lastSlot.dateTime)).toBe(21);
        expect(clinicMinute(lastSlot.dateTime)).toBe(30);
      });

      it('should handle non-zero start minute', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          start: 8,
          startMinute: 30,
          end: 17,
          endMinute: 0,
          lunchStart: 12,
          lunchStartMinute: 0,
          lunchEnd: 13,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        expect(clinicHour(slots[0].dateTime)).toBe(8);
        expect(clinicMinute(slots[0].dateTime)).toBe(30);
      });

      it('should handle short work day', () => {
        const date = '2026-01-15';
        const shortDay: BusinessHours = {
          start: 9,
          startMinute: 0,
          end: 13,
          endMinute: 0,
          lunchStart: null,
          lunchStartMinute: 0,
          lunchEnd: null,
          lunchEndMinute: 0,
          slotDuration: 60,
        };
        const slots = generateDaySlots(date, shortDay, TZ);

        // 9:00-13:00 = 4 hours = 4 slots
        expect(slots.length).toBe(4);
      });
    });

    describe('date handling', () => {
      it('should maintain the correct date for all slots', () => {
        const date = '2026-06-15'; // June 15, 2026
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        slots.forEach(slot => {
          expect(clinicDay(slot.dateTime)).toBe('2026-06-15');
        });
      });

      it('should handle month boundaries', () => {
        const date = '2026-01-31'; // Jan 31, 2026
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        slots.forEach(slot => {
          expect(clinicDay(slot.dateTime)).toBe('2026-01-31');
        });
      });

      it('should handle year boundaries', () => {
        const date = '2026-12-31'; // Dec 31, 2026
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        slots.forEach(slot => {
          expect(clinicDay(slot.dateTime)).toBe('2026-12-31');
        });
      });

      it('should handle leap year February', () => {
        const date = '2028-02-29'; // Feb 29, 2028 (leap year)
        const slots = generateDaySlots(date, standardBusinessHours, TZ);

        slots.forEach(slot => {
          expect(clinicDay(slot.dateTime)).toBe('2028-02-29');
        });
      });
    });

    describe('edge cases', () => {
      it('should handle minimum slot duration (15 minutes)', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          start: 10,
          startMinute: 0,
          end: 11,
          endMinute: 0,
          lunchStart: null,
          lunchStartMinute: 0,
          lunchEnd: null,
          lunchEndMinute: 0,
          slotDuration: 15,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        // 1 hour = 4 slots of 15 minutes
        expect(slots.length).toBe(4);
        expect(clinicMinute(slots[0].dateTime)).toBe(0);
        expect(clinicMinute(slots[1].dateTime)).toBe(15);
        expect(clinicMinute(slots[2].dateTime)).toBe(30);
        expect(clinicMinute(slots[3].dateTime)).toBe(45);
      });

      it('should return empty array for very short business hours', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          start: 10,
          startMinute: 0,
          end: 10,
          endMinute: 15,
          lunchStart: null,
          lunchStartMinute: 0,
          lunchEnd: null,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        // Business hours shorter than slot duration
        expect(slots.length).toBe(0);
      });

      it('should handle business hours that span only lunch time', () => {
        const date = '2026-01-15';
        const businessHours: BusinessHours = {
          start: 13,
          startMinute: 0,
          end: 14,
          endMinute: 0,
          lunchStart: 13,
          lunchStartMinute: 0,
          lunchEnd: 14,
          lunchEndMinute: 0,
          slotDuration: 30,
        };
        const slots = generateDaySlots(date, businessHours, TZ);

        // All business hours are lunch, so no slots
        expect(slots.length).toBe(0);
      });
    });
  });

  describe('isWithinBusinessHours', () => {
    const businessHours: BusinessHours = {
      start: 8,
      startMinute: 0,
      end: 18,
      endMinute: 0,
      lunchStart: 13,
      lunchStartMinute: 0,
      lunchEnd: 14,
      lunchEndMinute: 0,
      slotDuration: 30,
    };

    describe('within business hours', () => {
      it('should return true for time at start of business hours', () => {
        const date = at('2026-01-15', '08:00');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(true);
      });

      it('should return true for time in the middle of morning', () => {
        const date = at('2026-01-15', '10:30');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(true);
      });

      it('should return true for time just before lunch', () => {
        const date = at('2026-01-15', '12:59');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(true);
      });

      it('should return true for time at start of afternoon', () => {
        const date = at('2026-01-15', '14:00');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(true);
      });

      it('should return true for time in the middle of afternoon', () => {
        const date = at('2026-01-15', '16:30');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(true);
      });

      it('should return true for time just before end', () => {
        const date = at('2026-01-15', '17:59');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(true);
      });
    });

    describe('outside business hours', () => {
      it('should return false for time before business hours', () => {
        const date = at('2026-01-15', '07:59');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });

      it('should return false for time at end of business hours', () => {
        const date = at('2026-01-15', '18:00');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });

      it('should return false for time after business hours', () => {
        const date = at('2026-01-15', '19:00');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });

      it('should return false for midnight', () => {
        const date = at('2026-01-15', '00:00');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });
    });

    describe('during lunch break', () => {
      it('should return false for time at start of lunch', () => {
        const date = at('2026-01-15', '13:00');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });

      it('should return false for time in middle of lunch', () => {
        const date = at('2026-01-15', '13:30');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });

      it('should return false for time just before end of lunch', () => {
        const date = at('2026-01-15', '13:59');
        expect(isWithinBusinessHours(date, businessHours, TZ)).toBe(false);
      });
    });

    describe('no lunch break', () => {
      const noLunchHours: BusinessHours = {
        ...businessHours,
        lunchStart: null,
        lunchEnd: null,
      };

      it('should return true for time that would be during lunch', () => {
        const date = at('2026-01-15', '13:30');
        expect(isWithinBusinessHours(date, noLunchHours, TZ)).toBe(true);
      });
    });
  });

  describe('calculateAvailableMinutes', () => {
    it('should calculate minutes for standard day with lunch', () => {
      const businessHours: BusinessHours = {
        start: 8,
        startMinute: 0,
        end: 18,
        endMinute: 0,
        lunchStart: 13,
        lunchStartMinute: 0,
        lunchEnd: 14,
        lunchEndMinute: 0,
        slotDuration: 30,
      };

      // 10 hours - 1 hour lunch = 9 hours = 540 minutes
      expect(calculateAvailableMinutes(businessHours)).toBe(540);
    });

    it('should calculate minutes for day without lunch', () => {
      const businessHours: BusinessHours = {
        start: 9,
        startMinute: 0,
        end: 17,
        endMinute: 0,
        lunchStart: null,
        lunchStartMinute: 0,
        lunchEnd: null,
        lunchEndMinute: 0,
        slotDuration: 30,
      };

      // 8 hours = 480 minutes
      expect(calculateAvailableMinutes(businessHours)).toBe(480);
    });

    it('should handle non-zero start/end minutes', () => {
      const businessHours: BusinessHours = {
        start: 8,
        startMinute: 30,
        end: 17,
        endMinute: 30,
        lunchStart: 12,
        lunchStartMinute: 0,
        lunchEnd: 13,
        lunchEndMinute: 0,
        slotDuration: 30,
      };

      // 9 hours - 1 hour lunch = 8 hours = 480 minutes
      expect(calculateAvailableMinutes(businessHours)).toBe(480);
    });

    it('should handle lunch break with non-zero minutes', () => {
      const businessHours: BusinessHours = {
        start: 9,
        startMinute: 0,
        end: 18,
        endMinute: 0,
        lunchStart: 12,
        lunchStartMinute: 30,
        lunchEnd: 13,
        lunchEndMinute: 30,
        slotDuration: 30,
      };

      // 9 hours - 1 hour lunch = 8 hours = 480 minutes
      expect(calculateAvailableMinutes(businessHours)).toBe(480);
    });

    it('should calculate for short day', () => {
      const businessHours: BusinessHours = {
        start: 10,
        startMinute: 0,
        end: 14,
        endMinute: 0,
        lunchStart: null,
        lunchStartMinute: 0,
        lunchEnd: null,
        lunchEndMinute: 0,
        slotDuration: 30,
      };

      // 4 hours = 240 minutes
      expect(calculateAvailableMinutes(businessHours)).toBe(240);
    });

    it('should calculate for longer lunch break', () => {
      const businessHours: BusinessHours = {
        start: 8,
        startMinute: 0,
        end: 18,
        endMinute: 0,
        lunchStart: 12,
        lunchStartMinute: 0,
        lunchEnd: 14,
        lunchEndMinute: 0,
        slotDuration: 30,
      };

      // 10 hours - 2 hours lunch = 8 hours = 480 minutes
      expect(calculateAvailableMinutes(businessHours)).toBe(480);
    });
  });

  describe('integration scenarios', () => {
    it('should generate slots that match available minutes calculation', () => {
      const date = '2026-01-15';
      const businessHours: BusinessHours = {
        start: 9,
        startMinute: 0,
        end: 17,
        endMinute: 0,
        lunchStart: 12,
        lunchStartMinute: 0,
        lunchEnd: 13,
        lunchEndMinute: 0,
        slotDuration: 30,
      };

      const slots = generateDaySlots(date, businessHours, TZ);
      const availableMinutes = calculateAvailableMinutes(businessHours);
      const expectedSlots = availableMinutes / businessHours.slotDuration;

      expect(slots.length).toBe(expectedSlots);
    });

    it('should have all slots within business hours', () => {
      const date = '2026-01-15';
      const businessHours: BusinessHours = {
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

      const slots = generateDaySlots(date, businessHours, TZ);

      slots.forEach(slot => {
        expect(isWithinBusinessHours(slot.dateTime, businessHours, TZ)).toBe(true);
      });
    });

    it('should serialize all slots as absolute ISO instants on the clinic day', () => {
      const date = '2026-01-15';
      const slots = generateDaySlots(date, DEFAULT_BUSINESS_HOURS, TZ);

      slots.forEach(slot => {
        const serialized = serializeSlot(slot, TZ);
        expect(serialized.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
        expect(clinicDay(new Date(serialized.dateTime))).toBe('2026-01-15');
      });
    });
  });
  describe('clinic timezone (process-TZ independent)', () => {
    const hours: BusinessHours = {
      start: 9,
      startMinute: 0,
      end: 18,
      endMinute: 0,
      lunchStart: null,
      lunchStartMinute: 0,
      lunchEnd: null,
      lunchEndMinute: 0,
      slotDuration: 30,
    };

    it('builds the 09:00 Mexico City slot at 15:00Z', () => {
      const slots = generateDaySlots('2026-11-16', hours, TZ);
      expect(slots[0].dateTime.toISOString()).toBe('2026-11-16T15:00:00.000Z');
    });

    it('builds the same wall-clock slot at a different instant for another timezone', () => {
      const slots = generateDaySlots('2026-11-16', hours, 'America/Bogota');
      expect(slots[0].dateTime.toISOString()).toBe('2026-11-16T14:00:00.000Z');
    });

    it('serializes with an absolute instant and clinic-time labels', () => {
      const [first] = generateDaySlots('2026-11-16', hours, TZ);
      expect(serializeSlot(first, TZ)).toEqual({
        dateTime: '2026-11-16T15:00:00.000Z',
        time: '09:00',
        displayTime: expect.stringMatching(/^9:00/),
        period: 'morning',
      });
    });

    it('checks business hours in clinic time, including minutes', () => {
      const late: BusinessHours = { ...hours, startMinute: 30 };
      expect(isWithinBusinessHours(new Date('2026-11-16T15:00:00.000Z'), late, TZ)).toBe(false);
      expect(isWithinBusinessHours(new Date('2026-11-16T15:30:00.000Z'), late, TZ)).toBe(true);
      expect(isWithinBusinessHours(new Date('2026-11-16T23:30:00.000Z'), hours, TZ)).toBe(true);
      expect(isWithinBusinessHours(new Date('2026-11-16T14:30:00.000Z'), hours, TZ)).toBe(false);
    });

    describe('filterAvailableSlots', () => {
      const slots = generateDaySlots('2026-11-16', hours, TZ);
      const times = (list: typeof slots) => list.map((s) => serializeSlot(s, TZ).time);

      it('blocks the 09:00 clinic slot for an appointment stored at 15:00Z', () => {
        const free = filterAvailableSlots(slots, {
          durationMinutes: 30,
          busy: [{ start: new Date('2026-11-16T15:00:00.000Z'), durationMinutes: 30 }],
        });
        expect(times(free)).not.toContain('09:00');
        expect(times(free)).toContain('15:00');
      });

      it('treats overlap as half-open: back-to-back slots stay free', () => {
        const free = filterAvailableSlots(slots, {
          durationMinutes: 30,
          busy: [{ start: at('2026-11-16', '10:00'), durationMinutes: 30 }],
        });
        expect(times(free)).toContain('09:30');
        expect(times(free)).not.toContain('10:00');
        expect(times(free)).toContain('10:30');
      });

      it('blocks slots whose duration runs into an appointment', () => {
        const free = filterAvailableSlots(slots, {
          durationMinutes: 60,
          busy: [{ start: at('2026-11-16', '10:00'), durationMinutes: 30 }],
        });
        expect(times(free)).not.toContain('09:30');
        expect(times(free)).toContain('09:00');
      });

      it('drops slots at or before notBefore', () => {
        const free = filterAvailableSlots(slots, {
          durationMinutes: 30,
          busy: [],
          notBefore: new Date('2026-11-16T15:50:00.000Z'), // 09:50 clinic time
        });
        expect(times(free)[0]).toBe('10:00');
      });
    });
  });
});
