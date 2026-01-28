import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Landing Page
 *
 * Tests the redesigned landing page targeting small veterinary clinics:
 * - Hero section with empathetic messaging
 * - Problem section with pain points
 * - Solution section with simplified features
 * - Benefits section with qualitative benefits
 * - Audience section
 * - CTA sections
 * - Navigation and responsiveness
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Hero Section', () => {
    test('should display empathetic headline', async ({ page }) => {
      await expect(
        page.locator('h1:has-text("El sistema sencillo para")')
      ).toBeVisible();
      await expect(
        page.locator('h1:has-text("veterinarias pequeñas")')
      ).toBeVisible();
    });

    test('should display subheadline about Excel and WhatsApp', async ({ page }) => {
      await expect(
        page.locator('text=Gestiona pacientes, citas y recordatorios sin Excel')
      ).toBeVisible();
    });

    test('should have primary CTA button', async ({ page }) => {
      const ctaButton = page.locator('a[data-testid="signup-button"] button');
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toHaveText('Comienza tu prueba gratis');
    });

    test('should display trial info', async ({ page }) => {
      await expect(
        page.locator('text=30 días gratis, sin tarjeta de crédito')
      ).toBeVisible();
    });

    test('should display clarifying subtexto for small clinics', async ({ page }) => {
      await expect(
        page.locator('text=Pensado para clínicas veterinarias pequeñas')
      ).toBeVisible();
    });

    test('should display simplified badges', async ({ page }) => {
      await expect(page.locator('text=Fácil de usar')).toBeVisible();
      await expect(page.locator('text=Soporte incluido')).toBeVisible();
    });

    test('should display dashboard preview image', async ({ page }) => {
      const dashboardImage = page.locator('img[alt*="dashboard"]');
      await expect(dashboardImage.first()).toBeVisible();
    });

    test('CTA should link to registration', async ({ page }) => {
      const ctaLink = page.locator('a[data-testid="signup-button"]');
      await expect(ctaLink).toHaveAttribute('href', '/api/auth/register');
    });
  });

  test.describe('Problem Section', () => {
    test('should display problem section header', async ({ page }) => {
      await expect(
        page.locator('h2:has-text("Si tienes una veterinaria pequeña, probablemente")')
      ).toBeVisible();
    });

    test('should display all four pain points', async ({ page }) => {
      await expect(
        page.locator('text=Llevas pacientes y citas en Excel o libretas')
      ).toBeVisible();
      await expect(
        page.locator('text=Usas WhatsApp para todo')
      ).toBeVisible();
      await expect(
        page.locator('text=Olvidas citas o recordatorios importantes')
      ).toBeVisible();
      await expect(
        page.locator('text=Pierdes tiempo administrativo')
      ).toBeVisible();
    });

    test('should display empathetic closing message', async ({ page }) => {
      await expect(
        page.locator('text=Esto no es falta de ganas')
      ).toBeVisible();
    });
  });

  test.describe('Solution Section', () => {
    test('should display solution section header', async ({ page }) => {
      await expect(
        page.locator('h2:has-text("Todo en un solo lugar")')
      ).toBeVisible();
    });

    test('should display all six features', async ({ page }) => {
      await expect(page.locator('h3:has-text("Pacientes y mascotas")')).toBeVisible();
      await expect(page.locator('h3:has-text("Citas y agenda")')).toBeVisible();
      await expect(page.locator('h3:has-text("Recordatorios automáticos")')).toBeVisible();
      await expect(page.locator('h3:has-text("Historial clínico")')).toBeVisible();
      await expect(page.locator('h3:has-text("Inventario básico")')).toBeVisible();
      await expect(page.locator('h3:has-text("Acceso desde cualquier dispositivo")')).toBeVisible();
    });
  });

  test.describe('Benefits Section', () => {
    test('should display benefits section header', async ({ page }) => {
      await expect(
        page.locator('h2:has-text("Beneficios reales para tu clínica")')
      ).toBeVisible();
    });

    test('should display qualitative benefits (not stats)', async ({ page }) => {
      await expect(
        page.locator('h3:has-text("Menos administración, más atención")')
      ).toBeVisible();
      await expect(
        page.locator('h3:has-text("No más citas perdidas")')
      ).toBeVisible();
      await expect(
        page.locator('h3:has-text("Información siempre a la mano")')
      ).toBeVisible();
      await expect(
        page.locator('h3:has-text("Empieza fácil")')
      ).toBeVisible();
    });

    test('should NOT display percentage stats', async ({ page }) => {
      // Old stats should not be visible
      await expect(page.locator('text=-30%')).not.toBeVisible();
      await expect(page.locator('text=+20%')).not.toBeVisible();
      await expect(page.locator('text=95%')).not.toBeVisible();
      await expect(page.locator('text=+40%')).not.toBeVisible();
    });

    test('should display WhatsApp comparison', async ({ page }) => {
      await expect(
        page.locator('text=Si sabes usar WhatsApp, puedes usar Vetify')
      ).toBeVisible();
    });
  });

  test.describe('Audience Section', () => {
    test('should display audience section header', async ({ page }) => {
      await expect(
        page.locator('h2:has-text("¿Para quién es Vetify?")')
      ).toBeVisible();
    });

    test('should display all qualifying criteria', async ({ page }) => {
      await expect(
        page.locator('text=Tienes una veterinaria pequeña o familiar')
      ).toBeVisible();
      await expect(
        page.locator('text=Atiendes tú mismo o con 1-2 doctores más')
      ).toBeVisible();
      await expect(
        page.locator('text=No quieres sistemas complicados ni caros')
      ).toBeVisible();
      await expect(
        page.locator('text=Buscas algo práctico que realmente uses todos los días')
      ).toBeVisible();
    });

    test('should display closing statement', async ({ page }) => {
      await expect(
        page.locator('text=No es un sistema corporativo')
      ).toBeVisible();
    });
  });

  test.describe('CTA Section', () => {
    test('should display CTA section header', async ({ page }) => {
      await expect(
        page.locator('h2:has-text("Prueba gratis, sin compromiso")')
      ).toBeVisible();
    });

    test('should display trial info', async ({ page }) => {
      await expect(
        page.locator('text=30 días para probarlo. Sin tarjeta de crédito.')
      ).toBeVisible();
    });

    test('should have single CTA button (no "Agendar demo")', async ({ page }) => {
      // Should have "Empieza tu prueba gratis"
      await expect(
        page.locator('button:has-text("Empieza tu prueba gratis")')
      ).toBeVisible();

      // Should NOT have "Agendar demo"
      await expect(
        page.locator('button:has-text("Agendar demo")')
      ).not.toBeVisible();
    });
  });

  test.describe('Closing Section', () => {
    test('should display feedback message', async ({ page }) => {
      await expect(
        page.locator('text=Vetify está en crecimiento y se construye con feedback real')
      ).toBeVisible();
    });

    test('should display target audience message', async ({ page }) => {
      await expect(
        page.locator('text=Si tienes una clínica pequeña y buscas algo sencillo')
      ).toBeVisible();
    });

    test('should have "Crear cuenta gratis" button', async ({ page }) => {
      await expect(
        page.locator('button:has-text("Crear cuenta gratis")')
      ).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have navigation bar', async ({ page }) => {
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('should have logo link to home', async ({ page }) => {
      const logoLink = page.locator('nav a[href="/"]').first();
      await expect(logoLink).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(baseUrl);

      // Hero should be visible
      await expect(
        page.locator('h1:has-text("El sistema sencillo")')
      ).toBeVisible();

      // CTA should be visible
      await expect(
        page.locator('button:has-text("Comienza tu prueba gratis")')
      ).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(baseUrl);

      await expect(
        page.locator('h1:has-text("El sistema sencillo")')
      ).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should support dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(baseUrl);

      // Page should render in dark mode
      await expect(page.locator('body')).toBeVisible();

      // Hero should still be visible
      await expect(
        page.locator('h1:has-text("El sistema sencillo")')
      ).toBeVisible();
    });
  });

  test.describe('SEO', () => {
    test('should have proper title', async ({ page }) => {
      const title = await page.title();
      expect(title).toContain('Vetify');
    });

    test('should have meta description', async ({ page }) => {
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
    });
  });

  test.describe('Section Order', () => {
    test('should have correct section order', async ({ page }) => {
      // Get all section headings in order
      const headings = await page.locator('h2').allTextContents();

      // Verify the new section order
      const expectedSections = [
        'Si tienes una veterinaria pequeña',
        'Todo en un solo lugar',
        'Beneficios reales',
        '¿Para quién es Vetify?',
      ];

      expectedSections.forEach((section) => {
        const found = headings.some((h) => h.includes(section));
        expect(found).toBe(true);
      });
    });
  });
});
