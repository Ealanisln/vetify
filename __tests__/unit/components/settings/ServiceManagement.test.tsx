import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { ServiceManagement } from '@/components/settings/ServiceManagement';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

const baseService = {
  id: 'service-1',
  tenantId: 'tenant-1',
  locationId: null,
  location: null,
  name: 'Consulta General',
  description: null,
  category: 'CONSULTATION',
  price: '350.5',
  duration: 30,
  isActive: true,
  isFeatured: false,
  publicIcon: null,
  publicPriceLabel: null,
  publicDisplayOrder: null,
};

function mockApi(services: unknown[], deleteResponse?: () => Promise<unknown>) {
  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    if (url.startsWith('/api/services?')) return jsonResponse(services);
    if (url === '/api/locations') return jsonResponse([]);
    if (init?.method === 'DELETE' && deleteResponse) return deleteResponse();
    throw new Error(`Unexpected fetch ${init?.method ?? 'GET'} ${url}`);
  });
}

function renderList(currencyCode = 'MXN') {
  return render(
    <CurrencyProvider currencyCode={currencyCode}>
      <ServiceManagement tenantId="tenant-1" />
    </CurrencyProvider>
  );
}

describe('ServiceManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the test ids the e2e spec relies on', async () => {
    mockApi([baseService]);
    renderList();

    expect(await screen.findByTestId('services-list')).toBeInTheDocument();
    expect(screen.getByTestId('services-settings')).toBeInTheDocument();
  });

  it('formats prices in the tenant currency', async () => {
    mockApi([baseService]);
    renderList('MXN');

    const card = await screen.findByTestId('service-card');
    expect(within(card).getByText('$350.50')).toBeInTheDocument();
  });

  it('formats a CLP price without decimals and with local grouping', async () => {
    mockApi([{ ...baseService, price: '350000' }]);
    renderList('CLP');

    const card = await screen.findByTestId('service-card');
    expect(within(card).getByText('$350.000')).toBeInTheDocument();
  });

  it('labels BOARDING as "Pensión / Hotel"', async () => {
    mockApi([{ ...baseService, category: 'BOARDING' }]);
    renderList();

    const card = await screen.findByTestId('service-card');
    expect(within(card).getByText('Pensión / Hotel')).toBeInTheDocument();
  });

  it('keeps a deactivated service in the list as Inactivo and shows the API message', async () => {
    const message = 'El servicio tiene ventas asociadas, se ha desactivado en lugar de eliminarse';
    mockApi([baseService], () =>
      jsonResponse({ message, service: { ...baseService, price: '350.5', isActive: false } })
    );
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByTestId('delete-service-button'));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(message));
    const card = screen.getByTestId('service-card');
    expect(within(card).getByText('Consulta General')).toBeInTheDocument();
    expect(within(card).getByText('Inactivo')).toBeInTheDocument();
  });

  it('removes a deleted service and confirms it', async () => {
    mockApi([baseService], () => jsonResponse({ message: 'Servicio eliminado correctamente' }));
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByTestId('delete-service-button'));

    await waitFor(() => expect(screen.queryByTestId('service-card')).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Servicio eliminado correctamente');
  });

  it('shows the API error when deleting fails', async () => {
    mockApi([baseService], () => jsonResponse({ error: 'Servicio no encontrado' }, 404));
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByTestId('delete-service-button'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Servicio no encontrado'));
    expect(screen.getByTestId('service-card')).toBeInTheDocument();
  });
});
