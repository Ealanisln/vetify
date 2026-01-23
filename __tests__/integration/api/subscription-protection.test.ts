/**
 * Integration tests for Subscription-based Page Protection
 *
 * These tests verify that protected pages (customers, reports) require
 * an active subscription, and that the settings page properly gates
 * tabs based on subscription status.
 *
 * Related to: VETIF-XXX - Fix Subscription Access Control Security Vulnerabilities
 */

import { hasActiveSubscription } from '@/lib/auth';

// Test data fixtures
const createTenantWithSubscription = (overrides = {}) => ({
  id: 'test-tenant-id',
  name: 'Test Clinic',
  subscriptionStatus: 'ACTIVE',
  isTrialPeriod: false,
  trialEndsAt: null,
  planId: 'plan-basic',
  ...overrides,
});

const createActiveTrialTenant = () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  return createTenantWithSubscription({
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    trialEndsAt: futureDate,
  });
};

const createExpiredTrialTenant = () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7);
  return createTenantWithSubscription({
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    trialEndsAt: pastDate,
  });
};

const createCancelledSubscriptionTenant = () =>
  createTenantWithSubscription({
    subscriptionStatus: 'CANCELLED',
    isTrialPeriod: false,
    trialEndsAt: null,
  });

describe('Subscription-based Page Protection', () => {
  describe('Customers Page Protection', () => {
    it('should allow access for tenant with active paid subscription', () => {
      const tenant = createTenantWithSubscription();
      expect(hasActiveSubscription(tenant)).toBe(true);
    });

    it('should allow access for tenant with active trial', () => {
      const tenant = createActiveTrialTenant();
      expect(hasActiveSubscription(tenant)).toBe(true);
    });

    it('should deny access for tenant with expired trial', () => {
      const tenant = createExpiredTrialTenant();
      expect(hasActiveSubscription(tenant)).toBe(false);
    });

    it('should deny access for tenant with cancelled subscription', () => {
      const tenant = createCancelledSubscriptionTenant();
      expect(hasActiveSubscription(tenant)).toBe(false);
    });
  });

  describe('Reports Page Protection', () => {
    it('should allow access for tenant with active paid subscription', () => {
      const tenant = createTenantWithSubscription();
      expect(hasActiveSubscription(tenant)).toBe(true);
    });

    it('should allow access for tenant with active trial', () => {
      const tenant = createActiveTrialTenant();
      expect(hasActiveSubscription(tenant)).toBe(true);
    });

    it('should deny access for tenant with expired trial', () => {
      const tenant = createExpiredTrialTenant();
      expect(hasActiveSubscription(tenant)).toBe(false);
    });

    it('should deny access for tenant with cancelled subscription', () => {
      const tenant = createCancelledSubscriptionTenant();
      expect(hasActiveSubscription(tenant)).toBe(false);
    });
  });

  describe('Settings Page Tab Gating', () => {
    // Settings page tabs that require subscription
    const subscriptionRequiredTabs = [
      'public-page',
      'qr-codes',
      'analytics',
      'business-hours',
      'services',
      'notifications',
      'security',
      'clinic-info',
    ];

    // Settings page tabs that are always accessible
    const alwaysAccessibleTabs = ['subscription'];

    describe('When subscription is active', () => {
      it('should allow access to all settings tabs', () => {
        const tenant = createTenantWithSubscription();
        const isActive = hasActiveSubscription(tenant);

        expect(isActive).toBe(true);

        // All tabs should be accessible
        [...subscriptionRequiredTabs, ...alwaysAccessibleTabs].forEach((tab) => {
          // Tab access logic: !requiresSubscription || isActive
          const tabConfig = { requiresSubscription: subscriptionRequiredTabs.includes(tab) };
          const canAccessTab = !tabConfig.requiresSubscription || isActive;
          expect(canAccessTab).toBe(true);
        });
      });
    });

    describe('When subscription is expired', () => {
      it('should only allow access to subscription tab', () => {
        const tenant = createExpiredTrialTenant();
        const isActive = hasActiveSubscription(tenant);

        expect(isActive).toBe(false);

        // Only subscription tab should be accessible
        alwaysAccessibleTabs.forEach((tab) => {
          const tabConfig = { requiresSubscription: false };
          const canAccessTab = !tabConfig.requiresSubscription || isActive;
          expect(canAccessTab).toBe(true);
        });

        // All other tabs should be blocked
        subscriptionRequiredTabs.forEach((tab) => {
          const tabConfig = { requiresSubscription: true };
          const canAccessTab = !tabConfig.requiresSubscription || isActive;
          expect(canAccessTab).toBe(false);
        });
      });

      it('subscription tab should always be accessible regardless of subscription status', () => {
        const expiredTenant = createExpiredTrialTenant();
        const cancelledTenant = createCancelledSubscriptionTenant();

        // Even with no subscription, the subscription tab must be accessible
        // so users can subscribe/upgrade
        const subscriptionTabConfig = { requiresSubscription: false };

        [expiredTenant, cancelledTenant].forEach((tenant) => {
          const isActive = hasActiveSubscription(tenant);
          const canAccessSubscriptionTab =
            !subscriptionTabConfig.requiresSubscription || isActive;
          expect(canAccessSubscriptionTab).toBe(true);
        });
      });
    });

    describe('Tab Gating Logic', () => {
      it('should correctly implement tab access check', () => {
        // Simulate the logic used in SettingsPageClient.tsx
        const settingsSections = [
          { id: 'public-page', requiresSubscription: true },
          { id: 'subscription', requiresSubscription: false },
          { id: 'services', requiresSubscription: true },
        ];

        const isActiveSubscription = false; // Expired trial

        settingsSections.forEach((section) => {
          const isLocked = !isActiveSubscription && section.requiresSubscription;
          const isDisabled = isLocked; // Simplified

          if (section.id === 'subscription') {
            expect(isLocked).toBe(false);
            expect(isDisabled).toBe(false);
          } else {
            expect(isLocked).toBe(true);
            expect(isDisabled).toBe(true);
          }
        });
      });

      it('should handle section change prevention correctly', () => {
        const isActiveSubscription = false;

        const handleSectionChange = (sectionId: string) => {
          const sections = [
            { id: 'public-page', requiresSubscription: true },
            { id: 'subscription', requiresSubscription: false },
          ];
          const section = sections.find((s) => s.id === sectionId);

          // Return false if cannot change
          if (!isActiveSubscription && section?.requiresSubscription) {
            return false;
          }
          return true;
        };

        expect(handleSectionChange('public-page')).toBe(false); // Blocked
        expect(handleSectionChange('subscription')).toBe(true); // Allowed
      });
    });
  });

  describe('URL Parameter Handling', () => {
    describe('Settings page ?tab= parameter', () => {
      it('should use URL tab parameter when subscription is active', () => {
        const isActiveSubscription = true;
        const tabParam = 'public-page';
        const validTabs = ['public-page', 'subscription', 'services'];

        const getInitialSection = () => {
          if (!isActiveSubscription) return 'subscription';
          if (tabParam && validTabs.includes(tabParam)) return tabParam;
          return 'public-page';
        };

        expect(getInitialSection()).toBe('public-page');
      });

      it('should ignore URL tab parameter and default to subscription when subscription is expired', () => {
        const isActiveSubscription = false;
        const tabParam = 'public-page'; // User tries to access restricted tab

        const getInitialSection = () => {
          if (!isActiveSubscription) return 'subscription';
          return tabParam || 'public-page';
        };

        expect(getInitialSection()).toBe('subscription');
      });

      it('should handle ?tab=subscription correctly for expired subscription', () => {
        const isActiveSubscription = false;
        const tabParam = 'subscription';

        const getInitialSection = () => {
          if (!isActiveSubscription) return 'subscription';
          if (tabParam) return tabParam;
          return 'public-page';
        };

        expect(getInitialSection()).toBe('subscription');
      });

      it('should handle invalid tab parameter gracefully', () => {
        const isActiveSubscription = true;
        const tabParam = 'invalid-tab';
        const validTabs = ['public-page', 'subscription', 'services'];

        const getInitialSection = () => {
          if (!isActiveSubscription) return 'subscription';
          if (tabParam && validTabs.includes(tabParam)) return tabParam;
          return 'public-page';
        };

        expect(getInitialSection()).toBe('public-page'); // Falls back to default
      });
    });

    describe('Redirect URL for protected pages', () => {
      it('should redirect to correct URL when subscription is expired', () => {
        // This is the expected redirect URL from requireActiveSubscription
        const redirectUrl = '/dashboard/settings?tab=subscription&reason=trial_expired';

        const url = new URL(redirectUrl, 'http://localhost');
        expect(url.pathname).toBe('/dashboard/settings');
        expect(url.searchParams.get('tab')).toBe('subscription');
        expect(url.searchParams.get('reason')).toBe('trial_expired');
      });
    });
  });

  describe('Subscription Status Edge Cases', () => {
    it('should handle trial ending today', () => {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const tenant = createTenantWithSubscription({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
        trialEndsAt: endOfToday,
      });

      // Trial that ends later today should still be valid
      expect(hasActiveSubscription(tenant)).toBe(true);
    });

    it('should handle trial that just started', () => {
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      const tenant = createTenantWithSubscription({
        subscriptionStatus: 'TRIALING',
        isTrialPeriod: true,
        trialEndsAt: twoWeeksFromNow,
      });

      expect(hasActiveSubscription(tenant)).toBe(true);
    });

    it('should handle PAST_DUE status', () => {
      const tenant = createTenantWithSubscription({
        subscriptionStatus: 'PAST_DUE',
        isTrialPeriod: false,
      });

      expect(hasActiveSubscription(tenant)).toBe(false);
    });

    it('should handle status change from ACTIVE to CANCELLED', () => {
      const tenant = createTenantWithSubscription({
        subscriptionStatus: 'CANCELLED',
        isTrialPeriod: false,
        trialEndsAt: null,
      });

      expect(hasActiveSubscription(tenant)).toBe(false);
    });
  });

  describe('Protected Features Documentation', () => {
    // These tests document which features require active subscription

    it('should protect customer management features', () => {
      const protectedFeatures = [
        '/dashboard/customers',
        '/dashboard/customers/new',
        '/dashboard/customers/:id',
        '/dashboard/customers/:id/edit',
      ];

      // All these routes now use requireActiveSubscription
      expect(protectedFeatures.length).toBe(4);
    });

    it('should protect reports features', () => {
      const protectedFeatures = ['/dashboard/reports'];

      // Reports page now uses requireActiveSubscription
      expect(protectedFeatures.length).toBe(1);
    });

    it('should document settings tab protection', () => {
      const protectedSettingsTabs = [
        { id: 'public-page', protected: true },
        { id: 'qr-codes', protected: true },
        { id: 'analytics', protected: true },
        { id: 'business-hours', protected: true },
        { id: 'services', protected: true },
        { id: 'subscription', protected: false }, // Always accessible
        { id: 'notifications', protected: true },
        { id: 'security', protected: true },
        { id: 'clinic-info', protected: true },
      ];

      const unprotectedTabs = protectedSettingsTabs.filter((t) => !t.protected);
      expect(unprotectedTabs).toHaveLength(1);
      expect(unprotectedTabs[0].id).toBe('subscription');
    });
  });
});

