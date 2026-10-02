/**
 * @jest-environment jsdom
 *
 * A brand-new clinic has no locations and doesn't need one to register a pet,
 * so the selector must not render a "No hay ubicaciones activas disponibles"
 * warning in that case. It only keeps it when a location is required.
 */
import { render, screen, waitFor } from '@testing-library/react';
import LocationSelector from '@/components/locations/LocationSelector';

const originalFetch = global.fetch;

function mockLocations(locations: unknown[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: locations }),
  }) as unknown as typeof fetch;
}

describe('LocationSelector', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders nothing when the clinic has no active locations', async () => {
    mockLocations([]);
    const { container } = render(<LocationSelector value="" onChange={jest.fn()} />);

    await waitFor(() =>
      expect(screen.queryByText('Cargando ubicaciones...')).not.toBeInTheDocument()
    );
    expect(screen.queryByText(/No hay ubicaciones activas/)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the notice when a location is required but none exist', async () => {
    mockLocations([]);
    render(<LocationSelector value="" onChange={jest.fn()} required />);

    expect(await screen.findByText(/No hay ubicaciones activas/)).toBeInTheDocument();
  });

  it('renders the select when there are active locations', async () => {
    mockLocations([{ id: 'loc-1', name: 'Matriz', isPrimary: true, isActive: true }]);
    render(<LocationSelector value="loc-1" onChange={jest.fn()} />);

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/Matriz/)).toBeInTheDocument();
  });
});
