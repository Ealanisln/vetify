import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  AUTH_STATE_PATH,
  CORPORATIVO_AUTH_STATE_PATH,
  SEEDED_CORPORATIVO_LOCATION_NAME,
  VET_AUTH_STATE_PATH,
} from '../support/constants';

/**
 * E2E Tests for API Key Management
 *
 * This test suite verifies the API Key Management feature:
 * - Create API Key flow
 * - Edit API Key
 * - Delete API Key
 * - Toggle API Key active state
 * - Feature gating for non-CORPORATIVO users
 * - Search and filter
 *
 * Runs as SEEDED_CORPORATIVO_OWNER (CORPORATIVO plan, API access), except the
 * gating and role tests, which use the PROFESIONAL owner and the veterinarian.
 * All are seeded by scripts/seed-ci-test-data.ts and logged in by
 * tests/auth.setup.ts. Skipped unless TEST_AUTH_ENABLED=true.
 *
 * Each test creates the keys it needs with a unique name and only looks at
 * those, so the tests do not depend on each other or on run order.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

const API_TAB = '/dashboard/settings?tab=api';

async function openApiTab(page: Page) {
  await page.goto(API_TAB);
  await expect(page.getByRole('button', { name: 'Nueva Clave', exact: true })).toBeVisible();
}

async function openCreateModal(page: Page) {
  await page.getByRole('button', { name: 'Nueva Clave', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nueva Clave de API' })).toBeVisible();
}

/** The card of the key named `name` (ApiKeyCard has no test id). */
function keyCard(page: Page, name: string): Locator {
  return page
    .locator('div.rounded-lg')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Eliminar' }) })
    .last();
}

/** Creates a key through the UI and closes the one-time display. */
async function createKey(page: Page, prefix: string): Promise<string> {
  const name = `${prefix} ${Date.now()}`;
  await openCreateModal(page);
  await page.fill('#api-key-name', name);
  await page.getByRole('button', { name: 'Crear Clave' }).click();
  await expect(page.getByRole('heading', { name: 'Clave de API Creada' })).toBeVisible();
  await page.getByRole('button', { name: /Entendido/ }).click();
  await expect(keyCard(page, name)).toBeVisible();
  return name;
}

