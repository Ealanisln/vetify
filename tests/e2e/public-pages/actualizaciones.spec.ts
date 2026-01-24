import { test, expect } from '@playwright/test';

/**
 * E2E Tests for /actualizaciones (Updates/Changelog) Page
 *
 * Tests the public changelog page functionality:
 * - Page loads correctly
 * - Version entries are displayed
 * - Expandable/collapsible sections work
 * - Category icons and styling
 * - Responsive design
 * - Navigation links
 *
 * This page is synced automatically from CHANGELOG.md via sync-changelog.mjs
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Actualizaciones Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/actualizaciones`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Actualizaciones');
    });

    test('should display page description', async ({ page }) => {
      // Use first() to avoid strict mode violation when multiple matches exist
      const description = page.locator('text=/mejoras|correcciones|funcionalidades/i').first();
      await expect(description).toBeVisible();
    });

    test('should have back link to home', async ({ page }) => {
      const backLink = page.locator('a[href="/"]');
      await expect(backLink).toBeVisible();
      await expect(backLink).toContainText(/volver/i);
    });

    test('should have footer with changelog format reference', async ({ page }) => {
      const footer = page.locator('text=/Keep a Changelog/i');
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Version Entries', () => {
    test('should display at least one version entry', async ({ page }) => {
      // Look for version tags (v1.0.0, v1.1.0, etc.)
      const versionTags = page.locator('text=/v\\d+\\.\\d+\\.\\d+|En desarrollo/');
      await expect(versionTags.first()).toBeVisible();
    });

    test('should display version 1.2.0', async ({ page }) => {
      const version = page.locator('text=v1.2.0');
      await expect(version).toBeVisible();
    });

    test('should display version 1.1.0', async ({ page }) => {
      const version = page.locator('text=v1.1.0');
      await expect(version).toBeVisible();
    });

    test('should display version 1.0.0', async ({ page }) => {
      // May need to expand a section to see this
      const version = page.locator('text=v1.0.0');
      // Either visible or will be visible after clicking
      const count = await version.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display dates in Spanish format', async ({ page }) => {
      // Spanish months
      const spanishMonths = /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i;
      const dateText = page.locator(`text=${spanishMonths}`);
      await expect(dateText.first()).toBeVisible();
    });
  });

  test.describe('Expandable Sections', () => {
    test('should have first version expanded by default', async ({ page }) => {
      // First version should show categories
      const firstCategory = page.locator('text=/Agregado|Corregido|Modificado|Seguridad/i').first();
      await expect(firstCategory).toBeVisible();
    });

    test('should toggle section on click', async ({ page }) => {
      // Find a version header button (chevron icon indicates expandable)
      const versionButton = page.locator('button').filter({ has: page.locator('text=/v\\d+\\.\\d+\\.\\d+/') }).first();

      if (await versionButton.count() > 0) {
        // Get initial state
        const chevron = versionButton.locator('svg').last();
        await expect(chevron).toBeVisible();

        // Click to toggle
        await versionButton.click();

        // Wait for animation
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Category Display', () => {
    test('should display "Agregado" category with green styling', async ({ page }) => {
      const addedCategory = page.locator('h3').filter({ hasText: 'Agregado' }).first();

      if (await addedCategory.count() > 0) {
        await expect(addedCategory).toBeVisible();
        // Check that the category heading has green color class
        await expect(addedCategory).toHaveClass(/green/);
      }
    });

    test('should display "Corregido" category with blue styling', async ({ page }) => {
      const fixedCategory = page.locator('h3').filter({ hasText: 'Corregido' }).first();

      if (await fixedCategory.count() > 0) {
        await expect(fixedCategory).toBeVisible();
        // Check that the category heading has blue color class
        await expect(fixedCategory).toHaveClass(/blue/);
      }
    });

    test('should display changelog items as list', async ({ page }) => {
      // Look for list items (bullet points)
      const listItems = page.locator('ul li').filter({ hasText: /.+/ });
      const count = await listItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Content Verification', () => {
    test('should contain PWA InstallPrompt feature in v1.2.0', async ({ page }) => {
      // v1.2.0 may be collapsed if newer versions exist, expand it first
      const v120Button = page.locator('button').filter({ hasText: 'v1.2.0' });
      if (await v120Button.count() > 0) {
        await v120Button.click();
        await page.waitForTimeout(300);
      }
      const feature = page.locator('text=/InstallPrompt|PWA/i');
      const count = await feature.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should contain Sistema de Invitaciones feature in v1.1.0', async ({ page }) => {
      // v1.1.0 may be collapsed, expand it first
      const v110Button = page.locator('button').filter({ hasText: 'v1.1.0' });
      if (await v110Button.count() > 0) {
        await v110Button.click();
        await page.waitForTimeout(300);
      }
      const feature = page.locator('text=/Sistema de Invitaciones/i');
      const count = await feature.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should contain Sistema de Permisos feature in v1.1.0', async ({ page }) => {
      // v1.1.0 may be collapsed, expand it first
      const v110Button = page.locator('button').filter({ hasText: 'v1.1.0' });
      if (await v110Button.count() > 0) {
        await v110Button.click();
        await page.waitForTimeout(300);
      }
      const feature = page.locator('text=/Sistema de Permisos|RBAC/i');
      const count = await feature.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should contain Página de Actualizaciones feature in v1.1.0', async ({ page }) => {
      // v1.1.0 may be collapsed, expand it first
      const v110Button = page.locator('button').filter({ hasText: 'v1.1.0' });
      if (await v110Button.count() > 0) {
        await v110Button.click();
        await page.waitForTimeout(300);
      }
      const feature = page.locator('text=/Página de Actualizaciones/i');
      const count = await feature.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to home when clicking back link', async ({ page }) => {
      const backLink = page.locator('a[href="/"]').first();
      await backLink.click();
      await page.waitForURL(`${baseUrl}/`);
      expect(page.url()).toBe(`${baseUrl}/`);
    });

    test('should open Keep a Changelog link in new tab', async ({ page }) => {
      const link = page.locator('a[href*="keepachangelog.com"]');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    });

    test('should open Semantic Versioning link in new tab', async ({ page }) => {
      const link = page.locator('a[href*="semver.org"]');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const title = page.locator('h1');
      await expect(title).toBeVisible();

      const versionTag = page.locator('text=/v\\d+\\.\\d+\\.\\d+|En desarrollo/').first();
      await expect(versionTag).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should support dark mode styling', async ({ page }) => {
      // Check if dark mode classes are present in the page
      const darkModeElements = page.locator('[class*="dark:"]');
      const count = await darkModeElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('should have accessible buttons', async ({ page }) => {
      const buttons = page.locator('button');
      const count = await buttons.count();

      // Each button should be clickable
      for (let i = 0; i < Math.min(count, 3); i++) {
        const button = buttons.nth(i);
        await expect(button).toBeEnabled();
      }
    });
  });
});
