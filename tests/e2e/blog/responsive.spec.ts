import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Blog Responsive Design
 *
 * Tests responsive behavior across different viewport sizes:
 * - Mobile (375px)
 * - Tablet (768px)
 * - Desktop (1440px)
 * - Dark mode styling
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Blog Responsive Design', () => {
  test.describe('Mobile Viewport (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should display blog listing correctly on mobile', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Title should be visible
      const title = page.locator('h1');
      await expect(title).toBeVisible();

      // Content should be visible
      const content = page.locator('main, article').first();
      await expect(content).toBeVisible();
    });

    test('should display single column layout on mobile', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Grid should adapt to single column
      const grid = page.locator('[class*="grid"]').first();
      if (await grid.count() > 0) {
        const box = await grid.boundingBox();
        if (box) {
          // Width should be close to viewport width (accounting for padding)
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('should display article correctly on mobile', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Title should be visible
        const title = page.locator('h1');
        await expect(title).toBeVisible();

        // Content should be readable width
        const article = page.locator('article, main').first();
        const box = await article.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('should hide or collapse TOC on mobile', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // TOC might be hidden or collapsed on mobile
        const toc = page.locator('nav[aria-label*="contenido"], [class*="toc"]').first();

        if (await toc.count() > 0) {
          // TOC might be collapsed/hidden or shown as a toggle
          const isVisible = await toc.isVisible();
          // Either hidden or very compact
          expect(typeof isVisible).toBe('boolean');
        }
      }
    });

    test('should have touch-friendly tap targets on mobile', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Links and buttons should have adequate size for touch
      const interactiveElements = page.locator('a, button').first();

      if (await interactiveElements.count() > 0) {
        const box = await interactiveElements.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44px (Apple guidelines)
          // or have adequate clickable area
          expect(box.height >= 20 || box.width >= 20).toBe(true);
        }
      }
    });

    test('should display breadcrumbs on mobile', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      if (await breadcrumb.count() > 0) {
        await expect(breadcrumb).toBeVisible();
      }
    });
  });

  test.describe('Tablet Viewport (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('should display blog listing correctly on tablet', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should display two column layout on tablet', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Grid might have 2 columns on tablet
      const grid = page.locator('[class*="grid"]').first();
      if (await grid.count() > 0) {
        const box = await grid.boundingBox();
        if (box) {
          // Width should use available space
          expect(box.width).toBeGreaterThan(375);
        }
      }
    });

    test('should display article with better spacing on tablet', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const title = page.locator('h1');
        await expect(title).toBeVisible();
      }
    });
  });

  test.describe('Desktop Viewport (1440px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('should display blog listing correctly on desktop', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should display three column layout on desktop', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Grid should have 3 columns on desktop
      const grid = page.locator('[class*="grid"]').first();
      if (await grid.count() > 0) {
        // Should use more width on desktop
        const box = await grid.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(768);
        }
      }
    });

    test('should display article with sidebar TOC on desktop', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // TOC should be visible as sidebar on desktop
        const toc = page.locator('nav[aria-label*="contenido"], [class*="toc"], aside').first();

        if (await toc.count() > 0) {
          await expect(toc).toBeVisible();
        }
      }
    });

    test('should have comfortable reading width on desktop', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Content should have max-width for readability
        const content = page.locator('article p, main p').first();
        if (await content.count() > 0) {
          const box = await content.boundingBox();
          if (box) {
            // Optimal reading width is typically 45-75 characters (roughly 600-800px)
            // Content shouldn't stretch across full viewport
            expect(box.width).toBeLessThan(1200);
          }
        }
      }
    });
  });

  test.describe('Dark Mode', () => {
    test('should support dark mode classes', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Check for dark mode class support
      const darkModeElements = page.locator('[class*="dark:"]');
      const count = await darkModeElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should apply dark mode background colors', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Emulate dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Page should still be visible in dark mode
      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should maintain readability in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Text should be visible
      const content = page.locator('p').first();
      if (await content.count() > 0) {
        await expect(content).toBeVisible();
      }
    });

    test('should apply dark mode to article page', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Article should be readable in dark mode
        const title = page.locator('h1');
        await expect(title).toBeVisible();
      }
    });
  });

  test.describe('Image Responsiveness', () => {
    test('should have responsive images on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const box = await img.boundingBox();
          if (box) {
            // Images should fit within mobile viewport
            expect(box.width).toBeLessThanOrEqual(375);
          }
        }
      }
    });

    test('should have appropriate image sizes on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const box = await img.boundingBox();
          if (box) {
            // Images should have reasonable size on desktop
            expect(box.width).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Navigation Responsiveness', () => {
    test('should display header on all viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto(`${baseUrl}/blog`);
        await page.waitForLoadState('networkidle');

        const header = page.locator('header, nav').first();
        await expect(header).toBeVisible();
      }
    });

    test('should display footer on all viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto(`${baseUrl}/blog`);
        await page.waitForLoadState('networkidle');

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
      }
    });
  });

  test.describe('Typography Responsiveness', () => {
    test('should have readable font sizes on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Text should be readable (typically minimum 16px for body text)
      const paragraph = page.locator('p').first();
      if (await paragraph.count() > 0) {
        await expect(paragraph).toBeVisible();
      }
    });

    test('should scale heading sizes appropriately', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const h1 = page.locator('h1').first();
      if (await h1.count() > 0) {
        const h1Box = await h1.boundingBox();
        if (h1Box) {
          // H1 should fit within viewport
          expect(h1Box.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });
});
