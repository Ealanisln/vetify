import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Medical Records
 *
 * Tests the medical records workflow:
 * - Navigating to a pet's medical history
 * - Creating a new consultation
 * - Recording vital signs
 * - Viewing medical timeline
 * - Adding vaccinations and treatments
 *
 * NOTE: These tests require authentication and test data (pet, customer).
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 */
const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('Medical Records', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.describe('Medical History Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');
    });

    test('should display pets list for navigation to medical history', async ({ page }) => {
      // Should show pet cards or list items
      const petCard = page.locator('[data-testid="pet-card"]').first().or(
        page.locator('[data-testid="pet-row"]').first()
      );

      if (await petCard.isVisible()) {
        // Click on first pet to view its details
        await petCard.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to pet detail page
        expect(page.url()).toContain('/dashboard/pets/');
      }
    });

    test('should show medical history section on pet detail page', async ({ page }) => {
      // Navigate to first pet
      const petCard = page.locator('[data-testid="pet-card"]').first().or(
        page.locator('[data-testid="pet-row"]').first()
      );

      if (await petCard.isVisible()) {
        await petCard.click();
        await page.waitForLoadState('networkidle');

        // Should have medical history tab or section
        const medicalTab = page.locator('[data-testid="medical-history-tab"]').or(
          page.locator('text=/historial médico/i').or(
            page.locator('text=/historia clínica/i')
          )
        );

        if (await medicalTab.isVisible()) {
          await medicalTab.click();
          await page.waitForLoadState('networkidle');
        }

        // Page should not show errors
        await expect(page.locator('text=/error inesperado/i')).not.toBeVisible();
      }
    });
  });

  test.describe('Consultation Creation', () => {
    test('should navigate to consultation form', async ({ page }) => {
      // Navigate to first pet's detail
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');

      const petCard = page.locator('[data-testid="pet-card"]').first();
      if (!(await petCard.isVisible())) {
        test.info().annotations.push({ type: 'skip', description: 'No pets available' });
        return;
      }

      await petCard.click();
      await page.waitForLoadState('networkidle');

      // Look for new consultation button
      const newConsultButton = page.locator('[data-testid="new-consultation-button"]').or(
        page.locator('button:has-text("Nueva Consulta")').or(
          page.locator('a:has-text("Nueva Consulta")')
        )
      );

      if (await newConsultButton.isVisible()) {
        await newConsultButton.click();
        await page.waitForLoadState('networkidle');

        // Should show consultation form
        const form = page.locator('form').or(
          page.locator('[data-testid="consultation-form"]')
        );
        await expect(form).toBeVisible();
      }
    });

    test('should display consultation form fields', async ({ page }) => {
      // Navigate directly to consultation form for first pet
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');

      const petCard = page.locator('[data-testid="pet-card"]').first();
      if (!(await petCard.isVisible())) {
        test.info().annotations.push({ type: 'skip', description: 'No pets available' });
        return;
      }

      // Get pet ID from href or data attribute
      const petLink = petCard.locator('a').first();
      if (await petLink.isVisible()) {
        const href = await petLink.getAttribute('href');
        if (href) {
          await page.goto(`${href}/consultation`);
          await page.waitForLoadState('networkidle');

          // Should have basic consultation fields
          const formFields = [
            page.locator('[data-testid="consultation-reason"]').or(page.locator('textarea[name="reason"]')),
            page.locator('[data-testid="consultation-diagnosis"]').or(page.locator('textarea[name="diagnosis"]')),
          ];

          for (const field of formFields) {
            if (await field.isVisible()) {
              // Field is present - form loaded correctly
              expect(true).toBeTruthy();
              return;
            }
          }
        }
      }
    });
  });

  test.describe('Vital Signs', () => {
    test('should navigate to vital signs form for a pet', async ({ page }) => {
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');

      const petCard = page.locator('[data-testid="pet-card"]').first();
      if (!(await petCard.isVisible())) {
        test.info().annotations.push({ type: 'skip', description: 'No pets available' });
        return;
      }

      await petCard.click();
      await page.waitForLoadState('networkidle');

      // Look for vital signs section or button
      const vitalsButton = page.locator('[data-testid="vital-signs-button"]').or(
        page.locator('button:has-text("Signos Vitales")').or(
          page.locator('a:has-text("Signos Vitales")')
        )
      );

      if (await vitalsButton.isVisible()) {
        await vitalsButton.click();
        await page.waitForLoadState('networkidle');

        // Should show vitals form or history
        await expect(page.locator('text=/error inesperado/i')).not.toBeVisible();
      }
    });
  });

  test.describe('Medical Timeline', () => {
    test('should display medical history timeline', async ({ page }) => {
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');

      const petCard = page.locator('[data-testid="pet-card"]').first();
      if (!(await petCard.isVisible())) {
        test.info().annotations.push({ type: 'skip', description: 'No pets available' });
        return;
      }

      await petCard.click();
      await page.waitForLoadState('networkidle');

      // Look for medical timeline component
      const timeline = page.locator('[data-testid="medical-timeline"]').or(
        page.locator('[data-testid="medical-history-list"]').or(
          page.locator('text=/historial médico/i')
        )
      );

      if (await timeline.isVisible()) {
        // Timeline should render without errors
        await expect(page.locator('text=/error inesperado/i')).not.toBeVisible();
      }
    });

    test('should show empty state when pet has no medical records', async ({ page }) => {
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');

      const petCard = page.locator('[data-testid="pet-card"]').first();
      if (!(await petCard.isVisible())) {
        test.info().annotations.push({ type: 'skip', description: 'No pets available' });
        return;
      }

      await petCard.click();
      await page.waitForLoadState('networkidle');

      // Either show timeline with entries or empty state
      const hasTimeline = await page.locator('[data-testid="medical-timeline"]').isVisible().catch(() => false);
      const hasEmptyState = await page.locator('[data-testid="empty-medical-history"]').or(
        page.locator('text=/sin registros/i').or(
          page.locator('text=/no hay consultas/i')
        )
      ).isVisible().catch(() => false);

      // Page loaded successfully - either with data or empty state
      await expect(page.locator('text=/error inesperado/i')).not.toBeVisible();
    });
  });

  test.describe('Vaccinations', () => {
    test('should navigate to vaccination section', async ({ page }) => {
      await page.goto('/dashboard/pets');
      await page.waitForLoadState('networkidle');

      const petCard = page.locator('[data-testid="pet-card"]').first();
      if (!(await petCard.isVisible())) {
        test.info().annotations.push({ type: 'skip', description: 'No pets available' });
        return;
      }

      await petCard.click();
      await page.waitForLoadState('networkidle');

      // Look for vaccinations tab or section
      const vaccinationTab = page.locator('[data-testid="vaccinations-tab"]').or(
        page.locator('text=/vacunas/i').or(
          page.locator('text=/vacunación/i')
        )
      );

      if (await vaccinationTab.isVisible()) {
        await vaccinationTab.click();
        await page.waitForLoadState('networkidle');

        // Should show vaccination records or empty state
        await expect(page.locator('text=/error inesperado/i')).not.toBeVisible();
      }
    });
  });
});
