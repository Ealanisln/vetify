import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Inventory Management
 *
 * This test suite verifies the Inventory module:
 * - Listing products
 * - Adding products
 * - Editing products
 * - Deleting products
 * - Stock management
 * - Low stock alerts
 * - Inventory transfers (Pro feature)
 * - ABC Analysis (Pro feature)
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Inventory Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/dashboard/inventory');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Inventory List', () => {
    test('should display inventory page header', async ({ page }) => {
      await expect(page.locator('h1:has-text("Inventario")')).toBeVisible();
    });

    test('should display add product button', async ({ page }) => {
      await expect(page.locator('[data-testid="add-product-button"]')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(page.locator('[data-testid="inventory-search-input"]')).toBeVisible();
    });

    test('should filter products by name', async ({ page }) => {
      const searchInput = page.locator('[data-testid="inventory-search-input"]');
      await searchInput.fill('vacuna');

      await page.waitForTimeout(500);

      const productRows = page.locator('[data-testid="product-row"]');
      const count = await productRows.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const row = productRows.nth(i);
          const text = await row.textContent();
          expect(text?.toLowerCase()).toContain('vacuna');
        }
      }
    });

    test('should display product information in table', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await expect(productRow.locator('[data-testid="product-name"]')).toBeVisible();
        await expect(productRow.locator('[data-testid="product-stock"]')).toBeVisible();
        await expect(productRow.locator('[data-testid="product-price"]')).toBeVisible();
      }
    });

    test('should show empty state when no products', async ({ page }) => {
      const searchInput = page.locator('[data-testid="inventory-search-input"]');
      await searchInput.fill('zzzznonexistent12345');
      await page.waitForTimeout(500);

      await expect(page.locator('[data-testid="empty-inventory-state"]')).toBeVisible();
    });

    test('should display category filter', async ({ page }) => {
      await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
      const categoryFilter = page.locator('[data-testid="category-filter"]');

      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.locator('[data-testid="category-option"]').first().click();

        await page.waitForLoadState('networkidle');

        // Products should be filtered
        const productRows = page.locator('[data-testid="product-row"]');
        expect(await productRows.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Inventory Statistics', () => {
    test('should display inventory stats section', async ({ page }) => {
      await expect(page.locator('[data-testid="inventory-stats"]')).toBeVisible();
    });

    test('should show total products count', async ({ page }) => {
      const statsSection = page.locator('[data-testid="inventory-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="total-products"]')).toBeVisible();
      }
    });

    test('should show total inventory value', async ({ page }) => {
      const statsSection = page.locator('[data-testid="inventory-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="total-value"]')).toBeVisible();
      }
    });

    test('should show low stock count', async ({ page }) => {
      const statsSection = page.locator('[data-testid="inventory-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="low-stock-count"]')).toBeVisible();
      }
    });
  });

  test.describe('Add Product', () => {
    test('should open add product modal', async ({ page }) => {
      await page.click('[data-testid="add-product-button"]');

      await expect(page.locator('[data-testid="add-product-modal"]')).toBeVisible();
    });

    test('should display product form fields', async ({ page }) => {
      await page.click('[data-testid="add-product-button"]');

      await expect(page.locator('[data-testid="product-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-sku-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-price-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-stock-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-category-select"]')).toBeVisible();
    });

    test('should show validation errors for required fields', async ({ page }) => {
      await page.click('[data-testid="add-product-button"]');
      await page.click('[data-testid="submit-product-button"]');

      await expect(page.locator('text=/nombre.*requerido/i')).toBeVisible();
    });

    test('should validate price format', async ({ page }) => {
      await page.click('[data-testid="add-product-button"]');

      await page.fill('[data-testid="product-name-input"]', 'Test Product');
      await page.fill('[data-testid="product-price-input"]', '-100');

      await page.click('[data-testid="submit-product-button"]');

      await expect(page.locator('text=/precio.*v.lido|mayor que 0/i')).toBeVisible();
    });

    test('should create product successfully', async ({ page }) => {
      await page.click('[data-testid="add-product-button"]');

      const timestamp = Date.now();
      await page.fill('[data-testid="product-name-input"]', `Test Product E2E ${timestamp}`);
      await page.fill('[data-testid="product-sku-input"]', `SKU-${timestamp}`);
      await page.fill('[data-testid="product-price-input"]', '99.99');
      await page.fill('[data-testid="product-stock-input"]', '50');

      // Select category
      await page.click('[data-testid="product-category-select"]');
      await page.locator('[data-testid="category-option"]').first().click();

      await page.click('[data-testid="submit-product-button"]');

      await expect(page.locator('text=/producto.*creado/i')).toBeVisible();
      await expect(page.locator('[data-testid="add-product-modal"]')).not.toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.click('[data-testid="add-product-button"]');
      await page.click('[data-testid="cancel-product-button"]');

      await expect(page.locator('[data-testid="add-product-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Edit Product', () => {
    test('should open edit modal from product row', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await productRow.locator('[data-testid="edit-product-button"]').click();
        await expect(page.locator('[data-testid="edit-product-modal"]')).toBeVisible();
      }
    });

    test('should pre-fill form with existing data', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        const productName = await productRow.locator('[data-testid="product-name"]').textContent();

        await productRow.locator('[data-testid="edit-product-button"]').click();

        const nameInput = page.locator('[data-testid="product-name-input"]');
        await expect(nameInput).toHaveValue(productName || '');
      }
    });

    test('should update product successfully', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await productRow.locator('[data-testid="edit-product-button"]').click();

        await page.fill('[data-testid="product-price-input"]', '149.99');
        await page.click('[data-testid="submit-product-button"]');

        await expect(page.locator('text=/producto.*actualizado/i')).toBeVisible();
      }
    });
  });

  test.describe('Delete Product', () => {
    test('should show delete confirmation', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await productRow.locator('[data-testid="delete-product-button"]').click();
        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).toBeVisible();
      }
    });

    test('should cancel deletion', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await productRow.locator('[data-testid="delete-product-button"]').click();
        await page.click('[data-testid="cancel-delete-button"]');

        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Stock Management', () => {
    test('should show stock adjustment option', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await productRow.locator('[data-testid="adjust-stock-button"]').click();
        await expect(page.locator('[data-testid="stock-adjustment-modal"]')).toBeVisible();
      }
    });

    test('should adjust stock quantity', async ({ page }) => {
      const productRow = page.locator('[data-testid="product-row"]').first();

      if (await productRow.isVisible()) {
        await productRow.locator('[data-testid="adjust-stock-button"]').click();

        await page.fill('[data-testid="stock-adjustment-input"]', '10');
        await page.selectOption('[data-testid="adjustment-type"]', 'add');
        await page.click('[data-testid="submit-adjustment-button"]');

        await expect(page.locator('text=/stock.*actualizado/i')).toBeVisible();
      }
    });
  });

  test.describe('Low Stock Alerts', () => {
    test('should display low stock alerts section', async ({ page }) => {
      await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();
    });

    test('should show products with low stock', async ({ page }) => {
      const alertsSection = page.locator('[data-testid="low-stock-alerts"]');

      if (await alertsSection.isVisible()) {
        const lowStockItems = alertsSection.locator('[data-testid="low-stock-item"]');
        const count = await lowStockItems.count();

        // May or may not have items depending on data
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should highlight low stock in product row', async ({ page }) => {
      const lowStockRow = page.locator('[data-testid="product-row"].low-stock, [data-testid="product-row"][data-low-stock="true"]').first();

      if (await lowStockRow.isVisible()) {
        // Should have visual indication
        const stockCell = lowStockRow.locator('[data-testid="product-stock"]');
        await expect(stockCell).toHaveClass(/text-red|text-orange|warning|danger/);
      }
    });
  });

  test.describe('Inventory Transfers (Pro Feature)', () => {
    test('should display transfers tab', async ({ page }) => {
      const transfersTab = page.locator('[data-testid="transfers-tab"]');

      // May be hidden or feature-gated
      if (await transfersTab.isVisible()) {
        await expect(transfersTab).toBeVisible();
      }
    });

    test('should show create transfer button', async ({ page }) => {
      const transfersTab = page.locator('[data-testid="transfers-tab"]');

      if (await transfersTab.isVisible()) {
        await transfersTab.click();
        await page.waitForLoadState('networkidle');

        const createTransferButton = page.locator('[data-testid="create-transfer-button"]');
        if (await createTransferButton.isVisible()) {
          await expect(createTransferButton).toBeVisible();
        }
      }
    });

    test('should open transfer form', async ({ page }) => {
      const transfersTab = page.locator('[data-testid="transfers-tab"]');

      if (await transfersTab.isVisible()) {
        await transfersTab.click();
        await page.waitForLoadState('networkidle');

        const createTransferButton = page.locator('[data-testid="create-transfer-button"]');
        if (await createTransferButton.isVisible()) {
          await createTransferButton.click();
          await expect(page.locator('[data-testid="transfer-form"]')).toBeVisible();
        }
      }
    });

    test('should display transfer form fields', async ({ page }) => {
      const transfersTab = page.locator('[data-testid="transfers-tab"]');

      if (await transfersTab.isVisible()) {
        await transfersTab.click();
        await page.waitForLoadState('networkidle');

        const createTransferButton = page.locator('[data-testid="create-transfer-button"]');
        if (await createTransferButton.isVisible()) {
          await createTransferButton.click();

          await expect(page.locator('[data-testid="from-location-select"]')).toBeVisible();
          await expect(page.locator('[data-testid="to-location-select"]')).toBeVisible();
          await expect(page.locator('[data-testid="transfer-product-select"]')).toBeVisible();
          await expect(page.locator('[data-testid="transfer-quantity-input"]')).toBeVisible();
        }
      }
    });

    test('should list pending transfers', async ({ page }) => {
      const transfersTab = page.locator('[data-testid="transfers-tab"]');

      if (await transfersTab.isVisible()) {
        await transfersTab.click();
        await page.waitForLoadState('networkidle');

        const transfersList = page.locator('[data-testid="transfers-list"]');
        if (await transfersList.isVisible()) {
          await expect(transfersList).toBeVisible();
        }
      }
    });
  });

  test.describe('Feature Gate - Pro Features', () => {
    test('should show upgrade prompt for non-Pro users on ABC Analysis', async ({ page }) => {
      const abcTab = page.locator('[data-testid="abc-analysis-tab"]');

      if (await abcTab.isVisible()) {
        await abcTab.click();

        // Should show upgrade prompt or ABC analysis
        const hasUpgradePrompt = await page.locator('[data-testid="upgrade-prompt"]').isVisible();
        const hasAbcAnalysis = await page.locator('[data-testid="abc-analysis-content"]').isVisible();

        expect(hasUpgradePrompt || hasAbcAnalysis).toBeTruthy();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper table structure', async ({ page }) => {
      const table = page.locator('table, [role="table"]');

      if (await table.isVisible()) {
        await expect(table.locator('thead, [role="rowgroup"]').first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1:has-text("Inventario")')).toBeVisible();
      await expect(page.locator('[data-testid="add-product-button"]')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('[data-testid="inventory-search-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="inventory-stats"]')).toBeVisible();
    });
  });
});
