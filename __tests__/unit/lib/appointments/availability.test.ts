/**
 * Availability Utility Tests
 * VETIF-194: Add unit tests for availability slot generation
 *
 * Tests cover:
 * - formatLocalDateTime() - local datetime formatting
 * - generateDaySlots() - slot generation with various business hour configurations
 * - parseTimeString() - time string parsing
 * - isWithinBusinessHours() - business hours validation
 * - calculateAvailableMinutes() - available minutes calculation
 * - Lunch break handling
 * - Edge cases (no lunch break, custom slot durations, etc.)
 */

import {
  formatLocalDateTime,
  generateDaySlots,
  parseTimeString,
  isWithinBusinessHours,
  calculateAvailableMinutes,
  DEFAULT_BUSINESS_HOURS,
  type BusinessHours,
} from '@/lib/appointments/availability';

describe('Availability Utilities', () => {
  describe('formatLocalDateTime', () => {
    it('should format date as ISO local string without Z suffix', () => {
      const date = new Date(2026, 0, 15, 10, 30, 0); // Jan 15, 2026 10:30:00
      const result = formatLocalDateTime(date);
      expect(result).toBe('2026-01-15T10:30:00');
    });

    it('should pad single-digit months and days with zeros', () => {
      const date = new Date(2026, 0, 5, 9, 5, 0); // Jan 5, 2026 09:05:00
      const result = formatLocalDateTime(date);
      expect(result).toBe('2026-01-05T09:05:00');
    });

    it('should handle midnight correctly', () => {
      const date = new Date(2026, 5, 20, 0, 0, 0); // June 20, 2026 00:00:00
      const result = formatLocalDateTime(date);
      expect(result).toBe('2026-06-20T00:00:00');
    });

    it('should handle end of day correctly', () => {
      const date = new Date(2026, 11, 31, 23, 59, 59); // Dec 31, 2026 23:59:59
      const result = formatLocalDateTime(date);
      expect(result).toBe('2026-12-31T23:59:59');
    });

    it('should not include milliseconds', () => {
      const date = new Date(2026, 0, 15, 10, 30, 45, 123);
      const result = formatLocalDateTime(date);
      expect(result).not.toContain('.');
      expect(result).toBe('2026-01-15T10:30:45');
    });

    it('should not include Z suffix (UTC indicator)', () => {
      const date = new Date();
      const result = formatLocalDateTime(date);
      expect(result).not.toContain('Z');
    });
  });

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
        const date = new Date(2026, 0, 15); // Thursday Jan 15, 2026
        const slots = generateDaySlots(date, standardBusinessHours);

        expect(slots.length).toBeGreaterThan(0);
        expect(slots.every(slot => slot.dateTime instanceof Date)).toBe(true);
        expect(slots.every(slot => ['morning', 'afternoon'].includes(slot.period))).toBe(true);
      });

      it('should generate correct number of slots with 30-minute duration', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);

        // 8:00-13:00 = 5 hours = 10 slots (morning)
        // 14:00-18:00 = 4 hours = 8 slots (afternoon)
        // Total = 18 slots
        expect(slots.length).toBe(18);
      });

      it('should generate correct number of slots with 15-minute duration', () => {
        const date = new Date(2026, 0, 15);
        const businessHours: BusinessHours = {
          ...standardBusinessHours,
          slotDuration: 15,
        };
        const slots = generateDaySlots(date, businessHours);

        // 8:00-13:00 = 5 hours = 20 slots (morning)
        // 14:00-18:00 = 4 hours = 16 slots (afternoon)
        // Total = 36 slots
        expect(slots.length).toBe(36);
      });

      it('should generate correct number of slots with 60-minute duration', () => {
        const date = new Date(2026, 0, 15);
        const businessHours: BusinessHours = {
          ...standardBusinessHours,
          slotDuration: 60,
        };
        const slots = generateDaySlots(date, businessHours);

        // 8:00-13:00 = 5 hours = 5 slots (morning)
        // 14:00-18:00 = 4 hours = 4 slots (afternoon)
        // Total = 9 slots
        expect(slots.length).toBe(9);
      });
    });

    describe('morning slots', () => {
      it('should mark morning slots correctly', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);
        const morningSlots = slots.filter(s => s.period === 'morning');

        morningSlots.forEach(slot => {
          const hour = slot.dateTime.getHours();
          expect(hour).toBeGreaterThanOrEqual(8);
          expect(hour).toBeLessThan(13);
        });
      });

      it('should start morning slots at business start time', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);
        const firstSlot = slots[0];

        expect(firstSlot.dateTime.getHours()).toBe(8);
        expect(firstSlot.dateTime.getMinutes()).toBe(0);
        expect(firstSlot.period).toBe('morning');
      });

      it('should end morning slots before lunch', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);
        const morningSlots = slots.filter(s => s.period === 'morning');
        const lastMorningSlot = morningSlots[morningSlots.length - 1];

        // With 30-minute slots, last morning slot should be 12:30
        expect(lastMorningSlot.dateTime.getHours()).toBe(12);
        expect(lastMorningSlot.dateTime.getMinutes()).toBe(30);
      });
    });

    describe('afternoon slots', () => {
      it('should mark afternoon slots correctly', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);
        const afternoonSlots = slots.filter(s => s.period === 'afternoon');

        afternoonSlots.forEach(slot => {
          const hour = slot.dateTime.getHours();
          expect(hour).toBeGreaterThanOrEqual(14);
          expect(hour).toBeLessThan(18);
        });
      });

      it('should start afternoon slots after lunch', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);
        const afternoonSlots = slots.filter(s => s.period === 'afternoon');
        const firstAfternoonSlot = afternoonSlots[0];

        expect(firstAfternoonSlot.dateTime.getHours()).toBe(14);
        expect(firstAfternoonSlot.dateTime.getMinutes()).toBe(0);
      });

      it('should end afternoon slots at business end time', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);
        const lastSlot = slots[slots.length - 1];

        // With 30-minute slots, last slot should be 17:30
        expect(lastSlot.dateTime.getHours()).toBe(17);
        expect(lastSlot.dateTime.getMinutes()).toBe(30);
      });
    });

    describe('lunch break handling', () => {
      it('should not generate slots during lunch break', () => {
        const date = new Date(2026, 0, 15);
        const slots = generateDaySlots(date, standardBusinessHours);

        const lunchSlots = slots.filter(slot => {
          const hour = slot.dateTime.getHours();
          return hour >= 13 && hour < 14;
        });

        expect(lunchSlots.length).toBe(0);
      });

      it('should handle no lunch break (all morning slots)', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, noLunchHours);

        // All slots should be morning since there's no lunch break
        expect(slots.every(s => s.period === 'morning')).toBe(true);
        // 8:00-18:00 = 10 hours = 20 slots
        expect(slots.length).toBe(20);
      });

      it('should handle custom lunch times', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, customLunchHours);

        // 9:00-12:00 = 3 hours = 6 slots (morning)
        // 13:00-17:00 = 4 hours = 8 slots (afternoon)
        expect(slots.length).toBe(14);

        // Verify no slots during 12:00-13:00
        const lunchSlots = slots.filter(slot => {
          const hour = slot.dateTime.getHours();
          return hour >= 12 && hour < 13;
        });
        expect(lunchSlots.length).toBe(0);
      });

      it('should handle lunch break with non-zero minutes', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, businessHours);

        // First afternoon slot should start at 13:30
        const afternoonSlots = slots.filter(s => s.period === 'afternoon');
        expect(afternoonSlots[0].dateTime.getHours()).toBe(13);
        expect(afternoonSlots[0].dateTime.getMinutes()).toBe(30);
      });
    });

    describe('custom business hours', () => {
      it('should handle early start time', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, earlyHours);

        expect(slots[0].dateTime.getHours()).toBe(6);
      });

      it('should handle late end time', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, lateHours);

        const lastSlot = slots[slots.length - 1];
        expect(lastSlot.dateTime.getHours()).toBe(21);
        expect(lastSlot.dateTime.getMinutes()).toBe(30);
      });

      it('should handle non-zero start minute', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, businessHours);

        expect(slots[0].dateTime.getHours()).toBe(8);
        expect(slots[0].dateTime.getMinutes()).toBe(30);
      });

      it('should handle short work day', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, shortDay);

        // 9:00-13:00 = 4 hours = 4 slots
        expect(slots.length).toBe(4);
      });
    });

    describe('date handling', () => {
      it('should maintain the correct date for all slots', () => {
        const date = new Date(2026, 5, 15); // June 15, 2026
        const slots = generateDaySlots(date, standardBusinessHours);

        slots.forEach(slot => {
          expect(slot.dateTime.getFullYear()).toBe(2026);
          expect(slot.dateTime.getMonth()).toBe(5); // June
          expect(slot.dateTime.getDate()).toBe(15);
        });
      });

      it('should handle month boundaries', () => {
        const date = new Date(2026, 0, 31); // Jan 31, 2026
        const slots = generateDaySlots(date, standardBusinessHours);

        slots.forEach(slot => {
          expect(slot.dateTime.getDate()).toBe(31);
          expect(slot.dateTime.getMonth()).toBe(0);
        });
      });

      it('should handle year boundaries', () => {
        const date = new Date(2026, 11, 31); // Dec 31, 2026
        const slots = generateDaySlots(date, standardBusinessHours);

        slots.forEach(slot => {
          expect(slot.dateTime.getFullYear()).toBe(2026);
          expect(slot.dateTime.getMonth()).toBe(11);
          expect(slot.dateTime.getDate()).toBe(31);
        });
      });

      it('should handle leap year February', () => {
        const date = new Date(2028, 1, 29); // Feb 29, 2028 (leap year)
        const slots = generateDaySlots(date, standardBusinessHours);

        slots.forEach(slot => {
          expect(slot.dateTime.getFullYear()).toBe(2028);
          expect(slot.dateTime.getMonth()).toBe(1);
          expect(slot.dateTime.getDate()).toBe(29);
        });
      });
    });

    describe('edge cases', () => {
      it('should handle minimum slot duration (15 minutes)', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, businessHours);

        // 1 hour = 4 slots of 15 minutes
        expect(slots.length).toBe(4);
        expect(slots[0].dateTime.getMinutes()).toBe(0);
        expect(slots[1].dateTime.getMinutes()).toBe(15);
        expect(slots[2].dateTime.getMinutes()).toBe(30);
        expect(slots[3].dateTime.getMinutes()).toBe(45);
      });

      it('should return empty array for very short business hours', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, businessHours);

        // Business hours shorter than slot duration
        expect(slots.length).toBe(0);
      });

      it('should handle business hours that span only lunch time', () => {
        const date = new Date(2026, 0, 15);
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
        const slots = generateDaySlots(date, businessHours);

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
        const date = new Date(2026, 0, 15, 8, 0, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(true);
      });

      it('should return true for time in the middle of morning', () => {
        const date = new Date(2026, 0, 15, 10, 30, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(true);
      });

      it('should return true for time just before lunch', () => {
        const date = new Date(2026, 0, 15, 12, 59, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(true);
      });

      it('should return true for time at start of afternoon', () => {
        const date = new Date(2026, 0, 15, 14, 0, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(true);
      });

      it('should return true for time in the middle of afternoon', () => {
        const date = new Date(2026, 0, 15, 16, 30, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(true);
      });

      it('should return true for time just before end', () => {
        const date = new Date(2026, 0, 15, 17, 59, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(true);
      });
    });

    describe('outside business hours', () => {
      it('should return false for time before business hours', () => {
        const date = new Date(2026, 0, 15, 7, 59, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });

      it('should return false for time at end of business hours', () => {
        const date = new Date(2026, 0, 15, 18, 0, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });

      it('should return false for time after business hours', () => {
        const date = new Date(2026, 0, 15, 19, 0, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });

      it('should return false for midnight', () => {
        const date = new Date(2026, 0, 15, 0, 0, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });
    });

    describe('during lunch break', () => {
      it('should return false for time at start of lunch', () => {
        const date = new Date(2026, 0, 15, 13, 0, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });

      it('should return false for time in middle of lunch', () => {
        const date = new Date(2026, 0, 15, 13, 30, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });

      it('should return false for time just before end of lunch', () => {
        const date = new Date(2026, 0, 15, 13, 59, 0);
        expect(isWithinBusinessHours(date, businessHours)).toBe(false);
      });
    });

    describe('no lunch break', () => {
      const noLunchHours: BusinessHours = {
        ...businessHours,
        lunchStart: null,
        lunchEnd: null,
      };

      it('should return true for time that would be during lunch', () => {
        const date = new Date(2026, 0, 15, 13, 30, 0);
        expect(isWithinBusinessHours(date, noLunchHours)).toBe(true);
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
      const date = new Date(2026, 0, 15);
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

      const slots = generateDaySlots(date, businessHours);
      const availableMinutes = calculateAvailableMinutes(businessHours);
      const expectedSlots = availableMinutes / businessHours.slotDuration;

      expect(slots.length).toBe(expectedSlots);
    });

    it('should have all slots within business hours', () => {
      const date = new Date(2026, 0, 15);
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

      const slots = generateDaySlots(date, businessHours);

      slots.forEach(slot => {
        expect(isWithinBusinessHours(slot.dateTime, businessHours)).toBe(true);
      });
    });

    it('should format all slot times correctly', () => {
      const date = new Date(2026, 0, 15);
      const slots = generateDaySlots(date, DEFAULT_BUSINESS_HOURS);

      slots.forEach(slot => {
        const formatted = formatLocalDateTime(slot.dateTime);
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
        expect(formatted.startsWith('2026-01-15')).toBe(true);
      });
    });
  });
});
