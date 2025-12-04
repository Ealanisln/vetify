import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Plan Básico Subscription Access Control
 *
 * This test suite verifies that users on the Plan Básico have:
 * - Access to core features: customers, pets, appointments, POS
 * - Access to 1 cash register
 * - Access to basic inventory
 * - Access to basic reports
 * - Proper upgrade prompts for premium features
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Plan Básico Access Control', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // TODO: Setup test user with Plan Básico subscription
    // This would typically involve:
    // 1. Authenticating as a test user with Plan Básico
    // 2. Ensuring their tenant has the correct subscription
    await page.goto('/dashboard');
  });

  test.describe('Allowed Features', () => {
    test('can access dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    });

    test('can access customers section', async ({ page }) => {
      await page.goto('/dashboard/clientes');
      await expect(page).toHaveURL(/.*clientes/);
      // Verify customers page loads without redirect
      await expect(page.locator('h1')).toContainText(/clientes/i);
    });

    test('can create new customers', async ({ page }) => {
      await page.goto('/dashboard/clientes');

      // Click new customer button
      await page.click('[data-testid="new-customer-button"]');

      // Should not be redirected to upgrade page
      await expect(page).not.toHaveURL(/.*precios/);
      await expect(page.locator('[data-testid="customer-form"]')).toBeVisible();
    });

    test('can access pets section', async ({ page }) => {
      await page.goto('/dashboard/mascotas');
      await expect(page).toHaveURL(/.*mascotas/);
      await expect(page.locator('h1')).toContainText(/mascota/i);
    });

    test('can create new pets', async ({ page }) => {
      await page.goto('/dashboard/pets/new');

      // Should load form without upgrade prompt
      await expect(page.locator('[data-testid="pet-form"]')).toBeVisible();
      await expect(page).not.toHaveURL(/.*settings.*subscription/);
    });

    test('can access appointments', async ({ page }) => {
      await page.goto('/dashboard/appointments');
      await expect(page).toHaveURL(/.*appointments/);
      await expect(page.locator('h1')).toContainText(/citas/i);
    });

    test('can create new appointments', async ({ page }) => {
      await page.goto('/dashboard/appointments/new');

      // Should load appointment form
      await expect(page.locator('[data-testid="appointment-form"]')).toBeVisible();
      await expect(page).not.toHaveURL(/.*settings.*subscription/);
    });

    test('can access point of sale', async ({ page }) => {
      await page.goto('/dashboard/punto-de-venta');
      await expect(page).toHaveURL(/.*punto-de-venta/);

      // Should show POS interface
      await expect(page.locator('[data-testid="pos-interface"]')).toBeVisible();
    });

    test('can access basic inventory', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await expect(page).toHaveURL(/.*inventario/);

      // Should show inventory list
      await expect(page.locator('[data-testid="inventory-list"]')).toBeVisible();
    });

    test('can access basic reports', async ({ page }) => {
      await page.goto('/dashboard/reportes');
      await expect(page).toHaveURL(/.*reportes/);

      // Should show basic reports
      await expect(page.locator('[data-testid="reports-dashboard"]')).toBeVisible();
    });

    test('can access single cash register', async ({ page }) => {
      await page.goto('/dashboard/caja');
      await expect(page).toHaveURL(/.*caja/);

      // Should show cash register interface
      await expect(page.locator('[data-testid="cash-register"]')).toBeVisible();
    });
  });

  test.describe('Restricted Features with Upgrade Prompts', () => {
    test('shows upgrade prompt when trying to create second cash register', async ({ page }) => {
      await page.goto('/dashboard/caja');

      // Try to add a second cash register
      await page.click('[data-testid="add-cash-register-button"]');

      // Should show upgrade prompt
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toContainText(/plan profesional/i);

      // Verify "Ver Planes" button exists
      const verPlanesButton = page.locator('[data-testid="upgrade-button"]');
      await expect(verPlanesButton).toBeVisible();
    });

    test('shows upgrade prompt for advanced inventory features', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Try to access advanced inventory feature (e.g., batch operations)
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should show FeatureGate upgrade prompt
      await expect(page.locator('text=/función premium/i')).toBeVisible();
      await expect(page.locator('text=/plan profesional/i')).toBeVisible();
    });

    test('shows upgrade prompt for advanced reports', async ({ page }) => {
      await page.goto('/dashboard/reportes');

      // Try to access advanced analytics
      await page.click('[data-testid="advanced-analytics-button"]');

      // Should show upgrade prompt
      await expect(page.locator('text=/función premium/i')).toBeVisible();
      await expect(page.locator('a[href="/precios"]')).toBeVisible();
    });

    test('upgrade prompt redirects to pricing page', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Trigger upgrade prompt
      await page.click('[data-testid="advanced-inventory-button"]');

      // Click "Ver Planes" button
      await page.click('a[href="/precios"]');

      // Should redirect to pricing page
      await expect(page).toHaveURL(/.*precios/);
    });
  });

  test.describe('Feature Limits', () => {
    test('cannot access multi-branch features', async ({ page }) => {
      // Multi-branch is a future feature, should be completely hidden for Plan Básico
      await page.goto('/dashboard');

      // Multi-branch navigation should not exist
      await expect(page.locator('[data-testid="multi-branch-nav"]')).not.toBeVisible();
    });

    test('cash register limit is enforced', async ({ page }) => {
      await page.goto('/dashboard/caja');

      // Get count of available cash registers
      const cashRegisters = page.locator('[data-testid="cash-register-item"]');
      const count = await cashRegisters.count();

      // Plan Básico should only have 1 cash register
      expect(count).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Settings and Subscription Management', () => {
    test('can access subscription settings', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=subscription');

      // Should show current plan
      await expect(page.locator('[data-testid="current-plan"]')).toContainText(/básico/i);
    });

    test('can view upgrade options', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=subscription');

      // Should show upgrade button
      const upgradeButton = page.locator('[data-testid="upgrade-plan-button"]');
      await expect(upgradeButton).toBeVisible();

      // Click upgrade button
      await upgradeButton.click();

      // Should navigate to pricing page
      await expect(page).toHaveURL(/.*precios/);
    });
  });
});
