/**
 * Unit tests for AdvancedReportsSection component
 * Tests tab navigation, export functionality, and rendering
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvancedReportsSection from '@/components/reports/AdvancedReportsSection';
import { exportToCSV } from '@/lib/reports';

// Mock Recharts to avoid SVG rendering issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock exportToCSV
jest.mock('@/lib/reports', () => ({
  exportToCSV: jest.fn(),
}));

const mockExportToCSV = exportToCSV as jest.MockedFunction<typeof exportToCSV>;

// Mock data that matches the component's expected types
const mockReportsData = {
  revenue: {
    todaySales: { total: 1500, count: 5 },
    weekSales: { total: 7500, count: 25 },
    monthSales: { total: 30000, count: 100 },
    yearSales: { total: 360000, count: 1200 },
    monthlyGrowth: 12.5,
    averageTicket: 300,
    dailySales: [
      { date: '2025-12-20', total: 3380.5, count: 4 },
      { date: '2025-12-31', total: 1616.36, count: 2 },
    ],
    monthlySales: [
      { month: '2025-11', total: 28000, count: 90 },
      { month: '2025-12', total: 30000, count: 100 },
    ],
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
      {
        id: 'prod-2',
        name: 'Shampoo Antipulgas',
        revenue: 3000,
        quantitySold: 60,
        profit: 1200,
      },
    ],
    lowStockItems: [
      {
        id: 'low-1',
        name: 'Antibióticos',
        currentStock: 5,
        minStock: 10,
      },
    ],
    inventoryValue: 150000,
  },
};

describe('AdvancedReportsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      expect(screen.getByText('Analytics Avanzados')).toBeInTheDocument();
      expect(
        screen.getByText('Análisis detallado con gráficos interactivos y tendencias')
      ).toBeInTheDocument();
    });

    it('should render all three tabs', () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Servicios e Inventario')).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
    });

    it('should have Ingresos tab active by default', () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const ingresosTab = screen.getByText('Ingresos').closest('button');
      expect(ingresosTab).toHaveClass('border-primary');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Clientes tab when clicked', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const clientesTab = screen.getByText('Clientes');
      fireEvent.click(clientesTab);

      await waitFor(() => {
        const button = clientesTab.closest('button');
        expect(button).toHaveClass('border-primary');
      });
    });

    it('should switch to Servicios e Inventario tab when clicked', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const serviciosTab = screen.getByText('Servicios e Inventario');
      fireEvent.click(serviciosTab);

      await waitFor(() => {
        const button = serviciosTab.closest('button');
        expect(button).toHaveClass('border-primary');
      });
    });

    it('should update export button text based on active tab', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      // Default tab
      expect(screen.getByRole('button', { name: /exportar ingresos/i })).toBeInTheDocument();

      // Switch to Clientes
      fireEvent.click(screen.getByText('Clientes'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar clientes/i })).toBeInTheDocument();
      });

      // Switch to Servicios e Inventario
      fireEvent.click(screen.getByText('Servicios e Inventario'));
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /exportar servicios e inventario/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should call exportToCSV with revenue data when on Ingresos tab', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const exportButton = screen.getByRole('button', { name: /exportar ingresos/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockExportToCSV).toHaveBeenCalledTimes(1);
        // Check the filename argument
        expect(mockExportToCSV).toHaveBeenCalledWith(expect.any(Array), 'revenue-report');
      });
    });

    it('should include properly rounded values in revenue export', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const exportButton = screen.getByRole('button', { name: /exportar ingresos/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportCall = mockExportToCSV.mock.calls[0][0];

        // Check that daily sales are properly rounded
        const dailySales = exportCall.filter(
          (item: { date: string }) =>
            item.date !== 'Esta Semana' && item.date !== 'Este Mes' && item.date !== 'Este Año'
        );
        dailySales.forEach((sale: { total: number }) => {
          const decimalPlaces = (sale.total.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        });
      });
    });

    it('should include period labels in revenue export summary', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const exportButton = screen.getByRole('button', { name: /exportar ingresos/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportCall = mockExportToCSV.mock.calls[0][0];

        // Check for period labels
        const periodLabels = exportCall.map((item: { date: string }) => item.date);
        expect(periodLabels).toContain('Esta Semana');
        expect(periodLabels).toContain('Este Mes');
        expect(periodLabels).toContain('Este Año');
      });
    });

    it('should call exportToCSV with customer data when on Clientes tab', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      // Switch to Clientes tab
      fireEvent.click(screen.getByText('Clientes'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar clientes/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar clientes/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockExportToCSV).toHaveBeenCalledWith(
          mockReportsData.customers.topCustomers,
          'customers-report'
        );
      });
    });

    it('should call exportToCSV with service data when on Servicios tab', async () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      // Switch to Servicios tab
      fireEvent.click(screen.getByText('Servicios e Inventario'));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /exportar servicios e inventario/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar servicios e inventario/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockExportToCSV).toHaveBeenCalledWith(
          mockReportsData.services.topServices,
          'services-report'
        );
      });
    });
  });

  describe('Empty State Handling', () => {
    it('should render without crashing when dailySales is empty', () => {
      const emptyRevenueData = {
        ...mockReportsData,
        revenue: {
          ...mockReportsData.revenue,
          dailySales: [],
          monthlySales: [],
        },
      };

      render(<AdvancedReportsSection reportsData={emptyRevenueData} />);

      expect(screen.getByText('Analytics Avanzados')).toBeInTheDocument();
    });

    it('should render without crashing when topCustomers is empty', () => {
      const emptyCustomersData = {
        ...mockReportsData,
        customers: {
          ...mockReportsData.customers,
          topCustomers: [],
        },
      };

      render(<AdvancedReportsSection reportsData={emptyCustomersData} />);

      fireEvent.click(screen.getByText('Clientes'));

      expect(screen.getByText('Clientes')).toBeInTheDocument();
    });

    it('should render without crashing when topServices is empty', () => {
      const emptyServicesData = {
        ...mockReportsData,
        services: {
          ...mockReportsData.services,
          topServices: [],
          serviceCategories: [],
        },
      };

      render(<AdvancedReportsSection reportsData={emptyServicesData} />);

      fireEvent.click(screen.getByText('Servicios e Inventario'));

      expect(screen.getByText('Servicios e Inventario')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab buttons', () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const tabs = screen.getAllByRole('button').filter(btn =>
        btn.textContent?.includes('Ingresos') ||
        btn.textContent?.includes('Clientes') ||
        btn.textContent?.includes('Servicios')
      );

      // Filter out export button
      const tabButtons = tabs.filter(btn => !btn.textContent?.includes('Exportar'));
      expect(tabButtons.length).toBe(3);
    });

    it('should have accessible export button', () => {
      render(<AdvancedReportsSection reportsData={mockReportsData} />);

      const exportButton = screen.getByRole('button', { name: /exportar/i });
      expect(exportButton).toBeInTheDocument();
    });
  });
});
