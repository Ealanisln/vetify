/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebhookDeliveryLogs } from '@/components/api/WebhookDeliveryLogs';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function log(overrides: Record<string, unknown>) {
  return {
    id: 'log-1',
    eventType: 'pet.created',
    payload: {},
    attempt: 1,
    status: 'DELIVERED',
    httpStatusCode: 200,
    responseBody: null,
    error: null,
    deliveredAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    scheduledFor: null,
    ...overrides,
  };
}

function logsResponse(data: unknown[], page: number, totalPages: number) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data,
        pagination: {
          page,
          limit: 10,
          totalCount: totalPages * 10,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      }),
  });
}

function renderLogs() {
  const onClose = jest.fn();
  render(<WebhookDeliveryLogs webhook={{ id: 'wh-1', name: 'CRM' }} onClose={onClose} />);
  return { onClose };
}

describe('WebhookDeliveryLogs', () => {
  beforeEach(() => fetchMock.mockReset());

  it('loads the first page and shows Spanish status badges', async () => {
    fetchMock.mockReturnValueOnce(
      logsResponse(
        [
          log({ id: 'a', status: 'DELIVERED' }),
          log({ id: 'b', status: 'FAILED', httpStatusCode: 500, error: 'HTTP 500' }),
          log({ id: 'c', status: 'PENDING', httpStatusCode: null }),
          log({ id: 'd', status: 'SKIPPED', httpStatusCode: null }),
        ],
        1,
        1
      )
    );
    renderLogs();

    expect(screen.getByRole('heading', { name: 'Historial de entregas' })).toBeInTheDocument();
    expect(await screen.findByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Fallido')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Omitido')).toBeInTheDocument();
    expect(screen.getByText('HTTP 500')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/webhooks/wh-1/logs?page=1&limit=10');
  });

  it('shows an empty state when nothing was delivered yet', async () => {
    fetchMock.mockReturnValueOnce(logsResponse([], 1, 0));
    renderLogs();

    expect(await screen.findByText('Aún no hay entregas para este webhook.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('paginates with Anterior and Siguiente', async () => {
    fetchMock
      .mockReturnValueOnce(logsResponse([log({ id: 'p1', eventType: 'pet.created' })], 1, 2))
      .mockReturnValueOnce(logsResponse([log({ id: 'p2', eventType: 'sale.completed' })], 2, 2));
    renderLogs();

    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('sale.completed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/settings/webhooks/wh-1/logs?page=2&limit=10');
  });

  it('shows the API error with a retry', async () => {
    fetchMock
      .mockReturnValueOnce(
        Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Webhook no encontrado' }) })
      )
      .mockReturnValueOnce(logsResponse([log({})], 1, 1));
    renderLogs();

    expect(await screen.findByText('Webhook no encontrado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.getByText('Entregado')).toBeInTheDocument());
  });

  it('closes with the Escape key and the close button', async () => {
    fetchMock.mockReturnValue(logsResponse([], 1, 0));
    const { onClose } = renderLogs();
    await screen.findByText('Aún no hay entregas para este webhook.');

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
