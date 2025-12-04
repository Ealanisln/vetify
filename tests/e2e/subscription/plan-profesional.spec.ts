import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Plan Profesional Subscription Access Control
 *
 * This test suite verifies that users on the Plan Profesional have:
 * - Full access to all Plan Básico features
 * - Multiple cash registers
 * - Advanced inventory features
 * - Advanced reports and analytics
 * - Staff management with shifts
 * - No upgrade prompts for any current features
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Plan Profesional Access Control', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // TODO: Setup test user with Plan Profesional subscription
    // This would typically involve:
    // 1. Authenticating as a test user with Plan Profesional
    // 2. Ensuring their tenant has the correct subscription
    await page.goto('/dashboard');
  });

  test.describe('All Basic Features Accessible', () => {
    test('has full access to dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();

      // Should not see any upgrade prompts
      await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
    });

    test('has full access to customers', async ({ page }) => {
      await page.goto('/dashboard/clientes');
      await expect(page).toHaveURL(/.*clientes/);

      // Can create customers without restrictions
      await page.click('[data-testid="new-customer-button"]');
      await expect(page.locator('[data-testid="customer-form"]')).toBeVisible();
    });

    test('has full access to pets', async ({ page }) => {
      await page.goto('/dashboard/mascotas');
      await expect(page).toHaveURL(/.*mascotas/);

      // Can create pets without restrictions
      await page.goto('/dashboard/pets/new');
      await expect(page.locator('[data-testid="pet-form"]')).toBeVisible();
    });

    test('has full access to appointments', async ({ page }) => {
      await page.goto('/dashboard/appointments');
      await expect(page).toHaveURL(/.*appointments/);

      // Can create appointments without restrictions
      await page.goto('/dashboard/appointments/new');
      await expect(page.locator('[data-testid="appointment-form"]')).toBeVisible();
    });

    test('has full access to point of sale', async ({ page }) => {
      await page.goto('/dashboard/punto-de-venta');
      await expect(page).toHaveURL(/.*punto-de-venta/);
      await expect(page.locator('[data-testid="pos-interface"]')).toBeVisible();
    });
  });

  test.describe('Advanced Inventory Features', () => {
    test('can access advanced inventory management', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Should be able to access advanced inventory features
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should NOT show upgrade prompt - feature should be accessible
      await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();

      // Should show advanced inventory interface
      await expect(page.locator('[data-testid="advanced-inventory-interface"]')).toBeVisible();
    });

    test('can perform batch inventory operations', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Select multiple items
      await page.click('[data-testid="inventory-item-checkbox"]:nth-child(1)');
      await page.click('[data-testid="inventory-item-checkbox"]:nth-child(2)');

      // Batch operations should be available
      await expect(page.locator('[data-testid="batch-operations-menu"]')).toBeVisible();

      // Click batch operations
      await page.click('[data-testid="batch-operations-menu"]');

      // Should not show upgrade prompt
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
    });

    test('can access inventory analytics', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Access analytics feature
      await page.click('[data-testid="inventory-analytics-button"]');

      // Should show analytics dashboard without upgrade prompt
      await expect(page.locator('[data-testid="inventory-analytics-dashboard"]')).toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
    });
  });

  test.describe('Advanced Reports and Analytics', () => {
    test('can access advanced reports dashboard', async ({ page }) => {
      await page.goto('/dashboard/reportes');

      // Should show advanced reports section
      await expect(page.locator('[data-testid="advanced-reports-section"]')).toBeVisible();
    });

    test('can access financial analytics', async ({ page }) => {
      await page.goto('/dashboard/reportes');

      // Click advanced analytics
      await page.click('[data-testid="advanced-analytics-button"]');

      // Should show analytics without upgrade prompt
      await expect(page.locator('[data-testid="advanced-analytics-dashboard"]')).toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
    });

    test('can generate custom reports', async ({ page }) => {
      await page.goto('/dashboard/reportes');

      // Access custom report builder
      await page.click('[data-testid="custom-report-builder"]');

      // Should be accessible without upgrade prompt
      await expect(page.locator('[data-testid="report-builder-interface"]')).toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
    });

    test('can export reports in multiple formats', async ({ page }) => {
      await page.goto('/dashboard/reportes');

      // Open export menu
      await page.click('[data-testid="export-report-button"]');

      // Should show multiple export options (PDF, Excel, CSV)
      await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-excel"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-csv"]')).toBeVisible();
    });
  });

  test.describe('Multiple Cash Registers', () => {
    test('can create multiple cash registers', async ({ page }) => {
      await page.goto('/dashboard/caja');

      // Click to add new cash register
      await page.click('[data-testid="add-cash-register-button"]');

      // Should NOT show upgrade prompt - feature should be accessible
      await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
      await expect(page.locator('text=/plan profesional/i')).not.toBeVisible();

      // Should show new cash register form
      await expect(page.locator('[data-testid="cash-register-form"]')).toBeVisible();
    });

    test('can manage multiple cash registers', async ({ page }) => {
      await page.goto('/dashboard/caja');

      // Should be able to see multiple cash registers
      const cashRegisters = page.locator('[data-testid="cash-register-item"]');
      const count = await cashRegisters.count();

      // Plan Profesional should allow multiple cash registers
      expect(count).toBeGreaterThanOrEqual(1);

      // Should have ability to add more
      await expect(page.locator('[data-testid="add-cash-register-button"]')).toBeVisible();
    });

    test('can switch between cash registers', async ({ page }) => {
      await page.goto('/dashboard/caja');

      // If multiple cash registers exist, should be able to switch
      const cashRegisters = page.locator('[data-testid="cash-register-item"]');
      const count = await cashRegisters.count();

      if (count > 1) {
        // Click on second cash register
        await cashRegisters.nth(1).click();

        // Should switch to that cash register
        await expect(page.locator('[data-testid="active-cash-register"]')).toContainText('2');
      }
    });
  });

  test.describe('Staff and Shift Management', () => {
    test('can access staff management', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=staff');

      // Should show staff management interface
      await expect(page.locator('[data-testid="staff-management"]')).toBeVisible();
    });

    test('can manage staff shifts', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=staff');

      // Click on staff member to manage shifts
      await page.click('[data-testid="staff-member"]:first-child');

      // Should show shift management interface
      await expect(page.locator('[data-testid="shift-management"]')).toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
    });

    test('can create staff shifts', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=staff');

      // Access shift creation
      await page.click('[data-testid="create-shift-button"]');

      // Should show shift form without upgrade prompt
      await expect(page.locator('[data-testid="shift-form"]')).toBeVisible();
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();
    });
  });

  test.describe('No Upgrade Prompts', () => {
    test('does not show upgrade prompts on any feature', async ({ page }) => {
      const routes = [
        '/dashboard',
        '/dashboard/clientes',
        '/dashboard/mascotas',
        '/dashboard/appointments',
        '/dashboard/inventario',
        '/dashboard/reportes',
        '/dashboard/caja',
        '/dashboard/punto-de-venta'
      ];

      for (const route of routes) {
        await page.goto(route);

        // Should never show upgrade prompt
        await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
        await expect(page.locator('text=/función premium/i')).not.toBeVisible();
        await expect(page.locator('text=/plan profesional/i')).not.toBeVisible();
      }
    });

    test('shows correct plan in subscription settings', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=subscription');

      // Should show Plan Profesional as current plan
      await expect(page.locator('[data-testid="current-plan"]')).toContainText(/profesional/i);

      // Should not show upgrade button (already on highest plan)
      await expect(page.locator('[data-testid="upgrade-plan-button"]')).not.toBeVisible();
    });
  });

  test.describe('Feature Accessibility Verification', () => {
    test('verifies all premium features are accessible', async ({ page }) => {
      // Create a list of all premium features
      const premiumFeatures = [
        { route: '/dashboard/inventario', button: '[data-testid="advanced-inventory-button"]' },
        { route: '/dashboard/reportes', button: '[data-testid="advanced-analytics-button"]' },
        { route: '/dashboard/caja', button: '[data-testid="add-cash-register-button"]' }
      ];

      for (const feature of premiumFeatures) {
        await page.goto(feature.route);
        await page.click(feature.button);

        // Should never encounter FeatureGate lock
        await expect(page.locator('[data-testid="feature-gate-lock"]')).not.toBeVisible();
        await expect(page.locator('text=/función premium/i')).not.toBeVisible();
      }
    });
  });
});
