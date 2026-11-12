import { test, expect, type Page } from '@playwright/test';
import { FAKE_SERVICES_URL, SEEDED_CLINIC_SLUG, TEST_AUTH_SECRET_HEADER } from '../support/constants';

/**
 * P0 clinic setup: what a new clinic owner configures before taking bookings.
 *
 * - Business hours, including "Sin comida", survive a reload.
 * - A service created, edited and deactivated in Configuración > Servicios
 *   shows up (or stops showing up) in the public booking form.
 * - A staff member can be invited and stays "Invitación pendiente".
 *
 * Runs as the seeded clinic owner (tests/auth.setup.ts). Every step asserts:
 * a missing element fails the test instead of skipping it.
 */
test.skip(process.env.TEST_AUTH_ENABLED !== 'true', 'Requires TEST_AUTH_ENABLED=true (authenticated E2E run)');

// Unique per run so reruns against the same database never collide
const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

const businessHoursSaved = (page: Page) =>
  page.waitForResponse(
    (response) => response.url().includes('/api/settings/business-hours') && response.request().method() === 'PUT'
  );

const bookingServiceOption = (page: Page, name: string) =>
  page.getByTestId('booking-service-select').locator('option', { hasText: name });

async function openBookingForm(page: Page) {
  await page.goto(`/${SEEDED_CLINIC_SLUG}/agendar`);
  await expect(page.getByTestId('booking-service-select')).toBeVisible();
}

async function openServicesSettings(page: Page) {
  await page.goto('/dashboard/settings?tab=services');
  await expect(page.getByTestId('services-settings')).toBeVisible();
  await expect(page.getByTestId('add-service-button')).toBeVisible();
}

