import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Blog Navigation
 *
 * Tests the blog navigation functionality:
 * - Blog listing page structure
 * - Navigation between blog pages
 * - Breadcrumb functionality
 * - Back navigation
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Blog Navigation', () => {
  test.describe('Blog Listing Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');
    });

    test('should display page title', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      await expect(title).toContainText(/blog|artículos/i);
    });

    test('should display page description', async ({ page }) => {
      const description = page.locator('text=/consejos|salud|mascotas|bienestar/i').first();
      await expect(description).toBeVisible();
    });

    test('should have navigation header', async ({ page }) => {
      const header = page.locator('header, nav').first();
      await expect(header).toBeVisible();
    });

    test('should have footer', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should display breadcrumbs', async ({ page }) => {
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      const homeLink = breadcrumb.locator('a[href="/"]');
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe('Blog to Article Navigation', () => {
    test('should navigate from blog listing to article', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Find first article link
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        const href = await articleLink.getAttribute('href');
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Should be on article page
        expect(page.url()).toContain('/blog/');
        expect(page.url()).not.toBe(`${baseUrl}/blog`);

        // Article should have heading
        const articleTitle = page.locator('h1');
        await expect(articleTitle).toBeVisible();
      }
    });

    test('should navigate back from article to blog listing', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Navigate to first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Find breadcrumb link back to blog
        const blogBreadcrumb = page.locator('nav[aria-label="Breadcrumb"] a[href="/blog"]');
        if (await blogBreadcrumb.count() > 0) {
          await blogBreadcrumb.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toBe(`${baseUrl}/blog`);
        }
      }
    });
  });

  test.describe('Article to Category Navigation', () => {
    test('should navigate from article to category page', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Find first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Find category link
        const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

        if (await categoryLink.count() > 0) {
          await categoryLink.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/blog/categoria/');

          const categoryTitle = page.locator('h1');
          await expect(categoryTitle).toBeVisible();
        }
      }
    });
  });

  test.describe('Article to Tag Navigation', () => {
    test('should navigate from article to tag page', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Find first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Find tag link
        const tagLink = page.locator('a[href^="/blog/etiqueta/"]').first();

        if (await tagLink.count() > 0) {
          await tagLink.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/blog/etiqueta/');

          const tagTitle = page.locator('h1');
          await expect(tagTitle).toBeVisible();
        }
      }
    });
  });

  test.describe('Article to Author Navigation', () => {
    test('should navigate from article to author page', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Find first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Find author link
        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/blog/autor/');

          const authorTitle = page.locator('h1');
          await expect(authorTitle).toBeVisible();
        }
      }
    });
  });

  test.describe('Breadcrumb Functionality', () => {
    test('should display correct breadcrumb trail on article page', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Navigate to first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
        await expect(breadcrumb).toBeVisible();

        // Should have Inicio link
        const homeLink = breadcrumb.locator('a[href="/"]');
        await expect(homeLink).toBeVisible();

        // Should have Blog link
        const blogLink = breadcrumb.locator('a[href="/blog"]');
        await expect(blogLink).toBeVisible();
      }
    });

    test('should display correct breadcrumb trail on category page', async ({ page }) => {
      // Try to navigate to a category page via category link
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');

        const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
        await expect(breadcrumb).toBeVisible();

        const blogLink = breadcrumb.locator('a[href="/blog"]');
        await expect(blogLink).toBeVisible();
      }
    });

    test('should navigate to home from breadcrumb', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      const homeLink = breadcrumb.locator('a[href="/"]');

      if (await homeLink.count() > 0) {
        await homeLink.click();
        await page.waitForURL(`${baseUrl}/`);
        expect(page.url()).toBe(`${baseUrl}/`);
      }
    });
  });

  test.describe('Category Filter Navigation', () => {
    test('should navigate to category when clicking filter button', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Find category filter button (if present)
      const categoryButton = page.locator('a[href^="/blog/categoria/"], button').filter({ hasText: /salud|nutrición|cuidado/i }).first();

      if (await categoryButton.count() > 0) {
        const href = await categoryButton.getAttribute('href');
        if (href) {
          await categoryButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/blog/categoria/');
        }
      }
    });
  });
});
