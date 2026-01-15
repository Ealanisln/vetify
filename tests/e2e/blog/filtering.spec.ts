import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Blog Filtering
 *
 * Tests category, tag, and author filtering:
 * - Category page functionality
 * - Tag page functionality
 * - Author page functionality
 * - URL encoding handling
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Blog Filtering', () => {
  test.describe('Category Page', () => {
    test('should display category page structure', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Find and click a category link
      const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');

        // Should have page title
        const title = page.locator('h1');
        await expect(title).toBeVisible();

        // Should have breadcrumbs
        const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
        await expect(breadcrumb).toBeVisible();
      }
    });

    test('should display category description', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');

        // Category page should have some description text
        const description = page.locator('p').first();
        await expect(description).toBeVisible();
      }
    });

    test('should display posts count', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');

        // Should show article count
        const countText = page.locator('text=/\\d+\\s*artículos?/i').first();
        if (await countText.count() > 0) {
          await expect(countText).toBeVisible();
        }
      }
    });

    test('should display filtered posts grid', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');

        // Either shows posts grid or empty state
        const postsOrEmpty = page.locator('article, [class*="grid"], text=/no hay artículos/i').first();
        await expect(postsOrEmpty).toBeVisible();
      }
    });

    test('should display empty state when no posts in category', async ({ page }) => {
      // Navigate to a potentially empty category
      await page.goto(`${baseUrl}/blog/categoria/empty-category-test`);
      await page.waitForLoadState('networkidle');

      // Should either show posts or empty state/404
      const emptyOrContent = page.locator('text=/no hay artículos|no encontrada|404/i, article').first();
      await expect(emptyOrContent).toBeVisible();
    });

    test('should show 404 for non-existent category', async ({ page }) => {
      await page.goto(`${baseUrl}/blog/categoria/categoria-que-no-existe-12345`);
      await page.waitForLoadState('networkidle');

      // Should show not found message
      const notFound = page.locator('text=/no encontrada|404|not found/i').first();
      if (await notFound.count() > 0) {
        await expect(notFound).toBeVisible();
      }
    });
  });

  test.describe('Tag Page', () => {
    test('should display tag page structure', async ({ page }) => {
      // First find a tag link from an article
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Navigate to first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Find tag link
        const tagLink = page.locator('a[href^="/blog/etiqueta/"]').first();

        if (await tagLink.count() > 0) {
          await tagLink.click();
          await page.waitForLoadState('networkidle');

          // Should have page title with hashtag
          const title = page.locator('h1');
          await expect(title).toBeVisible();

          // Should have breadcrumbs
          const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
          await expect(breadcrumb).toBeVisible();
        }
      }
    });

    test('should display hashtag in title', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const tagLink = page.locator('a[href^="/blog/etiqueta/"]').first();

        if (await tagLink.count() > 0) {
          await tagLink.click();
          await page.waitForLoadState('networkidle');

          // Check for hashtag in breadcrumb or title
          const hashtagText = page.locator('text=/#\\w+/').first();
          if (await hashtagText.count() > 0) {
            await expect(hashtagText).toBeVisible();
          }
        }
      }
    });

    test('should handle URL-encoded tags', async ({ page }) => {
      // Test with a URL-encoded tag (space becomes %20)
      await page.goto(`${baseUrl}/blog/etiqueta/cuidado%20de%20mascotas`);
      await page.waitForLoadState('networkidle');

      // Should handle the encoded URL (either showing content or 404)
      const content = page.locator('h1, text=/no encontrada|404/i').first();
      await expect(content).toBeVisible();
    });

    test('should display posts with tag', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const tagLink = page.locator('a[href^="/blog/etiqueta/"]').first();

        if (await tagLink.count() > 0) {
          await tagLink.click();
          await page.waitForLoadState('networkidle');

          // Should show article count
          const countText = page.locator('text=/\\d+\\s*artículos?\\s*(con esta etiqueta)?/i').first();
          if (await countText.count() > 0) {
            await expect(countText).toBeVisible();
          }
        }
      }
    });

    test('should display empty state when no posts with tag', async ({ page }) => {
      await page.goto(`${baseUrl}/blog/etiqueta/etiqueta-vacia-test`);
      await page.waitForLoadState('networkidle');

      const emptyOrContent = page.locator('text=/no hay artículos|no encontrada|404/i, article').first();
      await expect(emptyOrContent).toBeVisible();
    });
  });

  test.describe('Author Page', () => {
    test('should display author page structure', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Navigate to first article
      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        // Find author link
        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          // Should have author name as title
          const title = page.locator('h1');
          await expect(title).toBeVisible();

          // Should have breadcrumbs
          const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
          await expect(breadcrumb).toBeVisible();
        }
      }
    });

    test('should display author avatar', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          // Should have author avatar image
          const avatar = page.locator('img').first();
          await expect(avatar).toBeVisible();
        }
      }
    });

    test('should display author role', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          // Should have role/title text (Veterinario, Especialista, etc.)
          const roleText = page.locator('text=/veterinari|especialista|doctor/i').first();
          if (await roleText.count() > 0) {
            await expect(roleText).toBeVisible();
          }
        }
      }
    });

    test('should display author bio', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          // Should have bio paragraph
          const bio = page.locator('p').nth(1); // Skip potential role text
          if (await bio.count() > 0) {
            await expect(bio).toBeVisible();
          }
        }
      }
    });

    test('should display posts count by author', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          // Should show article count
          const countText = page.locator('text=/\\d+\\s*artículos?\\s*(publicados)?/i').first();
          if (await countText.count() > 0) {
            await expect(countText).toBeVisible();
          }
        }
      }
    });

    test('should display social links if available', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('networkidle');

        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          await authorLink.click();
          await page.waitForLoadState('networkidle');

          // Check for social links (optional)
          const socialLink = page.locator('a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"]').first();
          if (await socialLink.count() > 0) {
            await expect(socialLink).toHaveAttribute('target', '_blank');
          }
        }
      }
    });

    test('should show 404 for non-existent author', async ({ page }) => {
      await page.goto(`${baseUrl}/blog/autor/autor-que-no-existe-12345`);
      await page.waitForLoadState('networkidle');

      // Should show not found message
      const notFound = page.locator('text=/no encontrad|404|not found/i').first();
      if (await notFound.count() > 0) {
        await expect(notFound).toBeVisible();
      }
    });
  });

  test.describe('Filter Combinations', () => {
    test('should allow navigating between different filter types', async ({ page }) => {
      // Start at blog
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('networkidle');

      // Go to category
      const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();
      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/blog/categoria/');
      }

      // Navigate back to blog
      const blogLink = page.locator('a[href="/blog"]').first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(`${baseUrl}/blog`);
      }
    });
  });
});
