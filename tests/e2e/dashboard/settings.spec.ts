import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Settings Management
 *
 * This test suite verifies the Settings module:
 * - Tab navigation
 * - Business hours configuration
 * - Services management
 * - Notification settings
 * - Public page settings
 * - Subscription management
 * - Role-based access control (only MANAGER/ADMINISTRATOR can access)
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 *
 * NOTE: QR Code Generator tests are in a separate file: qr-code-generator.spec.ts
 * NOTE: Staff is not a settings tab; staff and invitations are covered by
 * tests/e2e/clinic-setup/clinic-setup.spec.ts (/dashboard/staff).
 *
 * SECURITY: Settings page is protected - only MANAGER and ADMINISTRATOR roles
 * can access. Other roles are redirected to dashboard.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Settings Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  const openTab = async (page: Page, tab: string) => {
    await page.getByTestId(`settings-tab-${tab}`).click();
    await expect(page.getByTestId(`settings-tab-${tab}`)).toHaveClass(/border-r-2/);
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByTestId('settings-tabs')).toBeVisible();
  });

  test.describe('Settings Navigation', () => {
    test('should display settings page header', async ({ page }) => {
      await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Configuración' })).toBeVisible();
    });

    test('should display all settings tabs', async ({ page }) => {
      for (const tab of ['public-page', 'qr-codes', 'business-hours', 'services', 'subscription', 'notifications']) {
        await expect(page.getByTestId(`settings-tab-${tab}`)).toBeEnabled();
      }
    });

    test('should switch to Public Page tab', async ({ page }) => {
      await openTab(page, 'public-page');
      await expect(page.getByTestId('public-page-settings')).toBeVisible();
    });

    test('should switch to Business Hours tab', async ({ page }) => {
      await openTab(page, 'business-hours');
      await expect(page.getByTestId('business-hours-settings')).toBeVisible();
    });

    test('should switch to Services tab', async ({ page }) => {
      await openTab(page, 'services');
      await expect(page.getByTestId('services-settings')).toBeVisible();
    });

    test('should switch to Subscription tab', async ({ page }) => {
      await openTab(page, 'subscription');
      await expect(page.getByTestId('subscription-settings')).toBeVisible();
    });

    test('should switch to Notifications tab', async ({ page }) => {
      await openTab(page, 'notifications');
      await expect(page.getByTestId('notification-settings')).toBeVisible();
    });

    test('should open correct tab from URL parameter', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=subscription');

      await expect(page.getByTestId('settings-tab-subscription')).toHaveClass(/border-r-2/);
      await expect(page.getByTestId('subscription-settings')).toBeVisible();
    });

    test('should open public-page tab from URL parameter when subscription active', async ({ page }) => {
      // The seeded clinic is in an active trial, so the tab is not locked
      await page.goto('/dashboard/settings?tab=public-page');

      await expect(page.getByTestId('settings-tab-public-page')).toHaveClass(/border-r-2/);
      await expect(page.getByTestId('public-page-settings')).toBeVisible();
    });
  });

  test.describe('Business Hours', () => {
    // These tests save to the test tenant, so run them one at a time and
    // restore what they change.
    test.describe.configure({ mode: 'serial' });

    const openBusinessHours = async (page: Page) => {
      await openTab(page, 'business-hours');
      await expect(page.getByTestId('business-hours-settings')).toBeVisible();
    };

    const saveAndWait = async (page: Page) => {
      const saved = page.waitForResponse(
        (response) => response.url().includes('/api/settings/business-hours') && response.request().method() === 'PUT'
      );
      await page.getByTestId('save-business-hours').click();
      expect((await saved).ok()).toBe(true);
      await expect(page.getByText('Horarios de atención guardados exitosamente').first()).toBeVisible();
    };

    const reloadBusinessHours = async (page: Page) => {
      await page.goto('/dashboard/settings?tab=business-hours');
      await expect(page.getByTestId('business-hours-settings')).toBeVisible();
    };

    // Opens Monday if needed; returns whether it had to (unsaved change).
    const ensureMondayOpen = async (page: Page) => {
      const mondayToggle = page.getByTestId('day-toggle-monday');
      if ((await mondayToggle.textContent())?.trim() === 'Abrir') {
        await mondayToggle.click();
        return true;
      }
      return false;
    };

    test.beforeEach(async ({ page }) => {
      await openBusinessHours(page);
    });

    test('should display all days of the week', async ({ page }) => {
      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

      for (const day of days) {
        await expect(page.getByRole('heading', { name: day, exact: true })).toBeVisible();
      }
    });

    test('should have open/closed toggle for each day', async ({ page }) => {
      await expect(page.locator('[data-testid^="day-toggle-"]')).toHaveCount(7);
    });

    test('should have time inputs for each open day', async ({ page }) => {
      const openDays = await page.locator('[data-testid^="day-toggle-"]', { hasText: 'Cerrar' }).count();

      expect(openDays).toBeGreaterThan(0);
      await expect(page.locator('[data-testid^="open-time-"]')).toHaveCount(openDays);
      await expect(page.locator('[data-testid^="close-time-"]')).toHaveCount(openDays);
    });

    test('should toggle day open/closed', async ({ page }) => {
      const mondayToggle = page.getByTestId('day-toggle-monday');
      const initialLabel = (await mondayToggle.textContent())?.trim();

      await mondayToggle.click();

      await expect(mondayToggle).toHaveText(initialLabel === 'Cerrar' ? 'Abrir' : 'Cerrar');
      // Unsaved change: discard it so later tests start clean
      await page.getByTestId('reset-hours-button').click();
      await expect(mondayToggle).toHaveText(initialLabel!);
    });

    test('should update and persist opening time', async ({ page }) => {
      const reopened = await ensureMondayOpen(page);

      const openTime = page.getByTestId('open-time-monday');
      const original = await openTime.inputValue();
      const updated = original === '09:00' ? '09:30' : '09:00';

      await openTime.selectOption(updated);
      await expect(openTime).toHaveValue(updated);
      await saveAndWait(page);

      await reloadBusinessHours(page);
      await expect(page.getByTestId('open-time-monday')).toHaveValue(updated);

      // Restore
      await page.getByTestId('open-time-monday').selectOption(original);
      if (reopened) await page.getByTestId('day-toggle-monday').click();
      await saveAndWait(page);
    });

    test('should persist "Sin comida" after reload', async ({ page }) => {
      const reopened = await ensureMondayOpen(page);
      const lunchStart = page.getByTestId('lunch-start-monday');
      const lunchEnd = page.getByTestId('lunch-end-monday');
      const originalStart = await lunchStart.inputValue();
      const originalEnd = await lunchEnd.inputValue();

      // Start from a day that has lunch, so clearing it is a real change
      if (!originalStart) {
        await lunchStart.selectOption('13:00');
        await lunchEnd.selectOption('14:00');
        await saveAndWait(page);
      }

      await page.getByTestId('lunch-start-monday').selectOption('');
      await saveAndWait(page);

      await reloadBusinessHours(page);
      await expect(page.getByTestId('lunch-start-monday')).toHaveValue('');
      await expect(page.getByTestId('lunch-end-monday')).toHaveValue('');

      // Restore
      if (originalStart && originalEnd) {
        await page.getByTestId('lunch-start-monday').selectOption(originalStart);
        await page.getByTestId('lunch-end-monday').selectOption(originalEnd);
      }
      if (reopened) await page.getByTestId('day-toggle-monday').click();
      if (originalStart || reopened) await saveAndWait(page);
    });

    test('should block saving when closing is before opening', async ({ page }) => {
      await ensureMondayOpen(page);
      await page.getByTestId('open-time-monday').selectOption('10:00');
      await page.getByTestId('close-time-monday').selectOption('09:00');

      await expect(page.getByText('La hora de cierre debe ser posterior a la de apertura').first()).toBeVisible();
      await page.getByTestId('save-business-hours').click();
      await expect(page.getByText('Revisa los horarios marcados antes de guardar')).toBeVisible();

      await page.getByTestId('reset-hours-button').click();
    });
  });

  test.describe('Services Management', () => {
    // The tests build on the service the first one creates
    test.describe.configure({ mode: 'serial' });

    const serviceName = `Test Service E2E ${Date.now().toString(36)}`;
    const serviceCard = (page: Page) => page.getByTestId('service-card').filter({ hasText: serviceName });

    test.beforeEach(async ({ page }) => {
      await openTab(page, 'services');
      await expect(page.getByTestId('services-settings')).toBeVisible();
    });

    test('should display services list', async ({ page }) => {
      // A tenant with no services shows the empty state instead of the grid
      await expect(
        page.getByTestId('services-list').or(page.getByTestId('services-empty-state'))
      ).toBeVisible();
    });

    test('should open add service modal with its form fields', async ({ page }) => {
      await page.getByTestId('add-service-button').click();

      await expect(page.getByTestId('service-modal')).toBeVisible();
      await expect(page.getByTestId('service-name-input')).toBeVisible();
      await expect(page.getByTestId('service-price-input')).toBeVisible();
      await expect(page.getByTestId('service-duration-input')).toBeVisible();
    });

    test('should create new service', async ({ page }) => {
      await page.getByTestId('add-service-button').click();
      await page.getByTestId('service-name-input').fill(serviceName);
      await page.getByTestId('service-price-input').fill('150');
      await page.getByTestId('service-duration-input').fill('30');
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio creado')).toBeVisible();
      await expect(serviceCard(page)).toBeVisible();
    });

    test('should create a service without duration', async ({ page }) => {
      await page.getByTestId('add-service-button').click();
      await page.getByTestId('service-name-input').fill(`${serviceName} sin duración`);
      await page.getByTestId('service-price-input').fill('200');
      await page.getByTestId('service-duration-input').fill('');
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio creado')).toBeVisible();
    });

    test('should edit existing service', async ({ page }) => {
      await serviceCard(page).first().getByTestId('edit-service-button').click();
      await page.getByTestId('service-price-input').fill('200');
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio actualizado')).toBeVisible();
      await expect(serviceCard(page).first().getByTestId('service-price')).toContainText('200');
    });

    test('should toggle service active status', async ({ page }) => {
      await serviceCard(page).first().getByTestId('edit-service-button').click();
      await page.getByTestId('service-active-checkbox').uncheck();
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio actualizado')).toBeVisible();
      await expect(serviceCard(page).first().getByTestId('service-status')).toHaveText('Inactivo');
    });

    test('should delete service', async ({ page }) => {
      const before = await serviceCard(page).count();
      expect(before).toBeGreaterThan(0);

      // Deletion is confirmed with a native confirm() dialog
      page.once('dialog', (dialog) => dialog.accept());
      await serviceCard(page).first().getByTestId('delete-service-button').click();

      // Without sales the service is deleted
      await expect(page.getByText('Servicio eliminado correctamente')).toBeVisible();
      await expect(serviceCard(page)).toHaveCount(before - 1);
    });
  });

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      await openTab(page, 'notifications');
      await expect(page.getByTestId('notification-settings')).toBeVisible();
    });

    test('should have appointment reminder toggle', async ({ page }) => {
      await expect(page.getByTestId('notification-toggle-appointmentReminder')).toBeVisible();
    });

    test('should toggle notification preference and offer to save', async ({ page }) => {
      const reminderToggle = page.getByTestId('notification-toggle-appointmentReminder');
      const initial = await reminderToggle.getAttribute('aria-checked');

      await reminderToggle.click();

      await expect(reminderToggle).toHaveAttribute('aria-checked', initial === 'true' ? 'false' : 'true');
      await expect(page.getByTestId('save-notifications')).toBeVisible();
    });
  });

  test.describe('Subscription Management', () => {
    test.beforeEach(async ({ page }) => {
      await openTab(page, 'subscription');
    });

    test('should display current plan', async ({ page }) => {
      await expect(page.getByTestId('subscription-settings')).toBeVisible();
      await expect(page.getByTestId('current-plan')).not.toBeEmpty();
    });
  });

  test.describe('Public Page Settings', () => {
    test.beforeEach(async ({ page }) => {
      await openTab(page, 'public-page');
      await expect(page.getByTestId('public-page-settings')).toBeVisible();
    });

    test('should display public page toggle', async ({ page }) => {
      await expect(page.getByTestId('public-page-toggle')).toBeVisible();
    });

    test('should show public page URL and preview link', async ({ page }) => {
      // The seeded clinic has its public page enabled
      await expect(page.getByTestId('public-page-url')).toContainText('/ci-test-clinic');
      await expect(page.getByTestId('preview-public-page')).toHaveAttribute('href', /\/ci-test-clinic$/);
    });

    test('should toggle public page visibility', async ({ page }) => {
      const toggle = page.getByTestId('public-page-toggle');
      const initial = await toggle.getAttribute('aria-checked');

      await toggle.click();

      // Unsaved change: the page is not reloaded, so nothing is persisted
      await expect(toggle).toHaveAttribute('aria-checked', initial === 'true' ? 'false' : 'true');
      await expect(page.getByText(initial === 'true' ? 'Página Pública Desactivada' : 'Página Pública Activa')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // The dashboard header has its own h1; the page content has exactly one
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Configuración');
    });

    test('should be keyboard navigable between tabs', async ({ page }) => {
      const tabs = page.getByTestId('settings-tabs').getByRole('button');

      await tabs.first().focus();
      await expect(tabs.first()).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(tabs.nth(1)).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Configuración' })).toBeVisible();
      await expect(page.getByTestId('settings-tabs')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByTestId('settings-tabs')).toBeVisible();
    });
  });
});

