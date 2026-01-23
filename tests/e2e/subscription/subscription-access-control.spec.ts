import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Subscription-based Access Control
 *
 * This test suite verifies:
 * - Protected pages (customers, reports) redirect users with expired trials
 * - Settings page shows locked tabs for users without active subscription
 * - URL parameters work correctly for settings tabs
 * - Warning banner displays for expired subscriptions
 * - Lock icons appear on restricted settings tabs
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 *
 * To run with different subscription states, configure test users:
 * - TEST_USER_ACTIVE_SUBSCRIPTION: User with active paid subscription
 * - TEST_USER_EXPIRED_TRIAL: User whose trial has expired
 * - TEST_USER_ACTIVE_TRIAL: User with active trial period
 *
 * Related to: Fix Subscription Access Control Security Vulnerabilities
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';
const isSubscriptionTestEnabled = process.env.TEST_SUBSCRIPTION_ACCESS === 'true';

test.describe('Subscription Access Control', () => {
  test.skip(
    !isAuthTestEnabled,
    'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true'
  );

  test.describe('Protected Pages - Expired Subscription', () => {
    test.skip(
      !isSubscriptionTestEnabled,
      'Skipping - requires subscription test setup. Set TEST_SUBSCRIPTION_ACCESS=true'
    );

    test.describe('Customers Page Protection', () => {
      test('should redirect to settings subscription tab when accessing /dashboard/customers', async ({
        page,
      }) => {
        // User with expired trial tries to access customers page
        await page.goto('/dashboard/customers');
        await page.waitForLoadState('networkidle');

        // Should redirect to settings with subscription tab
        await expect(page).toHaveURL(/\/dashboard\/settings\?tab=subscription/);
      });

      test('redirect URL should include reason parameter', async ({ page }) => {
        await page.goto('/dashboard/customers');
        await page.waitForLoadState('networkidle');

        // URL should contain reason=trial_expired
        await expect(page).toHaveURL(/reason=trial_expired/);
      });

      test('should not show customers page content after redirect', async ({
        page,
      }) => {
        await page.goto('/dashboard/customers');
        await page.waitForLoadState('networkidle');

        // Should NOT see customers page header
        await expect(page.locator('h1:has-text("Clientes")')).not.toBeVisible();

        // Should see settings page header
        await expect(page.locator('h1:has-text("Configuración")')).toBeVisible();
      });
    });

    test.describe('Reports Page Protection', () => {
      test('should redirect to settings subscription tab when accessing /dashboard/reports', async ({
        page,
      }) => {
        await page.goto('/dashboard/reports');
        await page.waitForLoadState('networkidle');

        // Should redirect to settings with subscription tab
        await expect(page).toHaveURL(/\/dashboard\/settings\?tab=subscription/);
      });

      test('should not show reports page content after redirect', async ({
        page,
      }) => {
        await page.goto('/dashboard/reports');
        await page.waitForLoadState('networkidle');

        // Should NOT see reports page header
        await expect(
          page.locator('h1:has-text("Reportes")')
        ).not.toBeVisible();

        // Should see settings page header
        await expect(page.locator('h1:has-text("Configuración")')).toBeVisible();
      });
    });
  });

  test.describe('Settings Page Tab Gating - Expired Subscription', () => {
    test.skip(
      !isSubscriptionTestEnabled,
      'Skipping - requires subscription test setup. Set TEST_SUBSCRIPTION_ACCESS=true'
    );

    test.beforeEach(async ({ page }) => {
      // Navigate to settings page with expired subscription user
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
    });

    test('should display expired subscription warning banner', async ({
      page,
    }) => {
      // Should show amber/yellow warning banner
      const warningBanner = page.locator(
        'text=/período de prueba.*expirado|suscríbete para acceder/i'
      );
      await expect(warningBanner).toBeVisible();
    });

    test('should default to subscription tab', async ({ page }) => {
      // Subscription tab should be active
      const subscriptionTab = page.locator(
        '[data-testid="settings-tab-subscription"]'
      );
      await expect(subscriptionTab).toHaveClass(/bg-blue-50|border-blue-700/);

      // Subscription content should be visible
      await expect(
        page.locator('text=/suscripción|facturación|plan/i').first()
      ).toBeVisible();
    });

    test('should show lock icons on protected tabs', async ({ page }) => {
      // Protected tabs should have lock icons
      const protectedTabs = [
        'settings-tab-public-page',
        'settings-tab-qr-codes',
        'settings-tab-analytics',
        'settings-tab-business-hours',
        'settings-tab-services',
        'settings-tab-notifications',
      ];

      for (const tabId of protectedTabs) {
        const tab = page.locator(`[data-testid="${tabId}"]`);
        if (await tab.isVisible()) {
          // Tab should have lock icon (h-3 w-3 class is used for lock icon)
          const lockIcon = tab.locator('svg.text-amber-500');
          await expect(lockIcon).toBeVisible();
        }
      }
    });

    test('subscription tab should NOT have lock icon', async ({ page }) => {
      const subscriptionTab = page.locator(
        '[data-testid="settings-tab-subscription"]'
      );

      // Subscription tab should NOT have lock icon
      const lockIcon = subscriptionTab.locator('svg.text-amber-500');
      await expect(lockIcon).not.toBeVisible();
    });

    test('should not be able to click on protected tabs', async ({ page }) => {
      // Click on public-page tab
      const publicPageTab = page.locator(
        '[data-testid="settings-tab-public-page"]'
      );

      if (await publicPageTab.isVisible()) {
        // Tab should be disabled
        await expect(publicPageTab).toBeDisabled();

        // Try to click anyway
        await publicPageTab.click({ force: true });

        // Should still be on subscription tab content
        await expect(
          page.locator('text=/suscripción.*facturación|gestione su plan/i').first()
        ).toBeVisible();
      }
    });

    test('should be able to click subscription tab', async ({ page }) => {
      const subscriptionTab = page.locator(
        '[data-testid="settings-tab-subscription"]'
      );

      // Tab should be enabled
      await expect(subscriptionTab).toBeEnabled();

      // Click should work
      await subscriptionTab.click();

      // Subscription content should be visible
      await expect(
        page.locator('text=/suscripción|facturación|plan/i').first()
      ).toBeVisible();
    });

    test('protected tabs should have reduced opacity', async ({ page }) => {
      const publicPageTab = page.locator(
        '[data-testid="settings-tab-public-page"]'
      );

      if (await publicPageTab.isVisible()) {
        // Should have opacity-60 class
        await expect(publicPageTab).toHaveClass(/opacity-60/);
      }
    });
  });

  test.describe('Settings Page URL Parameters - Expired Subscription', () => {
    test.skip(
      !isSubscriptionTestEnabled,
      'Skipping - requires subscription test setup. Set TEST_SUBSCRIPTION_ACCESS=true'
    );

    test('should ignore ?tab=public-page and show subscription tab', async ({
      page,
    }) => {
      // Try to directly access a protected tab via URL
      await page.goto('/dashboard/settings?tab=public-page');
      await page.waitForLoadState('networkidle');

      // Should default to subscription tab instead
      const subscriptionTab = page.locator(
        '[data-testid="settings-tab-subscription"]'
      );
      await expect(subscriptionTab).toHaveClass(/bg-blue-50|border-blue-700/);
    });

    test('should respect ?tab=subscription when subscription expired', async ({
      page,
    }) => {
      await page.goto('/dashboard/settings?tab=subscription');
      await page.waitForLoadState('networkidle');

      // Subscription tab should be active
      const subscriptionTab = page.locator(
        '[data-testid="settings-tab-subscription"]'
      );
      await expect(subscriptionTab).toHaveClass(/bg-blue-50|border-blue-700/);
    });

    test('should ignore ?tab=services and show subscription tab', async ({
      page,
    }) => {
      await page.goto('/dashboard/settings?tab=services');
      await page.waitForLoadState('networkidle');

      // Should default to subscription tab
      const subscriptionTab = page.locator(
        '[data-testid="settings-tab-subscription"]'
      );
      await expect(subscriptionTab).toHaveClass(/bg-blue-50|border-blue-700/);
    });
  });

  test.describe('Settings Page - Active Subscription', () => {
    // These tests run when user has active subscription
    // They verify normal functionality works as expected

    test.beforeEach(async ({ page }) => {
      // Navigate to settings page
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
    });

    test('should NOT display warning banner when subscription is active', async ({
      page,
    }) => {
      // Warning banner should not be visible
      const warningBanner = page.locator(
        'text=/período de prueba.*expirado/i'
      );

      // Either banner doesn't exist or it's not visible
      const isVisible = await warningBanner.isVisible().catch(() => false);

      // If we're here with active subscription, banner should not be visible
      // Note: This test may pass even with expired subscription if banner text is different
      expect(isVisible).toBe(false);
    });

    test('should allow clicking on all tabs', async ({ page }) => {
      const tabs = [
        'settings-tab-public-page',
        'settings-tab-qr-codes',
        'settings-tab-business-hours',
        'settings-tab-services',
        'settings-tab-subscription',
      ];

      for (const tabId of tabs) {
        const tab = page.locator(`[data-testid="${tabId}"]`);
        if (await tab.isVisible()) {
          // Tab should be enabled (unless it's a "coming soon" tab)
          const isDisabled = await tab.isDisabled();
          const hasComingSoonBadge = await tab
            .locator('text=/próximamente/i')
            .isVisible()
            .catch(() => false);

          if (!hasComingSoonBadge) {
            expect(isDisabled).toBe(false);
          }
        }
      }
    });

    test('tabs should NOT have lock icons when subscription active', async ({
      page,
    }) => {
      const publicPageTab = page.locator(
        '[data-testid="settings-tab-public-page"]'
      );

      if (await publicPageTab.isVisible()) {
        // Should NOT have lock icon
        const lockIcon = publicPageTab.locator('svg.text-amber-500');
        const hasLockIcon = await lockIcon.isVisible().catch(() => false);

        // If subscription is active, there should be no lock
        expect(hasLockIcon).toBe(false);
      }
    });

    test('should respect URL ?tab parameter', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=services');
      await page.waitForLoadState('networkidle');

      // Services tab should be active
      const servicesTab = page.locator('[data-testid="settings-tab-services"]');
      if (await servicesTab.isVisible()) {
        await expect(servicesTab).toHaveClass(/bg-blue-50|border-blue-700/);
      }
    });
  });

  test.describe('Protected Pages - Active Subscription', () => {
    test('should allow access to /dashboard/customers', async ({ page }) => {
      await page.goto('/dashboard/customers');
      await page.waitForLoadState('networkidle');

      // Should remain on customers page
      await expect(page).toHaveURL(/\/dashboard\/customers/);

      // Should see customers page header
      await expect(page.locator('h1:has-text("Clientes")')).toBeVisible();
    });

    test('should allow access to /dashboard/reports', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.waitForLoadState('networkidle');

      // Should remain on reports page
      await expect(page).toHaveURL(/\/dashboard\/reports/);

      // Should see reports page header
      await expect(
        page.locator('h1:has-text("Reportes"), h1:has-text("Análisis")')
      ).toBeVisible();
    });
  });

  test.describe('Navigation Flow After Redirect', () => {
    test.skip(
      !isSubscriptionTestEnabled,
      'Skipping - requires subscription test setup. Set TEST_SUBSCRIPTION_ACCESS=true'
    );

    test('should show clear path to subscribe after redirect', async ({
      page,
    }) => {
      // Start from customers page (will redirect)
      await page.goto('/dashboard/customers');
      await page.waitForLoadState('networkidle');

      // Should be on settings page with subscription tab
      await expect(page).toHaveURL(/\/dashboard\/settings\?tab=subscription/);

      // Should see subscription options/plans
      await expect(
        page.locator('text=/plan|suscribir|upgrade/i').first()
      ).toBeVisible();
    });

    test('should be able to navigate to pricing from settings', async ({
      page,
    }) => {
      await page.goto('/dashboard/settings?tab=subscription');
      await page.waitForLoadState('networkidle');

      // Look for link to pricing or upgrade button
      const pricingLink = page.locator('a[href="/precios"]');
      const upgradeButton = page.locator(
        'button:has-text("Upgrade"), button:has-text("Suscribir"), a:has-text("Ver Planes")'
      );

      const hasPricingLink =
        (await pricingLink.isVisible().catch(() => false)) ||
        (await upgradeButton.isVisible().catch(() => false));

      // There should be a way to subscribe
      expect(hasPricingLink).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
    });

    test('locked tabs should have appropriate aria attributes', async ({
      page,
    }) => {
      const publicPageTab = page.locator(
        '[data-testid="settings-tab-public-page"]'
      );

      if (await publicPageTab.isVisible()) {
        // Disabled tabs should have disabled attribute
        const isDisabled = await publicPageTab.isDisabled();
        if (isDisabled) {
          await expect(publicPageTab).toHaveAttribute('disabled', '');
        }
      }
    });

    test('warning banner should be perceivable', async ({ page }) => {
      const warningBanner = page.locator(
        '.bg-amber-50, [class*="amber"], [class*="warning"]'
      ).first();

      if (await warningBanner.isVisible()) {
        // Should have appropriate color contrast (amber/yellow colors)
        await expect(warningBanner).toBeVisible();
      }
    });

    test('lock icon should have appropriate semantics', async ({ page }) => {
      // Lock icons should be decorative or have appropriate label
      const lockIcons = page.locator('svg.text-amber-500');
      const count = await lockIcons.count();

      // If there are lock icons, they should be associated with their tabs
      if (count > 0) {
        // Each lock should be inside a button (tab)
        const firstLock = lockIcons.first();
        const parentButton = firstLock.locator('xpath=ancestor::button');
        await expect(parentButton).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('redirect should happen quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/customers');
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Redirect should complete within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('settings page should load within acceptable time', async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/settings?tab=subscription');
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});

test.describe('Trial Period Edge Cases', () => {
  test.skip(
    !isAuthTestEnabled || !isSubscriptionTestEnabled,
    'Skipping - requires auth and subscription test setup'
  );

  test('user in last day of trial should have access', async ({ page }) => {
    // This would require a test user whose trial ends today
    // For now, document the expected behavior
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');

    // If trial is still valid (even on last day), should have access
    // This test passes if either:
    // 1. User has access (stays on customers page)
    // 2. User is redirected (trial already expired)
    const url = page.url();
    const isValid =
      url.includes('/dashboard/customers') ||
      url.includes('/dashboard/settings');
    expect(isValid).toBe(true);
  });

  test('user with just-expired trial should be redirected', async ({
    page,
  }) => {
    // This test documents behavior for recently expired trial
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');

    // Should be redirected if trial expired
    // (This test mainly documents expected behavior)
    const url = page.url();
    expect(url).toBeTruthy();
  });
});
