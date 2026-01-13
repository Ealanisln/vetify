/**
 * Unit tests for appointments cache key generation
 * Tests the cache key factory functions used by SWR
 */

import { format } from 'date-fns';
import {
  APPOINTMENTS_KEYS,
  createListKey,
  createCalendarKey,
  type AppointmentListParams,
} from '@/lib/appointments/cache-keys';

describe('APPOINTMENTS_KEYS', () => {
  describe('all', () => {
    it('should return base appointments key', () => {
      expect(APPOINTMENTS_KEYS.all).toEqual(['appointments']);
    });
  });

  describe('lists()', () => {
    it('should return lists base key', () => {
      expect(APPOINTMENTS_KEYS.lists()).toEqual(['appointments', 'list']);
    });
  });

  describe('list()', () => {
    it('should generate key with all params', () => {
      const params: AppointmentListParams = {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        status: 'SCHEDULED',
        locationId: 'loc-1',
        page: 1,
        limit: 10,
      };

      const key = APPOINTMENTS_KEYS.list(params);

      expect(key[0]).toBe('appointments');
      expect(key[1]).toBe('list');
      // Params should be normalized and sorted alphabetically
      expect(key[2]).toContain('startDate=2025-12-01');
      expect(key[2]).toContain('endDate=2025-12-31');
      expect(key[2]).toContain('status=SCHEDULED');
      expect(key[2]).toContain('locationId=loc-1');
      expect(key[2]).toContain('page=1');
      expect(key[2]).toContain('limit=10');
    });

    it('should generate key with partial params', () => {
      const params: AppointmentListParams = {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };

      const key = APPOINTMENTS_KEYS.list(params);

      expect(key[2]).toContain('startDate=2025-12-01');
      expect(key[2]).toContain('endDate=2025-12-31');
      expect(key[2]).not.toContain('status');
      expect(key[2]).not.toContain('locationId');
    });

    it('should generate "all" when no params provided', () => {
      const key = APPOINTMENTS_KEYS.list({});

      expect(key).toEqual(['appointments', 'list', 'all']);
    });

    it('should ignore undefined values', () => {
      const params: AppointmentListParams = {
        startDate: '2025-12-01',
        status: undefined,
      };

      const key = APPOINTMENTS_KEYS.list(params);

      expect(key[2]).toContain('startDate=2025-12-01');
      expect(key[2]).not.toContain('status');
    });

    it('should generate consistent keys for same params in different order', () => {
      const params1: AppointmentListParams = {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        status: 'SCHEDULED',
      };

      const params2: AppointmentListParams = {
        status: 'SCHEDULED',
        endDate: '2025-12-31',
        startDate: '2025-12-01',
      };

      const key1 = APPOINTMENTS_KEYS.list(params1);
      const key2 = APPOINTMENTS_KEYS.list(params2);

      expect(key1).toEqual(key2);
    });
  });

  describe('details()', () => {
    it('should return details base key', () => {
      expect(APPOINTMENTS_KEYS.details()).toEqual(['appointments', 'detail']);
    });
  });

  describe('detail()', () => {
    it('should generate key with appointment ID', () => {
      const key = APPOINTMENTS_KEYS.detail('appt-123');

      expect(key).toEqual(['appointments', 'detail', 'appt-123']);
    });

    it('should generate unique keys for different IDs', () => {
      const key1 = APPOINTMENTS_KEYS.detail('appt-1');
      const key2 = APPOINTMENTS_KEYS.detail('appt-2');

      expect(key1).not.toEqual(key2);
    });
  });

  describe('today()', () => {
    it('should generate key with today date', () => {
      const todayFormatted = format(new Date(), 'yyyy-MM-dd');
      const key = APPOINTMENTS_KEYS.today();

      expect(key).toEqual(['appointments', 'today', todayFormatted]);
    });

    it('should generate same key when called multiple times on same day', () => {
      const key1 = APPOINTMENTS_KEYS.today();
      const key2 = APPOINTMENTS_KEYS.today();

      expect(key1).toEqual(key2);
    });
  });

  describe('stats()', () => {
    it('should return stats key', () => {
      expect(APPOINTMENTS_KEYS.stats()).toEqual(['appointments', 'stats']);
    });
  });

  describe('availability()', () => {
    it('should generate key with date only', () => {
      const key = APPOINTMENTS_KEYS.availability('2025-12-15');

      expect(key).toEqual(['appointments', 'availability', '2025-12-15', undefined, undefined]);
    });

    it('should generate key with date and duration', () => {
      const key = APPOINTMENTS_KEYS.availability('2025-12-15', 30);

      expect(key).toEqual(['appointments', 'availability', '2025-12-15', 30, undefined]);
    });

    it('should generate key with all params', () => {
      const key = APPOINTMENTS_KEYS.availability('2025-12-15', 30, 'staff-1');

      expect(key).toEqual(['appointments', 'availability', '2025-12-15', 30, 'staff-1']);
    });

    it('should generate unique keys for different params', () => {
      const key1 = APPOINTMENTS_KEYS.availability('2025-12-15', 30);
      const key2 = APPOINTMENTS_KEYS.availability('2025-12-15', 60);

      expect(key1).not.toEqual(key2);
    });
  });
});

