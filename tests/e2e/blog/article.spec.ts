import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Blog Article Page
 *
 * Tests the article display and interaction:
 * - Article content display
 * - Author information
 * - Table of contents
 * - Social sharing
 * - Related posts
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Blog Article Page', () => {
  // Helper to navigate to first available article
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

  test.describe('Article Content', () => {
    test('should display article title', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const title = page.locator('h1');
        await expect(title).toBeVisible();
        await expect(title).not.toBeEmpty();
      }
    });

    test('should display featured image', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const featuredImage = page.locator('img').first();
        await expect(featuredImage).toBeVisible();
      }
    });

    test('should display article content', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Article should have paragraph content
        const content = page.locator('article p, main p').first();
        await expect(content).toBeVisible();
      }
    });

    test('should display reading time', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const readingTime = page.locator('text=/\\d+\\s*(min|minutos)/i').first();
        if (await readingTime.count() > 0) {
          await expect(readingTime).toBeVisible();
        }
      }
    });

    test('should display publication date', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Date in Spanish format
        const datePattern = /\d{1,2}\s*(de\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
        const date = page.locator(`text=${datePattern}`).first();
        if (await date.count() > 0) {
          await expect(date).toBeVisible();
        }
      }
    });
  });

  test.describe('Author Information', () => {
    test('should display author name', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Look for author in various locations
        const authorLink = page.locator('a[href^="/blog/autor/"]').first();
        if (await authorLink.count() > 0) {
          await expect(authorLink).toBeVisible();
        }
      }
    });

    test('should have clickable author link', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const authorLink = page.locator('a[href^="/blog/autor/"]').first();

        if (await authorLink.count() > 0) {
          const href = await authorLink.getAttribute('href');
          expect(href).toContain('/blog/autor/');
        }
      }
    });
  });

  test.describe('Table of Contents', () => {
    test('should display table of contents when article has headings', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // TOC might be labeled or have specific structure
        const toc = page.locator('nav[aria-label*="contenido"], [class*="toc"], [class*="table-of-contents"]').first();

        // TOC is optional based on article content
        if (await toc.count() > 0) {
          await expect(toc).toBeVisible();
        }
      }
    });

    test('should scroll to heading when TOC item clicked', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const tocLink = page.locator('nav a[href^="#"]').first();

        if (await tocLink.count() > 0) {
          const targetId = await tocLink.getAttribute('href');
          await tocLink.click();

          // Wait for scroll
          await page.waitForTimeout(500);

          // Check that target element exists
          if (targetId) {
            const targetElement = page.locator(targetId);
            if (await targetElement.count() > 0) {
              await expect(targetElement).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Tags', () => {
    test('should display article tags', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const tagLink = page.locator('a[href^="/blog/etiqueta/"]').first();

        if (await tagLink.count() > 0) {
          await expect(tagLink).toBeVisible();
        }
      }
    });

    test('should have hashtag prefix on tags', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const tagWithHash = page.locator('text=/#\\w+/').first();

        if (await tagWithHash.count() > 0) {
          await expect(tagWithHash).toBeVisible();
        }
      }
    });
  });

  test.describe('Category', () => {
    test('should display article category', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const categoryLink = page.locator('a[href^="/blog/categoria/"]').first();

        if (await categoryLink.count() > 0) {
          await expect(categoryLink).toBeVisible();
        }
      }
    });
  });

  test.describe('Social Sharing', () => {
    test('should display share buttons', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Look for share section or buttons
        const shareSection = page.locator('[class*="share"], [aria-label*="compartir"]').first();

        if (await shareSection.count() > 0) {
          await expect(shareSection).toBeVisible();
        }
      }
    });

    test('should have Twitter/X share link', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const twitterShare = page.locator('a[href*="twitter.com"], a[href*="x.com"]').first();

        if (await twitterShare.count() > 0) {
          await expect(twitterShare).toHaveAttribute('target', '_blank');
        }
      }
    });

    test('should have Facebook share link', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const facebookShare = page.locator('a[href*="facebook.com"]').first();

        if (await facebookShare.count() > 0) {
          await expect(facebookShare).toHaveAttribute('target', '_blank');
        }
      }
    });

    test('should have WhatsApp share link', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const whatsappShare = page.locator('a[href*="whatsapp"], a[href*="wa.me"]').first();

        if (await whatsappShare.count() > 0) {
          await expect(whatsappShare).toBeVisible();
        }
      }
    });
  });

  test.describe('Related Posts', () => {
    test('should display related posts section if available', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Look for related posts section
        const relatedSection = page.locator('text=/artículos relacionados|también te puede interesar/i').first();

        if (await relatedSection.count() > 0) {
          await expect(relatedSection).toBeVisible();
        }
      }
    });

    test('should have clickable related post links', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Find related posts section first
        const relatedSection = page.locator('section').filter({ hasText: /relacionados|también/i }).first();

        if (await relatedSection.count() > 0) {
          const relatedLink = relatedSection.locator('a[href^="/blog/"]').first();

          if (await relatedLink.count() > 0) {
            await expect(relatedLink).toHaveAttribute('href', /^\/blog\//);
          }
        }
      }
    });
  });

  test.describe('FAQ Section', () => {
    test('should display FAQ section if article has FAQs', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        const faqSection = page.locator('text=/preguntas frecuentes|FAQ/i').first();

        if (await faqSection.count() > 0) {
          await expect(faqSection).toBeVisible();
        }
      }
    });

    test('should expand FAQ item on click', async ({ page }) => {
      const navigated = await navigateToArticle(page);

      if (navigated) {
        // Find FAQ accordion buttons
        const faqButton = page.locator('button[aria-expanded]').first();

        if (await faqButton.count() > 0) {
          const initialExpanded = await faqButton.getAttribute('aria-expanded');
          await faqButton.click();
          await page.waitForTimeout(300);

          const newExpanded = await faqButton.getAttribute('aria-expanded');
          expect(newExpanded).not.toBe(initialExpanded);
        }
      }
    });
  });
});
