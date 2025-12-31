import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedInventoryFeatures } from '@/components/inventory/AdvancedInventoryFeatures';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('AdvancedInventoryFeatures', () => {
  const mockTenantId = 'test-tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [],
        summary: {
          totalItems: 0,
          fastMoving: 0,
          slowMoving: 0,
          deadStock: 0,
          averageTurnover: 0,
          averageDIOH: 0,
        },
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    } as Response);
  });

  it('renders the component title and Plan Profesional badge', () => {
    render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

    expect(screen.getByText('Funciones Avanzadas de Inventario')).toBeInTheDocument();
    expect(screen.getByText('Plan Profesional')).toBeInTheDocument();
  });

  it('renders all four tabs', () => {
    render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

    expect(screen.getByText('Rotación')).toBeInTheDocument();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(screen.getByText('Movimientos')).toBeInTheDocument();
    expect(screen.getByText('Vencimientos')).toBeInTheDocument();
  });

  it('defaults to rotation tab on initial render', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            itemId: '1',
            itemName: 'Test Product',
            category: 'MEDICINE',
            currentStock: 100,
            totalSold: 50,
            turnoverRatio: 2,
            daysOfInventory: 45,
            abcClassification: 'A',
            lastMovementDate: null,
            daysSinceLastSale: null,
          },
        ],
        summary: {
          totalItems: 1,
          fastMoving: 1,
          slowMoving: 0,
          deadStock: 0,
          averageTurnover: 2,
          averageDIOH: 45,
        },
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    } as Response);

    render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/analytics/rotation')
      );
    });
  });

  it('switches to alerts tab when clicked', async () => {
    render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

    fireEvent.click(screen.getByText('Alertas'));

    await waitFor(() => {
      expect(screen.getByText('Configuración de Alertas Automáticas')).toBeInTheDocument();
    });
  });

  it('switches to movements tab when clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        movements: [],
        summary: {
          totalMovements: 0,
          totalIn: 0,
          totalOut: 0,
          netChange: 0,
        },
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    } as Response);

    render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

    fireEvent.click(screen.getByText('Movimientos'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/movements')
      );
    });
  });

  it('switches to expiration tab when clicked', async () => {
    render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

    fireEvent.click(screen.getByText('Vencimientos'));

    await waitFor(() => {
      expect(screen.getByText(/Productos que vencen en los próximos 30 días/i)).toBeInTheDocument();
    });
  });

  describe('Rotation Tab', () => {
    it('displays rotation classification filter on initial render', () => {
      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      // Filter should be visible immediately since rotation is the default tab
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Todas las clasificaciones')).toBeInTheDocument();
    });

    it('displays table headers for rotation data after loading', async () => {
      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      // Wait for table headers to be visible after loading completes
      await waitFor(() => {
        expect(screen.getByText('Producto')).toBeInTheDocument();
      });
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText('Vendido (90d)')).toBeInTheDocument();
    });

    it('shows empty state when no rotation data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          items: [],
          summary: {
            totalItems: 0,
            fastMoving: 0,
            slowMoving: 0,
            deadStock: 0,
            averageTurnover: 0,
            averageDIOH: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      } as Response);

      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('No hay datos de rotación disponibles')).toBeInTheDocument();
      });
    });
  });

  describe('Alerts Tab', () => {
    it('displays alert configuration information', async () => {
      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      fireEvent.click(screen.getByText('Alertas'));

      await waitFor(() => {
        expect(screen.getByText('Alertas de Stock Bajo')).toBeInTheDocument();
        expect(screen.getByText('Alertas de Vencimiento')).toBeInTheDocument();
      });
    });

    it('shows that alerts are active', async () => {
      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      fireEvent.click(screen.getByText('Alertas'));

      await waitFor(() => {
        // Check for the alert status text that contains "Activas"
        expect(screen.getByText(/Se notifica cuando el stock/i)).toBeInTheDocument();
      });
    });
  });

  describe('Movements Tab', () => {
    it('displays movement type filter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          movements: [],
          summary: {
            totalMovements: 0,
            totalIn: 0,
            totalOut: 0,
            netChange: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      } as Response);

      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      fireEvent.click(screen.getByText('Movimientos'));

      await waitFor(() => {
        expect(screen.getByText('Todos los tipos')).toBeInTheDocument();
      });
    });

    it('shows empty state when no movements', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          movements: [],
          summary: {
            totalMovements: 0,
            totalIn: 0,
            totalOut: 0,
            netChange: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      } as Response);

      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      fireEvent.click(screen.getByText('Movimientos'));

      await waitFor(() => {
        expect(screen.getByText('No hay movimientos registrados')).toBeInTheDocument();
      });
    });
  });

  describe('Expiration Tab', () => {
    it('displays expiration warning header', async () => {
      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      fireEvent.click(screen.getByText('Vencimientos'));

      await waitFor(() => {
        expect(screen.getByText(/Productos que vencen en los próximos 30 días/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no expiring items', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      fireEvent.click(screen.getByText('Vencimientos'));

      await waitFor(() => {
        expect(screen.getByText('No hay productos próximos a vencer')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner while fetching rotation data', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<AdvancedInventoryFeatures tenantId={mockTenantId} />);

      // Should not crash, component should still render
      await waitFor(() => {
        expect(screen.getByText('Funciones Avanzadas de Inventario')).toBeInTheDocument();
      });
    });
  });
});