test.describe('Clinic setup', () => {
  test('saves business hours, including a day without lunch', async ({ page }) => {
    // Wednesday: settings.spec.ts edits Monday, so the two specs never touch the same day
    await page.goto('/dashboard/settings?tab=business-hours');
    await expect(page.getByTestId('business-hours-settings')).toBeVisible();

    const toggle = page.getByTestId('day-toggle-wednesday');
    if ((await toggle.textContent())?.trim() === 'Abrir') {
      await toggle.click();
    }
    await expect(toggle).toHaveText('Cerrar');

    await page.getByTestId('open-time-wednesday').selectOption('09:30');
    await page.getByTestId('close-time-wednesday').selectOption('17:30');
    await page.getByTestId('lunch-start-wednesday').selectOption('');
    await expect(page.getByTestId('lunch-end-wednesday')).toHaveValue('');

    const saved = businessHoursSaved(page);
    await page.getByTestId('save-business-hours').click();
    expect((await saved).ok()).toBe(true);
    await expect(page.getByText('Horarios de atención guardados exitosamente')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('business-hours-settings')).toBeVisible();
    await expect(page.getByTestId('day-toggle-wednesday')).toHaveText('Cerrar');
    await expect(page.getByTestId('open-time-wednesday')).toHaveValue('09:30');
    await expect(page.getByTestId('close-time-wednesday')).toHaveValue('17:30');
    await expect(page.getByTestId('lunch-start-wednesday')).toHaveValue('');
    await expect(page.getByTestId('lunch-end-wednesday')).toHaveValue('');

    // A lunch break comes back after "Sin comida" as well
    await page.getByTestId('lunch-start-wednesday').selectOption('13:00');
    await page.getByTestId('lunch-end-wednesday').selectOption('14:00');
    const savedAgain = businessHoursSaved(page);
    await page.getByTestId('save-business-hours').click();
    expect((await savedAgain).ok()).toBe(true);

    await page.reload();
    await expect(page.getByTestId('lunch-start-wednesday')).toHaveValue('13:00');
    await expect(page.getByTestId('lunch-end-wednesday')).toHaveValue('14:00');
  });

  test('creates, edits and deactivates a service, and the booking form follows', async ({ page }) => {
    // Six page loads across the dashboard and the public booking page
    test.setTimeout(120_000);
    const createdName = `E2E Consulta ${runId}`;
    const editedName = `E2E Vacuna ${runId}`;
    const serviceCard = (name: string) => page.getByTestId('service-card').filter({ hasText: name });

    await test.step('create', async () => {
      await openServicesSettings(page);
      await page.getByTestId('add-service-button').click();
      await expect(page.getByTestId('service-modal')).toBeVisible();
      await page.getByTestId('service-name-input').fill(createdName);
      await page.getByTestId('service-price-input').fill('350');
      await page.getByTestId('service-duration-input').fill('30');
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio creado')).toBeVisible();
      await expect(page.getByTestId('service-modal')).toBeHidden();
      await expect(serviceCard(createdName).getByTestId('service-status')).toHaveText('Activo');

      await openBookingForm(page);
      await expect(bookingServiceOption(page, createdName)).toHaveCount(1);
    });

    await test.step('edit', async () => {
      await openServicesSettings(page);
      await serviceCard(createdName).getByTestId('edit-service-button').click();
      await expect(page.getByTestId('service-name-input')).toHaveValue(createdName);
      await page.getByTestId('service-name-input').fill(editedName);
      await page.getByTestId('service-price-input').fill('420');
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio actualizado')).toBeVisible();
      await expect(serviceCard(editedName).getByTestId('service-price')).toContainText('420');
      await expect(serviceCard(createdName)).toHaveCount(0);

      await openBookingForm(page);
      await expect(bookingServiceOption(page, editedName)).toHaveCount(1);
      await expect(bookingServiceOption(page, createdName)).toHaveCount(0);
    });

    await test.step('deactivate', async () => {
      await openServicesSettings(page);
      await serviceCard(editedName).getByTestId('edit-service-button').click();
      await page.getByTestId('service-active-checkbox').uncheck();
      await page.getByTestId('submit-service-button').click();

      await expect(page.getByText('Servicio actualizado')).toBeVisible();
      await expect(serviceCard(editedName).getByTestId('service-status')).toHaveText('Inactivo');

      await openBookingForm(page);
      await expect(bookingServiceOption(page, editedName)).toHaveCount(0);
    });
  });

  test('invites a staff member and shows the invitation as pending', async ({ page }) => {
    const name = `E2E Veterinaria ${runId}`;
    const email = `e2e-vet-${runId}@vetify-ci.com`;
    const staffRow = page.getByTestId('staff-row').filter({ hasText: email });

    await page.goto('/dashboard/staff');
    await page.getByTestId('add-staff-button').click();
    await expect(page.getByTestId('staff-modal')).toBeVisible();
    await page.getByTestId('staff-name-input').fill(name);
    await page.getByTestId('staff-position-select').selectOption({ label: 'Veterinario' });
    await page.getByTestId('staff-email-input').fill(email);
    await page.getByTestId('submit-staff-button').click();

    await expect(page.getByText('Personal agregado exitosamente')).toBeVisible();
    await expect(staffRow.getByTestId('staff-name')).toHaveText(name);
    await expect(staffRow.getByTestId('staff-role')).toContainText('Veterinario');

    await staffRow.getByTestId('send-invitation-button').click();
    await expect(page.getByText(`Invitación enviada a ${name}`)).toBeVisible();
    await expect(staffRow.getByTestId('invitation-status')).toHaveText('Invitación pendiente');

    // The invitation email went out (to the fake Resend) with an invite link
    const sent = await page.request.get(`${FAKE_SERVICES_URL}/test-auth/emails`, {
      params: { to: email },
      headers: { [TEST_AUTH_SECRET_HEADER]: process.env.TEST_AUTH_SECRET ?? '' },
    });
    expect(sent.ok()).toBe(true);
    const { emails } = await sent.json();
    expect(emails).toHaveLength(1);
    expect(emails[0].html).toMatch(/\/invite\?token=[\w-]+/);

    // Persisted, not just optimistic UI
    await page.reload();
    await expect(staffRow.getByTestId('invitation-status')).toHaveText('Invitación pendiente');
    await expect(staffRow.getByTestId('resend-invitation-button')).toBeVisible();
  });
});
