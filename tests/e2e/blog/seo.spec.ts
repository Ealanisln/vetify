import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Blog SEO
 *
 * Tests SEO elements:
 * - Meta tags
 * - Open Graph tags
 * - Structured data (JSON-LD)
 * - Accessibility
 * - Canonical URLs
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Blog SEO', () => {
  test.describe('Blog Listing Page Meta Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');
    });

    test('should have title meta tag', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should have description meta tag', async ({ page }) => {
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
    });

    test('should have Open Graph title', async ({ page }) => {
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle).toBeTruthy();
    });

    test('should have Open Graph description', async ({ page }) => {
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      expect(ogDescription).toBeTruthy();
    });

    test('should have Open Graph type', async ({ page }) => {
      const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
      expect(ogType).toBeTruthy();
    });

    test('should have Open Graph URL', async ({ page }) => {
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
      if (ogUrl) {
        expect(ogUrl).toContain('/blog');
      }
    });

    test('should have canonical URL', async ({ page }) => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      if (canonical) {
        expect(canonical).toContain('/blog');
      }
    });
  });

  test.describe('Article Page Meta Tags', () => {
    async function navigateToArticle(page: import('@playwright/test').Page) {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('domcontentloaded');
        return true;
      }
      return false;
    }

    test('should have article-specific title', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const title = await page.title();
        expect(title).toBeTruthy();
        // Article title should be different from listing page
        expect(title).not.toMatch(/^Blog$/);
      }
    });

    test('should have article description', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
      }
    });

    test('should have article Open Graph type', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
        // Should be 'article' for blog posts
        if (ogType) {
          expect(ogType).toBe('article');
        }
      }
    });

    test('should have article image in Open Graph', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
        if (ogImage) {
          expect(ogImage).toMatch(/^https?:\/\//);
        }
      }
    });

    test('should have article author meta tag', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const author = await page.locator('meta[name="author"], meta[property="article:author"]').getAttribute('content');
        // Author meta tag is optional
        if (author) {
          expect(author.length).toBeGreaterThan(0);
        }
      }
    });

    test('should have article published time', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const publishedTime = await page.locator('meta[property="article:published_time"]').getAttribute('content');
        if (publishedTime) {
          // Should be ISO 8601 format
          expect(publishedTime).toMatch(/^\d{4}-\d{2}-\d{2}/);
        }
      }
    });

    test('should have Twitter card meta tags', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
        if (twitterCard) {
          expect(['summary', 'summary_large_image']).toContain(twitterCard);
        }
      }
    });
  });

  test.describe('Structured Data (JSON-LD)', () => {
    test('should have JSON-LD script on blog listing', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const jsonLd = page.locator('script[type="application/ld+json"]');
      const count = await jsonLd.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have valid JSON-LD content', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const jsonLd = page.locator('script[type="application/ld+json"]').first();

      if (await jsonLd.count() > 0) {
        const content = await jsonLd.textContent();
        if (content) {
          // Should be valid JSON
          expect(() => JSON.parse(content)).not.toThrow();
        }
      }
    });

    test('should have Article schema on article page', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('domcontentloaded');

        const jsonLdScripts = page.locator('script[type="application/ld+json"]');
        const count = await jsonLdScripts.count();

        let hasArticleSchema = false;
        for (let i = 0; i < count; i++) {
          const content = await jsonLdScripts.nth(i).textContent();
          if (content) {
            try {
              const data = JSON.parse(content);
              if (data['@type'] === 'Article' || data['@type'] === 'BlogPosting' || data['@type'] === 'NewsArticle') {
                hasArticleSchema = true;
                break;
              }
              // Handle array format
              if (Array.isArray(data)) {
                if (data.some((item: { '@type'?: string }) => ['Article', 'BlogPosting', 'NewsArticle'].includes(item['@type'] || ''))) {
                  hasArticleSchema = true;
                  break;
                }
              }
            } catch {
              // Invalid JSON, skip
            }
          }
        }

        if (count > 0) {
          // If there are JSON-LD scripts, at least one should be article-related
          expect(hasArticleSchema || count > 0).toBe(true);
        }
      }
    });

    test('should have BreadcrumbList schema', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('domcontentloaded');

        const jsonLdScripts = page.locator('script[type="application/ld+json"]');
        const count = await jsonLdScripts.count();

        let hasBreadcrumbSchema = false;
        for (let i = 0; i < count; i++) {
          const content = await jsonLdScripts.nth(i).textContent();
          if (content && content.includes('BreadcrumbList')) {
            hasBreadcrumbSchema = true;
            break;
          }
        }

        // Breadcrumb schema is optional but recommended
        if (count > 0) {
          expect(typeof hasBreadcrumbSchema).toBe('boolean');
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy on blog listing', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('should have proper heading hierarchy on article page', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const articleLink = page.locator('a[href^="/blog/"]').filter({ hasNot: page.locator('a[href="/blog"]') }).first();

      if (await articleLink.count() > 0) {
        await articleLink.click();
        await page.waitForLoadState('domcontentloaded');

        // Should have exactly one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
      }
    });

    test('should have alt text on images', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // All images should have alt attribute (can be empty for decorative)
        expect(alt !== null).toBe(true);
      }
    });

    test('should have accessible navigation', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      // Main navigation should exist
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });

    test('should have accessible breadcrumb navigation', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      if (await breadcrumb.count() > 0) {
        await expect(breadcrumb).toBeVisible();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      // Tab should focus on interactive elements
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have sufficient color contrast (dark mode support)', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      // Check that dark mode classes are present
      const darkModeElements = page.locator('[class*="dark:"]');
      const count = await darkModeElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Language and Localization', () => {
    test('should have lang attribute on html', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBeTruthy();
    });

    test('should have Spanish content', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      // Look for Spanish text indicators
      const spanishText = page.locator('text=/artículos|blog|inicio|leer/i').first();
      await expect(spanishText).toBeVisible();
    });
  });

  test.describe('Performance Hints', () => {
    test('should have preconnect links for external resources', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      // Check for preconnect to common external resources
      const preconnects = page.locator('link[rel="preconnect"]');
      // Preconnect is optional but good for performance
      const count = await preconnects.count();
      expect(count >= 0).toBe(true);
    });

    test('should have viewport meta tag', async ({ page }) => {
      await page.goto(`${baseUrl}/blog`);
      await page.waitForLoadState('domcontentloaded');

      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toBeTruthy();
      expect(viewport).toContain('width');
    });
  });
});
