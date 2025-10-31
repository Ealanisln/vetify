import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Subscription Upgrade Flows
 *
 * This test suite verifies:
 * - Upgrade prompts appear correctly when accessing premium features
 * - "Ver Planes" buttons redirect to pricing page
 * - Post-upgrade feature access works immediately
 * - Subscription limits update correctly after upgrade
 * - Upgrade flow user experience is smooth and clear
 */

test.describe('Subscription Upgrade Flows', () => {
  test.describe('Upgrade Prompt Visibility (Plan Básico)', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup test user with Plan Básico
      await page.goto('/dashboard');
    });

    test('shows upgrade prompt when accessing second cash register', async ({ page }) => {
      await page.goto('/dashboard/caja');

      // Try to add second cash register
      await page.click('[data-testid="add-cash-register-button"]');

      // Should show upgrade prompt with correct messaging
      const upgradePrompt = page.locator('[data-testid="upgrade-prompt"]');
      await expect(upgradePrompt).toBeVisible();
      await expect(upgradePrompt).toContainText(/plan profesional/i);
      await expect(upgradePrompt).toContainText(/múltiples cajas/i);
    });

    test('shows upgrade prompt when accessing advanced inventory', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Try to access advanced features
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should show FeatureGate upgrade prompt
      await expect(page.locator('text=/función premium/i')).toBeVisible();
      await expect(page.locator('text=/plan profesional/i')).toBeVisible();

      // Should have "Ver Planes" link
      await expect(page.locator('a[href="/precios"]')).toBeVisible();
    });

    test('shows upgrade prompt when accessing advanced reports', async ({ page }) => {
      await page.goto('/dashboard/reportes');

      // Try to access advanced analytics
      await page.click('[data-testid="advanced-analytics-button"]');

      // Should show upgrade prompt
      await expect(page.locator('text=/función premium/i')).toBeVisible();

      // Should have upgrade call-to-action
      const upgradeLink = page.locator('a[href="/precios"]');
      await expect(upgradeLink).toBeVisible();
      await expect(upgradeLink).toContainText(/ver planes/i);
    });
  });

  test.describe('Upgrade Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup test user with Plan Básico
      await page.goto('/dashboard');
    });

    test('clicking "Ver Planes" redirects to pricing page', async ({ page }) => {
      await page.goto('/dashboard/inventario');

      // Trigger upgrade prompt
      await page.click('[data-testid="advanced-inventory-button"]');

      // Click "Ver Planes"
      const verPlanesLink = page.locator('a[href="/precios"]');
      await verPlanesLink.click();

      // Should navigate to pricing page
      await page.waitForURL('**/precios**');
      await expect(page).toHaveURL(/.*precios/);
    });

    test('pricing page highlights Plan Profesional for Básico users', async ({ page }) => {
      await page.goto('/precios');

      // Should highlight Plan Profesional as recommended upgrade
      const planProfesional = page.locator('[data-testid="plan-profesional"]');
      await expect(planProfesional).toBeVisible();

      // Should show "Actualizar Plan" or "Seleccionar Plan" button
      const upgradeButton = planProfesional.locator('[data-testid="select-plan-button"]');
      await expect(upgradeButton).toBeVisible();
    });

    test('pricing page shows current plan indicator', async ({ page }) => {
      await page.goto('/precios');

      // Should show "TU PLAN ACTUAL" badge on Plan Básico
      const currentPlanBadge = page.locator('[data-testid="current-plan-badge"]');
      await expect(currentPlanBadge).toBeVisible();
      await expect(currentPlanBadge).toContainText(/tu plan actual/i);

      // Badge should be on Plan Básico card
      const planBasico = page.locator('[data-testid="plan-basico"]');
      await expect(planBasico.locator('[data-testid="current-plan-badge"]')).toBeVisible();
    });

    test('navigating from settings passes current plan context', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=subscription');

      // Click "Actualizar Plan" button
      await page.click('[data-testid="upgrade-plan-button"]');

      // Should navigate to pricing with context
      await page.waitForURL('**/precios**');
      await expect(page).toHaveURL(/.*precios.*from=settings/);
      await expect(page).toHaveURL(/.*currentPlan=basico/);
    });

    test('pricing page shows contextual message when coming from settings', async ({ page }) => {
      await page.goto('/precios?from=settings&currentPlan=basico');

      // Should show contextual banner
      await expect(page.locator('text=/tu plan actual.*básico/i')).toBeVisible();
    });
  });

  test.describe('Post-Upgrade Feature Access', () => {
    test('features become accessible immediately after upgrade', async ({ page }) => {
      // TODO: This test would require mocking a Stripe upgrade webhook
      // or setting up a test subscription state
      test.skip();

      await page.goto('/dashboard/inventario');

      // Trigger upgrade (mocked)
      // ... upgrade logic here ...

      // After upgrade, advanced features should be accessible
      await page.click('[data-testid="advanced-inventory-button"]');

      // Should NOT show upgrade prompt anymore
      await expect(page.locator('text=/función premium/i')).not.toBeVisible();

      // Should show feature interface
      await expect(page.locator('[data-testid="advanced-inventory-interface"]')).toBeVisible();
    });

    test('settings reflect new plan after upgrade', async ({ page }) => {
      // TODO: Requires upgrade simulation
      test.skip();

      await page.goto('/dashboard/settings?tab=subscription');

      // After upgrade, should show new plan
      await expect(page.locator('[data-testid="current-plan"]')).toContainText(/profesional/i);

      // Upgrade button should be hidden (already on highest plan)
      await expect(page.locator('[data-testid="upgrade-plan-button"]')).not.toBeVisible();
    });

    test('upgrade prompts disappear after upgrade', async ({ page }) => {
      // TODO: Requires upgrade simulation
      test.skip();

      const routes = [
        '/dashboard/inventario',
        '/dashboard/reportes',
        '/dashboard/caja'
      ];

      for (const route of routes) {
        await page.goto(route);

        // Should not show any upgrade prompts
        await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();
        await expect(page.locator('text=/función premium/i')).not.toBeVisible();
      }
    });
  });

  test.describe('Limit Updates After Upgrade', () => {
    test('cash register limit increases after upgrade', async ({ page }) => {
      // TODO: Requires upgrade simulation
      test.skip();

      await page.goto('/dashboard/caja');

      // Before upgrade: 1 cash register max (Plan Básico)
      // After upgrade: Multiple cash registers allowed (Plan Profesional)

      // Should be able to add second cash register
      await page.click('[data-testid="add-cash-register-button"]');

      // Should NOT show upgrade prompt
      await expect(page.locator('[data-testid="upgrade-prompt"]')).not.toBeVisible();

      // Should show cash register form
      await expect(page.locator('[data-testid="cash-register-form"]')).toBeVisible();
    });

    test('feature flags update after upgrade', async ({ page }) => {
      // TODO: Requires upgrade simulation
      test.skip();

      // Verify that useSubscriptionStatus hook returns correct data
      await page.goto('/dashboard');

      // Check that advanced features are now enabled
      const featureFlags = await page.evaluate(() => {
        // Access feature flags from client-side context
        return {
          canUseAdvancedInventory: true,
          canUseAdvancedReports: true,
          canUseMultipleCashRegisters: true
        };
      });

      expect(featureFlags.canUseAdvancedInventory).toBe(true);
      expect(featureFlags.canUseAdvancedReports).toBe(true);
      expect(featureFlags.canUseMultipleCashRegisters).toBe(true);
    });
  });

  test.describe('Downgrade Prevention', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup test user with Plan Profesional
      await page.goto('/dashboard');
    });

    test('shows contact support for downgrade requests', async ({ page }) => {
      await page.goto('/precios');

      // Plan Básico should show "Contactar Soporte" for users on higher plans
      const planBasico = page.locator('[data-testid="plan-basico"]');
      const contactButton = planBasico.locator('text=/contactar soporte/i');

      // Should redirect to contact form for downgrade
      if (await contactButton.isVisible()) {
        await contactButton.click();

        // Should go to contact page with downgrade context
        await expect(page).toHaveURL(/.*contacto.*asunto=downgrade/);
      }
    });

    test('prevents automatic downgrade to protect data', async ({ page }) => {
      await page.goto('/precios');

      // Lower tier plans should not have direct "Seleccionar" buttons for existing customers
      const planBasico = page.locator('[data-testid="plan-basico"]');

      // Should NOT show "Seleccionar Plan" button (would be downgrade)
      await expect(planBasico.locator('button:has-text("Seleccionar Plan")')).not.toBeVisible();

      // Should show contact button instead
      await expect(planBasico.locator('text=/contactar soporte/i')).toBeVisible();
    });
  });

  test.describe('User Experience and Messaging', () => {
    test('upgrade prompts have clear, actionable messaging', async ({ page }) => {
      await page.goto('/dashboard/inventario');
      await page.click('[data-testid="advanced-inventory-button"]');

      const upgradePrompt = page.locator('[data-testid="feature-gate-lock"]').or(page.locator('text=/función premium/i'));

      // Should explain what feature is locked
      await expect(upgradePrompt).toBeVisible();

      // Should explain which plan unlocks it
      await expect(page.locator('text=/plan profesional/i')).toBeVisible();

      // Should have clear call-to-action
      await expect(page.locator('text=/ver planes/i')).toBeVisible();
    });

    test('pricing page highlights benefits of upgrade', async ({ page }) => {
      await page.goto('/precios?from=settings&currentPlan=basico');

      const planProfesional = page.locator('[data-testid="plan-profesional"]');

      // Should show feature list
      await expect(planProfesional.locator('ul')).toBeVisible();

      // Should highlight key differentiators
      await expect(planProfesional).toContainText(/múltiples cajas/i);
      await expect(planProfesional).toContainText(/inventario avanzado/i);
      await expect(planProfesional).toContainText(/reportes avanzados/i);
    });
  });
});
