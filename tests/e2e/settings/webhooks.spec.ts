import { test, expect, type Locator, type Page } from '@playwright/test';
import { AUTH_STATE_PATH, CORPORATIVO_AUTH_STATE_PATH, VET_AUTH_STATE_PATH } from '../support/constants';

/**
 * E2E Tests for Webhook Management
 *
 * This test suite verifies the Webhook Management feature, mounted in the
 * "Webhooks" tab of /dashboard/settings (WebhookConfig):
 * - Create Webhook flow with event selection
 * - Edit Webhook (edit modal) and regenerate its secret
 * - Delete Webhook (confirmation dialog)
 * - Delivery history (logs modal)
 * - Test Webhook delivery
 * - Toggle Webhook active state
 * - Feature gating for non-CORPORATIVO users
 *
 * Management tests run as SEEDED_CORPORATIVO_OWNER (CORPORATIVO plan); the
 * gate and role tests use the PROFESIONAL owner and the veterinarian. All are
 * seeded by scripts/seed-ci-test-data.ts and logged in by tests/auth.setup.ts.
 * Skipped unless TEST_AUTH_ENABLED=true.
 *
 * Each test creates the webhooks it needs with a unique name and only looks at
 * those, so the tests do not depend on each other or on run order. States the
 * seed cannot produce (no webhooks, failed deliveries) come from a mocked list.
 *
 * SECURITY: Webhook management is only available to CORPORATIVO plan users.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

const WEBHOOKS_TAB = '/dashboard/settings?tab=webhooks';
const WEBHOOK_URL = 'https://example.com/webhook';

async function openWebhooksTab(page: Page) {
  await page.goto(WEBHOOKS_TAB);
  await expect(page.getByRole('button', { name: 'Nuevo Webhook', exact: true })).toBeVisible();
}

async function openCreateModal(page: Page) {
  await page.getByRole('button', { name: 'Nuevo Webhook', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nuevo Webhook' })).toBeVisible();
}

/** The create form, so category and event names do not match the page around it. */
function createForm(page: Page): Locator {
  return page.locator('form').filter({ has: page.locator('#webhook-name') });
}

/** The checkbox of an event, labelled by its code and description. */
function eventCheckbox(page: Page, event: string): Locator {
  return page.getByRole('checkbox', { name: new RegExp(`^${event.replace('.', '\\.')}\\b`) });
}

/** The card of the webhook named `name` (WebhookCard has no test id). */
function webhookCard(page: Page, name: string): Locator {
  return page
    .locator('div.rounded-lg')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Eliminar' }) })
    .last();
}

async function fillCreateForm(page: Page, name: string, events: string[], url = WEBHOOK_URL) {
  await page.fill('#webhook-name', name);
  await page.fill('#webhook-url', url);
  for (const event of events) {
    await eventCheckbox(page, event).check();
  }
}

/** Creates a webhook through the UI and closes the one-time secret display. */
async function createWebhook(page: Page, prefix: string, events = ['pet.created']): Promise<string> {
  const name = `${prefix} ${Date.now()}`;
  await openCreateModal(page);
  await fillCreateForm(page, name, events);
  await page.getByRole('button', { name: 'Crear Webhook' }).click();
  await expect(page.getByRole('heading', { name: 'Webhook Creado' })).toBeVisible();
  await page.getByRole('button', { name: /Entendido/ }).click();
  await expect(webhookCard(page, name)).toBeVisible();
  return name;
}

/** Serves fixed delivery logs for every webhook, `pageSize` rows per page. */
async function mockDeliveryLogs(page: Page, logs: Record<string, unknown>[], pageSize = 10) {
  await page.route('**/api/settings/webhooks/*/logs*', (route) => {
    const current = Number(new URL(route.request().url()).searchParams.get('page') ?? '1');
    const totalPages = Math.ceil(logs.length / pageSize);
    return route.fulfill({
      json: {
        success: true,
        data: logs.slice((current - 1) * pageSize, current * pageSize),
        pagination: {
          page: current,
          limit: pageSize,
          totalCount: logs.length,
          totalPages,
          hasNextPage: current < totalPages,
          hasPreviousPage: current > 1,
        },
      },
    });
  });
}

