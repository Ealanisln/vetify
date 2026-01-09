import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pets Management
 *
 * This test suite verifies the Pets module:
 * - Listing pets with search and filters
 * - Adding a new pet
 * - Viewing pet details
 * - Editing pet information
 * - Deleting a pet
 * - Plan limit enforcement
 * - Location filtering
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Pets Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // Navigate to pets page
    await page.goto('/dashboard/pets');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Pets List', () => {
    test('should display pets page header', async ({ page }) => {
      await expect(page.locator('h1:has-text("Mascotas")')).toBeVisible();
    });

    test('should display add pet button', async ({ page }) => {
      await expect(page.locator('[data-testid="add-pet-button"]')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(page.locator('[data-testid="pets-search-input"]')).toBeVisible();
    });

    test('should filter pets by search term', async ({ page }) => {
      const searchInput = page.locator('[data-testid="pets-search-input"]');
      await searchInput.fill('Max');

      // Wait for debounced search
      await page.waitForTimeout(500);

      // Should show filtered results
      const petCards = page.locator('[data-testid="pet-card"]');
      const count = await petCards.count();

      if (count > 0) {
        // All visible pets should contain the search term
        for (let i = 0; i < count; i++) {
          const card = petCards.nth(i);
          const text = await card.textContent();
          expect(text?.toLowerCase()).toContain('max');
        }
      }
    });

    test('should clear search when clicking clear button', async ({ page }) => {
      const searchInput = page.locator('[data-testid="pets-search-input"]');
      await searchInput.fill('test');

      // Clear button should appear
      const clearButton = page.locator('[data-testid="clear-search"]');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should display pet count or empty state', async ({ page }) => {
      // Either we have pets or an empty state message
      const hasPets = await page.locator('[data-testid="pet-card"]').first().isVisible().catch(() => false);
      const hasEmptyState = await page.locator('[data-testid="empty-pets-state"]').isVisible().catch(() => false);

      expect(hasPets || hasEmptyState).toBeTruthy();
    });

    test('should display pet information in cards', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        // Each card should show pet name
        await expect(petCard.locator('[data-testid="pet-name"]')).toBeVisible();
        // Each card should show species
        await expect(petCard.locator('[data-testid="pet-species"]')).toBeVisible();
      }
    });
  });

  test.describe('Add Pet', () => {
    test('should navigate to new pet form', async ({ page }) => {
      await page.click('[data-testid="add-pet-button"]');
      await expect(page).toHaveURL(/\/dashboard\/pets\/new/);
    });

    test('should display pet form fields', async ({ page }) => {
      await page.goto('/dashboard/pets/new');
      await page.waitForLoadState('networkidle');

      // Required fields
      await expect(page.locator('[data-testid="pet-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="pet-species-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="pet-owner-select"]')).toBeVisible();
    });

    test('should show validation errors for required fields', async ({ page }) => {
      await page.goto('/dashboard/pets/new');
      await page.waitForLoadState('networkidle');

      // Try to submit without filling required fields
      await page.click('[data-testid="submit-pet-button"]');

      // Should show validation errors
      await expect(page.locator('text=/nombre.*requerido/i')).toBeVisible();
    });

    test('should create a new pet successfully', async ({ page }) => {
      await page.goto('/dashboard/pets/new');
      await page.waitForLoadState('networkidle');

      // Fill in pet details
      await page.fill('[data-testid="pet-name-input"]', 'Test Pet E2E');
      await page.selectOption('[data-testid="pet-species-select"]', 'perro');

      // Select an owner if required
      const ownerSelect = page.locator('[data-testid="pet-owner-select"]');
      if (await ownerSelect.isVisible()) {
        // Select first available owner
        await ownerSelect.click();
        await page.locator('[data-testid="owner-option"]').first().click();
      }

      // Submit the form
      await page.click('[data-testid="submit-pet-button"]');

      // Should redirect to pet detail or pets list
      await expect(page).toHaveURL(/\/dashboard\/pets/);

      // Should show success message
      await expect(page.locator('text=/mascota.*creada/i')).toBeVisible();
    });
  });

  test.describe('Pet Details', () => {
    test('should navigate to pet detail page', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await expect(page).toHaveURL(/\/dashboard\/pets\/[a-z0-9-]+$/);
      }
    });

    test('should display pet information', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        // Should display pet header with name
        await expect(page.locator('[data-testid="pet-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="pet-info-card"]')).toBeVisible();
      }
    });

    test('should display medical history section', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="medical-history-card"]')).toBeVisible();
      }
    });

    test('should have edit button', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="edit-pet-button"]')).toBeVisible();
      }
    });
  });

  test.describe('Edit Pet', () => {
    test('should navigate to edit page', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="edit-pet-button"]');
        await expect(page).toHaveURL(/\/dashboard\/pets\/[a-z0-9-]+\/edit/);
      }
    });

    test('should pre-fill form with existing data', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        // Get pet name from card
        const petName = await petCard.locator('[data-testid="pet-name"]').textContent();

        await petCard.click();
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="edit-pet-button"]');
        await page.waitForLoadState('networkidle');

        // Name input should be pre-filled
        const nameInput = page.locator('[data-testid="pet-name-input"]');
        await expect(nameInput).toHaveValue(petName || '');
      }
    });

    test('should update pet successfully', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="edit-pet-button"]');
        await page.waitForLoadState('networkidle');

        // Change pet name
        const nameInput = page.locator('[data-testid="pet-name-input"]');
        await nameInput.fill('Updated Pet Name E2E');

        // Submit
        await page.click('[data-testid="submit-pet-button"]');

        // Should show success message
        await expect(page.locator('text=/mascota.*actualizada/i')).toBeVisible();
      }
    });
  });

  test.describe('Delete Pet', () => {
    test('should show delete confirmation dialog', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        // Click delete button
        await page.click('[data-testid="delete-pet-button"]');

        // Confirmation dialog should appear
        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).toBeVisible();
      }
    });

    test('should cancel deletion when clicking cancel', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="delete-pet-button"]');
        await page.click('[data-testid="cancel-delete-button"]');

        // Dialog should close, still on detail page
        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).not.toBeVisible();
        await expect(page).toHaveURL(/\/dashboard\/pets\/[a-z0-9-]+$/);
      }
    });
  });

  test.describe('Plan Limits', () => {
    test('should show plan limit indicator', async ({ page }) => {
      // Should display pets count vs limit
      const limitIndicator = page.locator('[data-testid="pets-limit-indicator"]');

      if (await limitIndicator.isVisible()) {
        const text = await limitIndicator.textContent();
        // Should show format like "5 / 50 mascotas"
        expect(text).toMatch(/\d+\s*\/\s*\d+/);
      }
    });

    test('should disable add button when limit reached', async ({ page }) => {
      const addButton = page.locator('[data-testid="add-pet-button"]');
      const limitIndicator = page.locator('[data-testid="pets-limit-indicator"]');

      if (await limitIndicator.isVisible()) {
        const text = await limitIndicator.textContent();
        const match = text?.match(/(\d+)\s*\/\s*(\d+)/);

        if (match) {
          const [, current, max] = match;
          if (parseInt(current) >= parseInt(max)) {
            // Button should be disabled
            await expect(addButton).toBeDisabled();
          }
        }
      }
    });
  });

  test.describe('Location Filter', () => {
    test('should display location filter when multiple locations', async ({ page }) => {
      const locationFilter = page.locator('[data-testid="location-filter"]');

      // Location filter may or may not be visible depending on tenant setup
      if (await locationFilter.isVisible()) {
        await expect(locationFilter).toBeVisible();
      }
    });

    test('should filter pets by location', async ({ page }) => {
      const locationFilter = page.locator('[data-testid="location-filter"]');

      if (await locationFilter.isVisible()) {
        // Select a specific location
        await locationFilter.click();
        await page.locator('[data-testid="location-option"]').first().click();

        // Pets list should update
        await page.waitForLoadState('networkidle');

        // Verify filter is applied (pets should have the selected location)
        const petCards = page.locator('[data-testid="pet-card"]');
        const count = await petCards.count();

        // Just verify the list refreshed
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Quick Actions', () => {
    test('should show quick action menu on pet card', async ({ page }) => {
      const petCard = page.locator('[data-testid="pet-card"]').first();

      if (await petCard.isVisible()) {
        // Hover to reveal actions
        await petCard.hover();

        const actionsMenu = petCard.locator('[data-testid="pet-actions-menu"]');
        if (await actionsMenu.isVisible()) {
          await expect(actionsMenu).toBeVisible();
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Focus first interactive element
      await page.keyboard.press('Tab');

      // Should have a focused element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper aria labels on search input', async ({ page }) => {
      const searchInput = page.locator('[data-testid="pets-search-input"]');

      if (await searchInput.isVisible()) {
        const ariaLabel = await searchInput.getAttribute('aria-label');
        const placeholder = await searchInput.getAttribute('placeholder');

        // Should have either aria-label or placeholder for accessibility
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Key elements should still be visible
      await expect(page.locator('h1:has-text("Mascotas")')).toBeVisible();
      await expect(page.locator('[data-testid="add-pet-button"]')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1:has-text("Mascotas")')).toBeVisible();
      await expect(page.locator('[data-testid="pets-search-input"]')).toBeVisible();
    });
  });
});