/**
 * Role-based Access Control Tests for Settings
 *
 * These tests verify that the settings page is properly protected
 * and only accessible to MANAGER and ADMINISTRATOR roles.
 *
 * NOTE: These tests require special setup with test users having different roles.
 * Set TEST_ROLE_ACCESS_ENABLED=true to run these tests.
 */
const isRoleAccessTestEnabled = process.env.TEST_ROLE_ACCESS_ENABLED === 'true';

test.describe('Settings Role-Based Access Control', () => {
  test.skip(!isRoleAccessTestEnabled, 'Skipping - requires role-based test setup. Set TEST_ROLE_ACCESS_ENABLED=true');

  test.describe('Access Denied Scenarios', () => {
    test('should redirect non-admin user to dashboard when accessing settings directly', async ({ page }) => {
      // This test requires a user logged in with a non-admin role (e.g., VETERINARIAN)
      // The page should redirect to /dashboard?error=access_denied
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Should be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard(?:\?error=access_denied)?/);

      // Should NOT see the settings page header
      await expect(page.locator('h1:has-text("Configuración")')).not.toBeVisible();
    });

    test('should not show settings link in navigation for non-admin users', async ({ page }) => {
      // This test requires a user logged in with a non-admin role
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // The sidebar should not have a settings link for non-admin users
      const settingsLink = page.locator('a[href="/dashboard/settings"]');

      // Settings link should not be visible in sidebar for non-admin
      await expect(settingsLink).not.toBeVisible();
    });

    test('should not show settings link in user dropdown for non-admin users', async ({ page }) => {
      // This test requires a user logged in with a non-admin role
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open the user dropdown
      await page.locator('[data-testid="user-dropdown"]').click();

      // Settings link should not be visible in dropdown for non-admin
      const settingsMenuItem = page.locator('a[href="/dashboard/settings"]:has-text("Configuración")');
      await expect(settingsMenuItem).not.toBeVisible();
    });
  });

  test.describe('Access Allowed Scenarios', () => {
    test('should allow MANAGER to access settings page', async ({ page }) => {
      // This test requires a user logged in with MANAGER role
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Should see the settings page header
      await expect(page.locator('h1:has-text("Configuración")')).toBeVisible();
      await expect(page.locator('[data-testid="settings-tabs"]')).toBeVisible();
    });

    test('should show settings link in sidebar for MANAGER', async ({ page }) => {
      // This test requires a user logged in with MANAGER role
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // The sidebar should have a settings link for admin users
      const settingsLink = page.locator('a[href="/dashboard/settings"]');
      await expect(settingsLink).toBeVisible();
    });

    test('should show settings link in user dropdown for MANAGER', async ({ page }) => {
      // This test requires a user logged in with MANAGER role
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open the user dropdown
      await page.locator('[data-testid="user-dropdown"]').click();

      // Settings link should be visible in dropdown for admin
      const settingsMenuItem = page.locator('a[href="/dashboard/settings"]:has-text("Configuración")');
      await expect(settingsMenuItem).toBeVisible();
    });
  });

  test.describe('Security Edge Cases', () => {
    test('should handle direct URL access attempt by non-admin', async ({ page }) => {
      // Attempt to access settings with various URL patterns
      const settingsUrls = [
        '/dashboard/settings',
        '/dashboard/settings?tab=subscription',
        '/dashboard/settings?tab=public-page',
        '/dashboard/settings?tab=business-hours',
      ];

      for (const url of settingsUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Should be redirected away from settings
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('/dashboard/settings');
      }
    });

    test('should maintain access denial after page refresh', async ({ page }) => {
      // This test requires a user logged in with a non-admin role
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Should be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard(?:\?error=access_denied)?/);

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard, not settings
      await expect(page).not.toHaveURL(/\/dashboard\/settings/);
    });
  });
});
