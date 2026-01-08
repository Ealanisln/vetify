/**
 * Tests for the version utility module
 */
import {
  APP_VERSION,
  BUILD_TIME,
  getVersionString,
  parseVersion,
  getVersionInfo,
  isPrerelease,
  compareVersion,
} from '@/lib/version';

describe('Version Utility', () => {
  describe('APP_VERSION', () => {
    it('should be defined', () => {
      expect(APP_VERSION).toBeDefined();
    });

    it('should be a valid semver string', () => {
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
    });
  });

  describe('BUILD_TIME', () => {
    it('should be defined', () => {
      expect(BUILD_TIME).toBeDefined();
    });

    it('should be a valid ISO date string', () => {
      const date = new Date(BUILD_TIME);
      expect(date.toISOString()).toBeTruthy();
    });
  });

  describe('getVersionString', () => {
    it('should return version with default prefix', () => {
      const result = getVersionString();
      expect(result).toBe(`v${APP_VERSION}`);
    });

    it('should return version with custom prefix', () => {
      const result = getVersionString('version ');
      expect(result).toBe(`version ${APP_VERSION}`);
    });

    it('should return version with empty prefix', () => {
      const result = getVersionString('');
      expect(result).toBe(APP_VERSION);
    });
  });

  describe('parseVersion', () => {
    it('should parse version correctly', () => {
      const result = parseVersion();
      expect(result).toHaveProperty('major');
      expect(result).toHaveProperty('minor');
      expect(result).toHaveProperty('patch');
      expect(typeof result.major).toBe('number');
      expect(typeof result.minor).toBe('number');
      expect(typeof result.patch).toBe('number');
    });

    it('should return valid numbers for version components', () => {
      const result = parseVersion();
      expect(result.major).toBeGreaterThanOrEqual(0);
      expect(result.minor).toBeGreaterThanOrEqual(0);
      expect(result.patch).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getVersionInfo', () => {
    it('should return complete version info object', () => {
      const result = getVersionInfo();

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('versionString');
      expect(result).toHaveProperty('major');
      expect(result).toHaveProperty('minor');
      expect(result).toHaveProperty('patch');
      expect(result).toHaveProperty('buildTime');
    });

    it('should have consistent version and versionString', () => {
      const result = getVersionInfo();
      expect(result.versionString).toBe(`v${result.version}`);
    });
  });

  describe('isPrerelease', () => {
    it('should return a boolean', () => {
      const result = isPrerelease();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('compareVersion', () => {
    it('should return 0 for same version', () => {
      const result = compareVersion(APP_VERSION);
      expect(result).toBe(0);
    });

    it('should return 1 when current is greater', () => {
      const result = compareVersion('0.0.0');
      // Only valid if APP_VERSION > 0.0.0
      if (APP_VERSION !== '0.0.0') {
        expect(result).toBe(1);
      }
    });

    it('should return -1 when current is less', () => {
      const result = compareVersion('999.999.999');
      expect(result).toBe(-1);
    });

    it('should handle invalid version gracefully', () => {
      const result = compareVersion('invalid');
      expect(result).toBe(0);
    });
  });
});
