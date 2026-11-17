/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { WebhookConfig } from '@/components/api/WebhookConfig';

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const webhook = {
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
  _count: { deliveries: 0 },
};

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

/** Routes fetch by URL and method; unmatched calls fail the test loudly. */
function routeFetch(routes: Record<string, () => unknown>) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const handler = routes[key] ?? routes[`${init?.method ?? 'GET'} ${url.split('?')[0]}`];
    if (!handler) throw new Error(`Unexpected fetch: ${key}`);
    return handler();
  });
}

const listRoute = { 'GET /api/settings/webhooks': () => json({ success: true, data: [webhook] }) };

async function renderConfig() {
  render(<WebhookConfig />);
  await screen.findByRole('heading', { name: 'CRM' });
}

describe('WebhookConfig', () => {
  const promptSpy = jest.fn();
  const alertSpy = jest.fn();
  const confirmSpy = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    jest.mocked(toast.success).mockReset();
    jest.mocked(toast.error).mockReset();
    window.prompt = promptSpy;
    window.alert = alertSpy;
    window.confirm = confirmSpy;
    promptSpy.mockReset();
    confirmSpy.mockReset();
    alertSpy.mockReset();
  });

  it('describes the feature with proper accents', async () => {
    routeFetch(listRoute);
    await renderConfig();

    expect(screen.getByText(/cuando ocurren eventos en tu clínica\./)).toBeInTheDocument();
    expect(screen.getByText(/Los webhooks envían peticiones POST/)).toBeInTheDocument();
  });

  it('edits through a modal instead of prompt()', async () => {
    routeFetch({
      ...listRoute,
      'PUT /api/settings/webhooks/wh-1': () =>
        json({ success: true, data: { ...webhook, name: 'ERP' } }),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Editar'));
    const dialog = screen.getByRole('dialog', { name: 'Editar Webhook' });
    const name = within(dialog).getByLabelText(/Nombre/);
    await userEvent.clear(name);
    await userEvent.type(name, 'ERP');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar Cambios' }));

    expect(await screen.findByRole('heading', { name: 'ERP' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Editar Webhook' })).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Webhook actualizado');
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it('shows the regenerated secret once', async () => {
    routeFetch({
      ...listRoute,
      'PUT /api/settings/webhooks/wh-1': () =>
        json({ success: true, data: { ...webhook, secret: 'whsec_abc123' } }),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Editar'));
    await userEvent.click(screen.getByRole('button', { name: 'Regenerar Secreto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, regenerar' }));

    expect(await screen.findByRole('heading', { name: 'Secreto Regenerado' })).toBeInTheDocument();
    expect(screen.getByText('whsec_abc123')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Editar Webhook' })).not.toBeInTheDocument();
  });

  it('reports a successful ping with a toast', async () => {
    routeFetch({
      ...listRoute,
      'POST /api/settings/webhooks/wh-1/test': () =>
        json({ success: true, data: { httpStatusCode: 200 } }),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Probar webhook'));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Prueba exitosa', { description: 'Código HTTP: 200' })
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('reports a failed ping with an error toast', async () => {
    routeFetch({
      ...listRoute,
      'POST /api/settings/webhooks/wh-1/test': () =>
        json({ success: false, error: 'Timeout', data: { httpStatusCode: 504 } }),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Probar webhook'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Prueba fallida', {
        description: 'Timeout · Código HTTP: 504',
      })
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('reports toggle errors with a toast', async () => {
    routeFetch({
      ...listRoute,
      'PUT /api/settings/webhooks/wh-1': () => json({ success: false, error: 'Sin permiso' }, false),
    });
    await renderConfig();

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sin permiso'));
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('opens the delivery history of a webhook', async () => {
    routeFetch({
      ...listRoute,
      'GET /api/settings/webhooks/wh-1/logs': () =>
        json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        }),
    });
    await renderConfig();

    await userEvent.click(screen.getByRole('button', { name: 'Ver entregas' }));

    expect(await screen.findByRole('heading', { name: 'Historial de entregas' })).toBeInTheDocument();
  });

  it('explains the empty state with proper accents', async () => {
    routeFetch({ 'GET /api/settings/webhooks': () => json({ success: true, data: [] }) });
    render(<WebhookConfig />);

    expect(await screen.findByText(/se agendan citas, y más\./)).toBeInTheDocument();
  });

  it('deletes after confirming in a dialog instead of confirm()', async () => {
    routeFetch({
      ...listRoute,
      'DELETE /api/settings/webhooks/wh-1': () => json({ success: true }),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Eliminar'));
    const dialog = screen.getByRole('alertdialog', { name: 'Eliminar Webhook' });
    expect(within(dialog).getByText(/¿Estás seguro de que deseas eliminar el webhook/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/settings/webhooks/wh-1', { method: 'DELETE' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'CRM' })).not.toBeInTheDocument());
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/webhooks/wh-1', { method: 'DELETE' });
    expect(toast.success).toHaveBeenCalledWith('Webhook eliminado');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('keeps the webhook when the delete dialog is cancelled', async () => {
    routeFetch(listRoute);
    await renderConfig();

    await userEvent.click(screen.getByTitle('Eliminar'));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' })
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CRM' })).toBeInTheDocument();
  });

  it('reports delete errors with a toast and keeps the webhook', async () => {
    routeFetch({
      ...listRoute,
      'DELETE /api/settings/webhooks/wh-1': () => json({ success: false, error: 'Sin permiso' }, false),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Eliminar'));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' })
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sin permiso'));
    expect(screen.getByRole('heading', { name: 'CRM' })).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('reports a ping that could not be sent with a toast', async () => {
    routeFetch({
      ...listRoute,
      'POST /api/settings/webhooks/wh-1/test': () => Promise.reject(new Error('network')),
    });
    await renderConfig();

    await userEvent.click(screen.getByTitle('Probar webhook'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al probar el webhook'));
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
