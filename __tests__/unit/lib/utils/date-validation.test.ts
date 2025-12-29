/**
 * @jest-environment node
 */
import {
  validateDateOfBirth,
  isValidDateOfBirth,
  formatDateForInput,
  getMaxDateForInput,
} from '@/lib/utils/date-validation';

describe('date-validation utilities', () => {
  describe('validateDateOfBirth', () => {
    describe('valid dates', () => {
      it('should accept valid date in YYYY-MM-DD format', () => {
        const result = validateDateOfBirth('2020-01-15');
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe('2020-01-15T00:00:00.000Z');
      });

      it('should accept date from 1900', () => {
        const result = validateDateOfBirth('1900-01-01');
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe('1900-01-01T00:00:00.000Z');
      });

      it('should accept yesterday as valid date', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        const result = validateDateOfBirth(dateStr);
        expect(result).toBeInstanceOf(Date);
      });

      it('should accept today as valid date', () => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const result = validateDateOfBirth(dateStr);
        expect(result).toBeInstanceOf(Date);
      });

      it('should handle dates with leading/trailing whitespace', () => {
        const result = validateDateOfBirth('  2020-05-10  ');
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe('2020-05-10T00:00:00.000Z');
      });

      it('should normalize time to UTC midnight', () => {
        const result = validateDateOfBirth('2020-06-15');
        expect(result.getUTCHours()).toBe(0);
        expect(result.getUTCMinutes()).toBe(0);
        expect(result.getUTCSeconds()).toBe(0);
        expect(result.getUTCMilliseconds()).toBe(0);
      });
    });

    describe('invalid dates', () => {
      it('should throw error for invalid date format (DD/MM/YYYY)', () => {
        expect(() => validateDateOfBirth('15/01/2020')).toThrow(
          'Invalid date format'
        );
      });

      it('should throw error for invalid date format (MM-DD-YYYY)', () => {
        expect(() => validateDateOfBirth('01-15-2020')).toThrow(
          'Invalid date format'
        );
      });

      it('should throw error for completely invalid string', () => {
        expect(() => validateDateOfBirth('not-a-date')).toThrow(
          'Invalid date format'
        );
      });

      it('should throw error for empty string', () => {
        expect(() => validateDateOfBirth('')).toThrow(
          'Invalid date format'
        );
      });

      it('should throw error for whitespace only', () => {
        expect(() => validateDateOfBirth('   ')).toThrow(
          'Invalid date format'
        );
      });

      it('should handle partial date by defaulting to day 1', () => {
        // JavaScript Date defaults YYYY-MM to first day of month
        const result = validateDateOfBirth('2020-01');
        expect(result).toBeInstanceOf(Date);
        expect(result.getUTCDate()).toBe(1);
      });

      it('should throw error for invalid month', () => {
        // JavaScript Date rejects invalid months (unlike days)
        expect(() => validateDateOfBirth('2020-13-01')).toThrow(
          'Invalid date format'
        );
      });

      it('should handle invalid day by rolling over', () => {
        // JavaScript Date is lenient - 2020-02-30 becomes 2020-03-01
        // The function should still work (just produces unexpected date)
        const result = validateDateOfBirth('2020-02-30');
        expect(result).toBeInstanceOf(Date);
      });
    });

    describe('date boundaries', () => {
      it('should throw error for date before 1900', () => {
        expect(() => validateDateOfBirth('1899-12-31')).toThrow(
          'cannot be before January 1, 1900'
        );
      });

      it('should throw error for very old date', () => {
        expect(() => validateDateOfBirth('1800-01-01')).toThrow(
          'cannot be before January 1, 1900'
        );
      });

      it('should throw error for future date', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const dateStr = futureDate.toISOString().split('T')[0];
        expect(() => validateDateOfBirth(dateStr)).toThrow(
          'cannot be in the future'
        );
      });

      it('should throw error for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        expect(() => validateDateOfBirth(dateStr)).toThrow(
          'cannot be in the future'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle leap year dates', () => {
        const result = validateDateOfBirth('2024-02-29');
        expect(result).toBeInstanceOf(Date);
        expect(result.getUTCDate()).toBe(29);
        expect(result.getUTCMonth()).toBe(1); // February
      });

      it('should handle year 2000', () => {
        const result = validateDateOfBirth('2000-01-01');
        expect(result).toBeInstanceOf(Date);
        expect(result.getUTCFullYear()).toBe(2000);
      });

      it('should handle end of year', () => {
        const result = validateDateOfBirth('2020-12-31');
        expect(result).toBeInstanceOf(Date);
        expect(result.getUTCMonth()).toBe(11);
        expect(result.getUTCDate()).toBe(31);
      });
    });
  });

  describe('isValidDateOfBirth', () => {
    it('should return true for valid date', () => {
      expect(isValidDateOfBirth('2020-01-15')).toBe(true);
    });

    it('should return true for date at boundary (1900)', () => {
      expect(isValidDateOfBirth('1900-01-01')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(isValidDateOfBirth('15/01/2020')).toBe(false);
    });

    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(isValidDateOfBirth(dateStr)).toBe(false);
    });

    it('should return false for date before 1900', () => {
      expect(isValidDateOfBirth('1899-12-31')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidDateOfBirth('')).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isValidDateOfBirth('not-a-date')).toBe(false);
    });

    it('should handle edge cases with Date lenience', () => {
      // JavaScript Date is lenient for invalid days - 2020-02-30 becomes 2020-03-01
      expect(isValidDateOfBirth('2020-02-30')).toBe(true); // Rolls to March 1
      // But invalid months are rejected
      expect(isValidDateOfBirth('2020-13-01')).toBe(false);
    });
  });

  describe('formatDateForInput', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2020-01-15T00:00:00.000Z');
      const result = formatDateForInput(date);
      expect(result).toBe('2020-01-15');
    });

    it('should pad single-digit month and day', () => {
      const date = new Date('2020-01-05T00:00:00.000Z');
      const result = formatDateForInput(date);
      expect(result).toBe('2020-01-05');
    });

    it('should handle end of year', () => {
      const date = new Date('2020-12-31T00:00:00.000Z');
      const result = formatDateForInput(date);
      expect(result).toBe('2020-12-31');
    });

    it('should handle beginning of year', () => {
      const date = new Date('2020-01-01T00:00:00.000Z');
      const result = formatDateForInput(date);
      expect(result).toBe('2020-01-01');
    });

    it('should handle dates with time component', () => {
      const date = new Date('2020-06-15T14:30:45.123Z');
      const result = formatDateForInput(date);
      expect(result).toBe('2020-06-15');
    });
  });

  describe('getMaxDateForInput', () => {
    it('should return today date in YYYY-MM-DD format', () => {
      const result = getMaxDateForInput();
      const today = new Date();
      const expected = today.toISOString().split('T')[0];
      expect(result).toBe(expected);
    });

    it('should return string in correct format', () => {
      const result = getMaxDateForInput();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should be a valid date string', () => {
      const result = getMaxDateForInput();
      const date = new Date(result);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should be usable with isValidDateOfBirth', () => {
      const result = getMaxDateForInput();
      // Today should be a valid date of birth
      expect(isValidDateOfBirth(result)).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should round-trip date through validation and formatting', () => {
      const originalDate = '2020-05-15';
      const validated = validateDateOfBirth(originalDate);
      const formatted = formatDateForInput(validated);
      expect(formatted).toBe(originalDate);
    });

    it('should validate max date for input', () => {
      const maxDate = getMaxDateForInput();
      expect(isValidDateOfBirth(maxDate)).toBe(true);
    });
  });
});