function mockedDeliveryLog(overrides: Record<string, unknown>) {
  const now = new Date().toISOString();
  return {
    id: 'mocked-log',
    eventType: 'pet.created',
    payload: {},
    attempt: 1,
    status: 'DELIVERED',
    httpStatusCode: 200,
    responseBody: null,
    error: null,
    deliveredAt: now,
    createdAt: now,
    scheduledFor: null,
    ...overrides,
  };
}

/** Serves a fixed webhook list to the page; writes still reach the API. */
async function mockWebhookList(page: Page, webhooks: Record<string, unknown>[]) {
  await page.route('**/api/settings/webhooks', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { success: true, data: webhooks } })
      : route.continue()
  );
}

function mockedWebhook(overrides: Record<string, unknown>) {
  const now = new Date().toISOString();
  return {
    id: 'mocked-webhook',
    name: 'Mocked Webhook',
    url: WEBHOOK_URL,
    events: ['pet.created'],
    isActive: true,
    consecutiveFailures: 0,
    lastDeliveryAt: null,
    lastSuccessAt: null,
    createdAt: now,
    updatedAt: now,
    _count: { deliveries: 0 },
    ...overrides,
  };
}

test.describe('Webhook Management', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');
  test.use({ storageState: CORPORATIVO_AUTH_STATE_PATH });

  test.describe('Feature Access', () => {
    test('should show the webhooks tab for CORPORATIVO users', async ({ page }) => {
      await page.goto(WEBHOOKS_TAB);

      await expect(page.getByTestId('settings-tab-webhooks')).toHaveClass(/border-r-2/);
      await expect(
        page.getByText('Los webhooks permiten recibir notificaciones en tiempo real').first()
      ).toBeVisible();
      await expect(page.getByText('Función Premium')).not.toBeVisible();
    });
  });

  test.describe('Create Webhook Flow', () => {
    test.beforeEach(async ({ page }) => {
      await openWebhooksTab(page);
    });

    test('should open create modal when clicking "Nuevo Webhook" button', async ({ page }) => {
      await openCreateModal(page);

      await expect(page.locator('#webhook-name')).toBeVisible();
      await expect(page.locator('#webhook-url')).toBeVisible();
    });

    test('should show form validation errors', async ({ page }) => {
      await openCreateModal(page);

      // No event selected: the hint shows and submit stays disabled
      await expect(createForm(page).getByText('Debes seleccionar al menos un evento')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Crear Webhook' })).toBeDisabled();

      // A blank name passes the browser's required check but not the form's
      await fillCreateForm(page, '   ', ['pet.created']);
      await page.getByRole('button', { name: 'Crear Webhook' }).click();
      await expect(page.getByText('El nombre es requerido')).toBeVisible();
    });

    test('should require HTTPS URL', async ({ page }) => {
      await openCreateModal(page);
      await fillCreateForm(page, 'Test Webhook', ['pet.created'], 'http://example.com/webhook');

      await page.getByRole('button', { name: 'Crear Webhook' }).click();

      // exact: the URL field's hint also starts with this sentence
      await expect(page.getByText('La URL debe usar HTTPS', { exact: true })).toBeVisible();
    });

    test('should create webhook and show one-time secret', async ({ page }) => {
      await openCreateModal(page);
      await fillCreateForm(page, `E2E Test Webhook ${Date.now()}`, ['pet.created', 'pet.updated']);

      await page.getByRole('button', { name: 'Crear Webhook' }).click();

      await expect(page.getByRole('heading', { name: 'Webhook Creado' })).toBeVisible();
      await expect(page.locator('code').filter({ hasText: /^whsec_[0-9a-f]+$/ })).toBeVisible();
      await expect(page.getByText('Esta es la única vez que verás el secreto')).toBeVisible();
    });

    test('should copy secret to clipboard', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await openCreateModal(page);
      await fillCreateForm(page, `Copy Secret Test ${Date.now()}`, ['pet.created']);
      await page.getByRole('button', { name: 'Crear Webhook' }).click();
      await expect(page.getByRole('heading', { name: 'Webhook Creado' })).toBeVisible();

      await page.getByTitle('Copiar secreto').click();

      await expect(page.getByText('Secreto copiado al portapapeles')).toBeVisible();
    });

    test('should close modal and show webhook in list', async ({ page }) => {
      const name = await createWebhook(page, 'List Test Webhook');

      await expect(page.getByRole('heading', { name: 'Webhook Creado' })).not.toBeVisible();
      await expect(webhookCard(page, name).getByText(WEBHOOK_URL)).toBeVisible();
    });
  });

  test.describe('Event Selection', () => {
    test.beforeEach(async ({ page }) => {
      await openWebhooksTab(page);
      await openCreateModal(page);
    });

    test('should display events grouped by category', async ({ page }) => {
      for (const category of ['Mascotas', 'Citas', 'Inventario', 'Ventas']) {
        await expect(createForm(page).getByText(category, { exact: true })).toBeVisible();
      }
    });

    test('should allow selecting multiple events', async ({ page }) => {
      const events = ['pet.created', 'appointment.created', 'sale.completed'];

      for (const event of events) {
        await eventCheckbox(page, event).check();
      }

      for (const event of events) {
        await expect(eventCheckbox(page, event)).toBeChecked();
      }
      await expect(eventCheckbox(page, 'pet.updated')).not.toBeChecked();
    });

    test('should toggle all events in category', async ({ page }) => {
      const mascotas = page.getByRole('checkbox', { name: 'Mascotas', exact: true });

      await mascotas.check();
      for (const event of ['pet.created', 'pet.updated', 'pet.deleted']) {
        await expect(eventCheckbox(page, event)).toBeChecked();
      }
      await expect(eventCheckbox(page, 'appointment.created')).not.toBeChecked();

      await mascotas.uncheck();
      await expect(eventCheckbox(page, 'pet.created')).not.toBeChecked();
    });
  });

  test.describe('Edit Webhook', () => {
    test('should rename webhook from the edit modal', async ({ page }) => {
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Edit Test Webhook');
      const newName = `Updated Webhook ${Date.now()}`;

      await webhookCard(page, name).getByTitle('Editar').click();
      const dialog = page.getByRole('dialog', { name: 'Editar Webhook' });
      await expect(dialog.locator('#edit-webhook-name')).toHaveValue(name);
      await dialog.locator('#edit-webhook-name').fill(newName);
      await dialog.getByRole('button', { name: 'Guardar Cambios' }).click();

      await expect(dialog).not.toBeVisible();
      await expect(webhookCard(page, newName)).toBeVisible();
      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();
    });

    test('should allow regenerating secret', async ({ page }) => {
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Regenerate Secret Webhook');

      await webhookCard(page, name).getByTitle('Editar').click();
      await page.getByRole('button', { name: 'Regenerar Secreto' }).click();
      // Rotating invalidates the current secret, so the modal asks first
      await page.getByRole('button', { name: 'Sí, regenerar' }).click();

      await expect(page.getByRole('heading', { name: 'Secreto Regenerado' })).toBeVisible();
      await expect(page.locator('code').filter({ hasText: /^whsec_/ })).toBeVisible();
    });
  });

  test.describe('Delete Webhook', () => {
    test.beforeEach(async ({ page }) => {
      await openWebhooksTab(page);
    });

    test('should keep the webhook when the confirmation is dismissed', async ({ page }) => {
      const name = await createWebhook(page, 'Keep Test Webhook');

      await webhookCard(page, name).getByTitle('Eliminar').click();
      const dialog = page.getByRole('alertdialog', { name: 'Eliminar Webhook' });
      await expect(dialog).toContainText(`deseas eliminar el webhook "${name}"`);
      await dialog.getByRole('button', { name: 'Cancelar' }).click();

      await expect(dialog).not.toBeVisible();
      await expect(webhookCard(page, name)).toBeVisible();
    });

    test('should delete webhook when confirmed', async ({ page }) => {
      const name = await createWebhook(page, 'Delete Test Webhook');

      await webhookCard(page, name).getByTitle('Eliminar').click();
      await page
        .getByRole('alertdialog', { name: 'Eliminar Webhook' })
        .getByRole('button', { name: 'Eliminar', exact: true })
        .click();

      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();
      await page.reload();
      await expect(page.getByRole('button', { name: 'Nuevo Webhook', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name, exact: true })).not.toBeVisible();
    });
  });

  test.describe('Toggle Webhook Active State', () => {
    test('should deactivate and reactivate a webhook', async ({ page }) => {
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Toggle Test Webhook');
      const card = webhookCard(page, name);

      await card.getByRole('button', { name: 'Desactivar' }).click();
      await expect(card.getByText('Inactivo', { exact: true })).toBeVisible();
      await expect(card.getByTitle('Probar webhook')).toBeDisabled();

      await card.getByRole('button', { name: 'Activar' }).click();
      await expect(card.getByText('Activo', { exact: true })).toBeVisible();
      await expect(card.getByTitle('Probar webhook')).toBeEnabled();
    });
  });

  test.describe('Test Webhook', () => {
    // The ping is a real POST from the server; delivery times out after 30s
    test.setTimeout(90_000);

    test('should send test ping, show the result and count the delivery', async ({ page }) => {
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Ping Test Webhook');
      const card = webhookCard(page, name);
      await expect(card.getByText('0 entregas')).toBeVisible();

      await card.getByTitle('Probar webhook').click();

      // The result is a toast: success reports the HTTP status, failure the error
      await expect(
        page.getByText('Prueba exitosa', { exact: true }).or(page.getByText('Prueba fallida', { exact: true }))
      ).toBeVisible({ timeout: 40_000 });

      await expect(card.getByText('1 entrega', { exact: true })).toBeVisible();
    });
  });

  test.describe('Delivery Logs', () => {
    // A webhook that was just created has no deliveries, so the badge and
    // pagination tests serve mocked logs.
    test('should show delivery logs when clicking webhook', async ({ page }) => {
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Logs Test Webhook');

      await webhookCard(page, name).click();

      await expect(page.getByText('Historial de entregas')).toBeVisible();
    });

    test('should display delivery status badges', async ({ page }) => {
      await mockDeliveryLogs(page, [
        mockedDeliveryLog({ id: 'delivered', status: 'DELIVERED' }),
        mockedDeliveryLog({ id: 'failed', status: 'FAILED', httpStatusCode: 500, error: 'HTTP 500' }),
        mockedDeliveryLog({ id: 'pending', status: 'PENDING', httpStatusCode: null }),
      ]);
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Log Badges Webhook');

      await webhookCard(page, name).click();

      await expect(
        page.getByText('Entregado').or(page.getByText('Fallido')).or(page.getByText('Pendiente')).first()
      ).toBeVisible();
    });

    test('should paginate delivery logs', async ({ page }) => {
      await mockDeliveryLogs(
        page,
        Array.from({ length: 15 }, (_, i) => mockedDeliveryLog({ id: `log-${i}` }))
      );
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Log Pages Webhook');

      await webhookCard(page, name).click();
      await page.getByRole('button', { name: 'Siguiente' }).click();

      await expect(page.getByText('Página 2')).toBeVisible();
    });
  });

  test.describe('Webhook Status Indicators', () => {
    test('should show active/inactive status badge', async ({ page }) => {
      await openWebhooksTab(page);
      const name = await createWebhook(page, 'Badge Test Webhook');

      await expect(webhookCard(page, name).getByText('Activo', { exact: true })).toBeVisible();
    });

    test('should show failure count when webhook has failures', async ({ page }) => {
      await mockWebhookList(page, [
        mockedWebhook({
          name: 'Failing Webhook',
          consecutiveFailures: 3,
          lastDeliveryAt: new Date().toISOString(),
          _count: { deliveries: 3 },
        }),
      ]);
      await openWebhooksTab(page);

      const card = webhookCard(page, 'Failing Webhook');
      await expect(card.getByText('3 fallos consecutivos')).toBeVisible();
      await expect(card.getByText(/^Fallo hace/)).toBeVisible();
    });

    test('should show last delivery timestamp', async ({ page }) => {
      await mockWebhookList(page, [
        mockedWebhook({ id: 'never', name: 'Never Delivered Webhook' }),
        mockedWebhook({
          id: 'delivered',
          name: 'Delivered Webhook',
          lastDeliveryAt: new Date(Date.now() - 5 * 60_000).toISOString(),
          lastSuccessAt: new Date(Date.now() - 5 * 60_000).toISOString(),
          _count: { deliveries: 1 },
        }),
      ]);
      await openWebhooksTab(page);

      await expect(webhookCard(page, 'Never Delivered Webhook').getByText('Sin entregas')).toBeVisible();
      await expect(webhookCard(page, 'Delivered Webhook').getByText(/^Éxito hace 5 minutos$/)).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test.beforeEach(async ({ page }) => {
      await mockWebhookList(page, []);
      await openWebhooksTab(page);
    });

    test('should show empty state when no webhooks exist', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'No hay webhooks configurados' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Crear Primer Webhook' })).toBeVisible();
    });

    test('should open create modal from empty state CTA', async ({ page }) => {
      await page.getByRole('button', { name: 'Crear Primer Webhook' }).click();

      await expect(page.getByRole('heading', { name: 'Nuevo Webhook' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await openWebhooksTab(page);
    });

    test('should have proper heading structure', async ({ page }) => {
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Configuración');
    });

    test('should be keyboard navigable', async ({ page }) => {
      const createButton = page.getByRole('button', { name: 'Nuevo Webhook', exact: true });

      await createButton.focus();
      await expect(createButton).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(page.getByRole('heading', { name: 'Nuevo Webhook' })).toBeVisible();
    });

    test('should have titles on card action buttons', async ({ page }) => {
      const name = await createWebhook(page, 'A11y Test Webhook');
      const card = webhookCard(page, name);

      for (const title of ['Probar webhook', 'Editar', 'Eliminar']) {
        await expect(card.getByRole('button', { name: title })).toBeVisible();
      }
    });
  });

  test.describe('Event Types Display', () => {
    test.beforeEach(async ({ page }) => {
      await openWebhooksTab(page);
    });

    test('should display subscribed events on webhook card', async ({ page }) => {
      const name = await createWebhook(page, 'Events Test Webhook', ['pet.created', 'sale.completed']);
      const card = webhookCard(page, name);

      await expect(card.getByText('pet.created', { exact: true })).toBeVisible();
      await expect(card.getByText('sale.completed', { exact: true })).toBeVisible();
    });

    test('should show truncated events with "more" indicator', async ({ page }) => {
      const events = [
        'pet.created',
        'pet.updated',
        'pet.deleted',
        'appointment.created',
        'appointment.updated',
        'sale.completed',
      ];
      const name = await createWebhook(page, 'Many Events Webhook', events);
      const card = webhookCard(page, name);

      // The card shows three events and folds the rest behind "+N más"
      const more = card.getByRole('button', { name: '+3 más', exact: true });
      await expect(more).toBeVisible();
      await expect(card.getByText('sale.completed', { exact: true })).not.toBeVisible();

      await more.click();
      await expect(card.getByText('sale.completed', { exact: true })).toBeVisible();
    });
  });
});

test.describe('Webhook Feature Gate', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');
  // The CI clinic is on PROFESIONAL, which has no API access
  test.use({ storageState: AUTH_STATE_PATH });

  test('should show upgrade prompt for non-CORPORATIVO users', async ({ page }) => {
    await page.goto(WEBHOOKS_TAB);

    await expect(page.getByText('Función Premium')).toBeVisible();
    await expect(page.getByText('Los webhooks requieren el plan Corporativo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuevo Webhook' })).not.toBeVisible();
  });
});

test.describe('Webhook Role-Based Access', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session. Set TEST_AUTH_ENABLED=true');
  test.use({ storageState: VET_AUTH_STATE_PATH });

  test('should only allow MANAGER/ADMINISTRATOR to manage webhooks', async ({ page }) => {
    await page.goto(WEBHOOKS_TAB);

    await expect(page).toHaveURL(/\/dashboard\?error=access_denied/);
    await expect(page.getByRole('button', { name: 'Nuevo Webhook' })).not.toBeVisible();
  });
});
