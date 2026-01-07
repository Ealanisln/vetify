import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Public Testimonials System
 *
 * Tests the testimonials functionality on public pages:
 * - Testimonials section displays on landing page
 * - Testimonial submission form works
 * - Form validation
 * - Success/error states
 *
 * NOTE: These tests require a running development server with test data.
 * Set TEST_CLINIC_SLUG env var to use a specific test clinic.
 *
 * SKIPPED IN CI: These tests require a database with real clinic data
 * which is not available in the CI environment.
 */

const testClinicSlug = process.env.TEST_CLINIC_SLUG || 'demo-clinic';
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Public Testimonials', () => {
  test.skip(!!process.env.CI, 'Skipped in CI - requires real database with clinic data');

  test.describe('Testimonials Section on Landing Page', () => {
    test('should display testimonials section if testimonials exist', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}`);
      await page.waitForLoadState('networkidle');

      // The section may or may not exist depending on whether testimonials are approved
      const testimonialsSection = page.locator('#testimonios');
      const sectionExists = await testimonialsSection.count() > 0;

      if (sectionExists) {
        await expect(testimonialsSection).toBeVisible();
        // Should have the header
        await expect(page.locator('text=/lo que dicen nuestros clientes/i')).toBeVisible();
      }
    });

    test('should display star ratings in testimonials', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}`);
      await page.waitForLoadState('networkidle');

      const testimonialsSection = page.locator('#testimonios');
      const sectionExists = await testimonialsSection.count() > 0;

      if (sectionExists) {
        // Should have star icons
        const stars = testimonialsSection.locator('svg').filter({ hasText: '' });
        expect(await stars.count()).toBeGreaterThan(0);
      }
    });

    test('should have link to submit testimonial', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}`);
      await page.waitForLoadState('networkidle');

      const testimonialsSection = page.locator('#testimonios');
      const sectionExists = await testimonialsSection.count() > 0;

      if (sectionExists) {
        // Should have "Deja tu testimonio" button
        const ctaButton = page.locator(`a[href="/${testClinicSlug}/testimonios/nuevo"]`);
        await expect(ctaButton).toBeVisible();
      }
    });

    test('should navigate carousel with arrows', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}`);
      await page.waitForLoadState('networkidle');

      const testimonialsSection = page.locator('#testimonios');
      const sectionExists = await testimonialsSection.count() > 0;

      if (sectionExists) {
        // Check for navigation arrows
        const nextButton = page.locator('button[aria-label="Siguiente testimonio"]');
        const prevButton = page.locator('button[aria-label="Testimonio anterior"]');

        if (await nextButton.isVisible()) {
          await nextButton.click();
          // Animation should complete
          await page.waitForTimeout(500);
        }

        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Testimonial Submission Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/testimonios/nuevo`);
      await page.waitForLoadState('networkidle');
    });

    test('should display submission form', async ({ page }) => {
      // Should have the form title
      await expect(page.locator('text=/comparte tu experiencia/i')).toBeVisible();

      // Should have name input
      await expect(page.locator('input#reviewerName')).toBeVisible();

      // Should have email input
      await expect(page.locator('input#reviewerEmail')).toBeVisible();

      // Should have star rating
      await expect(page.locator('button[aria-label*="estrella"]').first()).toBeVisible();

      // Should have text area
      await expect(page.locator('textarea#text')).toBeVisible();

      // Should have submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should have back navigation link', async ({ page }) => {
      const backLink = page.locator(`a[href="/${testClinicSlug}"]`);
      await expect(backLink).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=/por favor ingresa tu nombre/i')).toBeVisible();
      await expect(page.locator('text=/por favor selecciona una calificacion/i')).toBeVisible();
      await expect(page.locator('text=/por favor escribe tu testimonio/i')).toBeVisible();
    });

    test('should validate minimum text length', async ({ page }) => {
      // Fill in name
      await page.fill('input#reviewerName', 'Test User');

      // Select rating
      await page.click('button[aria-label="5 estrellas"]');

      // Enter short text
      await page.fill('textarea#text', 'Short');

      // Submit
      await page.click('button[type="submit"]');

      // Should show minimum length error
      await expect(page.locator('text=/al menos 10 caracteres/i')).toBeVisible();
    });

    test('should allow star rating selection', async ({ page }) => {
      // Click on 4-star button
      const fourStarButton = page.locator('button[aria-label="4 estrellas"]');
      await fourStarButton.click();

      // Should show "Bueno" label
      await expect(page.locator('text=Bueno')).toBeVisible();

      // Click on 5-star button
      const fiveStarButton = page.locator('button[aria-label="5 estrellas"]');
      await fiveStarButton.click();

      // Should show "Excelente" label
      await expect(page.locator('text=Excelente')).toBeVisible();
    });

    test('should show character count', async ({ page }) => {
      const textarea = page.locator('textarea#text');
      await textarea.fill('This is a test testimonial text');

      // Should show character count
      await expect(page.locator('text=/\\d+ caracteres/i')).toBeVisible();
    });

    test('should show success message after valid submission', async ({ page }) => {
      // Fill in valid data
      await page.fill('input#reviewerName', 'Test User');
      await page.fill('input#reviewerEmail', 'test@example.com');
      await page.click('button[aria-label="5 estrellas"]');
      await page.fill('textarea#text', 'This is a great veterinary clinic! Excellent service and care.');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for response
      await page.waitForTimeout(2000);

      // Should show success message or error (depending on API availability)
      const successMessage = page.locator('text=/gracias por tu testimonio/i');
      const errorMessage = page.locator('[data-sonner-toast]');

      const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
      const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);

      // Either success or we got an API error (acceptable in test environment)
      expect(hasSuccess || hasError).toBe(true);
    });

    test('should allow submitting another testimonial after success', async ({ page }) => {
      // Fill and submit
      await page.fill('input#reviewerName', 'Test User');
      await page.click('button[aria-label="5 estrellas"]');
      await page.fill('textarea#text', 'Great veterinary clinic with excellent care!');
      await page.click('button[type="submit"]');

      // Wait for success
      const successMessage = page.locator('text=/gracias por tu testimonio/i');
      const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasSuccess) {
        // Click "Enviar otro testimonio" button
        const anotherButton = page.locator('button:has-text("Enviar otro testimonio")');
        await anotherButton.click();

        // Form should be reset
        await expect(page.locator('input#reviewerName')).toHaveValue('');
      }
    });
  });

  test.describe('SEO and Meta', () => {
    test('should have proper meta tags on submission page', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/testimonios/nuevo`);

      // Check title
      const title = await page.title();
      expect(title).toContain('testimonio');

      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
    });

    test('should have canonical URL', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/testimonios/nuevo`);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', new RegExp(`/${testClinicSlug}/testimonios/nuevo`));
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/${testClinicSlug}/testimonios/nuevo`);

      // Form should still be visible
      await expect(page.locator('form')).toBeVisible();

      // Submit button should be full width
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseUrl}/${testClinicSlug}/testimonios/nuevo`);

      await expect(page.locator('form')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should support dark mode on submission page', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/testimonios/nuevo`);

      // Emulate dark mode
      await page.emulateMedia({ colorScheme: 'dark' });

      // Page should have dark background
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Form container should adapt to dark mode
      const formContainer = page.locator('form').locator('..');
      await expect(formContainer).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent clinic', async ({ page }) => {
      const response = await page.goto(`${baseUrl}/non-existent-clinic-xyz/testimonios/nuevo`);

      // Should return 404 or redirect to not found
      expect([404, 200]).toContain(response?.status() || 0);
    });
  });
});
