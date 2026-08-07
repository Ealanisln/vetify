/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { SaleDetailModal, type SaleDetail } from '@/components/sales/SaleDetailModal';

const buildSale = (overrides: Partial<SaleDetail> = {}): SaleDetail => ({
  id: 'sale-1',
  saleNumber: '00042',
  subtotal: '80000',
  tax: '0',
  discount: '0',
  total: '80000',
  status: 'COMPLETED',
  notes: null,
  createdAt: '2026-08-07T12:00:00.000Z',
  customer: { id: 'c1', name: 'Ana Ruiz', phone: null, email: null },
  pet: null,
  user: null,
  staff: { id: 's1', name: 'Dra. Pérez' },
  items: [
    {
      id: 'i1',
      description: 'Consulta general',
      quantity: '1',
      unitPrice: '80000',
      discount: '0',
      total: '80000',
      inventoryItem: null,
      service: null,
    },
  ],
  payments: [
    {
      id: 'p1',
      paymentMethod: 'CASH',
      amount: '80000',
      paymentDate: '2026-08-07T12:00:00.000Z',
      notes: null,
    },
  ],
  tenant: {
    name: 'Clínica Bogotá',
    publicPhone: null,
    publicEmail: null,
    publicAddress: null,
    tenantSettings: { taxRate: '0.19', currencyCode: 'COP' },
  },
  ...overrides,
});

const mockFetchOnce = (sale: SaleDetail) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => sale,
  }) as unknown as typeof fetch;
};

const renderModal = async (sale: SaleDetail) => {
  mockFetchOnce(sale);
  const view = render(<SaleDetailModal saleId="sale-1" open onClose={() => {}} />);
  await waitFor(() => expect(screen.getAllByText(/00042/).length).toBeGreaterThan(0));
  return view;
};

describe('SaleDetailModal money formatting', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats a Colombian sale with dot grouping and no cents', async () => {
    const { container } = await renderModal(buildSale());

    // 80.000 with a dot, not 80,000.00 the Mexican way.
    expect(container.textContent).toContain('80.000');
    expect(container.textContent).not.toContain('80,000.00');
  });

  /**
   * Regression: the default currencyDisplay renders MXN as "MX$", which this
   * component used to paper over with seven .replace('MX$','$') calls. If the
   * narrowSymbol option is ever lost, this catches it.
   */
  it('never renders the MX$ symbol', async () => {
    const { container } = await renderModal(buildSale());
    expect(container.textContent).not.toContain('MX$');
  });

  it('stamps the ISO code on the printed ticket total', async () => {
    const { container } = await renderModal(buildSale());
    expect(container.textContent).toContain('COP');
  });

  it('breaks down tax at the tenant rate, not Mexican IVA', async () => {
    const { container } = await renderModal(buildSale());
    expect(container.textContent).toContain('19%');
    expect(container.textContent).not.toContain('16%');
  });

  it('still formats a Mexican sale the way it always did', async () => {
    const { container } = await renderModal(
      buildSale({
        total: '1234.5',
        subtotal: '1234.5',
        tenant: {
          name: 'Clínica CDMX',
          publicPhone: null,
          publicEmail: null,
          publicAddress: null,
          tenantSettings: { taxRate: '0.16', currencyCode: 'MXN' },
        },
      })
    );

    expect(container.textContent).toContain('1,234.50');
    expect(container.textContent).not.toContain('MX$');
  });

  it('falls back to the default currency when the tenant has no settings row', async () => {
    const { container } = await renderModal(
      buildSale({
        total: '1234.5',
        subtotal: '1234.5',
        tenant: {
          name: 'Clínica Sin Settings',
          publicPhone: null,
          publicEmail: null,
          publicAddress: null,
          tenantSettings: null,
        },
      })
    );

    expect(container.textContent).toContain('1,234.50');
  });
});
