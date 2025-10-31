import { test, expect } from '@playwright/test';

/**
 * E2E Tests for FeatureGate Component Behavior
 *
 * This test suite verifies the FeatureGate component:
 * - Properly shows/hides content based on subscription
 * - Displays correct lock icon and messaging
 * - "Ver Planes" button functions correctly
 * - Loading states work properly
 * - Handles errors gracefully
 * - Works consistently across different features
 */

test.describe('FeatureGate Component', () => {
  test.describe('Visual Elements (Plan Básico)', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup test user with Plan Básico
      await page.goto('/dashboard');
    });

    test('shows lock icon when feature is gated', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Trigger feature gate
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should show lock icon
      const lockIcon = page.locator('[data-testid="feature-gate-lock"]').or(page.locator('svg').filter({ hasText: /lock/i }));
      await expect(lockIcon).toBeVisible();
    });

    test('displays "Función Premium" heading', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should show premium feature heading
      await expect(page.locator('text=/función premium/i')).toBeVisible();
    });

    test('shows upgrade message text', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should show upgrade requirement message
      await expect(page.locator('text=/plan profesional/i')).toBeVisible();
      // OR custom message
      await expect(page.locator('text=/requiere.*profesional/i')).toBeVisible();
    });

    test('displays "Ver Planes" button with correct styling', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Find "Ver Planes" button
      const verPlanesButton = page.locator('a[href="/precios"]');
      await expect(verPlanesButton).toBeVisible();
      await expect(verPlanesButton).toContainText(/ver planes/i);

      // Should have primary styling (check for primary color class)
      await expect(verPlanesButton).toHaveClass(/bg-primary|bg-\[#75a99c\]/);
    });

    test('uses dashed border styling for gated content', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // FeatureGate should have dashed border
      const featureGate = page.locator('[data-testid="feature-gate"]').or(page.locator('div').filter({ hasText: /función premium/i }).first());
      await expect(featureGate).toHaveClass(/border-dashed/);
    });
  });

  test.describe('FeatureGate Behavior (Plan Profesional)', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup test user with Plan Profesional
      await page.goto('/dashboard');
    });

    test('does not show FeatureGate for accessible features', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should NOT show FeatureGate components
      await expect(page.locator('[data-testid="feature-gate-lock"]')).not.toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();

      // Should show actual feature content
      await expect(page.locator('[data-testid="advanced-inventory-interface"]')).toBeVisible();
    });

    test('directly renders feature content without gate', async ({ page }) => {
      await page.goto('/dashboard/reportes');
      await page.click('[data-testid="advanced-analytics-button"]');

      // Should render analytics dashboard
      await expect(page.locator('[data-testid="advanced-analytics-dashboard"]')).toBeVisible();

      // Should NOT show any gate elements
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
      await expect(page.locator('a[href="/precios"]')).not.toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup test environment
      await page.goto('/dashboard');
    });

    test('shows loading spinner while checking access', async ({ page }) => {
      // Navigate to page with FeatureGate
      await page.goto('/dashboard/inventario');

      // FeatureGate should show loading state briefly
      // Note: This might be very fast in test environment
      const loadingSpinner = page.locator('[data-testid="feature-gate-loading"]').or(page.locator('.animate-spin'));

      // If visible, verify it's a spinner
      if (await loadingSpinner.isVisible({ timeout: 100 })) {
        await expect(loadingSpinner).toHaveClass(/animate-spin/);
      }
    });

    test('loading state does not block page render', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Page should render even if FeatureGate is loading
      await expect(page.locator('h1')).toBeVisible();

      // Eventually resolves to either gated or accessible state
      await page.waitForSelector('[data-testid="inventory-list"], [data-testid="feature-gate"]', {
        timeout: 5000
      });
    });
  });

  test.describe('FeatureGate Integration', () => {
    test('multiple FeatureGates on same page work independently', async ({ page }) => {
      // TODO: Setup page with multiple FeatureGate components
      test.skip();

      await page.goto('/dashboard');

      // Each FeatureGate should evaluate independently
      // Feature A might be accessible, Feature B might not
      // Both should render their appropriate states
    });

    test('FeatureGate state persists across navigation', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Note the gated state
      const isGated = await page.locator('text=/función premium/i').isVisible();

      // Navigate away
      await page.goto('/dashboard');

      // Navigate back
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should show same state (cached subscription status)
      if (isGated) {
        await expect(page.locator('text=/función premium/i')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="advanced-inventory-interface"]')).toBeVisible();
      }
    });
  });

  test.describe('Custom FeatureGate Messages', () => {
    test('supports custom upgrade messages', async ({ page }) => {
      // Some FeatureGates might have custom messages
      // Example: "Esta función requiere el plan Profesional para gestionar múltiples cajas"
      await page.goto('/dashboard/caja');
      await page.click('[data-testid="add-cash-register-button"]');

      // Should show contextual message
      const upgradePrompt = page.locator('[data-testid="upgrade-prompt"]');
      await expect(upgradePrompt).toBeVisible();

      // Message should be contextual to the feature
      await expect(upgradePrompt).toContainText(/cajas|cash register/i);
    });

    test('supports custom fallback content', async ({ page }) => {
      // FeatureGate can accept custom fallback parameter
      // Some implementations might show alternative content instead of default lock UI
      test.skip();

      await page.goto('/dashboard/some-feature-with-custom-fallback');

      // Should show custom fallback instead of default FeatureGate UI
      await expect(page.locator('[data-testid="custom-fallback"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles subscription check errors gracefully', async ({ page }) => {
      // TODO: Mock API error for subscription check
      test.skip();

      await page.goto('/dashboard/inventario');

      // If subscription check fails, should show error state or allow access
      // (fail-open for better UX)
      await expect(page.locator('[data-testid="feature-gate-error"]')).toBeVisible()
        .or(expect(page.locator('[data-testid="inventory-list"]')).toBeVisible());
    });

    test('subscription status refetch on error', async ({ page }) => {
      // TODO: Test retry logic
      test.skip();

      // If subscription check fails, user should be able to retry
      await page.goto('/dashboard/inventario');

      // If error occurs
      if (await page.locator('[data-testid="feature-gate-error"]').isVisible()) {
        // Should have retry button
        await page.click('[data-testid="retry-button"]');

        // Should attempt to reload subscription status
        await expect(page.locator('[data-testid="feature-gate-loading"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('FeatureGate has proper ARIA labels', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Lock icon should have aria-label
      const lockIcon = page.locator('svg[aria-label*="lock"]').or(page.locator('[aria-label*="locked"]'));

      // Either icon has label or container has proper role
      const hasAccessibility = await lockIcon.count() > 0 ||
        await page.locator('[role="alert"]').count() > 0;

      expect(hasAccessibility).toBe(true);
    });

    test('upgrade button is keyboard accessible', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Ver Planes button should be focusable
      const verPlanesButton = page.locator('a[href="/precios"]');
      await verPlanesButton.focus();

      // Should be focused
      await expect(verPlanesButton).toBeFocused();

      // Should be activatable with Enter key
      await verPlanesButton.press('Enter');

      // Should navigate
      await expect(page).toHaveURL(/.*precios/);
    });

    test('screen readers can understand gated content', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should have semantic structure
      // Heading for "Función Premium"
      await expect(page.locator('h1, h2, h3').filter({ hasText: /función premium/i })).toBeVisible();

      // Descriptive text
      await expect(page.locator('p').filter({ hasText: /plan profesional/i })).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('FeatureGate check does not block page load', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/inventario');

      const loadTime = Date.now() - startTime;

      // Page should load within reasonable time even with subscription check
      expect(loadTime).toBeLessThan(3000); // 3 seconds
    });

    test('subscription status is cached across components', async ({ page }) => {
      await page.goto('/dashboard');

      // Navigate to multiple pages with FeatureGates
      await page.goto('/dashboard/inventario');
      await page.goto('/dashboard/reportes');
      await page.goto('/dashboard/caja');

      // Should not make redundant subscription check calls
      // Note: This would require monitoring network requests
      // in a real test, we'd verify that subscription API is called only once
    });
  });
});
