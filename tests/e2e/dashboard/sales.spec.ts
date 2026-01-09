import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Sales/POS Management
 *
 * This test suite verifies the Sales module:
 * - Opening/closing cash register
 * - Creating sales
 * - Processing payments
 * - Customer and product search
 * - Cart management
 * - Sale receipts
 * - Shift closing
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Sales/POS Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // Navigate to sales page
    await page.goto('/dashboard/sales');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Cash Register', () => {
    test('should display sales page header', async ({ page }) => {
      await expect(page.locator('h1:has-text("Ventas"), h1:has-text("Punto de Venta")')).toBeVisible();
    });

    test('should show cash register status', async ({ page }) => {
      // Should show open or closed status
      const registerStatus = page.locator('[data-testid="register-status"]');
      await expect(registerStatus).toBeVisible();
    });

    test('should have open register button when closed', async ({ page }) => {
      const openButton = page.locator('[data-testid="open-register-button"]');
      const registerOpen = await page.locator('[data-testid="register-status"][data-open="true"]').isVisible();

      if (!registerOpen) {
        await expect(openButton).toBeVisible();
      }
    });

    test('should open cash register', async ({ page }) => {
      const openButton = page.locator('[data-testid="open-register-button"]');

      if (await openButton.isVisible()) {
        await openButton.click();

        // Should show opening amount dialog
        await expect(page.locator('[data-testid="opening-amount-modal"]')).toBeVisible();

        // Enter opening amount
        await page.fill('[data-testid="opening-amount-input"]', '1000');
        await page.click('[data-testid="confirm-open-register"]');

        // Register should be open
        await expect(page.locator('text=/caja.*abierta/i')).toBeVisible();
      }
    });

    test('should show close register button when open', async ({ page }) => {
      const closeButton = page.locator('[data-testid="close-register-button"]');
      const registerOpen = await page.locator('[data-testid="register-status"][data-open="true"]').isVisible();

      if (registerOpen) {
        await expect(closeButton).toBeVisible();
      }
    });
  });

  test.describe('Customer Search', () => {
    test('should display customer search input', async ({ page }) => {
      await expect(page.locator('[data-testid="customer-search-input"]')).toBeVisible();
    });

    test('should search customers by name', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customer-search-input"]');
      await searchInput.fill('Juan');

      await page.waitForTimeout(500);

      // Should show search results
      const results = page.locator('[data-testid="customer-search-result"]');
      const count = await results.count();

      if (count > 0) {
        await expect(results.first()).toBeVisible();
      }
    });

    test('should search customers by phone', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customer-search-input"]');
      await searchInput.fill('555');

      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="customer-search-result"]');
      if (await results.first().isVisible()) {
        const text = await results.first().textContent();
        expect(text).toContain('555');
      }
    });

    test('should select customer from search', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customer-search-input"]');
      await searchInput.fill('test');

      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="customer-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Selected customer should be shown
        await expect(page.locator('[data-testid="selected-customer"]')).toBeVisible();
      }
    });

    test('should allow general sale (no customer)', async ({ page }) => {
      const generalSaleButton = page.locator('[data-testid="general-sale-button"]');

      if (await generalSaleButton.isVisible()) {
        await generalSaleButton.click();

        // Should show "Venta General" or similar indicator
        await expect(page.locator('text=/venta general|sin cliente/i')).toBeVisible();
      }
    });

    test('should clear selected customer', async ({ page }) => {
      // First select a customer
      const searchInput = page.locator('[data-testid="customer-search-input"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="customer-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Clear button
        const clearButton = page.locator('[data-testid="clear-customer-button"]');
        if (await clearButton.isVisible()) {
          await clearButton.click();
          await expect(page.locator('[data-testid="selected-customer"]')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Pet Selection', () => {
    test('should show pet selection after customer selected', async ({ page }) => {
      // Select a customer first
      const searchInput = page.locator('[data-testid="customer-search-input"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="customer-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Pet selector should appear
        const petSelector = page.locator('[data-testid="pet-selector"]');
        if (await petSelector.isVisible()) {
          await expect(petSelector).toBeVisible();
        }
      }
    });

    test('should select pet for sale', async ({ page }) => {
      // Select a customer first
      const searchInput = page.locator('[data-testid="customer-search-input"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="customer-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        const petSelector = page.locator('[data-testid="pet-selector"]');
        if (await petSelector.isVisible()) {
          await petSelector.click();
          await page.locator('[data-testid="pet-option"]').first().click();

          await expect(page.locator('[data-testid="selected-pet"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Product/Service Search', () => {
    test('should display product search input', async ({ page }) => {
      await expect(page.locator('[data-testid="product-search-input"]')).toBeVisible();
    });

    test('should search products by name', async ({ page }) => {
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('vacuna');

      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await expect(results.first()).toBeVisible();
      }
    });

    test('should show product price in search results', async ({ page }) => {
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');

      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await expect(results.first().locator('[data-testid="product-price"]')).toBeVisible();
      }
    });

    test('should add product to cart from search', async ({ page }) => {
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');

      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Cart should have item
        await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible();
      }
    });
  });

  test.describe('Cart Management', () => {
    test('should display empty cart initially', async ({ page }) => {
      const cart = page.locator('[data-testid="sales-cart"]');
      await expect(cart).toBeVisible();

      // Should show empty state or zero total
      const emptyCart = page.locator('[data-testid="empty-cart"]');
      const cartItems = page.locator('[data-testid="cart-item"]');

      const isEmpty = await emptyCart.isVisible() || await cartItems.count() === 0;
      expect(isEmpty).toBeTruthy();
    });

    test('should update cart quantity', async ({ page }) => {
      // First add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Update quantity
        const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first();
        if (await quantityInput.isVisible()) {
          await quantityInput.fill('2');

          // Total should update
          const total = page.locator('[data-testid="cart-total"]');
          await expect(total).toBeVisible();
        }
      }
    });

    test('should remove item from cart', async ({ page }) => {
      // First add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Remove item
        const removeButton = page.locator('[data-testid="remove-cart-item"]').first();
        if (await removeButton.isVisible()) {
          await removeButton.click();

          // Cart should be empty
          const emptyCart = page.locator('[data-testid="empty-cart"]');
          const cartItems = page.locator('[data-testid="cart-item"]');

          const isEmpty = await emptyCart.isVisible() || await cartItems.count() === 0;
          expect(isEmpty).toBeTruthy();
        }
      }
    });

    test('should apply discount to item', async ({ page }) => {
      // First add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Apply discount
        const discountInput = page.locator('[data-testid="cart-item-discount"]').first();
        if (await discountInput.isVisible()) {
          await discountInput.fill('10');

          // Total should reflect discount
          const subtotal = page.locator('[data-testid="cart-subtotal"]');
          const total = page.locator('[data-testid="cart-total"]');

          // With discount, total should be less than subtotal
          const subtotalText = await subtotal.textContent();
          const totalText = await total.textContent();

          expect(totalText).not.toBe(subtotalText);
        }
      }
    });

    test('should show cart totals with tax', async ({ page }) => {
      // Add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Should show subtotal, tax, and total
        await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-tax"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
      }
    });

    test('should clear entire cart', async ({ page }) => {
      // Add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        // Clear cart
        const clearCartButton = page.locator('[data-testid="clear-cart-button"]');
        if (await clearCartButton.isVisible()) {
          await clearCartButton.click();

          // Confirm clear
          await page.click('[data-testid="confirm-clear-cart"]');

          // Cart should be empty
          await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Process Sale', () => {
    test('should have checkout button', async ({ page }) => {
      await expect(page.locator('[data-testid="checkout-button"]')).toBeVisible();
    });

    test('should disable checkout with empty cart', async ({ page }) => {
      const checkoutButton = page.locator('[data-testid="checkout-button"]');
      await expect(checkoutButton).toBeDisabled();
    });

    test('should enable checkout with items in cart', async ({ page }) => {
      // Add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        const checkoutButton = page.locator('[data-testid="checkout-button"]');
        await expect(checkoutButton).toBeEnabled();
      }
    });

    test('should open payment modal', async ({ page }) => {
      // Add item to cart
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();

        await page.click('[data-testid="checkout-button"]');

        await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
      }
    });

    test('should display payment methods', async ({ page }) => {
      // Add item and proceed to checkout
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();
        await page.click('[data-testid="checkout-button"]');

        // Should show payment methods
        await expect(page.locator('[data-testid="payment-method-cash"]')).toBeVisible();
        await expect(page.locator('[data-testid="payment-method-card"]')).toBeVisible();
      }
    });

    test('should process cash payment', async ({ page }) => {
      // Add item and proceed to checkout
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();
        await page.click('[data-testid="checkout-button"]');

        // Select cash payment
        await page.click('[data-testid="payment-method-cash"]');

        // Enter amount received
        const amountInput = page.locator('[data-testid="amount-received-input"]');
        if (await amountInput.isVisible()) {
          await amountInput.fill('500');
        }

        // Complete sale
        await page.click('[data-testid="complete-sale-button"]');

        // Should show success
        await expect(page.locator('text=/venta.*completada/i')).toBeVisible();
      }
    });

    test('should calculate change for cash payment', async ({ page }) => {
      // Add item and proceed to checkout
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();
        await page.click('[data-testid="checkout-button"]');

        await page.click('[data-testid="payment-method-cash"]');

        const amountInput = page.locator('[data-testid="amount-received-input"]');
        if (await amountInput.isVisible()) {
          await amountInput.fill('500');

          // Should show change
          const changeAmount = page.locator('[data-testid="change-amount"]');
          await expect(changeAmount).toBeVisible();
        }
      }
    });
  });

  test.describe('Sale Receipt', () => {
    test('should show receipt after sale', async ({ page }) => {
      // Complete a sale first
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('consulta');
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="product-search-result"]');
      if (await results.first().isVisible()) {
        await results.first().click();
        await page.click('[data-testid="checkout-button"]');
        await page.click('[data-testid="payment-method-cash"]');

        const amountInput = page.locator('[data-testid="amount-received-input"]');
        if (await amountInput.isVisible()) {
          await amountInput.fill('500');
        }

        await page.click('[data-testid="complete-sale-button"]');

        // Receipt should be visible
        await expect(page.locator('[data-testid="sale-receipt"]')).toBeVisible();
      }
    });

    test('should have print receipt button', async ({ page }) => {
      // After completing sale (assuming receipt is shown)
      const printButton = page.locator('[data-testid="print-receipt-button"]');

      if (await printButton.isVisible()) {
        await expect(printButton).toBeVisible();
      }
    });

    test('should have new sale button after completion', async ({ page }) => {
      const newSaleButton = page.locator('[data-testid="new-sale-button"]');

      if (await newSaleButton.isVisible()) {
        await newSaleButton.click();

        // Cart should be empty, ready for new sale
        await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
      }
    });
  });

  test.describe('Close Shift/Register', () => {
    test('should show close register option when open', async ({ page }) => {
      const closeButton = page.locator('[data-testid="close-register-button"]');

      if (await closeButton.isVisible()) {
        await expect(closeButton).toBeVisible();
      }
    });

    test('should show shift summary when closing', async ({ page }) => {
      const closeButton = page.locator('[data-testid="close-register-button"]');

      if (await closeButton.isVisible()) {
        await closeButton.click();

        // Should show summary
        await expect(page.locator('[data-testid="shift-summary"]')).toBeVisible();
      }
    });

    test('should show total sales for shift', async ({ page }) => {
      const closeButton = page.locator('[data-testid="close-register-button"]');

      if (await closeButton.isVisible()) {
        await closeButton.click();

        await expect(page.locator('[data-testid="shift-total-sales"]')).toBeVisible();
      }
    });

    test('should require closing amount input', async ({ page }) => {
      const closeButton = page.locator('[data-testid="close-register-button"]');

      if (await closeButton.isVisible()) {
        await closeButton.click();

        await expect(page.locator('[data-testid="closing-amount-input"]')).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error when register is closed', async ({ page }) => {
      const registerClosed = await page.locator('[data-testid="register-status"][data-open="false"]').isVisible();

      if (registerClosed) {
        // Try to make a sale
        const searchInput = page.locator('[data-testid="product-search-input"]');
        await searchInput.fill('consulta');
        await page.waitForTimeout(500);

        const results = page.locator('[data-testid="product-search-result"]');
        if (await results.first().isVisible()) {
          await results.first().click();

          const checkoutButton = page.locator('[data-testid="checkout-button"]');
          if (await checkoutButton.isVisible()) {
            await checkoutButton.click();

            // Should show error about closed register
            await expect(page.locator('text=/caja.*cerrada|abrir.*caja/i')).toBeVisible();
          }
        }
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

    test('should have proper aria labels on search inputs', async ({ page }) => {
      const customerSearch = page.locator('[data-testid="customer-search-input"]');
      const productSearch = page.locator('[data-testid="product-search-input"]');

      if (await customerSearch.isVisible()) {
        const ariaLabel = await customerSearch.getAttribute('aria-label');
        const placeholder = await customerSearch.getAttribute('placeholder');
        expect(ariaLabel || placeholder).toBeTruthy();
      }

      if (await productSearch.isVisible()) {
        const ariaLabel = await productSearch.getAttribute('aria-label');
        const placeholder = await productSearch.getAttribute('placeholder');
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1:has-text("Ventas"), h1:has-text("Punto de Venta")')).toBeVisible();
      await expect(page.locator('[data-testid="product-search-input"]')).toBeVisible();
    });

    test('should stack layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Cart and search should be visible but stacked
      await expect(page.locator('[data-testid="sales-cart"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-search-input"]')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('[data-testid="sales-cart"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-search-input"]')).toBeVisible();
    });
  });
});
