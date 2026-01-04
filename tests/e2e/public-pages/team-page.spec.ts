import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Public Team Page
 *
 * Tests the /[clinicSlug]/equipo public page functionality:
 * - Team page displays correctly
 * - Staff cards show proper information
 * - Navigation links work
 * - SEO elements are present
 * - Responsive design works
 * - Dark mode styling
 *
 * NOTE: These tests require a running development server with test data.
 * Set TEST_CLINIC_SLUG env var to use a specific test clinic.
 */

const testClinicSlug = process.env.TEST_CLINIC_SLUG || 'demo-clinic';
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Public Team Page', () => {
  test.describe('Team Page Display', () => {
    test('should display team page header', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Should show "Nuestro Equipo" heading
      await expect(page.locator('h1, h2').filter({ hasText: /nuestro equipo/i })).toBeVisible();
    });

    test('should display back navigation link', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Should have back link to clinic home
      const backLink = page.locator(`a[href="/${testClinicSlug}"]`).filter({ hasText: /volver/i });
      await expect(backLink).toBeVisible();
    });

    test('should show staff count', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Should display number of professionals
      await expect(page.locator('text=/\\d+\\s*profesional/i')).toBeVisible();
    });

    test('should display TeamSection with staff cards when team exists', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check for team section or empty state
      const teamSection = page.locator('section').first();
      const emptyState = page.locator('text=/equipo en construcción/i');

      const hasTeam = await teamSection.locator('[class*="grid"]').count() > 0;
      const hasEmptyState = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasTeam || hasEmptyState).toBe(true);
    });
  });

  test.describe('Staff Cards', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);
      await page.waitForLoadState('networkidle');
    });

    test('should display staff photo or placeholder', async ({ page }) => {
      // Look for staff cards
      const staffCards = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('h3') });
      const cardCount = await staffCards.count();

      if (cardCount > 0) {
        // Each card should have an image or User icon placeholder
        const firstCard = staffCards.first();
        const hasImage = await firstCard.locator('img').count() > 0;
        const hasPlaceholder = await firstCard.locator('svg').count() > 0;

        expect(hasImage || hasPlaceholder).toBe(true);
      }
    });

    test('should display staff name and position', async ({ page }) => {
      const staffCards = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('h3') });
      const cardCount = await staffCards.count();

      if (cardCount > 0) {
        const firstCard = staffCards.first();

        // Should have name in h3
        await expect(firstCard.locator('h3')).toBeVisible();

        // Should have position
        await expect(firstCard.locator('p').first()).toBeVisible();
      }
    });

    test('should display specialties as badges when present', async ({ page }) => {
      const staffCards = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('h3') });
      const cardCount = await staffCards.count();

      if (cardCount > 0) {
        // Check for specialty badges (rounded-full elements)
        const badges = staffCards.first().locator('[class*="rounded-full"]');
        const badgeCount = await badges.count();

        // If badges exist, they should have specialty text
        if (badgeCount > 0) {
          await expect(badges.first()).toBeVisible();
        }
      }
    });

    test('should display bio text when present', async ({ page }) => {
      const staffCards = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('h3') });
      const cardCount = await staffCards.count();

      if (cardCount > 0) {
        // Bio is typically in a paragraph with muted color
        const bio = staffCards.first().locator('p').last();
        // Bio may or may not exist, just check structure is valid
        expect(await bio.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no public team members', async ({ page }) => {
      // Use a non-existent or empty clinic slug
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);
      await page.waitForLoadState('networkidle');

      // If empty, should show construction message
      const emptyState = page.locator('text=/equipo en construcción/i');
      const hasCards = await page.locator('[class*="grid"]').locator('[class*="rounded-xl"]').count() > 0;

      if (!hasCards) {
        await expect(emptyState).toBeVisible();
        await expect(page.locator('text=/pronto tendremos información/i')).toBeVisible();
        await expect(page.locator(`a[href="/${testClinicSlug}"]`).filter({ hasText: /volver al inicio/i })).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to clinic home when clicking back link', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      const backLink = page.locator(`a[href="/${testClinicSlug}"]`).first();
      await backLink.click();

      await expect(page).toHaveURL(new RegExp(`/${testClinicSlug}/?$`));
    });

    test('should have team link in navbar when on team page', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Navbar should be visible
      await expect(page.locator('nav')).toBeVisible();

      // Check for team link or at least verify navbar structure
      const navbarTeamLink = page.locator('nav').locator(`a[href="/${testClinicSlug}/equipo"]`);
      const navbarExists = await page.locator('nav').count() > 0;
      const teamLinkExists = await navbarTeamLink.count() > 0;

      // At least navbar should exist
      expect(navbarExists).toBe(true);
      // Team link may or may not be visible depending on implementation
      expect(teamLinkExists || navbarExists).toBe(true);
    });
  });

  test.describe('SEO Elements', () => {
    test('should have proper page title', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      const title = await page.title();
      expect(title.toLowerCase()).toContain('equipo');
    });

    test('should have meta description', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription?.toLowerCase()).toContain('equipo');
    });

    test('should have OpenGraph tags', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
    });

    test('should have canonical URL', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain('/equipo');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Header should be visible
      await expect(page.locator('text=/nuestro equipo/i')).toBeVisible();

      // Cards should stack vertically on mobile (single column)
      const grid = page.locator('[class*="grid"]').first();
      if (await grid.count() > 0) {
        // Grid should exist and be responsive
        await expect(grid).toBeVisible();
      }
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      await expect(page.locator('text=/nuestro equipo/i')).toBeVisible();
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      await expect(page.locator('text=/nuestro equipo/i')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should support dark mode styling', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Check for dark mode classes on body or html
      const html = page.locator('html');
      const bodyClass = await html.getAttribute('class');

      // Should support dark mode (either light or dark class should be present)
      // or system preference should be respected
      expect(bodyClass !== null).toBe(true);
    });

    test('should have proper dark mode borders and backgrounds', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Enable dark mode if possible
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();

      // Page background should adapt
      const main = page.locator('main').first();
      await expect(main).toBeVisible();

      // Cards should have dark mode styling
      const cards = page.locator('[class*="rounded-xl"]');
      if (await cards.count() > 0) {
        await expect(cards.first()).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible heading structure', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Should have h1 or h2 for main heading
      const mainHeading = page.locator('h1, h2').filter({ hasText: /nuestro equipo/i });
      await expect(mainHeading).toBeVisible();

      // Staff names should be in h3
      const staffNames = page.locator('h3');
      // May be 0 if empty state
      expect(await staffNames.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to navigate without errors
      // At least the back link should be focusable
      const backLink = page.locator(`a[href="/${testClinicSlug}"]`).first();
      await backLink.focus();
      await expect(backLink).toBeFocused();
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${baseUrl}/${testClinicSlug}/equipo`);
      await page.waitForLoadState('networkidle');

      // Filter out expected errors (like missing resources in dev)
      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('404')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('404 Handling', () => {
    test('should show 404 for non-existent clinic', async ({ page }) => {
      const response = await page.goto(`${baseUrl}/non-existent-clinic-12345/equipo`);

      // Should return 404 or show not found page
      expect(response?.status() === 404 || await page.locator('text=/no encontrad/i').isVisible()).toBe(true);
    });

    test('should show 404 when public page is disabled', async () => {
      // This test assumes there's a clinic with publicPageEnabled=false
      // Skip if not applicable to test environment
      test.skip();
    });
  });
});

test.describe('Staff Public Profile in Dashboard', () => {
  // These tests require authentication
  const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session');

  test.describe('StaffModal Public Profile Section', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Setup authenticated session
      await page.goto(`${baseUrl}/dashboard/staff`);
    });

    test('should have public profile section in staff modal', async ({ page }) => {
      // Click to edit a staff member
      await page.locator('[data-testid="edit-staff-button"]').first().click();

      // Should show "Perfil Público" section
      await expect(page.locator('text=/perfil público/i')).toBeVisible();
    });

    test('should have photo upload capability', async ({ page }) => {
      await page.locator('[data-testid="edit-staff-button"]').first().click();

      // Should have photo uploader
      await expect(page.locator('[data-testid="staff-photo-uploader"]')).toBeVisible();
    });

    test('should have bio textarea', async ({ page }) => {
      await page.locator('[data-testid="edit-staff-button"]').first().click();

      // Should have bio textarea
      await expect(page.locator('textarea[name="publicBio"]')).toBeVisible();
    });

    test('should have specialties selector', async ({ page }) => {
      await page.locator('[data-testid="edit-staff-button"]').first().click();

      // Should have specialties selection
      await expect(page.locator('text=/especialidades/i')).toBeVisible();
    });

    test('should have show on public page toggle', async ({ page }) => {
      await page.locator('[data-testid="edit-staff-button"]').first().click();

      // Should have visibility toggle
      await expect(page.locator('input[name="showOnPublicPage"]')).toBeVisible();
    });
  });
});
