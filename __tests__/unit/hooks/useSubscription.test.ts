/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from '@/hooks/useSubscription';
import type { Tenant } from '@prisma/client';

// Helper to create mock tenant with defaults
const createMockTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 'tenant_123',
  name: 'Test Clinic',
  slug: 'test-clinic',
  planType: 'PROFESIONAL',
  planName: 'Profesional',
  subscriptionStatus: 'ACTIVE',
  isTrialPeriod: false,
  trialEndsAt: null,
  subscriptionEndsAt: new Date('2025-12-31'),
  stripeCustomerId: 'cus_123',
  stripeSubscriptionId: 'sub_123',
  stripeProductId: 'prod_123',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  status: 'ACTIVE',
  ...overrides,
});

describe('useSubscription', () => {
  describe('Subscription Status Parsing', () => {
    it('should return correct state for ACTIVE status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'ACTIVE' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isActive).toBe(true);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isPastDue).toBe(false);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.subscriptionStatus).toBe('ACTIVE');
    });

    it('should return correct state for TRIALING status', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
        trialEndsAt: new Date('2025-12-15'),
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isTrialing).toBe(true);
      expect(result.current.isPastDue).toBe(false);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.subscriptionStatus).toBe('TRIALING');
    });

    it('should return correct state for PAST_DUE status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'PAST_DUE' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isPastDue).toBe(true);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.subscriptionStatus).toBe('PAST_DUE');
    });

    it('should return correct state for CANCELED status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'CANCELED' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isPastDue).toBe(false);
      expect(result.current.isCanceled).toBe(true);
      expect(result.current.subscriptionStatus).toBe('CANCELED');
    });

    it('should handle null tenant gracefully', () => {
      const { result } = renderHook(() => useSubscription(null));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isPastDue).toBe(false);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.planName).toBeNull();
      expect(result.current.subscriptionEndsAt).toBeNull();
      expect(result.current.subscriptionStatus).toBe('INACTIVE');
    });

    it('should handle unknown subscription status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'UNKNOWN' as never });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isActive).toBe(false);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isPastDue).toBe(false);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.subscriptionStatus).toBe('UNKNOWN');
    });
  });

  describe('Plan Name Handling', () => {
    it('should return correct plan name', () => {
      const tenant = createMockTenant({ planName: 'Profesional' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.planName).toBe('Profesional');
    });

    it('should handle null plan name', () => {
      const tenant = createMockTenant({ planName: null });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.planName).toBeNull();
    });

    it('should return different plan names correctly', () => {
      const clinicaTenant = createMockTenant({ planName: 'Clinica' });
      const empresaTenant = createMockTenant({ planName: 'Empresa' });

      const { result: clinicaResult } = renderHook(() => useSubscription(clinicaTenant));
      const { result: empresaResult } = renderHook(() => useSubscription(empresaTenant));

      expect(clinicaResult.current.planName).toBe('Clinica');
      expect(empresaResult.current.planName).toBe('Empresa');
    });
  });

  describe('Trial Period Logic', () => {
    it('should use trialEndsAt when in trial period', () => {
      const trialEndDate = new Date('2025-12-15');
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
        trialEndsAt: trialEndDate,
        subscriptionEndsAt: new Date('2025-12-31'),
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.subscriptionEndsAt).toEqual(trialEndDate);
    });

    it('should use subscriptionEndsAt when subscription is paid', () => {
      const subscriptionEndDate = new Date('2025-12-31');
      const tenant = createMockTenant({
        subscriptionStatus: 'ACTIVE',
        isTrialPeriod: false,
        trialEndsAt: null,
        subscriptionEndsAt: subscriptionEndDate,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.subscriptionEndsAt).toEqual(subscriptionEndDate);
    });

    it('should use subscriptionEndsAt when isTrialPeriod is true but trialEndsAt is null', () => {
      const subscriptionEndDate = new Date('2025-12-31');
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
        trialEndsAt: null,
        subscriptionEndsAt: subscriptionEndDate,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.subscriptionEndsAt).toEqual(subscriptionEndDate);
    });

    it('should handle missing both date fields', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'ACTIVE',
        isTrialPeriod: false,
        trialEndsAt: null,
        subscriptionEndsAt: null,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.subscriptionEndsAt).toBeNull();
    });
  });

  describe('Derived States', () => {
    it('should return hasActiveSubscription true for ACTIVE status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'ACTIVE' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.hasActiveSubscription).toBe(true);
    });

    it('should return hasActiveSubscription true for TRIALING status', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.hasActiveSubscription).toBe(true);
    });

    it('should return hasActiveSubscription false for PAST_DUE status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'PAST_DUE' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.hasActiveSubscription).toBe(false);
    });

    it('should return hasActiveSubscription false for CANCELED status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'CANCELED' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.hasActiveSubscription).toBe(false);
    });

    it('should return needsPayment true for PAST_DUE status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'PAST_DUE' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.needsPayment).toBe(true);
    });

    it('should return needsPayment true for CANCELED status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'CANCELED' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.needsPayment).toBe(true);
    });

    it('should return needsPayment false for ACTIVE status', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'ACTIVE' });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.needsPayment).toBe(false);
    });

    it('should return needsPayment false for TRIALING status', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.needsPayment).toBe(false);
    });

    it('should return isInTrial true only when TRIALING and isTrialPeriod is true', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isInTrial).toBe(true);
    });

    it('should return isInTrial false when TRIALING but isTrialPeriod is false', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: false,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isInTrial).toBe(false);
    });

    it('should return isInTrial false when ACTIVE even if isTrialPeriod is true', () => {
      const tenant = createMockTenant({
        subscriptionStatus: 'ACTIVE',
        isTrialPeriod: true,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.isInTrial).toBe(false);
    });

    it('should return isInTrial as falsy when tenant is null', () => {
      const { result } = renderHook(() => useSubscription(null));

      expect(result.current.isInTrial).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('should update state when tenant object changes', () => {
      const activeTenant = createMockTenant({ subscriptionStatus: 'ACTIVE' });
      const canceledTenant = createMockTenant({ subscriptionStatus: 'CANCELED' });

      const { result, rerender } = renderHook(
        ({ tenant }) => useSubscription(tenant),
        { initialProps: { tenant: activeTenant } }
      );

      expect(result.current.isActive).toBe(true);
      expect(result.current.isCanceled).toBe(false);

      rerender({ tenant: canceledTenant });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCanceled).toBe(true);
    });

    it('should handle transition from tenant to null', () => {
      const tenant = createMockTenant({ subscriptionStatus: 'ACTIVE' });

      const { result, rerender } = renderHook(
        ({ tenant }) => useSubscription(tenant),
        { initialProps: { tenant: tenant as Tenant | null } }
      );

      expect(result.current.isActive).toBe(true);

      rerender({ tenant: null });

      // Note: State doesn't reset when tenant becomes null (current implementation)
      // This test documents the current behavior
      expect(result.current.subscriptionStatus).toBe('INACTIVE');
    });

    it('should handle expired trial date', () => {
      const expiredTrialDate = new Date('2024-01-01'); // Past date
      const tenant = createMockTenant({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
        trialEndsAt: expiredTrialDate,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.subscriptionEndsAt).toEqual(expiredTrialDate);
      expect(result.current.isTrialing).toBe(true);
    });

    it('should handle future subscription end date', () => {
      const futureDate = new Date('2030-12-31');
      const tenant = createMockTenant({
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: futureDate,
      });
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current.subscriptionEndsAt).toEqual(futureDate);
    });

    it('should handle rapid tenant changes', () => {
      const tenant1 = createMockTenant({ subscriptionStatus: 'ACTIVE', planName: 'Plan A' });
      const tenant2 = createMockTenant({ subscriptionStatus: 'TRIALING', planName: 'Plan B' });
      const tenant3 = createMockTenant({ subscriptionStatus: 'CANCELED', planName: 'Plan C' });

      const { result, rerender } = renderHook(
        ({ tenant }) => useSubscription(tenant),
        { initialProps: { tenant: tenant1 } }
      );

      rerender({ tenant: tenant2 });
      rerender({ tenant: tenant3 });

      expect(result.current.isCanceled).toBe(true);
      expect(result.current.planName).toBe('Plan C');
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const tenant = createMockTenant();
      const { result } = renderHook(() => useSubscription(tenant));

      expect(result.current).toHaveProperty('isActive');
      expect(result.current).toHaveProperty('isTrialing');
      expect(result.current).toHaveProperty('isPastDue');
      expect(result.current).toHaveProperty('isCanceled');
      expect(result.current).toHaveProperty('planName');
      expect(result.current).toHaveProperty('subscriptionEndsAt');
      expect(result.current).toHaveProperty('hasActiveSubscription');
      expect(result.current).toHaveProperty('needsPayment');
      expect(result.current).toHaveProperty('isInTrial');
      expect(result.current).toHaveProperty('subscriptionStatus');
    });

    it('should return boolean values for status flags', () => {
      const tenant = createMockTenant();
      const { result } = renderHook(() => useSubscription(tenant));

      expect(typeof result.current.isActive).toBe('boolean');
      expect(typeof result.current.isTrialing).toBe('boolean');
      expect(typeof result.current.isPastDue).toBe('boolean');
      expect(typeof result.current.isCanceled).toBe('boolean');
      expect(typeof result.current.hasActiveSubscription).toBe('boolean');
      expect(typeof result.current.needsPayment).toBe('boolean');
    });
  });
});
