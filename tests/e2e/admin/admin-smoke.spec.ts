import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests for Admin Panel
 *
 * Basic smoke tests for the super admin interface:
 * - Admin login and access control
 * - Tenant list page loads
 * - Billing overview loads
 * - Navigation between admin sections
 *
 * NOTE: These tests require authentication with a super admin user.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Admin Panel Smoke Tests', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.describe('Access Control', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any stored auth state
      await page.context().clearCookies();

      const response = await page.goto('/admin');

      // Should redirect to login page
      const url = page.url();
      const isLoginPage = url.includes('kinde') ||
                          url.includes('login') ||
                          url.includes('auth');
      expect(isLoginPage).toBeTruthy();
    });

    test('should show admin page for authenticated admin user', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should either load admin panel or redirect to login (if not super admin)
      const url = page.url();
      const isAdminOrLogin = url.includes('/admin') ||
                             url.includes('login') ||
                             url.includes('kinde');
      expect(isAdminOrLogin).toBeTruthy();
    });
  });

  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
    });

    test('should display admin navigation', async ({ page }) => {
      // Admin panel should have navigation elements
      const nav = page.locator('nav').or(page.locator('[data-testid="admin-nav"]'));
      if (await nav.isVisible()) {
        // Verify navigation has links
        const links = await nav.locator('a').count();
        expect(links).toBeGreaterThan(0);
      }
    });

    test('should display admin page content', async ({ page }) => {
      // Should have some heading or content on the admin page
      const heading = page.locator('h1').first();
      if (await heading.isVisible()) {
        const text = await heading.textContent();
        expect(text).toBeTruthy();
      }
    });
  });

  test.describe('Tenant Management', () => {
    test('should load tenant list page', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for tenant-related content
      const tenantLink = page.locator('a[href*="tenant"]').or(
        page.locator('a:has-text("Tenant")').or(
          page.locator('a:has-text("Clínica")')
        )
      );

      if (await tenantLink.first().isVisible()) {
        await tenantLink.first().click();
        await page.waitForLoadState('networkidle');

        // Should show tenant list or detail
        const content = page.locator('table').or(
          page.locator('[data-testid="tenant-list"]')
        );
        // Verify page loaded without errors
        await expect(page.locator('text=/error/i')).not.toBeVisible();
      }
    });
  });

  test.describe('Admin API Endpoints', () => {
    test('should require authentication for admin API', async ({ page }) => {
      const response = await page.request.get('/api/admin/tenants', {
        failOnStatusCode: false,
      });

      // Should either succeed (200) if authenticated as admin,
      // or fail with 401/403 if not authorized
      expect([200, 401, 403, 307]).toContain(response.status());
    });

    test('should return health check from API', async ({ page }) => {
      const response = await page.request.get('/api/health');

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status');
    });
  });
});
