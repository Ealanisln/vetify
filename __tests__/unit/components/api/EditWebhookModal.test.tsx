/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditWebhookModal } from '@/components/api/EditWebhookModal';
import type { WebhookData } from '@/components/api/WebhookCard';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const webhook: WebhookData = {
  id: 'wh-1',
  name: 'CRM',
  url: 'https://example.com/webhook',
  events: ['pet.created'],
  isActive: true,
  consecutiveFailures: 0,
  lastDeliveryAt: null,
  lastSuccessAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

function renderModal() {
  const onClose = jest.fn();
  const onUpdated = jest.fn();
  const onSecretRegenerated = jest.fn();
  render(
    <EditWebhookModal
      webhook={webhook}
      onClose={onClose}
      onUpdated={onUpdated}
      onSecretRegenerated={onSecretRegenerated}
    />
  );
  return { onClose, onUpdated, onSecretRegenerated };
}

describe('EditWebhookModal', () => {
  beforeEach(() => fetchMock.mockReset());

  it('prefills name, URL and subscribed events', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: 'Editar Webhook' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('CRM');
    expect(screen.getByLabelText(/URL del Endpoint/)).toHaveValue('https://example.com/webhook');
    expect(screen.getByRole('checkbox', { name: /^pet\.created\b/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^pet\.updated\b/ })).not.toBeChecked();
  });

  it('saves name, URL and events with a PUT', async () => {
    const updated = { ...webhook, name: 'ERP', events: ['pet.created', 'sale.completed'] };
    fetchMock.mockReturnValueOnce(jsonResponse({ success: true, data: updated }));
    const { onUpdated } = renderModal();

    const name = screen.getByLabelText(/Nombre/);
    await userEvent.clear(name);
    await userEvent.type(name, 'ERP');
    await userEvent.click(screen.getByRole('checkbox', { name: /^sale\.completed\b/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/webhooks/wh-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ERP',
        url: 'https://example.com/webhook',
        events: ['pet.created', 'sale.completed'],
      }),
    });
  });

  it('rejects a non-HTTPS URL without calling the API', async () => {
    renderModal();

    const url = screen.getByLabelText(/URL del Endpoint/);
    await userEvent.clear(url);
    await userEvent.type(url, 'http://example.com/webhook');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

    expect(await screen.findByText('La URL debe usar HTTPS')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the API error inside the form', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ success: false, error: 'Webhook no encontrado' }, false));
    const { onUpdated } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

    expect(await screen.findByText('Webhook no encontrado')).toBeInTheDocument();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('regenerates the secret only after confirming', async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ success: true, data: { ...webhook, secret: 'whsec_new' } })
    );
    const { onSecretRegenerated } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Regenerar Secreto' }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/dejará de funcionar/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sí, regenerar' }));

    await waitFor(() =>
      expect(onSecretRegenerated).toHaveBeenCalledWith({ name: 'CRM', secret: 'whsec_new' })
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/webhooks/wh-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerateSecret: true }),
    });
  });

  it('closes with the Escape key', async () => {
    const { onClose } = renderModal();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is exposed as a labelled modal dialog', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Editar Webhook' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });
});
