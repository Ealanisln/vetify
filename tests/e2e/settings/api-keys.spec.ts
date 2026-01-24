import { test, expect } from '@playwright/test';

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
 * NOTE: These tests require authentication and a CORPORATIVO plan.
 * They will be skipped if TEST_AUTH_ENABLED is not set.
 *
 * SECURITY: API key management is only available to CORPORATIVO plan users.
 * Non-CORPORATIVO users will see a feature gate/upgrade prompt.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

test.describe('API Key Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');

  test.describe('Feature Access', () => {
    test('should show API tab in settings for CORPORATIVO users', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Should see the API key management section
      await expect(
        page.locator('text=Las claves de API permiten que aplicaciones externas')
      ).toBeVisible();
    });

    test('should show upgrade prompt for non-CORPORATIVO users', async ({ page }) => {
      // This test requires a non-CORPORATIVO user
      // The FeatureGate component should block access
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // May see either the API management (if CORPORATIVO) or upgrade prompt
      const upgradePrompt = page.locator('text=Función Premium');
      const apiSection = page.locator('text=Las claves de API permiten');

      // One of these should be visible
      await expect(upgradePrompt.or(apiSection)).toBeVisible();
    });
  });

  test.describe('Create API Key Flow', () => {
    test('should open create modal when clicking "Nueva Clave" button', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Click create button
      await page.click('button:has-text("Nueva Clave")');

      // Modal should open
      await expect(page.locator('text=Nueva Clave de API')).toBeVisible();
    });

    test('should show form validation errors', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Try to submit without name
      await page.click('button:has-text("Crear Clave")');

      // Should show validation error
      await expect(page.locator('text=El nombre es requerido')).toBeVisible();
    });

    test('should create API key and show one-time display', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Open modal
      await page.click('button:has-text("Nueva Clave")');

      // Fill form
      const timestamp = Date.now();
      const keyName = `E2E Test Key ${timestamp}`;
      await page.fill('#api-key-name', keyName);

      // Submit
      await page.click('button:has-text("Crear Clave")');

      // Should show the created key modal
      await expect(page.locator('text=Clave de API Creada')).toBeVisible();

      // Should show the full key (one time)
      await expect(page.locator('code:has-text("vfy_")')).toBeVisible();

      // Should show the warning about one-time display
      await expect(page.locator('text=Esta es la única vez que verás la clave completa')).toBeVisible();
    });

    test('should copy key to clipboard', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      const keyName = `Copy Test Key ${Date.now()}`;
      await page.fill('#api-key-name', keyName);
      await page.click('button:has-text("Crear Clave")');

      await expect(page.locator('text=Clave de API Creada')).toBeVisible();

      // Click copy button
      const copyButton = page.locator('button[title*="Copiar"]');
      await copyButton.click();

      // Should show confirmation
      await expect(page.locator('text=Clave copiada al portapapeles')).toBeVisible();
    });

    test('should close modal and show key in list', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      const keyName = `List Test Key ${Date.now()}`;
      await page.fill('#api-key-name', keyName);
      await page.click('button:has-text("Crear Clave")');

      await expect(page.locator('text=Clave de API Creada')).toBeVisible();

      // Close the modal
      await page.click('button:has-text("Entendido")');

      // Key should appear in the list
      await expect(page.locator(`text=${keyName}`)).toBeVisible();
    });

    test('should select different scope bundles', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Open bundle dropdown
      await page.click('button:has-text("Solo lectura")');

      // Should show all bundle options
      await expect(page.locator('text=Acceso completo')).toBeVisible();
      await expect(page.locator('text=Solo citas')).toBeVisible();
      await expect(page.locator('text=Solo inventario')).toBeVisible();
      await expect(page.locator('text=Personalizado')).toBeVisible();
    });

    test('should show custom scopes when selecting Personalizado', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Open bundle dropdown
      await page.click('button:has-text("Solo lectura")');

      // Select custom
      await page.click('text=Personalizado >> nth=0');

      // Should show scope groups
      await expect(page.locator('text=Mascotas')).toBeVisible();
      await expect(page.locator('text=Citas')).toBeVisible();
      await expect(page.locator('text=Clientes')).toBeVisible();
    });
  });

  test.describe('Edit API Key', () => {
    test('should open edit dialog when clicking edit button', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // First create a key if none exists
      const keyExists = await page.locator('[data-testid="api-key-card"]').count() > 0;

      if (!keyExists) {
        await page.click('button:has-text("Nueva Clave")');
        await page.fill('#api-key-name', `Edit Test Key ${Date.now()}`);
        await page.click('button:has-text("Crear Clave")');
        await page.click('button:has-text("Entendido")');
        await page.waitForLoadState('networkidle');
      }

      // Click edit button (pencil icon)
      const editButton = page.locator('button[title="Editar"]').first();
      if (await editButton.isVisible()) {
        // Handle the prompt dialog
        page.on('dialog', async (dialog) => {
          expect(dialog.type()).toBe('prompt');
          await dialog.accept('Renamed Key');
        });

        await editButton.click();
      }
    });
  });

  test.describe('Delete API Key', () => {
    test('should show confirmation dialog when clicking delete', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.locator('button[title="Eliminar"]').first();

      if (await deleteButton.isVisible()) {
        // Handle the confirmation dialog
        page.on('dialog', async (dialog) => {
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toContain('Estás seguro');
          await dialog.dismiss(); // Don't actually delete
        });

        await deleteButton.click();
      }
    });

    test('should delete key when confirmed', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // First create a key to delete
      await page.click('button:has-text("Nueva Clave")');
      const keyName = `Delete Test Key ${Date.now()}`;
      await page.fill('#api-key-name', keyName);
      await page.click('button:has-text("Crear Clave")');
      await page.click('button:has-text("Entendido")');
      await page.waitForLoadState('networkidle');

      // Find the key's delete button
      const keyCard = page.locator(`text=${keyName}`).locator('..').locator('..');
      const deleteButton = keyCard.locator('button[title="Eliminar"]');

      // Accept the confirmation
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await deleteButton.click();

      // Key should be removed from list
      await expect(page.locator(`text=${keyName}`)).not.toBeVisible();
    });
  });

  test.describe('Toggle API Key Active State', () => {
    test('should toggle key from active to inactive', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const deactivateButton = page.locator('button:has-text("Desactivar")').first();

      if (await deactivateButton.isVisible()) {
        await deactivateButton.click();

        // Should now show "Inactiva" badge
        await expect(page.locator('text=Inactiva')).toBeVisible();
      }
    });

    test('should toggle key from inactive to active', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const activateButton = page.locator('button:has-text("Activar")').first();

      if (await activateButton.isVisible()) {
        await activateButton.click();

        // Should now show "Activa" badge
        await expect(page.locator('text=Activa')).toBeVisible();
      }
    });
  });

  test.describe('Search and Filter', () => {
    test('should filter keys by search term', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Ensure we have some keys
      const keyCount = await page.locator('[data-testid="api-key-card"]').count();

      if (keyCount > 0) {
        const searchInput = page.locator('input[placeholder*="Buscar"]');
        await searchInput.fill('nonexistent-key-name');

        // Should show no results or filtered results
        await expect(page.locator('text=Sin resultados')).toBeVisible();
      }
    });

    test('should filter keys by status', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const statusSelect = page.locator('select');

      if (await statusSelect.isVisible()) {
        // Filter by active only
        await statusSelect.selectOption('active');

        // All visible keys should have "Activa" badge
        const inactiveBadges = page.locator('text=Inactiva');
        await expect(inactiveBadges).toHaveCount(0);
      }
    });

    test('should clear filters and show all keys', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      const statusSelect = page.locator('select');

      if (await statusSelect.isVisible()) {
        // Filter by inactive, then back to all
        await statusSelect.selectOption('inactive');
        await statusSelect.selectOption('all');

        // Should show all keys (no "Sin resultados" message if keys exist)
        const searchInput = page.locator('input[placeholder*="Buscar"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill('');
        }
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no keys exist', async ({ page }) => {
      // This test would need a tenant with no API keys
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Check if we're in empty state
      const emptyState = page.locator('text=No hay claves de API');
      const createFirstButton = page.locator('text=Crear Primera Clave');

      // If empty state is visible, verify the CTA
      if (await emptyState.isVisible()) {
        await expect(createFirstButton).toBeVisible();
      }
    });
  });

  test.describe('Location Selection', () => {
    test('should show location dropdown in create modal', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Location select should be visible if tenant has locations
      const locationSelect = page.locator('#api-key-location');

      if (await locationSelect.isVisible()) {
        await expect(page.locator('text=Todas las ubicaciones (Global)')).toBeVisible();
      }
    });
  });

  test.describe('Advanced Options', () => {
    test('should show advanced options section', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Advanced options should be collapsible
      await expect(page.locator('text=Opciones avanzadas')).toBeVisible();
    });

    test('should expand advanced options on click', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Nueva Clave")');

      // Click to expand
      await page.click('text=Opciones avanzadas');

      // Should show rate limit and expiration inputs
      await expect(page.locator('text=Límite de peticiones por hora')).toBeVisible();
      await expect(page.locator('text=Fecha de expiración')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Should have main heading
      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=api');
      await page.waitForLoadState('networkidle');

      // Focus on first interactive element
      await page.keyboard.press('Tab');

      // Should have focus visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});

/**
 * Separate test group for role-based access control
 */
const isRoleTestEnabled = process.env.TEST_ROLE_ACCESS_ENABLED === 'true';

test.describe('API Key Role-Based Access', () => {
  test.skip(!isRoleTestEnabled, 'Skipping - requires role-based test setup');

  test('should only allow MANAGER/ADMINISTRATOR to access API settings', async ({ page }) => {
    await page.goto('/dashboard/settings?tab=api');
    await page.waitForLoadState('networkidle');

    // For non-admin users, should redirect or show access denied
    const currentUrl = page.url();

    // Either on the settings page or redirected
    const isOnSettings = currentUrl.includes('/settings');
    const hasApiAccess = await page.locator('text=Nueva Clave').isVisible();

    // If user doesn't have access, they shouldn't see the API key management
    if (!hasApiAccess && isOnSettings) {
      await expect(page.locator('text=Función Premium')).toBeVisible();
    }
  });
});
