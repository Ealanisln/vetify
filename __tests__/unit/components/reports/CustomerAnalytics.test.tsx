/**
 * Unit tests for CustomerAnalytics component
 * Tests stat cards, charts, customer list, and pluralization
 */

import { render, screen } from '@testing-library/react';
import CustomerAnalytics from '@/components/reports/CustomerAnalytics';
import { CustomerAnalytics as CustomerAnalyticsType } from '@/lib/reports';

// Mock Recharts to avoid SVG rendering issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
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

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    const d = new Date(date);
    // Simple mock format
    return `${d.getDate()} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()]} ${d.getFullYear()}`;
  }),
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

const createMockData = (overrides: Partial<CustomerAnalyticsType> = {}): CustomerAnalyticsType => ({
  totalCustomers: 150,
  newCustomersThisMonth: 12,
  newCustomersLastMonth: 10,
  customerGrowth: 20,
  activeCustomers: 120,
  topCustomers: [
    {
      id: 'cust-1',
      name: 'Juan Pérez',
      totalSpent: 8188.20,
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
      visitCount: 1,
      lastVisit: new Date('2025-10-24'),
    },
  ],
  customerRetention: 80,
  ...overrides,
});

describe('CustomerAnalytics', () => {
  describe('Stat Cards Rendering', () => {
    it('should render Total Clientes stat card', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Total Clientes')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render Nuevos Este Mes stat card', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Nuevos Este Mes')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should render Clientes Activos stat card', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      // There are two "Clientes Activos" texts - one in stat card and one in insights
      const clientesActivosElements = screen.getAllByText('Clientes Activos');
      expect(clientesActivosElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('should render Retención stat card', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Retención')).toBeInTheDocument();
      // 80.0% appears in both stat card and insights section
      const percentageElements = screen.getAllByText('80.0%');
      expect(percentageElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show positive growth indicator', () => {
      render(<CustomerAnalytics data={createMockData({ customerGrowth: 20 })} />);

      expect(screen.getByText(/\+20\.0%/)).toBeInTheDocument();
    });

    it('should show negative growth indicator', () => {
      render(<CustomerAnalytics data={createMockData({ customerGrowth: -15 })} />);

      expect(screen.getByText(/-15\.0%/)).toBeInTheDocument();
    });
  });

  describe('Spanish Pluralization', () => {
    it('should use singular "visita" for 1 visit', () => {
      const mockData = createMockData({
        topCustomers: [
          {
            id: 'cust-1',
            name: 'Juan Pérez',
            totalSpent: 5000,
            visitCount: 1,
            lastVisit: new Date('2025-10-23'),
          },
        ],
      });

      render(<CustomerAnalytics data={mockData} />);

      expect(screen.getByText('1 visita')).toBeInTheDocument();
    });

    it('should use plural "visitas" for multiple visits', () => {
      const mockData = createMockData({
        topCustomers: [
          {
            id: 'cust-1',
            name: 'Juan Pérez',
            totalSpent: 8000,
            visitCount: 4,
            lastVisit: new Date('2025-10-23'),
          },
        ],
      });

      render(<CustomerAnalytics data={mockData} />);

      expect(screen.getByText('4 visitas')).toBeInTheDocument();
    });

    it('should use plural "visitas" for 0 visits', () => {
      const mockData = createMockData({
        topCustomers: [
          {
            id: 'cust-1',
            name: 'Juan Pérez',
            totalSpent: 0,
            visitCount: 0,
            lastVisit: new Date('2025-10-23'),
          },
        ],
      });

      render(<CustomerAnalytics data={mockData} />);

      expect(screen.getByText('0 visitas')).toBeInTheDocument();
    });
  });

  describe('Top Customers List', () => {
    it('should render customer names', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    it('should render customer ranking numbers', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      // Check for ranking indicators (1, 2, 3)
      const rankings = screen.getAllByText(/^[123]$/);
      expect(rankings.length).toBeGreaterThanOrEqual(3);
    });

    it('should format currency values correctly', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      // Check for Mexican peso format (should include $ and comma separators)
      expect(screen.getByText(/\$8,188/)).toBeInTheDocument();
      expect(screen.getByText(/\$7,203/)).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('should show empty message when no customers', () => {
      const emptyData = createMockData({ topCustomers: [] });

      render(<CustomerAnalytics data={emptyData} />);

      expect(screen.getByText('No hay datos de clientes disponibles')).toBeInTheDocument();
    });

    it('should handle zero total customers', () => {
      const zeroData = createMockData({
        totalCustomers: 0,
        activeCustomers: 0,
      });

      render(<CustomerAnalytics data={zeroData} />);

      // Should not crash and should show 0
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  describe('Charts Rendering', () => {
    it('should render Segmentación de Clientes chart section', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Segmentación de Clientes')).toBeInTheDocument();
    });

    it('should render Top Clientes por Ingresos chart section', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Top Clientes por Ingresos')).toBeInTheDocument();
    });

    it('should render Mejores Clientes section', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Mejores Clientes')).toBeInTheDocument();
    });
  });

  describe('Customer Insights', () => {
    it('should render Insights de Clientes section', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Insights de Clientes')).toBeInTheDocument();
    });

    it('should show Gasto Promedio Top 10', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Gasto Promedio Top 10')).toBeInTheDocument();
    });

    it('should show Visitas Promedio Top 10', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      expect(screen.getByText('Visitas Promedio Top 10')).toBeInTheDocument();
    });

    it('should show Clientes Activos percentage', () => {
      render(<CustomerAnalytics data={createMockData()} />);

      // 120 active out of 150 total = 80%
      // Both appear in multiple places (stat card and insights section)
      const percentageElements = screen.getAllByText('80.0%');
      expect(percentageElements.length).toBeGreaterThanOrEqual(1);
      const clientesActivosElements = screen.getAllByText('Clientes Activos');
      expect(clientesActivosElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate average spent correctly', () => {
      const mockData = createMockData({
        topCustomers: [
          {
            id: 'cust-1',
            name: 'Customer 1',
            totalSpent: 1000,
            visitCount: 2,
            lastVisit: new Date(),
          },
          {
            id: 'cust-2',
            name: 'Customer 2',
            totalSpent: 2000,
            visitCount: 3,
            lastVisit: new Date(),
          },
        ],
      });

      render(<CustomerAnalytics data={mockData} />);

      // Average: (1000 + 2000) / 2 = 1500
      expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
    });

    it('should calculate average visits correctly', () => {
      const mockData = createMockData({
        topCustomers: [
          {
            id: 'cust-1',
            name: 'Customer 1',
            totalSpent: 1000,
            visitCount: 2,
            lastVisit: new Date(),
          },
          {
            id: 'cust-2',
            name: 'Customer 2',
            totalSpent: 2000,
            visitCount: 4,
            lastVisit: new Date(),
          },
        ],
      });

      render(<CustomerAnalytics data={mockData} />);

      // Average visits: (2 + 4) / 2 = 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format large amounts correctly', () => {
      const mockData = createMockData({
        topCustomers: [
          {
            id: 'cust-1',
            name: 'High Value Customer',
            totalSpent: 125000,
            visitCount: 10,
            lastVisit: new Date(),
          },
        ],
      });

      render(<CustomerAnalytics data={mockData} />);

      // Should show formatted as MXN currency (minimumFractionDigits: 0)
      // May appear in multiple places (table and insights)
      const currencyElements = screen.getAllByText(/\$125,000/);
      expect(currencyElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