describe('createListKey', () => {
  it('should create key from Date objects', () => {
    const startDate = new Date('2025-12-01T00:00:00Z');
    const endDate = new Date('2025-12-31T23:59:59Z');

    const key = createListKey(startDate, endDate);

    expect(key[0]).toBe('appointments');
    expect(key[1]).toBe('list');
    expect(key[2]).toContain('startDate=2025-12-01');
    expect(key[2]).toContain('endDate=2025-12-31');
  });

  it('should create key with status filter', () => {
    const startDate = new Date('2025-12-01T00:00:00Z');
    const endDate = new Date('2025-12-31T23:59:59Z');

    const key = createListKey(startDate, endDate, 'CONFIRMED');

    expect(key[2]).toContain('status=CONFIRMED');
  });

  it('should handle undefined dates', () => {
    const key = createListKey(undefined, undefined, 'SCHEDULED');

    expect(key[2]).toBe('status=SCHEDULED');
  });

  it('should return "all" when no params provided', () => {
    const key = createListKey();

    expect(key).toEqual(['appointments', 'list', 'all']);
  });
});

describe('createCalendarKey', () => {
  describe('month view', () => {
    it('should create key for first day of month', () => {
      const date = new Date('2025-12-15T12:00:00Z');
      const key = createCalendarKey('month', date);

      // Should include the full month range
      expect(key[0]).toBe('appointments');
      expect(key[1]).toBe('list');
      // Key should contain date range for the month
      expect(typeof key[2]).toBe('string');
    });

    it('should create consistent key for any day in same month', () => {
      const date1 = new Date('2025-12-01T12:00:00Z');
      const date2 = new Date('2025-12-15T12:00:00Z');
      const date3 = new Date('2025-12-31T12:00:00Z');

      const key1 = createCalendarKey('month', date1);
      const key2 = createCalendarKey('month', date2);
      const key3 = createCalendarKey('month', date3);

      // All should produce the same key since they're in the same month
      expect(key1).toEqual(key2);
      expect(key2).toEqual(key3);
    });
  });

  describe('week view', () => {
    it('should create key for week starting Monday', () => {
      // Wednesday December 18, 2025
      const date = new Date('2025-12-18T12:00:00Z');
      const key = createCalendarKey('week', date);

      expect(key[0]).toBe('appointments');
      expect(key[1]).toBe('list');
      expect(typeof key[2]).toBe('string');
    });

    it('should create same key for all days in same week', () => {
      // Monday to Sunday of same week
      const monday = new Date('2025-12-15T12:00:00Z');
      const wednesday = new Date('2025-12-17T12:00:00Z');
      const sunday = new Date('2025-12-21T12:00:00Z');

      const key1 = createCalendarKey('week', monday);
      const key2 = createCalendarKey('week', wednesday);
      const key3 = createCalendarKey('week', sunday);

      expect(key1).toEqual(key2);
      expect(key2).toEqual(key3);
    });
  });

  describe('day view', () => {
    it('should create key for specific day', () => {
      const date = new Date('2025-12-15T12:00:00Z');
      const key = createCalendarKey('day', date);

      expect(key[0]).toBe('appointments');
      expect(key[1]).toBe('list');
      expect(typeof key[2]).toBe('string');
    });

    it('should create different keys for different days', () => {
      const date1 = new Date('2025-12-15T12:00:00Z');
      const date2 = new Date('2025-12-16T12:00:00Z');

      const key1 = createCalendarKey('day', date1);
      const key2 = createCalendarKey('day', date2);

      expect(key1).not.toEqual(key2);
    });

    it('should create same key for same day regardless of time', () => {
      const morning = new Date('2025-12-15T08:00:00Z');
      const evening = new Date('2025-12-15T20:00:00Z');

      const key1 = createCalendarKey('day', morning);
      const key2 = createCalendarKey('day', evening);

      expect(key1).toEqual(key2);
    });
  });
});
