import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceModal } from '@/components/settings/ServiceModal';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

type Location = { id: string; name: string };

function mockApi({
  locations = [] as Location[],
  save = (body: Record<string, unknown>) => jsonResponse({ id: 'service-1', ...body }, 201),
} = {}) {
  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/locations') return jsonResponse(locations);
    if (url.startsWith('/api/services')) return save(JSON.parse(String(init?.body ?? '{}')));
    throw new Error(`Unexpected fetch ${url}`);
  });
}

function renderModal({
  currencyCode = 'MXN',
  onSave = jest.fn(),
  service = null,
}: {
  currencyCode?: string;
  onSave?: jest.Mock;
  service?: Parameters<typeof ServiceModal>[0]['service'];
} = {}) {
  render(
    <CurrencyProvider currencyCode={currencyCode}>
      <ServiceModal isOpen onClose={jest.fn()} onSave={onSave} service={service} tenantId="tenant-1" />
    </CurrencyProvider>
  );
  return { onSave };
}

const savedBodies = () =>
  mockFetch.mock.calls
    .filter(([url]) => String(url).startsWith('/api/services'))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));

async function fillName(user: ReturnType<typeof userEvent.setup>, name = 'Consulta General') {
  const input = screen.getByTestId('service-name-input');
  await user.clear(input);
  await user.type(input, name);
}

describe('ServiceModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the API error message when the name already exists', async () => {
    mockApi({ save: () => jsonResponse({ error: 'Ya existe un servicio con este nombre' }, 400) });
    const user = userEvent.setup();
    const { onSave } = renderModal();

    await fillName(user);
    await user.click(screen.getByTestId('submit-service-button'));

    expect(await screen.findByText('Ya existe un servicio con este nombre')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves with an empty duration (optional) and sends null', async () => {
    mockApi();
    const user = userEvent.setup();
    const { onSave } = renderModal();

    await fillName(user);
    await user.clear(screen.getByTestId('service-duration-input'));
    await user.click(screen.getByTestId('submit-service-button'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(savedBodies()[0]).toEqual(expect.objectContaining({ duration: null }));
    expect(screen.queryByText(/expected number/i)).not.toBeInTheDocument();
  });

  it('asks for the price in Spanish when the field is cleared', async () => {
    mockApi();
    const user = userEvent.setup();
    const { onSave } = renderModal();

    await fillName(user);
    await user.clear(screen.getByTestId('service-price-input'));
    await user.click(screen.getByTestId('submit-service-button'));

    expect(await screen.findByText('Ingresa el precio')).toBeInTheDocument();
    expect(screen.queryByText(/expected number/i)).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("uses the tenant currency's symbol and whole-unit step for CLP", async () => {
    mockApi();
    renderModal({ currencyCode: 'CLP' });

    const price = screen.getByTestId('service-price-input');
    expect(price).toHaveAttribute('step', '1');
    expect(screen.getByTestId('service-price-symbol')).toHaveTextContent('$');
  });

  it("shows a non-dollar currency's symbol (PEN)", () => {
    mockApi();
    renderModal({ currencyCode: 'PEN' });

    expect(screen.getByTestId('service-price-symbol')).toHaveTextContent('S/');
    expect(screen.getByTestId('service-price-input')).toHaveAttribute('step', '0.01');
  });

  it('accepts a 350.000 CLP price (no 99,999 cap)', async () => {
    mockApi();
    const user = userEvent.setup();
    const { onSave } = renderModal({ currencyCode: 'CLP' });

    await fillName(user);
    const price = screen.getByTestId('service-price-input');
    await user.clear(price);
    await user.type(price, '350000');
    await user.click(screen.getByTestId('submit-service-button'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(savedBodies()[0]).toEqual(expect.objectContaining({ price: 350000 }));
  });

  it('labels BOARDING as "Pensión / Hotel", distinct from Hospitalización', () => {
    mockApi();
    renderModal();

    const select = screen.getByTestId('service-category-select');
    expect(within(select).getByRole('option', { name: 'Pensión / Hotel' })).toHaveValue('BOARDING');
    expect(within(select).getByRole('option', { name: 'Hospitalización' })).toHaveValue('HOSPITALIZATION');
  });

  it('does not promise appointment scheduling in the duration hint', () => {
    mockApi();
    renderModal();

    expect(screen.queryByText(/programación de citas/i)).not.toBeInTheDocument();
  });

  it('hides the location picker when the clinic has a single location', async () => {
    mockApi({ locations: [{ id: 'loc-1', name: 'Matriz' }] });
    renderModal();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/locations'));
    await waitFor(() => expect(screen.queryByText('Disponibilidad')).not.toBeInTheDocument());
    expect(screen.queryByText(/Solo en Matriz/)).not.toBeInTheDocument();
  });

  it('shows the location picker with two or more locations', async () => {
    mockApi({
      locations: [
        { id: 'loc-1', name: 'Matriz' },
        { id: 'loc-2', name: 'Sucursal Norte' },
      ],
    });
    renderModal();

    expect(await screen.findByText('Disponibilidad')).toBeInTheDocument();
    expect(screen.getByText('Solo en Sucursal Norte')).toBeInTheDocument();
  });
});
