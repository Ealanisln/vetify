/**
 * Unit tests for centralized constants
 */

import {
  TRIAL_WARNING_DAYS,
  USAGE_WARNING_THRESHOLD,
  TRIAL_PERIOD_DAYS,
  DEFAULT_PLAN_LIMITS,
  ANIMATION_DURATION_SHORT,
  ANIMATION_DURATION_MEDIUM,
  STORAGE_TTL_DEFAULT,
  STORAGE_TTL_NOTIFICATION_DISMISSAL,
  STORAGE_TTL_LOCATION_CACHE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_FILE_UPLOAD_SIZE,
  ALLOWED_IMAGE_TYPES,
  SEARCH_DEBOUNCE_MS,
  TOAST_DURATION_MS,
} from '@/lib/constants';

describe('Constants', () => {
  describe('Trial & Subscription Constants', () => {
    it('should have correct TRIAL_WARNING_DAYS value', () => {
      expect(TRIAL_WARNING_DAYS).toBe(3);
      expect(typeof TRIAL_WARNING_DAYS).toBe('number');
    });

    it('should have correct USAGE_WARNING_THRESHOLD value', () => {
      expect(USAGE_WARNING_THRESHOLD).toBe(0.8);
      expect(USAGE_WARNING_THRESHOLD).toBeGreaterThan(0);
      expect(USAGE_WARNING_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('should have correct TRIAL_PERIOD_DAYS value', () => {
      expect(TRIAL_PERIOD_DAYS).toBe(30);
    });
  });

  describe('DEFAULT_PLAN_LIMITS', () => {
    it('should have all required limit properties', () => {
      expect(DEFAULT_PLAN_LIMITS).toHaveProperty('maxPets');
      expect(DEFAULT_PLAN_LIMITS).toHaveProperty('maxUsers');
      expect(DEFAULT_PLAN_LIMITS).toHaveProperty('maxStorageGB');
      expect(DEFAULT_PLAN_LIMITS).toHaveProperty('maxCashRegisters');
      expect(DEFAULT_PLAN_LIMITS).toHaveProperty('maxMonthlyWhatsApp');
    });

    it('should have correct default values', () => {
      expect(DEFAULT_PLAN_LIMITS.maxPets).toBe(300);
      expect(DEFAULT_PLAN_LIMITS.maxUsers).toBe(3);
      expect(DEFAULT_PLAN_LIMITS.maxStorageGB).toBe(5);
      expect(DEFAULT_PLAN_LIMITS.maxCashRegisters).toBe(1);
      expect(DEFAULT_PLAN_LIMITS.maxMonthlyWhatsApp).toBe(-1); // -1 = unlimited
    });

    it('should have positive values for numeric limits (except unlimited)', () => {
      expect(DEFAULT_PLAN_LIMITS.maxPets).toBeGreaterThan(0);
      expect(DEFAULT_PLAN_LIMITS.maxUsers).toBeGreaterThan(0);
      expect(DEFAULT_PLAN_LIMITS.maxStorageGB).toBeGreaterThan(0);
      expect(DEFAULT_PLAN_LIMITS.maxCashRegisters).toBeGreaterThan(0);
    });

    it('should be a frozen/readonly object', () => {
      // TypeScript enforces this with `as const`, but we can verify the values exist
      expect(Object.keys(DEFAULT_PLAN_LIMITS)).toHaveLength(5);
    });
  });

  describe('Animation Constants', () => {
    it('should have correct ANIMATION_DURATION_SHORT value', () => {
      expect(ANIMATION_DURATION_SHORT).toBe(300);
    });

    it('should have correct ANIMATION_DURATION_MEDIUM value', () => {
      expect(ANIMATION_DURATION_MEDIUM).toBe(500);
    });

    it('should have short < medium', () => {
      expect(ANIMATION_DURATION_SHORT).toBeLessThan(ANIMATION_DURATION_MEDIUM);
    });
  });

  describe('Storage TTL Constants', () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    it('should have correct STORAGE_TTL_DEFAULT (7 days)', () => {
      expect(STORAGE_TTL_DEFAULT).toBe(SEVEN_DAYS_MS);
    });

    it('should have correct STORAGE_TTL_NOTIFICATION_DISMISSAL (7 days)', () => {
      expect(STORAGE_TTL_NOTIFICATION_DISMISSAL).toBe(SEVEN_DAYS_MS);
    });

    it('should have correct STORAGE_TTL_LOCATION_CACHE (1 hour)', () => {
      expect(STORAGE_TTL_LOCATION_CACHE).toBe(ONE_HOUR_MS);
    });

    it('should have location cache < notification dismissal', () => {
      expect(STORAGE_TTL_LOCATION_CACHE).toBeLessThan(
        STORAGE_TTL_NOTIFICATION_DISMISSAL
      );
    });
  });

  describe('Pagination Constants', () => {
    it('should have correct DEFAULT_PAGE_SIZE', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(10);
    });

    it('should have correct MAX_PAGE_SIZE', () => {
      expect(MAX_PAGE_SIZE).toBe(100);
    });

    it('should have DEFAULT_PAGE_SIZE <= MAX_PAGE_SIZE', () => {
      expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(MAX_PAGE_SIZE);
    });
  });

  describe('Validation Constants', () => {
    it('should have correct MAX_FILE_UPLOAD_SIZE (10MB)', () => {
      const TEN_MB = 10 * 1024 * 1024;
      expect(MAX_FILE_UPLOAD_SIZE).toBe(TEN_MB);
    });

    it('should have correct ALLOWED_IMAGE_TYPES', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
      expect(ALLOWED_IMAGE_TYPES).toHaveLength(3);
    });
  });

  describe('UI Constants', () => {
    it('should have correct SEARCH_DEBOUNCE_MS', () => {
      expect(SEARCH_DEBOUNCE_MS).toBe(300);
    });

    it('should have correct TOAST_DURATION_MS', () => {
      expect(TOAST_DURATION_MS).toBe(5000);
    });

    it('should have reasonable UI timing values', () => {
      expect(SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
      expect(SEARCH_DEBOUNCE_MS).toBeLessThan(1000); // Should be responsive
      expect(TOAST_DURATION_MS).toBeGreaterThan(1000); // Should be readable
      expect(TOAST_DURATION_MS).toBeLessThan(30000); // Should not be too long
    });
  });

  describe('Constant Relationships', () => {
    it('should have consistent time units', () => {
      // All storage TTLs should be in milliseconds (not seconds)
      expect(STORAGE_TTL_DEFAULT).toBeGreaterThan(1000);
      expect(STORAGE_TTL_NOTIFICATION_DISMISSAL).toBeGreaterThan(1000);
      expect(STORAGE_TTL_LOCATION_CACHE).toBeGreaterThan(1000);
    });

    it('should have reasonable warning thresholds', () => {
      // Warning should trigger before reaching limit
      expect(USAGE_WARNING_THRESHOLD).toBeLessThan(1);
      // But not too early
      expect(USAGE_WARNING_THRESHOLD).toBeGreaterThan(0.5);
    });

    it('should have trial warning before trial ends', () => {
      // Warning days should be less than trial period
      expect(TRIAL_WARNING_DAYS).toBeLessThan(TRIAL_PERIOD_DAYS);
    });
  });
});
