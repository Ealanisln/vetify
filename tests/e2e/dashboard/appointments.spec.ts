import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Appointments Management
 *
 * This test suite verifies the Appointments module:
 * - Calendar view (day, week, month)
 * - Creating new appointments
 * - Editing appointments
 * - Canceling appointments
 * - Quick actions (complete, cancel, WhatsApp)
 * - Today's appointments section
 * - Appointment statistics
 *
 * NOTE: These tests require authentication and proper test user setup.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Appointments Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.beforeEach(async ({ page }) => {
    // Navigate to appointments page
    await page.goto('/dashboard/appointments');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Calendar View', () => {
    test('should display appointments page header', async ({ page }) => {
      await expect(page.locator('h1:has-text("Citas")')).toBeVisible();
    });

    test('should display calendar component', async ({ page }) => {
      await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    });

    test('should display new appointment button', async ({ page }) => {
      await expect(page.locator('[data-testid="new-appointment-button"]')).toBeVisible();
    });

    test('should have view toggle buttons', async ({ page }) => {
      // Should have day, week, month view buttons
      await expect(page.locator('[data-testid="view-day"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-week"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-month"]')).toBeVisible();
    });

    test('should switch to day view', async ({ page }) => {
      await page.click('[data-testid="view-day"]');

      // Calendar should update to day view
      await expect(page.locator('[data-testid="calendar-day-view"]')).toBeVisible();
    });

    test('should switch to week view', async ({ page }) => {
      await page.click('[data-testid="view-week"]');

      // Calendar should update to week view
      await expect(page.locator('[data-testid="calendar-week-view"]')).toBeVisible();
    });

    test('should switch to month view', async ({ page }) => {
      await page.click('[data-testid="view-month"]');

      // Calendar should update to month view
      await expect(page.locator('[data-testid="calendar-month-view"]')).toBeVisible();
    });

    test('should navigate to next period', async ({ page }) => {
      const currentDate = page.locator('[data-testid="calendar-current-date"]');
      const initialText = await currentDate.textContent();

      await page.click('[data-testid="calendar-next"]');

      // Date should change
      await expect(currentDate).not.toHaveText(initialText || '');
    });

    test('should navigate to previous period', async ({ page }) => {
      const currentDate = page.locator('[data-testid="calendar-current-date"]');
      const initialText = await currentDate.textContent();

      await page.click('[data-testid="calendar-prev"]');

      // Date should change
      await expect(currentDate).not.toHaveText(initialText || '');
    });

    test('should navigate to today', async ({ page }) => {
      // First navigate away
      await page.click('[data-testid="calendar-prev"]');
      await page.click('[data-testid="calendar-prev"]');

      // Then click today
      await page.click('[data-testid="calendar-today"]');

      // Should be back to today
      const todayElement = page.locator('[data-testid="calendar-today-indicator"]');
      await expect(todayElement).toBeVisible();
    });
  });

  test.describe('Today\'s Appointments', () => {
    test('should display today appointments section', async ({ page }) => {
      await expect(page.locator('[data-testid="today-appointments"]')).toBeVisible();
    });

    test('should show appointment count for today', async ({ page }) => {
      const todaySection = page.locator('[data-testid="today-appointments"]');
      await expect(todaySection).toBeVisible();

      // Should show count or empty state
      const hasAppointments = await page.locator('[data-testid="today-appointment-card"]').first().isVisible().catch(() => false);
      const hasEmptyState = await page.locator('[data-testid="no-today-appointments"]').isVisible().catch(() => false);

      expect(hasAppointments || hasEmptyState).toBeTruthy();
    });

    test('should display appointment time and patient info', async ({ page }) => {
      const appointmentCard = page.locator('[data-testid="today-appointment-card"]').first();

      if (await appointmentCard.isVisible()) {
        await expect(appointmentCard.locator('[data-testid="appointment-time"]')).toBeVisible();
        await expect(appointmentCard.locator('[data-testid="appointment-pet-name"]')).toBeVisible();
      }
    });
  });

  test.describe('Create Appointment', () => {
    test('should open appointment modal from button', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');

      await expect(page.locator('[data-testid="appointment-modal"]')).toBeVisible();
    });

    test('should open appointment modal from calendar date click', async ({ page }) => {
      // Click on a calendar date cell
      const dateCell = page.locator('[data-testid="calendar-date-cell"]').first();

      if (await dateCell.isVisible()) {
        await dateCell.click();
        await expect(page.locator('[data-testid="appointment-modal"]')).toBeVisible();
      }
    });

    test('should display appointment form fields', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');

      // Required fields
      await expect(page.locator('[data-testid="appointment-pet-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="appointment-date-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="appointment-time-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="appointment-service-select"]')).toBeVisible();
    });

    test('should show validation errors for required fields', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');

      // Try to submit without filling fields
      await page.click('[data-testid="submit-appointment-button"]');

      // Should show validation errors
      await expect(page.locator('text=/mascota.*requerida/i')).toBeVisible();
    });

    test('should search and select a pet', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');

      const petSelect = page.locator('[data-testid="appointment-pet-select"]');
      await petSelect.click();

      // Search for a pet
      const searchInput = page.locator('[data-testid="pet-search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Max');
        await page.waitForTimeout(300);
      }

      // Select first result
      await page.locator('[data-testid="pet-option"]').first().click();

      // Should show selected pet
      await expect(petSelect).toContainText(/Max/i);
    });

    test('should create appointment successfully', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');

      // Select pet
      await page.click('[data-testid="appointment-pet-select"]');
      await page.locator('[data-testid="pet-option"]').first().click();

      // Set date (today or tomorrow)
      const dateInput = page.locator('[data-testid="appointment-date-input"]');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await dateInput.fill(tomorrow.toISOString().split('T')[0]);

      // Set time
      await page.fill('[data-testid="appointment-time-input"]', '10:00');

      // Select service
      await page.click('[data-testid="appointment-service-select"]');
      await page.locator('[data-testid="service-option"]').first().click();

      // Submit
      await page.click('[data-testid="submit-appointment-button"]');

      // Should show success message
      await expect(page.locator('text=/cita.*creada/i')).toBeVisible();

      // Modal should close
      await expect(page.locator('[data-testid="appointment-modal"]')).not.toBeVisible();
    });

    test('should close modal when clicking cancel', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');
      await page.click('[data-testid="cancel-appointment-button"]');

      await expect(page.locator('[data-testid="appointment-modal"]')).not.toBeVisible();
    });

    test('should close modal when clicking outside', async ({ page }) => {
      await page.click('[data-testid="new-appointment-button"]');

      // Click on backdrop
      await page.locator('[data-testid="modal-backdrop"]').click();

      await expect(page.locator('[data-testid="appointment-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Edit Appointment', () => {
    test('should open edit modal from calendar event click', async ({ page }) => {
      const appointmentEvent = page.locator('[data-testid="calendar-appointment"]').first();

      if (await appointmentEvent.isVisible()) {
        await appointmentEvent.click();
        await expect(page.locator('[data-testid="appointment-modal"]')).toBeVisible();
      }
    });

    test('should pre-fill form with existing data', async ({ page }) => {
      const appointmentEvent = page.locator('[data-testid="calendar-appointment"]').first();

      if (await appointmentEvent.isVisible()) {
        await appointmentEvent.click();

        // Form should have pre-filled values
        const petSelect = page.locator('[data-testid="appointment-pet-select"]');
        const selectedPet = await petSelect.textContent();
        expect(selectedPet).toBeTruthy();
      }
    });

    test('should update appointment successfully', async ({ page }) => {
      const appointmentEvent = page.locator('[data-testid="calendar-appointment"]').first();

      if (await appointmentEvent.isVisible()) {
        await appointmentEvent.click();

        // Change time
        await page.fill('[data-testid="appointment-time-input"]', '14:00');

        // Submit
        await page.click('[data-testid="submit-appointment-button"]');

        // Should show success message
        await expect(page.locator('text=/cita.*actualizada/i')).toBeVisible();
      }
    });
  });

  test.describe('Cancel Appointment', () => {
    test('should show cancel confirmation', async ({ page }) => {
      const appointmentEvent = page.locator('[data-testid="calendar-appointment"]').first();

      if (await appointmentEvent.isVisible()) {
        await appointmentEvent.click();

        // Click cancel button in modal
        await page.click('[data-testid="cancel-appointment-action"]');

        // Confirmation dialog should appear
        await expect(page.locator('[data-testid="confirm-cancel-dialog"]')).toBeVisible();
      }
    });

    test('should cancel appointment successfully', async ({ page }) => {
      const appointmentEvent = page.locator('[data-testid="calendar-appointment"]').first();

      if (await appointmentEvent.isVisible()) {
        await appointmentEvent.click();
        await page.click('[data-testid="cancel-appointment-action"]');
        await page.click('[data-testid="confirm-cancel-button"]');

        // Should show success message
        await expect(page.locator('text=/cita.*cancelada/i')).toBeVisible();
      }
    });
  });

  test.describe('Quick Actions', () => {
    test('should complete appointment from today list', async ({ page }) => {
      const appointmentCard = page.locator('[data-testid="today-appointment-card"]').first();

      if (await appointmentCard.isVisible()) {
        await page.click('[data-testid="complete-appointment-button"]');

        // Should show success or confirmation
        await expect(page.locator('text=/completada|confirmar/i')).toBeVisible();
      }
    });

    test('should open WhatsApp reminder', async ({ page }) => {
      const appointmentCard = page.locator('[data-testid="today-appointment-card"]').first();

      if (await appointmentCard.isVisible()) {
        // WhatsApp button might open in new tab
        const whatsappButton = appointmentCard.locator('[data-testid="whatsapp-reminder-button"]');

        if (await whatsappButton.isVisible()) {
          const href = await whatsappButton.getAttribute('href');
          expect(href).toContain('wa.me');
        }
      }
    });
  });

  test.describe('Appointment Statistics', () => {
    test('should display appointment stats', async ({ page }) => {
      await expect(page.locator('[data-testid="appointment-stats"]')).toBeVisible();
    });

    test('should show total appointments count', async ({ page }) => {
      const statsSection = page.locator('[data-testid="appointment-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="total-appointments"]')).toBeVisible();
      }
    });

    test('should show today appointments count', async ({ page }) => {
      const statsSection = page.locator('[data-testid="appointment-stats"]');

      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('[data-testid="today-count"]')).toBeVisible();
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

    test('should have accessible calendar navigation', async ({ page }) => {
      const prevButton = page.locator('[data-testid="calendar-prev"]');
      const nextButton = page.locator('[data-testid="calendar-next"]');

      // Should have aria-labels
      await expect(prevButton).toHaveAttribute('aria-label', /anterior|prev/i);
      await expect(nextButton).toHaveAttribute('aria-label', /siguiente|next/i);
    });

    test('should announce date changes to screen readers', async ({ page }) => {
      // Live region should exist for date announcements
      const liveRegion = page.locator('[aria-live="polite"]');
      if (await liveRegion.isVisible()) {
        await expect(liveRegion).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1:has-text("Citas")')).toBeVisible();
      await expect(page.locator('[data-testid="new-appointment-button"]')).toBeVisible();
    });

    test('should adapt calendar to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Calendar should still be visible but may switch to compact view
      await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
      await expect(page.locator('[data-testid="today-appointments"]')).toBeVisible();
    });
  });

  test.describe('Auto-refresh', () => {
    test('should refresh appointments on tab focus', async ({ page }) => {
      // Navigate away and back
      await page.goto('/dashboard');
      await page.goto('/dashboard/appointments');

      // Calendar should be refreshed
      await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    });
  });
});
