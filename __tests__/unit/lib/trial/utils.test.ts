/**
 * @jest-environment node
 */
import {
  calculateTrialStatus,
  getTrialMessage,
  calculateTrialDaysRemaining,
  TrialStatus,
  FeatureAccess,
} from '@/lib/trial/utils';
import type { Tenant } from '@prisma/client';

// Helper to create a mock tenant with trial period
function createMockTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-123',
    name: 'Test Clinic',
    slug: 'test-clinic',
    ownerId: 'owner-123',
    plan: 'starter',
    isTrialPeriod: true,
    trialEndsAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    subdomain: null,
    customDomain: null,
    logoUrl: null,
    address: null,
    phone: null,
    email: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    ...overrides,
  } as Tenant;
}

// Helper to get date X days from now with consistent time handling
// For future dates: set to end of day to maximize day count
// For past dates: set to start of day to maximize negative day count
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  if (days >= 0) {
    // Future dates: end of day for full day counts
    date.setHours(23, 59, 59, 999);
  } else {
    // Past dates: start of day for correct negative day counts
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

describe('trial/utils', () => {
  describe('calculateTrialStatus', () => {
    describe('converted tenants (not in trial)', () => {
      it('should return converted status when isTrialPeriod is false', () => {
        const tenant = createMockTenant({
          isTrialPeriod: false,
          trialEndsAt: daysFromNow(10),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('converted');
        expect(result.daysRemaining).toBe(0);
        expect(result.showUpgradePrompt).toBe(false);
        expect(result.blockedFeatures).toHaveLength(0);
      });

      it('should return converted status when trialEndsAt is null', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: null,
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('converted');
        expect(result.bannerType).toBe('info');
      });
    });

    describe('active trial', () => {
      it('should return active status for trial with more than 3 days remaining', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(10),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('active');
        expect(result.daysRemaining).toBe(10);
        expect(result.bannerType).toBe('success');
        expect(result.showUpgradePrompt).toBe(false);
        expect(result.blockedFeatures).toHaveLength(0);
      });

      it('should include days remaining in display message', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(7),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.displayMessage).toContain('7');
        expect(result.displayMessage).toContain('días');
      });

      it('should return active status for 4 days remaining', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(4),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('active');
        expect(result.daysRemaining).toBe(4);
      });
    });

    describe('ending soon trial (3 days or less)', () => {
      it('should return ending_soon for 3 days remaining', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(3),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('ending_soon');
        expect(result.daysRemaining).toBe(3);
        expect(result.bannerType).toBe('warning');
        expect(result.showUpgradePrompt).toBe(true);
      });

      it('should return ending_soon for 2 days remaining', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(2),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('ending_soon');
        expect(result.daysRemaining).toBe(2);
      });

      it('should return ending_soon for 1 day remaining', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(1),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('ending_soon');
        expect(result.daysRemaining).toBe(1);
        expect(result.displayMessage).toMatch(/1 día/);
      });

      it('should use singular "día" for 1 day remaining', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(1),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.displayMessage).not.toContain('días');
        expect(result.displayMessage).toContain('día');
      });
    });

    describe('last day of trial (0 days remaining)', () => {
      it('should return ending_soon with special message for last day', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(0),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('ending_soon');
        expect(result.daysRemaining).toBe(0);
        expect(result.displayMessage).toBe('¡Último día de prueba!');
        expect(result.bannerType).toBe('warning');
        expect(result.showUpgradePrompt).toBe(true);
      });
    });

    describe('expired trial (negative days)', () => {
      it('should return expired status for 1 day ago', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-1),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('expired');
        expect(result.daysRemaining).toBe(-1);
        expect(result.bannerType).toBe('danger');
        expect(result.showUpgradePrompt).toBe(true);
      });

      it('should return expired status with correct message for multiple days', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-5),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.status).toBe('expired');
        expect(result.daysRemaining).toBe(-5);
        expect(result.displayMessage).toContain('5');
        expect(result.displayMessage).toContain('días');
      });

      it('should use singular "día" for 1 day ago', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-1),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.displayMessage).toContain('1 día');
        expect(result.displayMessage).not.toContain('1 días');
      });

      it('should block all features when expired', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-10),
        });

        const result = calculateTrialStatus(tenant);

        expect(result.blockedFeatures.length).toBeGreaterThan(0);

        const features = result.blockedFeatures.map(f => f.feature);
        expect(features).toContain('pets');
        expect(features).toContain('appointments');
        expect(features).toContain('inventory');
        expect(features).toContain('reports');
        expect(features).toContain('automations');
      });

      it('should mark all blocked features as not allowed', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-5),
        });

        const result = calculateTrialStatus(tenant);

        result.blockedFeatures.forEach((feature: FeatureAccess) => {
          expect(feature.allowed).toBe(false);
          expect(feature.reason).toBe('Trial expirado');
        });
      });
    });
  });

  describe('getTrialMessage', () => {
    describe('expired trials (negative days)', () => {
      it('should return message for 1 day expired', () => {
        const message = getTrialMessage(-1);
        expect(message).toContain('expiró hace 1 día');
        expect(message).not.toContain('1 días');
      });

      it('should return message for multiple days expired', () => {
        const message = getTrialMessage(-5);
        expect(message).toContain('expiró hace 5 días');
      });

      it('should handle large negative values', () => {
        const message = getTrialMessage(-30);
        expect(message).toContain('expiró hace 30 días');
      });
    });

    describe('last day (0 days)', () => {
      it('should return urgent last day message', () => {
        const message = getTrialMessage(0);
        expect(message).toBe('¡Hoy es el último día de tu prueba gratuita!');
      });
    });

    describe('tomorrow (1 day)', () => {
      it('should return tomorrow message', () => {
        const message = getTrialMessage(1);
        expect(message).toBe('Tu prueba gratuita termina mañana');
      });
    });

    describe('ending soon (2-3 days)', () => {
      it('should return ending soon message for 2 days', () => {
        const message = getTrialMessage(2);
        expect(message).toBe('Tu prueba gratuita termina en 2 días');
      });

      it('should return ending soon message for 3 days', () => {
        const message = getTrialMessage(3);
        expect(message).toBe('Tu prueba gratuita termina en 3 días');
      });
    });

    describe('active trial (4+ days)', () => {
      it('should return active message for 4 days', () => {
        const message = getTrialMessage(4);
        expect(message).toBe('Tienes 4 días restantes en tu prueba gratuita');
      });

      it('should return active message for 14 days', () => {
        const message = getTrialMessage(14);
        expect(message).toBe('Tienes 14 días restantes en tu prueba gratuita');
      });

      it('should return active message for 30 days', () => {
        const message = getTrialMessage(30);
        expect(message).toBe('Tienes 30 días restantes en tu prueba gratuita');
      });
    });
  });

  describe('calculateTrialDaysRemaining', () => {
    describe('non-trial tenants', () => {
      it('should return null when isTrialPeriod is false', () => {
        const tenant = createMockTenant({
          isTrialPeriod: false,
          trialEndsAt: daysFromNow(10),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBeNull();
      });

      it('should return null when trialEndsAt is null', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: null,
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBeNull();
      });

      it('should return null when both are not set', () => {
        const tenant = createMockTenant({
          isTrialPeriod: false,
          trialEndsAt: null,
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBeNull();
      });
    });

    describe('active trials', () => {
      it('should return positive days for future trial end', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(10),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBe(10);
      });

      it('should return 0 for trial ending today', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(0),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBe(0);
      });

      it('should return 1 for trial ending tomorrow', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(1),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBe(1);
      });
    });

    describe('expired trials', () => {
      it('should return negative days for expired trial', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-5),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBe(-5);
      });

      it('should return -1 for trial that expired yesterday', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-1),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBe(-1);
      });

      it('should handle long-expired trials', () => {
        const tenant = createMockTenant({
          isTrialPeriod: true,
          trialEndsAt: daysFromNow(-100),
        });

        const result = calculateTrialDaysRemaining(tenant);

        expect(result).toBe(-100);
      });
    });
  });

  describe('TrialStatus interface', () => {
    it('should have all required properties', () => {
      const tenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: daysFromNow(5),
      });

      const result = calculateTrialStatus(tenant);

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('daysRemaining');
      expect(result).toHaveProperty('displayMessage');
      expect(result).toHaveProperty('bannerType');
      expect(result).toHaveProperty('showUpgradePrompt');
      expect(result).toHaveProperty('blockedFeatures');
    });

    it('should have valid status values', () => {
      const validStatuses = ['active', 'ending_soon', 'expired', 'grace_period', 'converted'];

      // Test active
      const activeTenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: daysFromNow(10),
      });
      expect(validStatuses).toContain(calculateTrialStatus(activeTenant).status);

      // Test expired
      const expiredTenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: daysFromNow(-5),
      });
      expect(validStatuses).toContain(calculateTrialStatus(expiredTenant).status);

      // Test converted
      const convertedTenant = createMockTenant({
        isTrialPeriod: false,
      });
      expect(validStatuses).toContain(calculateTrialStatus(convertedTenant).status);
    });

    it('should have valid banner types', () => {
      const validBannerTypes = ['success', 'warning', 'danger', 'info'];

      const tenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: daysFromNow(5),
      });

      expect(validBannerTypes).toContain(calculateTrialStatus(tenant).bannerType);
    });
  });

  describe('edge cases', () => {
    it('should handle Date object for trialEndsAt', () => {
      const tenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });

      const result = calculateTrialStatus(tenant);

      expect(result.status).toBe('active');
      expect(result.daysRemaining).toBe(7);
    });

    it('should handle string date for trialEndsAt', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const tenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: futureDate,
      });

      const result = calculateTrialStatus(tenant);

      expect(result.daysRemaining).toBe(5);
    });

    it('should handle trial ending at exact current time', () => {
      const tenant = createMockTenant({
        isTrialPeriod: true,
        trialEndsAt: new Date(), // Exactly now
      });

      const result = calculateTrialStatus(tenant);

      // Should be 0 days remaining (last day)
      expect(result.daysRemaining).toBe(0);
      expect(result.status).toBe('ending_soon');
    });
  });
});
