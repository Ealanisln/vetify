/**
 * @jest-environment node
 */
import {
  formatDate,
  formatDateLong,
  formatTime,
  formatDateTime,
  formatDateTimeLong,
  formatDateForInput,
  formatDateWithWeekday,
  formatCalendarDateTime,
  formatRelativeDate,
  formatCurrency,
} from '@/lib/utils/date-format';

describe('date-format utilities', () => {
  // Use a fixed date for consistent testing
  const testDate = new Date('2025-12-04T10:30:00.000Z');
  const testDateString = '2025-12-04T10:30:00.000Z';

  describe('formatDate', () => {
    it('should format Date object to short date format', () => {
      const result = formatDate(testDate);
      // es-MX format: "4 dic 2025"
      expect(result).toMatch(/4.*dic.*2025/i);
    });

    it('should format date string to short date format', () => {
      const result = formatDate(testDateString);
      expect(result).toMatch(/4.*dic.*2025/i);
    });

    it('should handle different months correctly', () => {
      const januaryDate = new Date('2025-01-15T12:00:00.000Z');
      const result = formatDate(januaryDate);
      expect(result).toMatch(/15.*ene.*2025/i);
    });
  });

  describe('formatDateLong', () => {
    it('should format Date object to long date format', () => {
      const result = formatDateLong(testDate);
      // es-MX format: "jueves, 4 de diciembre de 2025"
      expect(result.toLowerCase()).toContain('diciembre');
      expect(result).toContain('2025');
    });

    it('should include weekday in long format', () => {
      const result = formatDateLong(testDate);
      // Thursday in Spanish
      expect(result.toLowerCase()).toMatch(/jueves|miércoles/); // Depending on timezone
    });

    it('should format date string to long format', () => {
      const result = formatDateLong(testDateString);
      expect(result.toLowerCase()).toContain('diciembre');
    });
  });

  describe('formatTime', () => {
    it('should format time in 24-hour format', () => {
      // Create date in local timezone context
      const localDate = new Date(2025, 11, 4, 10, 30, 0); // December 4, 2025, 10:30 AM local
      const result = formatTime(localDate);
      expect(result).toBe('10:30');
    });

    it('should format date string time correctly', () => {
      const localDate = new Date(2025, 11, 4, 14, 45, 0); // 2:45 PM local
      const result = formatTime(localDate);
      expect(result).toBe('14:45');
    });

    it('should handle midnight correctly', () => {
      const midnight = new Date(2025, 11, 4, 0, 0, 0);
      const result = formatTime(midnight);
      expect(result).toBe('00:00');
    });

    it('should pad single digit hours and minutes', () => {
      const earlyMorning = new Date(2025, 11, 4, 9, 5, 0); // 9:05 AM local
      const result = formatTime(earlyMorning);
      expect(result).toBe('09:05');
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time', () => {
      const localDate = new Date(2025, 11, 4, 10, 30, 0);
      const result = formatDateTime(localDate);
      expect(result).toMatch(/4.*dic.*2025.*10:30/i);
    });

    it('should work with date strings', () => {
      const result = formatDateTime(testDateString);
      expect(result).toContain('2025');
      expect(result).toContain(':');
    });
  });

  describe('formatDateTimeLong', () => {
    it('should combine long date and time', () => {
      const localDate = new Date(2025, 11, 4, 10, 30, 0);
      const result = formatDateTimeLong(localDate);
      expect(result.toLowerCase()).toContain('diciembre');
      expect(result).toContain('10:30');
    });
  });

  describe('formatDateForInput', () => {
    it('should format date for HTML input (YYYY-MM-DD)', () => {
      const result = formatDateForInput(testDate);
      expect(result).toBe('2025-12-04');
    });

    it('should work with date strings', () => {
      const result = formatDateForInput('2025-06-15T14:30:00.000Z');
      expect(result).toBe('2025-06-15');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2025-01-05T12:00:00.000Z');
      const result = formatDateForInput(date);
      expect(result).toBe('2025-01-05');
    });
  });

  describe('formatDateWithWeekday', () => {
    it('should include short weekday', () => {
      const result = formatDateWithWeekday(testDate);
      // Should include abbreviated weekday
      expect(result).toMatch(/\w{2,4}/);
      expect(result).toMatch(/4/);
    });

    it('should include short month', () => {
      const result = formatDateWithWeekday(testDate);
      expect(result.toLowerCase()).toMatch(/dic/);
    });
  });

  describe('formatCalendarDateTime', () => {
    it('should format for calendar display', () => {
      const localDate = new Date(2025, 11, 4, 10, 30, 0);
      const result = formatCalendarDateTime(localDate);
      expect(result).toContain('10:30');
      expect(result.toLowerCase()).toMatch(/dic/);
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Hoy" for today', () => {
      const today = new Date();
      const result = formatRelativeDate(today);
      expect(result).toBe('Hoy');
    });

    it('should return "Mañana" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = formatRelativeDate(tomorrow);
      expect(result).toBe('Mañana');
    });

    it('should return formatted date for other days', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const result = formatRelativeDate(nextWeek);
      expect(result).not.toBe('Hoy');
      expect(result).not.toBe('Mañana');
      expect(result).toMatch(/\d/); // Should contain a number (day)
    });

    it('should return formatted date for past days', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatRelativeDate(yesterday);
      expect(result).not.toBe('Hoy');
      expect(result).not.toBe('Mañana');
    });

    it('should work with date strings', () => {
      const todayStr = new Date().toISOString();
      const result = formatRelativeDate(todayStr);
      expect(result).toBe('Hoy');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as MXN currency by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('$');
      expect(result).toMatch(/1[,.]?234/);
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('$');
      expect(result).toMatch(/0/);
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-');
      expect(result).toContain('100');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('$');
    });

    it('should accept different currency codes', () => {
      const result = formatCurrency(100, 'USD');
      // es-MX locale may format USD differently (e.g., "USD 100.00")
      expect(result).toMatch(/USD|100/);
    });

    it('should round decimals appropriately', () => {
      const result = formatCurrency(99.999);
      // Should round to 2 decimal places
      expect(result).toMatch(/100|99\.99/);
    });
  });

  describe('edge cases', () => {
    it('should handle Date objects from different timezones', () => {
      const utcDate = new Date(Date.UTC(2025, 5, 15, 0, 0, 0));
      const result = formatDateForInput(utcDate);
      expect(result).toBe('2025-06-15');
    });

    it('should handle year boundaries', () => {
      const newYear = new Date('2025-12-31T23:59:59.999Z');
      const result = formatDate(newYear);
      expect(result).toContain('2025');
    });

    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00.000Z');
      const result = formatDate(leapDay);
      expect(result).toMatch(/29.*feb.*2024/i);
    });
  });
});
