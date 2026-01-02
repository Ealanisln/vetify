/**
 * Unit tests for BasicReportsClient component
 * Tests stat cards, top 5 lists, export functionality, and rendering
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BasicReportsClient from '@/components/reports/BasicReportsClient';
import { exportToCSV } from '@/lib/reports';

// Mock exportToCSV
jest.mock('@/lib/reports', () => ({
  exportToCSV: jest.fn(),
}));

const mockExportToCSV = exportToCSV as jest.MockedFunction<typeof exportToCSV>;

// Mock data that matches the component's expected types
const createMockReportsData = () => ({
  revenue: {
    todaySales: { total: 1500, count: 5 },
    weekSales: { total: 7500, count: 25 },
    monthSales: { total: 30000, count: 100 },
    yearSales: { total: 360000, count: 1200 },
    monthlyGrowth: 12.5,
    averageTicket: 300,
    dailySales: [],
    monthlySales: [],
    weeklySales: 7500,
    yearlySales: 360000,
  },
  customers: {
    totalCustomers: 150,
    newCustomersThisMonth: 12,
    newCustomersLastMonth: 10,
    customerGrowth: 20,
    activeCustomers: 120,
    topCustomers: [
      {
        id: 'cust-1',
        name: 'Juan Pérez',
        totalSpent: 8188.2,
        visitCount: 4,
        lastVisit: new Date('2025-10-23'),
      },
      {
        id: 'cust-2',
        name: 'María García',
        totalSpent: 7203.02,
        visitCount: 3,
        lastVisit: new Date('2025-10-18'),
      },
      {
        id: 'cust-3',
        name: 'Carlos López',
        totalSpent: 5700,
        visitCount: 2,
        lastVisit: new Date('2025-10-24'),
      },
      {
        id: 'cust-4',
        name: 'Ana Martínez',
        totalSpent: 4500,
        visitCount: 5,
        lastVisit: new Date('2025-10-20'),
      },
      {
        id: 'cust-5',
        name: 'Pedro Sánchez',
        totalSpent: 3200,
        visitCount: 1,
        lastVisit: new Date('2025-10-15'),
      },
      {
        id: 'cust-6',
        name: 'Extra Customer',
        totalSpent: 1000,
        visitCount: 1,
        lastVisit: new Date('2025-10-10'),
      },
    ],
    customerRetention: 80,
  },
  services: {
    topServices: [
      {
        id: 'serv-1',
        name: 'Consulta General',
        revenue: 15000,
        count: 50,
        averagePrice: 300,
      },
      {
        id: 'serv-2',
        name: 'Vacunación',
        revenue: 10000,
        count: 40,
        averagePrice: 250,
      },
      {
        id: 'serv-3',
        name: 'Cirugía Menor',
        revenue: 8000,
        count: 10,
        averagePrice: 800,
      },
      {
        id: 'serv-4',
        name: 'Desparasitación',
        revenue: 5000,
        count: 100,
        averagePrice: 50,
      },
      {
        id: 'serv-5',
        name: 'Baño y Estética',
        revenue: 4000,
        count: 80,
        averagePrice: 50,
      },
      {
        id: 'serv-6',
        name: 'Extra Service',
        revenue: 2000,
        count: 20,
        averagePrice: 100,
      },
    ],
    serviceCategories: [
      { category: 'CONSULTATION', revenue: 15000, count: 50 },
      { category: 'VACCINATION', revenue: 10000, count: 40 },
    ],
  },
  inventory: {
    topProducts: [
      {
        id: 'prod-1',
        name: 'Vitaminas para Perro',
        revenue: 5000,
        quantitySold: 100,
        profit: 2000,
      },
    ],
    lowStockItems: [
      {
        id: 'low-1',
        name: 'Antibióticos',
        currentStock: 5,
        minStock: 10,
      },
      {
        id: 'low-2',
        name: 'Vacunas',
        currentStock: 3,
        minStock: 15,
      },
    ],
    inventoryValue: 150000,
  },
});

describe('BasicReportsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header Rendering', () => {
    it('should render the page title', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Reportes Básicos')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Resumen general de tu veterinaria')).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByRole('button', { name: /exportar resumen/i })).toBeInTheDocument();
    });
  });

  describe('Key Metrics Cards', () => {
    it('should render Ventas del Mes card with correct value', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Ventas del Mes')).toBeInTheDocument();
      expect(screen.getByText(/\$30,000/)).toBeInTheDocument();
    });

    it('should render Clientes Activos card with correct value', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Clientes Activos')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render Ticket Promedio card with correct value', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Ticket Promedio')).toBeInTheDocument();
      expect(screen.getByText(/\$300/)).toBeInTheDocument();
    });

    it('should render Inventario card with correct value', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Inventario')).toBeInTheDocument();
      expect(screen.getByText(/\$150,000/)).toBeInTheDocument();
    });

    it('should show positive monthly growth badge', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText(/\+12\.5%/)).toBeInTheDocument();
    });

    it('should show negative monthly growth badge', () => {
      const data = createMockReportsData();
      data.revenue.monthlyGrowth = -8.5;

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.getByText(/-8\.5%/)).toBeInTheDocument();
    });

    it('should show new customers this month badge', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('+12')).toBeInTheDocument();
      expect(screen.getByText('nuevos este mes')).toBeInTheDocument();
    });

    it('should show transaction count', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('100 transacciones')).toBeInTheDocument();
    });

    it('should show low stock items count badge when items exist', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('2 críticos')).toBeInTheDocument();
    });

    it('should not show low stock badge when no low stock items', () => {
      const data = createMockReportsData();
      data.inventory.lowStockItems = [];

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.queryByText(/críticos/)).not.toBeInTheDocument();
    });
  });

  describe('Top 5 Services Section', () => {
    it('should render Top 5 Servicios section title', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Top 5 Servicios')).toBeInTheDocument();
    });

    it('should only display 5 services even when more exist', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      // Should show first 5 services
      expect(screen.getByText('Consulta General')).toBeInTheDocument();
      expect(screen.getByText('Vacunación')).toBeInTheDocument();
      expect(screen.getByText('Cirugía Menor')).toBeInTheDocument();
      expect(screen.getByText('Desparasitación')).toBeInTheDocument();
      expect(screen.getByText('Baño y Estética')).toBeInTheDocument();
      // Should NOT show 6th service
      expect(screen.queryByText('Extra Service')).not.toBeInTheDocument();
    });

    it('should format service revenue correctly', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
    });

    it('should display ranking indicators for services', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      // Check that ranking numbers exist (1-5)
      // They appear in blue circles for services
      const rankings = screen.getAllByText(/^[1-5]$/);
      expect(rankings.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Top 5 Customers Section', () => {
    it('should render Top 5 Clientes section title', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Top 5 Clientes')).toBeInTheDocument();
    });

    it('should only display 5 customers even when more exist', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      // Should show first 5 customers
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
      expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
      expect(screen.getByText('Pedro Sánchez')).toBeInTheDocument();
      // Should NOT show 6th customer
      expect(screen.queryByText('Extra Customer')).not.toBeInTheDocument();
    });

    it('should format customer total spent correctly', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText(/\$8,188/)).toBeInTheDocument();
      expect(screen.getByText(/\$7,203/)).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should call exportToCSV when export button is clicked', async () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      const exportButton = screen.getByRole('button', { name: /exportar resumen/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockExportToCSV).toHaveBeenCalledTimes(1);
      });
    });

    it('should export with correct filename', async () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      const exportButton = screen.getByRole('button', { name: /exportar resumen/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockExportToCSV).toHaveBeenCalledWith(expect.any(Array), 'resumen-basico');
      });
    });

    it('should include correct metrics in export data', async () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      const exportButton = screen.getByRole('button', { name: /exportar resumen/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportData = mockExportToCSV.mock.calls[0][0];

        // Check export includes all expected metrics
        const metrics = exportData.map((item: { metric: string }) => item.metric);
        expect(metrics).toContain('Ventas Hoy');
        expect(metrics).toContain('Ventas Semana');
        expect(metrics).toContain('Ventas Mes');
        expect(metrics).toContain('Total Clientes');
        expect(metrics).toContain('Nuevos Clientes');
        expect(metrics).toContain('Valor Inventario');
      });
    });

    it('should include correct values in export data', async () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      const exportButton = screen.getByRole('button', { name: /exportar resumen/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportData = mockExportToCSV.mock.calls[0][0];

        // Find specific metrics and check their values
        const ventasHoy = exportData.find((item: { metric: string }) => item.metric === 'Ventas Hoy');
        expect(ventasHoy.value).toBe(1500);

        const totalClientes = exportData.find((item: { metric: string }) => item.metric === 'Total Clientes');
        expect(totalClientes.value).toBe(150);

        const valorInventario = exportData.find((item: { metric: string }) => item.metric === 'Valor Inventario');
        expect(valorInventario.value).toBe(150000);
      });
    });
  });

  describe('Empty State Handling', () => {
    it('should render without crashing when services list is empty', () => {
      const data = createMockReportsData();
      data.services.topServices = [];

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.getByText('Top 5 Servicios')).toBeInTheDocument();
    });

    it('should render without crashing when customers list is empty', () => {
      const data = createMockReportsData();
      data.customers.topCustomers = [];

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.getByText('Top 5 Clientes')).toBeInTheDocument();
    });

    it('should handle zero monthly sales', () => {
      const data = createMockReportsData();
      data.revenue.monthSales = { total: 0, count: 0 };

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('0 transacciones')).toBeInTheDocument();
    });

    it('should handle zero inventory value', () => {
      const data = createMockReportsData();
      data.inventory.inventoryValue = 0;

      render(<BasicReportsClient reportsData={data} />);

      // There will be multiple $0 values, just check component renders
      const zeroValues = screen.getAllByText('$0');
      expect(zeroValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Currency Formatting', () => {
    it('should format large amounts correctly', () => {
      const data = createMockReportsData();
      data.revenue.monthSales = { total: 1250000, count: 500 };

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.getByText(/\$1,250,000/)).toBeInTheDocument();
    });

    it('should format small amounts correctly', () => {
      const data = createMockReportsData();
      data.revenue.averageTicket = 50;

      render(<BasicReportsClient reportsData={data} />);

      expect(screen.getByText(/\$50/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible export button', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      const exportButton = screen.getByRole('button', { name: /exportar resumen/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByRole('heading', { level: 1, name: 'Reportes Básicos' })).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render 4 stat cards', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Ventas del Mes')).toBeInTheDocument();
      expect(screen.getByText('Clientes Activos')).toBeInTheDocument();
      expect(screen.getByText('Ticket Promedio')).toBeInTheDocument();
      expect(screen.getByText('Inventario')).toBeInTheDocument();
    });

    it('should render 2 top 5 list sections', () => {
      render(<BasicReportsClient reportsData={createMockReportsData()} />);

      expect(screen.getByText('Top 5 Servicios')).toBeInTheDocument();
      expect(screen.getByText('Top 5 Clientes')).toBeInTheDocument();
    });
  });
});
