import { test, expect } from '@playwright/test';

/**
 * E2E Tests for QR Code Generator
 *
 * This test suite verifies the QR Code Generator component:
 * - Proper rendering of QR preview
 * - Target page selection updates URL
 * - Size selection works correctly
 * - Color customization functions
 * - Download functionality for PNG, SVG, PDF
 * - Logo toggle behavior
 * - Dark mode styling
 * - Public page warning display
 * - Accessibility compliance
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('QR Code Generator', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // Navigate to settings page and select QR codes tab
    await page.goto('/dashboard/settings');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    // Click on QR codes section
    await page.click('button:has-text("Códigos QR")');
  });

  test.describe('Basic Rendering', () => {
    test('should display QR code generator section', async ({ page }) => {
      // Check for the QR preview container
      await expect(page.locator('[data-testid="qr-preview"]')).toBeVisible();
    });

    test('should show Vista Previa card', async ({ page }) => {
      await expect(page.locator('text=Vista Previa')).toBeVisible();
    });

    test('should show Configuración card', async ({ page }) => {
      await expect(page.locator('text=Configuración')).toBeVisible();
    });

    test('should display QR SVG element', async ({ page }) => {
      await expect(page.locator('[data-testid="qr-preview"] svg')).toBeVisible();
    });

    test('should display URL in preview section', async ({ page }) => {
      const urlDisplay = page.locator('[data-testid="qr-url-display"]');
      await expect(urlDisplay).toBeVisible();
      // Should contain the base URL pattern
      await expect(urlDisplay).toContainText(/localhost|vetify/);
    });
  });

  test.describe('Target Page Selection', () => {
    test('should display all target page options', async ({ page }) => {
      await expect(page.locator('text=Página Principal')).toBeVisible();
      await expect(page.locator('text=Agendar Cita')).toBeVisible();
      await expect(page.locator('text=Servicios')).toBeVisible();
    });

    test('should update URL when selecting booking page', async ({ page }) => {
      // Click on booking option
      await page.click('label:has-text("Agendar Cita")');

      // Verify URL includes /agendar
      const urlDisplay = page.locator('[data-testid="qr-url-display"]');
      await expect(urlDisplay).toContainText('/agendar');
    });

    test('should update URL when selecting services page', async ({ page }) => {
      // Click on services option
      await page.click('label:has-text("Servicios")');

      // Verify URL includes /servicios
      const urlDisplay = page.locator('[data-testid="qr-url-display"]');
      await expect(urlDisplay).toContainText('/servicios');
    });

    test('should highlight selected target page option', async ({ page }) => {
      // Click on booking option
      await page.click('label:has-text("Agendar Cita")');

      // The label should have active styling
      const activeLabel = page.locator('label:has-text("Agendar Cita")');
      await expect(activeLabel).toHaveClass(/border-\[#75a99c\]/);
    });
  });

  test.describe('Size Selection', () => {
    test('should have size selector dropdown', async ({ page }) => {
      await expect(page.locator('[data-testid="size-select"]')).toBeVisible();
    });

    test('should display all size options', async ({ page }) => {
      const sizeSelect = page.locator('[data-testid="size-select"]');
      await expect(sizeSelect).toContainText('Pequeño');
      await expect(sizeSelect).toContainText('Mediano');
      await expect(sizeSelect).toContainText('Grande');
      await expect(sizeSelect).toContainText('Extra grande');
    });

    test('should change size when option selected', async ({ page }) => {
      await page.selectOption('[data-testid="size-select"]', '512');
      const sizeSelect = page.locator('[data-testid="size-select"]');
      await expect(sizeSelect).toHaveValue('512');
    });
  });

  test.describe('Color Configuration', () => {
    test('should have foreground color picker', async ({ page }) => {
      await expect(page.locator('[data-testid="fg-color-input"]')).toBeAttached();
    });

    test('should have background color picker', async ({ page }) => {
      // Find background color input
      const bgColorInput = page.locator('input[type="color"]#bgColor');
      await expect(bgColorInput).toBeAttached();
    });

    test('should have preset color buttons for QR color', async ({ page }) => {
      // Should have preset color buttons
      const colorButtons = page.locator('button[aria-label^="Seleccionar"]');
      await expect(colorButtons.first()).toBeVisible();
      // Should have at least 6 preset colors for QR
      expect(await colorButtons.count()).toBeGreaterThanOrEqual(6);
    });

    test('should update color when preset is clicked', async ({ page }) => {
      // Click on the black color preset (first one)
      await page.click('button[aria-label="Seleccionar Negro"]');

      // The color input should have updated
      const colorInput = page.locator('[data-testid="fg-color-input"]');
      await expect(colorInput).toHaveValue('#000000');
    });

    test('should update foreground color when custom picker used', async ({ page }) => {
      const colorInput = page.locator('[data-testid="fg-color-input"]');

      // Change color using the hidden input
      await colorInput.fill('#ff0000');

      // Verify value changed
      await expect(colorInput).toHaveValue('#ff0000');
    });
  });

  test.describe('Logo Toggle', () => {
    test('should have logo toggle switch', async ({ page }) => {
      // Use role selector for switch component
      await expect(page.locator('role=switch')).toBeVisible();
    });

    test('should display "Incluir logo" label', async ({ page }) => {
      await expect(page.locator('text=Incluir logo')).toBeVisible();
    });

    // Note: Logo toggle may be disabled if no logo is uploaded
    test('should show message when no logo available', async ({ page }) => {
      const logoToggle = page.locator('role=switch');
      const isDisabled = await logoToggle.isDisabled();

      if (isDisabled) {
        // Should show message about uploading logo
        await expect(page.locator('text=/sube un logo/i')).toBeVisible();
      }
    });
  });

  test.describe('Download Functionality', () => {
    test('should have PNG download button', async ({ page }) => {
      await expect(page.locator('[data-testid="download-png"]')).toBeVisible();
    });

    test('should have SVG download button', async ({ page }) => {
      await expect(page.locator('[data-testid="download-svg"]')).toBeVisible();
    });

    test('should have PDF download button', async ({ page }) => {
      await expect(page.locator('[data-testid="download-pdf"]')).toBeVisible();
    });

    test('should download QR as PNG', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-png"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.png$/);
    });

    test('should download QR as SVG', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-svg"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.svg$/);
    });

    test('should download QR as PDF', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });
  });

  test.describe('Reset Functionality', () => {
    test('should have reset button', async ({ page }) => {
      await expect(page.locator('text=Restablecer valores predeterminados')).toBeVisible();
    });

    test('should reset values when clicked', async ({ page }) => {
      // Change size
      await page.selectOption('[data-testid="size-select"]', '512');

      // Click reset
      await page.click('text=Restablecer valores predeterminados');

      // Verify size is back to default (256)
      const sizeSelect = page.locator('[data-testid="size-select"]');
      await expect(sizeSelect).toHaveValue('256');
    });
  });

  test.describe('Copy URL Functionality', () => {
    test('should copy URL when copy button clicked', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-write']);

      // Find and click copy button
      const urlSection = page.locator('[data-testid="qr-url-display"]').locator('..');
      const copyButton = urlSection.locator('button').first();
      await copyButton.click();

      // Should show success indication (check icon appears)
      await expect(copyButton.locator('svg')).toBeVisible();
    });
  });

  test.describe('External Link', () => {
    test('should have external link button to preview URL', async ({ page }) => {
      const urlSection = page.locator('[data-testid="qr-url-display"]').locator('..');
      const externalLink = urlSection.locator('a[target="_blank"]');
      await expect(externalLink).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should render correctly in dark mode', async ({ page }) => {
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Verify dark mode styling on container
      const container = page.locator('[data-testid="qr-generator-container"]');
      await expect(container).toBeVisible();

      // Cards should have dark styling
      const cards = page.locator('.border-gray-700');
      await expect(cards.first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper aria labels for size select', async ({ page }) => {
      const sizeSelect = page.locator('[data-testid="size-select"]');
      await expect(sizeSelect).toHaveAttribute('aria-label', 'tamaño');
    });

    test('should have proper aria labels for color input', async ({ page }) => {
      const colorInput = page.locator('[data-testid="fg-color-input"]');
      await expect(colorInput).toHaveAttribute('aria-label', 'color');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Focus first interactive element
      await page.keyboard.press('Tab');

      // Should have a focused element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have labels for form controls', async ({ page }) => {
      // Check for labels
      await expect(page.locator('label:has-text("URL de destino")')).toBeVisible();
      await expect(page.locator('label:has-text("Tamaño")')).toBeVisible();
      await expect(page.locator('label:has-text("Colores")')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify key elements are still visible
      await expect(page.locator('[data-testid="qr-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="download-png"]')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Verify layout is correct
      await expect(page.locator('[data-testid="qr-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="size-select"]')).toBeVisible();
    });
  });
});

test.describe('QR Code Generator - Public Page Warning', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session');

  // Note: This test requires a test tenant with publicPageEnabled = false
  test.skip(true, 'Requires test fixture with disabled public page');

  test('should show warning when public page is disabled', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.click('button:has-text("Códigos QR")');

    const warning = page.locator('[data-testid="public-page-warning"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(/página pública deshabilitada/i);
  });
});