test.describe('API Key Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');
  test.use({ storageState: CORPORATIVO_AUTH_STATE_PATH });

  test.describe('Feature Access', () => {
    test('should show API tab in settings for CORPORATIVO users', async ({ page }) => {
      await page.goto(API_TAB);

      await expect(
        page.getByText('Las claves de API permiten que aplicaciones externas').first()
      ).toBeVisible();
      await expect(page.getByText('Función Premium')).not.toBeVisible();
    });
  });

  test.describe('Create API Key Flow', () => {
    test.beforeEach(async ({ page }) => {
      await openApiTab(page);
    });

    test('should open create modal when clicking "Nueva Clave" button', async ({ page }) => {
      await openCreateModal(page);
      await expect(page.locator('#api-key-name')).toBeVisible();
    });

    test('should require a name before creating', async ({ page }) => {
      await openCreateModal(page);

      await page.getByRole('button', { name: 'Crear Clave' }).click();

      // The name input is `required`, so the browser blocks the submit
      const nameInput = page.locator('#api-key-name');
      expect(await nameInput.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
      await expect(page.getByRole('heading', { name: 'Nueva Clave de API' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Clave de API Creada' })).not.toBeVisible();
    });

    test('should create API key and show one-time display', async ({ page }) => {
      await openCreateModal(page);
      await page.fill('#api-key-name', `E2E Test Key ${Date.now()}`);
      await page.getByRole('button', { name: 'Crear Clave' }).click();

      await expect(page.getByRole('heading', { name: 'Clave de API Creada' })).toBeVisible();
      // The full key, shown only once
      await expect(page.locator('code', { hasText: /^vfy_/ }).first()).toBeVisible();
      await expect(page.getByText('Esta es la única vez que verás la clave completa')).toBeVisible();
    });

    test('should copy key to clipboard', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await openCreateModal(page);
      await page.fill('#api-key-name', `Copy Test Key ${Date.now()}`);
      await page.getByRole('button', { name: 'Crear Clave' }).click();
      await expect(page.getByRole('heading', { name: 'Clave de API Creada' })).toBeVisible();

      await page.locator('button[title="Copiar clave"]').click();

      await expect(page.getByText('Clave copiada al portapapeles')).toBeVisible();
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toMatch(/^vfy_/);
    });

    test('should close modal and show key in list', async ({ page }) => {
      const name = await createKey(page, 'List Test Key');

      await expect(page.getByRole('heading', { name: 'Clave de API Creada' })).not.toBeVisible();
      await expect(keyCard(page, name).getByText('Activa', { exact: true })).toBeVisible();
    });

    test('should select different scope bundles', async ({ page }) => {
      await openCreateModal(page);

      await page.getByRole('button', { name: /Solo lectura/ }).click();

      for (const bundle of ['Acceso completo', 'Solo citas', 'Solo inventario', 'Personalizado']) {
        await expect(page.getByRole('button', { name: new RegExp(`^${bundle}`) })).toBeVisible();
      }
    });

    test('should show custom scopes when selecting Personalizado', async ({ page }) => {
      await openCreateModal(page);

      await page.getByRole('button', { name: /Solo lectura/ }).click();
      await page.getByRole('button', { name: /^Personalizado/ }).click();

      const intro = page.getByText('Selecciona los permisos específicos para esta clave de API:');
      await expect(intro).toBeVisible();
      const customScopes = page.locator('div').filter({ has: intro }).last();
      for (const group of ['Mascotas', 'Citas', 'Clientes']) {
        await expect(customScopes.getByText(group, { exact: true })).toBeVisible();
      }
    });
  });

  test.describe('Edit API Key', () => {
    test('should rename a key from the edit prompt', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Edit Test Key');
      const newName = `Renamed Key ${Date.now()}`;

      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.defaultValue()).toBe(name);
        await dialog.accept(newName);
      });
      await keyCard(page, name).getByRole('button', { name: 'Editar' }).click();

      await expect(keyCard(page, newName)).toBeVisible();
      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();
    });
  });

  test.describe('Delete API Key', () => {
    test('should keep the key when the confirmation is dismissed', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Keep Test Key');

      const dialogShown = new Promise<void>((resolve) => {
        page.once('dialog', async (dialog) => {
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toContain('Estás seguro');
          await dialog.dismiss();
          resolve();
        });
      });
      await keyCard(page, name).getByRole('button', { name: 'Eliminar' }).click();
      await dialogShown;

      await expect(keyCard(page, name)).toBeVisible();
    });

    test('should delete key when confirmed', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Delete Test Key');

      page.once('dialog', (dialog) => dialog.accept());
      await keyCard(page, name).getByRole('button', { name: 'Eliminar' }).click();

      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();
      // Still gone after a reload, so it was deleted on the server
      await openApiTab(page);
      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();
    });
  });

  test.describe('Toggle API Key Active State', () => {
    test('should deactivate and reactivate a key', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Toggle Test Key');
      const card = keyCard(page, name);

      await card.getByRole('button', { name: 'Desactivar' }).click();
      await expect(card.getByText('Inactiva', { exact: true })).toBeVisible();

      await card.getByRole('button', { name: 'Activar' }).click();
      await expect(card.getByText('Activa', { exact: true })).toBeVisible();
    });
  });

  test.describe('Search and Filter', () => {
    test('should filter keys by search term', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Search Test Key');
      const searchInput = page.getByPlaceholder('Buscar por nombre o prefijo...');

      await searchInput.fill('nonexistent-key-name');
      await expect(page.getByText('Sin resultados')).toBeVisible();

      await searchInput.fill(name);
      await expect(keyCard(page, name)).toBeVisible();
      await expect(page.getByText('Sin resultados')).not.toBeVisible();
    });

    test('should filter keys by status', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Status Test Key');
      await keyCard(page, name).getByRole('button', { name: 'Desactivar' }).click();
      await expect(keyCard(page, name).getByText('Inactiva', { exact: true })).toBeVisible();
      const statusSelect = page.locator('select').filter({ has: page.locator('option[value="inactive"]') });

      await statusSelect.selectOption('active');
      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();

      await statusSelect.selectOption('inactive');
      await expect(keyCard(page, name)).toBeVisible();
    });

    test('should clear filters and show all keys', async ({ page }) => {
      await openApiTab(page);
      const name = await createKey(page, 'Clear Filter Key');
      const searchInput = page.getByPlaceholder('Buscar por nombre o prefijo...');
      const statusSelect = page.locator('select').filter({ has: page.locator('option[value="inactive"]') });

      await statusSelect.selectOption('inactive');
      await searchInput.fill('nonexistent-key-name');
      await expect(page.getByText('Sin resultados')).toBeVisible();

      await statusSelect.selectOption('all');
      await searchInput.fill('');
      await expect(keyCard(page, name)).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no keys exist', async ({ page }) => {
      await openApiTab(page);

      // Delete every key of the clinic, then the empty state must show
      page.on('dialog', (dialog) => dialog.accept());
      const deleteButtons = page.getByRole('button', { name: 'Eliminar' });
      while ((await deleteButtons.count()) > 0) {
        const remaining = await deleteButtons.count();
        await deleteButtons.first().click();
        await expect(deleteButtons).toHaveCount(remaining - 1);
      }

      await expect(page.getByRole('heading', { name: 'No hay claves de API' })).toBeVisible();
      await page.getByRole('button', { name: 'Crear Primera Clave' }).click();
      await expect(page.getByRole('heading', { name: 'Nueva Clave de API' })).toBeVisible();
    });
  });

  test.describe('Location Selection', () => {
    // FIXME(app): the location select never renders. ApiKeyManagement calls
    // setLocations(data) with the whole /api/locations body
    // ({ success, data, pagination }) instead of data.data, so
    // locations.length is undefined. The CORPORATIVO clinic has a seeded location.
    test.fixme('should show location dropdown in create modal', async ({ page }) => {
      await openApiTab(page);
      await openCreateModal(page);

      const locationSelect = page.locator('#api-key-location');
      await expect(locationSelect).toBeVisible();
      await expect(locationSelect.locator('option')).toHaveText([
        'Todas las ubicaciones (Global)',
        SEEDED_CORPORATIVO_LOCATION_NAME,
      ]);
    });
  });

  test.describe('Advanced Options', () => {
    test('should show advanced options section', async ({ page }) => {
      await openApiTab(page);
      await openCreateModal(page);

      await expect(page.getByText('Opciones avanzadas')).toBeVisible();
      await expect(page.getByText('Límite de peticiones por hora')).not.toBeVisible();
    });

    test('should expand advanced options on click', async ({ page }) => {
      await openApiTab(page);
      await openCreateModal(page);

      await page.getByText('Opciones avanzadas').click();

      await expect(page.getByText('Límite de peticiones por hora')).toBeVisible();
      await expect(page.getByText('Fecha de expiración')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await openApiTab(page);

      // The layout also renders a hidden mobile header
      await expect(
        page.getByRole('heading', { level: 1, name: 'Configuración' }).filter({ visible: true }).first()
      ).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await openApiTab(page);

      await page.keyboard.press('Tab');

      await expect(page.locator(':focus')).toBeVisible();
    });
  });
});

test.describe('API Key Feature Gate', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');
  // The CI clinic is on PROFESIONAL, which has no API access
  test.use({ storageState: AUTH_STATE_PATH });

  test('should show upgrade prompt for non-CORPORATIVO users', async ({ page }) => {
    await page.goto(API_TAB);

    await expect(page.getByText('Función Premium')).toBeVisible();
    await expect(page.getByText('El acceso a la API requiere el plan Corporativo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nueva Clave', exact: true })).not.toBeVisible();
  });
});

test.describe('API Key Role-Based Access', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');
  test.use({ storageState: VET_AUTH_STATE_PATH });

  test('should only allow MANAGER/ADMINISTRATOR to access API settings', async ({ page }) => {
    await page.goto(API_TAB);

    await expect(page).toHaveURL(/\/dashboard\?error=access_denied/);
    await expect(page.getByRole('button', { name: 'Nueva Clave', exact: true })).not.toBeVisible();
  });
});
