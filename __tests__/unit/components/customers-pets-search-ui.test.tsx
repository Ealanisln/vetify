// The customer and pet list searches used to filter only the 10 rows on the
// screen. They now send the term to the API, which searches every row.
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/components/providers/LocationProvider', () => ({
  useLocation: () => ({ currentLocation: null, isAllLocations: true }),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import { CustomersPageClient } from '@/app/dashboard/customers/CustomersPageClient';
import { PetsPageClient } from '@/app/dashboard/pets/PetsPageClient';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const paged = (data: unknown[], total = data.length) =>
  ({
    ok: true,
    json: async () => ({
      success: true,
      data,
      pagination: { page: 1, limit: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)), hasMore: false },
    }),
  }) as Response;

const searchParamOf = (url: unknown) => new URL(String(url), 'http://localhost').searchParams;

const customer = (id: string, name: string) => ({
  id,
  name,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  _count: { pets: 0, appointments: 0 },
});

const pet = (id: string, name: string) => ({
  id,
  name,
  species: 'dog',
  breed: '',
  gender: 'male',
  customer: { id: 'c1', name: 'Ana' },
  appointments: [],
  medicalHistories: [],
});

describe('CustomersPageClient search', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('asks the API for the term instead of filtering the loaded page', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      searchParamOf(url).get('search') === 'jose'
        ? paged([customer('jose', 'José Ramírez')], 1)
        : paged(Array.from({ length: 10 }, (_, i) => customer(`c${i}`, `Cliente ${i}`)), 30)
    );

    render(<CustomersPageClient />);
    await screen.findAllByText('Cliente 0');

    fireEvent.change(screen.getByTestId('customer-search-input'), { target: { value: 'jose' } });

    expect(await screen.findAllByText('José Ramírez')).not.toHaveLength(0);
    const searchCall = mockFetch.mock.calls.find(([url]) => searchParamOf(url).get('search') === 'jose');
    expect(searchParamOf(searchCall![0]).get('page')).toBe('1');
  });

  it('keeps the search box when nothing matches', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      searchParamOf(url).get('search') ? paged([], 0) : paged([customer('c1', 'Cliente 1')], 1)
    );

    render(<CustomersPageClient />);
    await screen.findAllByText('Cliente 1');

    fireEvent.change(screen.getByTestId('customer-search-input'), { target: { value: 'nadie' } });

    expect(await screen.findByText('No se encontraron clientes')).toBeInTheDocument();
    expect(screen.getByTestId('customer-search-input')).toHaveValue('nadie');
  });
});

describe('PetsPageClient search', () => {
  const petLimit = { canAdd: true, current: 30, limit: 300 };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('asks the API for the term instead of filtering the loaded page', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      searchParamOf(url).get('search') === 'nino'
        ? paged([pet('nino', 'Niño')], 1)
        : paged(Array.from({ length: 10 }, (_, i) => pet(`p${i}`, `Mascota ${i}`)), 30)
    );

    render(<PetsPageClient petLimit={petLimit} />);
    await screen.findByText('Mascota 0');

    fireEvent.change(screen.getByTestId('pets-search-input'), { target: { value: 'nino' } });

    expect(await screen.findByText('Niño')).toBeInTheDocument();
    expect(screen.queryByText('Mascota 0')).not.toBeInTheDocument();
  });

  it('keeps the search box when nothing matches', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      searchParamOf(url).get('search') ? paged([], 0) : paged([pet('p1', 'Mascota 1')], 1)
    );

    render(<PetsPageClient petLimit={petLimit} />);
    await screen.findByText('Mascota 1');

    fireEvent.change(screen.getByTestId('pets-search-input'), { target: { value: 'nadie' } });

    expect(await screen.findByText('No se encontraron resultados')).toBeInTheDocument();
    expect(screen.getByTestId('pets-search-input')).toHaveValue('nadie');
  });
});
