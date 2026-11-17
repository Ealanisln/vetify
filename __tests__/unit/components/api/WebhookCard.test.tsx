/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebhookCard, type WebhookData } from '@/components/api/WebhookCard';

function makeWebhook(overrides: Partial<WebhookData> = {}): WebhookData {
  const now = new Date().toISOString();
  return {
    id: 'wh-1',
    name: 'CRM',
    url: 'https://example.com/webhook',
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

function renderCard(webhook: WebhookData, onViewLogs = jest.fn()) {
  render(
    <WebhookCard
      webhook={webhook}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onToggleActive={jest.fn()}
      onTest={jest.fn()}
      onViewLogs={onViewLogs}
    />
  );
  return { onViewLogs };
}

describe('WebhookCard', () => {
  it('labels the last success with an accented "Éxito"', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    renderCard(makeWebhook({ lastDeliveryAt: fiveMinutesAgo, lastSuccessAt: fiveMinutesAgo }));

    expect(screen.getByText(/^Éxito hace 5 minutos$/)).toBeInTheDocument();
  });

  it('folds extra events behind "+N más"', () => {
    renderCard(
      makeWebhook({
        events: ['pet.created', 'pet.updated', 'pet.deleted', 'sale.completed'],
      })
    );

    expect(screen.getByRole('button', { name: '+1 más' })).toBeInTheDocument();
  });

  it('opens the delivery history from its own button', async () => {
    const webhook = makeWebhook();
    const { onViewLogs } = renderCard(webhook);

    await userEvent.click(screen.getByRole('button', { name: 'Ver entregas' }));

    expect(onViewLogs).toHaveBeenCalledWith(webhook);
  });

  // The e2e flow opens the history by clicking the card itself
  it('opens the delivery history when the card body is clicked', async () => {
    const webhook = makeWebhook();
    const { onViewLogs } = renderCard(webhook);

    await userEvent.click(screen.getByRole('heading', { name: 'CRM' }));

    expect(onViewLogs).toHaveBeenCalledWith(webhook);
  });

  it('does not open the history when an action button is clicked', async () => {
    const { onViewLogs } = renderCard(
      makeWebhook({ events: ['pet.created', 'pet.updated', 'pet.deleted', 'sale.completed'] })
    );

    for (const title of ['Probar webhook', 'Editar', 'Eliminar']) {
      await userEvent.click(screen.getByTitle(title));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
    await userEvent.click(screen.getByRole('button', { name: '+1 más' }));

    expect(onViewLogs).not.toHaveBeenCalled();
  });
});