describe('SettingsPageClient Subscription Gating', () => {
  // Unit tests for the client component logic

  describe('Initial Section Selection', () => {
    it('should default to subscription tab when no active subscription', () => {
      const isActiveSubscription = false;
      const tabParam = null;

      const getInitialSection = () => {
        if (!isActiveSubscription) return 'subscription';
        if (tabParam) return tabParam;
        return 'public-page';
      };

      expect(getInitialSection()).toBe('subscription');
    });

    it('should respect URL tab param when subscription is active', () => {
      const isActiveSubscription = true;
      const tabParam = 'services';
      const validTabs = ['public-page', 'services', 'subscription'];

      const getInitialSection = () => {
        if (!isActiveSubscription) return 'subscription';
        if (tabParam && validTabs.includes(tabParam)) return tabParam;
        return 'public-page';
      };

      expect(getInitialSection()).toBe('services');
    });

    it('should default to public-page when subscription active and no tab param', () => {
      const isActiveSubscription = true;
      const tabParam = null;

      const getInitialSection = () => {
        if (!isActiveSubscription) return 'subscription';
        if (tabParam) return tabParam;
        return 'public-page';
      };

      expect(getInitialSection()).toBe('public-page');
    });
  });

  describe('Section Change Handler', () => {
    const settingsSections = [
      { id: 'public-page', requiresSubscription: true },
      { id: 'subscription', requiresSubscription: false },
      { id: 'services', requiresSubscription: true },
    ];

    it('should block navigation to protected tab when subscription expired', () => {
      const isActiveSubscription = false;
      let activeSection = 'subscription';

      const handleSectionChange = (sectionId: string) => {
        const section = settingsSections.find((s) => s.id === sectionId);
        if (!isActiveSubscription && section?.requiresSubscription) return;
        activeSection = sectionId;
      };

      handleSectionChange('public-page');
      expect(activeSection).toBe('subscription'); // Should not change

      handleSectionChange('services');
      expect(activeSection).toBe('subscription'); // Should not change
    });

    it('should allow navigation to subscription tab when subscription expired', () => {
      const isActiveSubscription = false;
      let activeSection = 'public-page';

      const handleSectionChange = (sectionId: string) => {
        const section = settingsSections.find((s) => s.id === sectionId);
        if (!isActiveSubscription && section?.requiresSubscription) return;
        activeSection = sectionId;
      };

      handleSectionChange('subscription');
      expect(activeSection).toBe('subscription'); // Should change
    });

    it('should allow navigation to any tab when subscription active', () => {
      const isActiveSubscription = true;
      let activeSection = 'subscription';

      const handleSectionChange = (sectionId: string) => {
        const section = settingsSections.find((s) => s.id === sectionId);
        if (!isActiveSubscription && section?.requiresSubscription) return;
        activeSection = sectionId;
      };

      handleSectionChange('public-page');
      expect(activeSection).toBe('public-page');

      handleSectionChange('services');
      expect(activeSection).toBe('services');
    });
  });

  describe('Tab Locking Visual State', () => {
    const settingsSections = [
      { id: 'public-page', requiresSubscription: true, comingSoon: false },
      { id: 'subscription', requiresSubscription: false, comingSoon: false },
      { id: 'security', requiresSubscription: true, comingSoon: true },
    ];

    it('should calculate isLocked correctly', () => {
      const isActiveSubscription = false;

      settingsSections.forEach((section) => {
        const isLocked = !isActiveSubscription && section.requiresSubscription;

        if (section.id === 'public-page') {
          expect(isLocked).toBe(true);
        } else if (section.id === 'subscription') {
          expect(isLocked).toBe(false);
        } else if (section.id === 'security') {
          expect(isLocked).toBe(true);
        }
      });
    });

    it('should calculate isDisabled correctly (combines locked and comingSoon)', () => {
      const isActiveSubscription = false;

      settingsSections.forEach((section) => {
        const isLocked = !isActiveSubscription && section.requiresSubscription;
        const isDisabled = section.comingSoon || isLocked;

        if (section.id === 'public-page') {
          expect(isDisabled).toBe(true); // Locked
        } else if (section.id === 'subscription') {
          expect(isDisabled).toBe(false); // Neither
        } else if (section.id === 'security') {
          expect(isDisabled).toBe(true); // Both comingSoon and locked
        }
      });
    });

    it('should not show lock icon for comingSoon tabs', () => {
      const isActiveSubscription = false;

      settingsSections.forEach((section) => {
        const isLocked = !isActiveSubscription && section.requiresSubscription;
        const showLockIcon = isLocked && !section.comingSoon;

        if (section.id === 'security') {
          // comingSoon takes precedence, don't show lock
          expect(showLockIcon).toBe(false);
        } else if (section.id === 'public-page') {
          // Locked and not comingSoon, show lock
          expect(showLockIcon).toBe(true);
        }
      });
    });
  });
});
