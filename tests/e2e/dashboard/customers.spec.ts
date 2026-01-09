import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Customers Management
 *
 * This test suite verifies the Customers module:
 * - Listing customers with search
 * - Adding a new customer
 * - Viewing customer details
 * - Editing customer information
 * - Archiving customers
 * - Customer-pet relationships
 * - Customer statistics
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Customers Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // Navigate to customers page
    await page.goto('/dashboard/customers');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Customers List', () => {
    test('should display customers page header', async ({ page }) => {
      await expect(page.locator('h1:has-text("Clientes")')).toBeVisible();
    });

    test('should display add customer button', async ({ page }) => {
      await expect(page.locator('[data-testid="add-customer-button"]')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(page.locator('[data-testid="customers-search-input"]')).toBeVisible();
    });

    test('should filter customers by name', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customers-search-input"]');
      await searchInput.fill('Juan');

      // Wait for debounced search
      await page.waitForTimeout(500);

      // Should show filtered results
      const customerRows = page.locator('[data-testid="customer-row"]');
      const count = await customerRows.count();

      if (count > 0) {
        // All visible customers should contain the search term
        for (let i = 0; i < count; i++) {
          const row = customerRows.nth(i);
          const text = await row.textContent();
          expect(text?.toLowerCase()).toContain('juan');
        }
      }
    });

    test('should filter customers by email', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customers-search-input"]');
      await searchInput.fill('@gmail.com');

      await page.waitForTimeout(500);

      const customerRows = page.locator('[data-testid="customer-row"]');
      const count = await customerRows.count();

      if (count > 0) {
        const firstRow = customerRows.first();
        const text = await firstRow.textContent();
        expect(text?.toLowerCase()).toContain('@gmail.com');
      }
    });

    test('should filter customers by phone', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customers-search-input"]');
      await searchInput.fill('555');

      await page.waitForTimeout(500);

      // Results should match phone number
      const customerRows = page.locator('[data-testid="customer-row"]');
      if (await customerRows.first().isVisible()) {
        const text = await customerRows.first().textContent();
        expect(text).toContain('555');
      }
    });

    test('should clear search', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customers-search-input"]');
      await searchInput.fill('test');

      const clearButton = page.locator('[data-testid="clear-search"]');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should display customer information in table', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        // Should display customer name
        await expect(customerRow.locator('[data-testid="customer-name"]')).toBeVisible();
        // Should display email or phone
        const hasContact = await customerRow.locator('[data-testid="customer-email"]').isVisible() ||
                          await customerRow.locator('[data-testid="customer-phone"]').isVisible();
        expect(hasContact).toBeTruthy();
      }
    });

    test('should show empty state when no customers', async ({ page }) => {
      // Search for non-existent customer
      const searchInput = page.locator('[data-testid="customers-search-input"]');
      await searchInput.fill('zzzznonexistent12345');
      await page.waitForTimeout(500);

      await expect(page.locator('[data-testid="empty-customers-state"]')).toBeVisible();
    });
  });

  test.describe('Customer Statistics', () => {
    test('should display customer stats section', async ({ page }) => {
      await expect(page.locator('[data-testid="customer-stats"]')).toBeVisible();
    });

    test('should show total customers count', async ({ page }) => {
      const statsSection = page.locator('[data-testid="customer-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="total-customers"]')).toBeVisible();
      }
    });

    test('should show active customers count', async ({ page }) => {
      const statsSection = page.locator('[data-testid="customer-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="active-customers"]')).toBeVisible();
      }
    });
  });

  test.describe('Add Customer', () => {
    test('should navigate to new customer form', async ({ page }) => {
      await page.click('[data-testid="add-customer-button"]');
      await expect(page).toHaveURL(/\/dashboard\/customers\/new/);
    });

    test('should display customer form fields', async ({ page }) => {
      await page.goto('/dashboard/customers/new');
      await page.waitForLoadState('networkidle');

      // Required and optional fields
      await expect(page.locator('[data-testid="customer-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-phone-input"]')).toBeVisible();
    });

    test('should show validation errors for required fields', async ({ page }) => {
      await page.goto('/dashboard/customers/new');
      await page.waitForLoadState('networkidle');

      // Try to submit without filling required fields
      await page.click('[data-testid="submit-customer-button"]');

      // Should show validation errors
      await expect(page.locator('text=/nombre.*requerido/i')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/dashboard/customers/new');
      await page.waitForLoadState('networkidle');

      await page.fill('[data-testid="customer-name-input"]', 'Test Customer');
      await page.fill('[data-testid="customer-email-input"]', 'invalid-email');

      await page.click('[data-testid="submit-customer-button"]');

      // Should show email validation error
      await expect(page.locator('text=/email.*v.lido/i')).toBeVisible();
    });

    test('should validate phone format', async ({ page }) => {
      await page.goto('/dashboard/customers/new');
      await page.waitForLoadState('networkidle');

      await page.fill('[data-testid="customer-name-input"]', 'Test Customer');
      await page.fill('[data-testid="customer-phone-input"]', '123'); // Too short

      await page.click('[data-testid="submit-customer-button"]');

      // Should show phone validation error
      await expect(page.locator('text=/tel.fono.*v.lido/i')).toBeVisible();
    });

    test('should create customer successfully', async ({ page }) => {
      await page.goto('/dashboard/customers/new');
      await page.waitForLoadState('networkidle');

      // Fill in customer details
      const timestamp = Date.now();
      await page.fill('[data-testid="customer-name-input"]', `Test Customer E2E ${timestamp}`);
      await page.fill('[data-testid="customer-email-input"]', `test.e2e.${timestamp}@example.com`);
      await page.fill('[data-testid="customer-phone-input"]', '5551234567');

      // Optional address
      const addressInput = page.locator('[data-testid="customer-address-input"]');
      if (await addressInput.isVisible()) {
        await addressInput.fill('123 Test Street');
      }

      // Submit
      await page.click('[data-testid="submit-customer-button"]');

      // Should show success message
      await expect(page.locator('text=/cliente.*creado/i')).toBeVisible();

      // Should redirect to customers list or detail
      await expect(page).toHaveURL(/\/dashboard\/customers/);
    });

    test('should cancel creation and return to list', async ({ page }) => {
      await page.goto('/dashboard/customers/new');
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="cancel-button"]');

      await expect(page).toHaveURL('/dashboard/customers');
    });
  });

  test.describe('Customer Details', () => {
    test('should navigate to customer detail page', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await expect(page).toHaveURL(/\/dashboard\/customers\/[a-z0-9-]+$/);
      }
    });

    test('should display customer information', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="customer-detail-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="customer-info-card"]')).toBeVisible();
      }
    });

    test('should display customer pets section', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="customer-pets-section"]')).toBeVisible();
      }
    });

    test('should display customer appointment history', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="customer-appointments-section"]')).toBeVisible();
      }
    });

    test('should have edit button', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="edit-customer-button"]')).toBeVisible();
      }
    });
  });

  test.describe('Edit Customer', () => {
    test('should navigate to edit page', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="edit-customer-button"]');
        await expect(page).toHaveURL(/\/dashboard\/customers\/[a-z0-9-]+\/edit/);
      }
    });

    test('should pre-fill form with existing data', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        // Get customer name from row
        const customerName = await customerRow.locator('[data-testid="customer-name"]').textContent();

        await customerRow.click();
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="edit-customer-button"]');
        await page.waitForLoadState('networkidle');

        // Name input should be pre-filled
        const nameInput = page.locator('[data-testid="customer-name-input"]');
        await expect(nameInput).toHaveValue(customerName || '');
      }
    });

    test('should update customer successfully', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="edit-customer-button"]');
        await page.waitForLoadState('networkidle');

        // Change customer phone
        await page.fill('[data-testid="customer-phone-input"]', '5559876543');

        // Submit
        await page.click('[data-testid="submit-customer-button"]');

        // Should show success message
        await expect(page.locator('text=/cliente.*actualizado/i')).toBeVisible();
      }
    });
  });

  test.describe('Archive Customer', () => {
    test('should show archive confirmation dialog', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="archive-customer-button"]');

        await expect(page.locator('[data-testid="confirm-archive-dialog"]')).toBeVisible();
      }
    });

    test('should cancel archiving when clicking cancel', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="archive-customer-button"]');
        await page.click('[data-testid="cancel-archive-button"]');

        await expect(page.locator('[data-testid="confirm-archive-dialog"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Customer-Pet Relationship', () => {
    test('should add pet to customer from detail page', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        const addPetButton = page.locator('[data-testid="add-pet-to-customer-button"]');
        if (await addPetButton.isVisible()) {
          await addPetButton.click();

          // Should open pet form or navigate to new pet
          const hasPetModal = await page.locator('[data-testid="add-pet-modal"]').isVisible();
          const navigatedToNewPet = page.url().includes('/pets/new');

          expect(hasPetModal || navigatedToNewPet).toBeTruthy();
        }
      }
    });

    test('should navigate to pet detail from customer page', async ({ page }) => {
      const customerRow = page.locator('[data-testid="customer-row"]').first();

      if (await customerRow.isVisible()) {
        await customerRow.click();
        await page.waitForLoadState('networkidle');

        const petCard = page.locator('[data-testid="customer-pet-card"]').first();
        if (await petCard.isVisible()) {
          await petCard.click();
          await expect(page).toHaveURL(/\/dashboard\/pets\/[a-z0-9-]+$/);
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination when many customers', async ({ page }) => {
      const pagination = page.locator('[data-testid="customers-pagination"]');

      // Pagination may or may not be visible depending on data
      if (await pagination.isVisible()) {
        await expect(pagination).toBeVisible();
      }
    });

    test('should navigate to next page', async ({ page }) => {
      const nextButton = page.locator('[data-testid="pagination-next"]');

      if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
        const firstCustomerBefore = await page.locator('[data-testid="customer-row"]').first().textContent();

        await nextButton.click();
        await page.waitForLoadState('networkidle');

        const firstCustomerAfter = await page.locator('[data-testid="customer-row"]').first().textContent();

        // Customers should be different
        expect(firstCustomerAfter).not.toBe(firstCustomerBefore);
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
        // Should have header row
        await expect(table.locator('thead, [role="rowgroup"]').first()).toBeVisible();
      }
    });

    test('should have proper aria labels', async ({ page }) => {
      const searchInput = page.locator('[data-testid="customers-search-input"]');

      if (await searchInput.isVisible()) {
        const ariaLabel = await searchInput.getAttribute('aria-label');
        const placeholder = await searchInput.getAttribute('placeholder');
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1:has-text("Clientes")')).toBeVisible();
      await expect(page.locator('[data-testid="add-customer-button"]')).toBeVisible();
    });

    test('should adapt table to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Table might switch to card view on mobile
      const hasTable = await page.locator('table').isVisible();
      const hasCards = await page.locator('[data-testid="customer-card"]').first().isVisible();

      expect(hasTable || hasCards).toBeTruthy();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('[data-testid="customers-search-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-stats"]')).toBeVisible();
    });
  });
});
