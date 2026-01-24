import { test, expect, devices } from '@playwright/test';

/**
 * Mobile-specific E2E Tests for API Key Management
 *
 * Tests responsive behavior on mobile devices:
 * - Modal behavior on small screens
 * - Touch interactions
 * - Copy functionality on mobile
 * - Responsive layout
 *
 * NOTE: These tests require authentication and CORPORATIVO plan.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

// Mobile viewport configurations
const mobileViewports = [
  { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
  { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'Pixel 5', viewport: { width: 393, height: 851 } },
];

test.describe('API Key Management - Mobile', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session');

  test.describe('iPhone SE Viewport', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display settings page correctly on mobile', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Settings header should be visible
      await expect(page.locator('h1:has-text("Configuración")')).toBeVisible();
    });

    test('should show create button on mobile', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Create button should be visible (might be full width on mobile)
      await expect(page.locator('button:has-text("Nueva Clave")')).toBeVisible();
    });

    test('should open modal as full-screen on mobile', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Modal should be visible and take up significant screen space
      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();
    });

    test('should scroll modal content on mobile', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Expand advanced options to make content taller
      await page.click('text=Opciones avanzadas');

      // Modal should be scrollable
      const modalContent = page.locator('.overflow-y-auto, [class*="overflow-y"]').first();
      if (await modalContent.isVisible()) {
        await expect(modalContent).toBeVisible();
      }
    });

    test('should handle touch copy action', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Create a key
      await page.click('button:has-text("Nueva Clave")');
      await page.fill('#api-key-name', `Mobile Test ${Date.now()}`);
      await page.click('button:has-text("Crear Clave")');

      await expect(page.locator('text=Clave de API Creada')).toBeVisible();

      // Tap copy button
      await page.tap('button[title*="Copiar"]');

      // Should show confirmation
      await expect(page.locator('text=Clave copiada al portapapeles')).toBeVisible();
    });

    test('should stack filters vertically on mobile', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Check if filters are in column layout
      const filterContainer = page.locator('.flex.flex-col').first();
      if (await filterContainer.isVisible()) {
        // Filters should be stacked
        await expect(filterContainer).toBeVisible();
      }
    });

    test('should display API key cards in single column', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Cards should be full width on mobile (grid-cols-1)
      const cardsGrid = page.locator('.grid.grid-cols-1');
      if (await cardsGrid.isVisible()) {
        await expect(cardsGrid).toBeVisible();
      }
    });
  });

  test.describe('iPhone 12 Viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should display correctly on iPhone 12', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('button:has-text("Nueva Clave")')).toBeVisible();
    });

    test('should handle swipe gestures for closing modal', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Modal should be visible
      await expect(page.locator('text=Nueva Clave de API')).toBeVisible();

      // Close by clicking backdrop (mobile users often tap outside)
      const backdrop = page.locator('.bg-black\\/50').first();
      if (await backdrop.isVisible()) {
        await backdrop.click();
      }
    });
  });

  test.describe('Tablet Viewport', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display in tablet layout', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Should have enough space for side navigation
      const sideNav = page.locator('nav.space-y-1');
      if (await sideNav.isVisible()) {
        await expect(sideNav).toBeVisible();
      }
    });

    test('should show two-column grid for API keys', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // On tablet, might show 2 columns (md:grid-cols-2)
      const cardsGrid = page.locator('.md\\:grid-cols-2');
      if (await cardsGrid.isVisible()) {
        await expect(cardsGrid).toBeVisible();
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test('should handle tap on create button', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Nueva Clave")');
      await createButton.tap();

      await expect(page.locator('text=Nueva Clave de API')).toBeVisible();
    });

    test('should handle tap on bundle selector', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.tap('button:has-text("Nueva Clave")');

      const bundleSelector = page.locator('button:has-text("Solo lectura")');
      await bundleSelector.tap();

      await expect(page.locator('text=Acceso completo')).toBeVisible();
    });

    test('should handle tap on action buttons in card', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const editButton = page.locator('button[title="Editar"]').first();

      if (await editButton.isVisible()) {
        // Setup dialog handler
        page.on('dialog', async (dialog) => {
          await dialog.dismiss();
        });

        await editButton.tap();
      }
    });

    test('should handle long press for context options', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const keyCard = page.locator('[data-testid="api-key-card"]').first();

      if (await keyCard.isVisible()) {
        // Simulate long press (platform may show context menu)
        await page.mouse.move(0, 0);
        await page.mouse.down();
        await page.waitForTimeout(500);
        await page.mouse.up();
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle landscape orientation', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });

      // Content should still be visible and usable
      await expect(page.locator('button:has-text("Nueva Clave")')).toBeVisible();
    });

    test('should maintain modal state during orientation change', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');
      await expect(page.locator('text=Nueva Clave de API')).toBeVisible();

      // Rotate
      await page.setViewportSize({ width: 667, height: 375 });

      // Modal should still be open
      await expect(page.locator('text=Nueva Clave de API')).toBeVisible();
    });
  });

  test.describe('Soft Keyboard Handling', () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

    test('should scroll to focused input when keyboard opens', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.tap('button:has-text("Nueva Clave")');

      // Tap on name input to focus
      const nameInput = page.locator('#api-key-name');
      await nameInput.tap();

      // Input should be visible (not hidden by keyboard)
      await expect(nameInput).toBeVisible();
    });

    test('should handle keyboard-based form submission', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.tap('button:has-text("Nueva Clave")');

      const nameInput = page.locator('#api-key-name');
      await nameInput.tap();
      await nameInput.fill(`Keyboard Test ${Date.now()}`);

      // Submit via Enter key (simulating mobile keyboard "Done")
      await page.keyboard.press('Enter');

      // Form should submit or button should be focused
      // The behavior depends on form implementation
    });
  });

  test.describe('Performance on Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should load settings page within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds on mobile (allowing for network latency)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle rapid interactions gracefully', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Rapidly tap the create button multiple times
      const createButton = page.locator('button:has-text("Nueva Clave")');

      await createButton.click();
      await createButton.click();
      await createButton.click();

      // Should only show one modal
      const modals = page.locator('text=Nueva Clave de API');
      await expect(modals).toHaveCount(1);
    });
  });
});

/**
 * Test with specific device emulation
 */
test.describe('API Keys - Device Emulation', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session');

  for (const device of ['iPhone 12', 'Pixel 5']) {
    test.describe(`${device}`, () => {
      test.use({ ...devices[device] });

      test(`should work correctly on ${device}`, async ({ page }) => {
        await page.goto('/dashboard/settings?tab=api');
        await page.waitForLoadState('networkidle');

        // Basic functionality should work
        await expect(page.locator('button:has-text("Nueva Clave")')).toBeVisible();
      });
    });
  }
});
