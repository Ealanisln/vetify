import {
  DEFAULT_CLINIC_TIME_ZONE,
  clinicDateTime,
  clinicDayRange,
  clinicToday,
  dayOfWeekForDate,
  getClinicTimeZone,
  parseClinicDate,
  timeZoneForCountry,
} from '@/lib/clinic-timezone';
import { ONBOARDING_COUNTRIES } from '@/lib/onboarding-defaults';

function isValidIana(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

describe('clinic-timezone', () => {
  describe('timeZoneForCountry', () => {
    it('maps Mexico to America/Mexico_City', () => {
      expect(timeZoneForCountry('MX')).toBe('America/Mexico_City');
    });

    it('is case-insensitive', () => {
      expect(timeZoneForCountry('co')).toBe('America/Bogota');
    });

    it('falls back to the default for missing or unknown countries', () => {
      expect(timeZoneForCountry(null)).toBe(DEFAULT_CLINIC_TIME_ZONE);
      expect(timeZoneForCountry(undefined)).toBe(DEFAULT_CLINIC_TIME_ZONE);
      expect(timeZoneForCountry('ZZ')).toBe(DEFAULT_CLINIC_TIME_ZONE);
    });

    it('resolves every onboarding country to a valid IANA timezone', () => {
      for (const { code } of ONBOARDING_COUNTRIES) {
        expect(isValidIana(timeZoneForCountry(code))).toBe(true);
      }
    });
  });

  describe('getClinicTimeZone', () => {
    it('uses a non-UTC TenantSettings.timezone', () => {
      expect(
        getClinicTimeZone({ countryCode: 'MX', tenantSettings: { timezone: 'America/Cancun' } })
      ).toBe('America/Cancun');
    });

    it.each(['UTC', 'Etc/UTC', 'GMT', '', null])(
      'ignores the signup placeholder %p and derives from the country',
      (timezone) => {
        expect(getClinicTimeZone({ countryCode: 'CL', tenantSettings: { timezone } })).toBe(
          'America/Santiago'
        );
      }
    );

    it('ignores an invalid timezone string', () => {
      expect(
        getClinicTimeZone({ countryCode: 'PE', tenantSettings: { timezone: 'Mars/Olympus' } })
      ).toBe('America/Lima');
    });

    it('falls back to America/Mexico_City with no usable data', () => {
      expect(getClinicTimeZone({})).toBe('America/Mexico_City');
      expect(getClinicTimeZone(null)).toBe('America/Mexico_City');
      expect(getClinicTimeZone({ countryCode: null, tenantSettings: null })).toBe(
        'America/Mexico_City'
      );
    });
  });

  describe('clinicDateTime', () => {
    it('turns a clinic wall-clock time into the absolute instant', () => {
      expect(clinicDateTime('2026-11-16', '09:00', 'America/Mexico_City').toISOString()).toBe(
        '2026-11-16T15:00:00.000Z'
      );
    });
  });

  describe('clinicDayRange', () => {
    it('spans the clinic calendar day', () => {
      const { start, end } = clinicDayRange('2026-11-16', 'America/Mexico_City');
      expect(start.toISOString()).toBe('2026-11-16T06:00:00.000Z');
      expect(end.toISOString()).toBe('2026-11-17T05:59:59.999Z');
    });
  });

  describe('clinicToday', () => {
    it('returns the clinic calendar date, not the UTC one', () => {
      // 21:00 on the 16th in Mexico City, already the 17th in UTC
      expect(clinicToday('America/Mexico_City', new Date('2026-11-17T03:00:00.000Z'))).toBe(
        '2026-11-16'
      );
    });
  });

  describe('parseClinicDate', () => {
    it('keeps a plain calendar date as-is', () => {
      expect(parseClinicDate('2026-11-16', 'America/Mexico_City')).toBe('2026-11-16');
    });

    it('converts an instant to its clinic calendar date', () => {
      expect(parseClinicDate('2026-11-17T03:00:00.000Z', 'America/Mexico_City')).toBe(
        '2026-11-16'
      );
    });

    it('returns null for garbage or impossible dates', () => {
      expect(parseClinicDate('not-a-date', 'America/Mexico_City')).toBeNull();
      expect(parseClinicDate('2026-02-30', 'America/Mexico_City')).toBeNull();
    });
  });

  describe('dayOfWeekForDate', () => {
    it('is independent of the process timezone', () => {
      expect(dayOfWeekForDate('2026-11-16')).toBe(1); // Monday
      expect(dayOfWeekForDate('2026-11-15')).toBe(0); // Sunday
    });
  });
});
