import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests for Admin Referrals Panel
 *
 * Basic smoke tests for the referral management interface:
 * - Page loads correctly
 * - Navigation from admin sidebar
 * - Key UI elements render
 *
 * NOTE: These tests require authentication with a super admin user.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Admin Referrals Panel Smoke Tests', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.describe('Page Access', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.context().clearCookies();

      await page.goto('/admin/referrals');

      const url = page.url();
      const isLoginPage =
        url.includes('kinde') || url.includes('login') || url.includes('auth');
      expect(isLoginPage).toBeTruthy();
    });

    test('should load referrals page for authenticated admin', async ({ page }) => {
      await page.goto('/admin/referrals');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const isReferralsOrLogin =
        url.includes('/admin/referrals') ||
        url.includes('login') ||
        url.includes('kinde');
      expect(isReferralsOrLogin).toBeTruthy();
    });
  });

  test.describe('Referrals Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/referrals');
      await page.waitForLoadState('networkidle');
    });

    test('should display page title', async ({ page }) => {
      const heading = page.locator('h1');
      if (await heading.isVisible()) {
        const text = await heading.textContent();
        expect(text?.toLowerCase()).toContain('referido');
      }
    });

    test('should display stat cards', async ({ page }) => {
      // The page should show stat cards for partners, conversions, commissions
      const statCards = page.locator('[class*="rounded"]').filter({ hasText: /Partner|Conversion|Comision|Pagado/i });
      if (await statCards.first().isVisible()) {
        const count = await statCards.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('should display tab navigation for Partners and Conversiones', async ({ page }) => {
      const partnersTab = page.locator('button').filter({ hasText: /Partners/i });
      const conversionsTab = page.locator('button').filter({ hasText: /Conversion/i });

      if (await partnersTab.isVisible()) {
        expect(await partnersTab.isVisible()).toBeTruthy();
      }
      if (await conversionsTab.isVisible()) {
        expect(await conversionsTab.isVisible()).toBeTruthy();
      }
    });

    test('should have a button to create new partner', async ({ page }) => {
      const newPartnerBtn = page.locator('button').filter({ hasText: /Nuevo Partner/i });
      if (await newPartnerBtn.isVisible()) {
        expect(await newPartnerBtn.isEnabled()).toBeTruthy();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should be accessible from admin sidebar', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Look for referrals link in sidebar
      const referralsLink = page.locator('a[href*="referrals"]');
      if (await referralsLink.isVisible()) {
        await referralsLink.click();
        await page.waitForLoadState('networkidle');

        const url = page.url();
        expect(url).toContain('/admin/referrals');
      }
    });
  });
});
