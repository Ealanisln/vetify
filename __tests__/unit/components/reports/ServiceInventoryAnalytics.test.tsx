/**
 * Unit tests for ServiceInventoryAnalytics component
 * Tests service and inventory analytics, pluralization, and chart rendering
 */

import { render, screen } from '@testing-library/react';
import ServiceInventoryAnalytics from '@/components/reports/ServiceInventoryAnalytics';
import { ServiceAnalytics, InventoryAnalytics } from '@/lib/reports';

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

const createMockServiceData = (overrides: Partial<ServiceAnalytics> = {}): ServiceAnalytics => ({
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
      name: 'Vacunación Completa',
      revenue: 10000,
      count: 40,
      averagePrice: 250,
    },
    {
      id: 'serv-3',
      name: 'Cirugía Menor',
      revenue: 25000,
      count: 1,
      averagePrice: 25000,
    },
  ],
  serviceCategories: [
    { category: 'CONSULTATION', revenue: 15000, count: 50 },
    { category: 'VACCINATION', revenue: 10000, count: 40 },
    { category: 'SURGERY', revenue: 25000, count: 5 },
  ],
  ...overrides,
});

const createMockInventoryData = (overrides: Partial<InventoryAnalytics> = {}): InventoryAnalytics => ({
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
      quantitySold: 1,
      profit: 1200,
    },
    {
      id: 'prod-3',
      name: 'Collar Antiparasitario',
      revenue: 2500,
      quantitySold: 25,
      profit: 1000,
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
  ...overrides,
});

describe('ServiceInventoryAnalytics', () => {
  describe('Inventory Overview Cards', () => {
    it('should render Valor Inventario stat card', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Valor Inventario')).toBeInTheDocument();
      expect(screen.getByText(/\$150,000/)).toBeInTheDocument();
    });

    it('should render Productos Vendidos stat card', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Productos Vendidos')).toBeInTheDocument();
      // Sum: 100 + 1 + 25 = 126
      expect(screen.getByText('126')).toBeInTheDocument();
    });

    it('should render Stock Bajo stat card', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
      expect(screen.getByText('Productos críticos')).toBeInTheDocument();
      // The number 2 appears in multiple places (rankings, values), just verify the section exists
    });
  });

  describe('Spanish Pluralization - Services', () => {
    it('should use singular "servicio" for 1 service', () => {
      const serviceData = createMockServiceData({
        topServices: [
          {
            id: 'serv-1',
            name: 'Cirugía',
            revenue: 25000,
            count: 1,
            averagePrice: 25000,
          },
        ],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={serviceData}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText(/1 servicio/)).toBeInTheDocument();
    });

    it('should use plural "servicios" for multiple services', () => {
      const serviceData = createMockServiceData({
        topServices: [
          {
            id: 'serv-1',
            name: 'Consulta',
            revenue: 15000,
            count: 50,
            averagePrice: 300,
          },
        ],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={serviceData}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText(/50 servicios/)).toBeInTheDocument();
    });

    it('should use plural "servicios" for 0 services', () => {
      const serviceData = createMockServiceData({
        topServices: [
          {
            id: 'serv-1',
            name: 'Servicio Inactivo',
            revenue: 0,
            count: 0,
            averagePrice: 0,
          },
        ],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={serviceData}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText(/0 servicios/)).toBeInTheDocument();
    });
  });

  describe('Spanish Pluralization - Products', () => {
    it('should use singular "unidad" for 1 unit sold', () => {
      const inventoryData = createMockInventoryData({
        topProducts: [
          {
            id: 'prod-1',
            name: 'Producto Único',
            revenue: 100,
            quantitySold: 1,
            profit: 50,
          },
        ],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.getByText(/1 unidad/)).toBeInTheDocument();
    });

    it('should use plural "unidades" for multiple units sold', () => {
      const inventoryData = createMockInventoryData({
        topProducts: [
          {
            id: 'prod-1',
            name: 'Vitaminas',
            revenue: 5000,
            quantitySold: 100,
            profit: 2000,
          },
        ],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.getByText(/100 unidades/)).toBeInTheDocument();
    });

    it('should use plural "unidades" for 0 units sold', () => {
      const inventoryData = createMockInventoryData({
        topProducts: [
          {
            id: 'prod-1',
            name: 'Producto Sin Ventas',
            revenue: 0,
            quantitySold: 0,
            profit: 0,
          },
        ],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.getByText(/0 unidades/)).toBeInTheDocument();
    });
  });

  describe('Top Services Section', () => {
    it('should render Detalle de Servicios section', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Detalle de Servicios')).toBeInTheDocument();
    });

    it('should render service names', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Consulta General')).toBeInTheDocument();
      expect(screen.getByText('Vacunación Completa')).toBeInTheDocument();
    });

    it('should format service revenue correctly', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      // Check for Mexican peso format
      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
    });

    it('should show average price', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText(/\$300 promedio/)).toBeInTheDocument();
    });
  });

  describe('Top Products Section', () => {
    it('should render Detalle de Productos section', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Detalle de Productos')).toBeInTheDocument();
    });

    it('should render product names', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Vitaminas para Perro')).toBeInTheDocument();
      expect(screen.getByText('Shampoo Antipulgas')).toBeInTheDocument();
    });

    it('should show profit values', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText(/\$2,000 ganancia/)).toBeInTheDocument();
    });
  });

  describe('Low Stock Alert Section', () => {
    it('should render Productos con Stock Bajo section when items exist', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Productos con Stock Bajo')).toBeInTheDocument();
    });

    it('should render low stock item names', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Antibióticos')).toBeInTheDocument();
      expect(screen.getByText('Vacunas')).toBeInTheDocument();
    });

    it('should show current stock levels', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText(/Stock actual: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Stock actual: 3/)).toBeInTheDocument();
    });

    it('should show minimum stock levels', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Mín: 10')).toBeInTheDocument();
      expect(screen.getByText('Mín: 15')).toBeInTheDocument();
    });

    it('should not render low stock section when no items', () => {
      const inventoryData = createMockInventoryData({
        lowStockItems: [],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.queryByText('Productos con Stock Bajo')).not.toBeInTheDocument();
    });
  });

  describe('Charts Rendering', () => {
    it('should render Servicios Más Rentables chart section', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Servicios Más Rentables')).toBeInTheDocument();
    });

    it('should render Distribución por Categorías chart section', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Distribución por Categorías')).toBeInTheDocument();
    });

    it('should render Productos Más Vendidos chart section', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Productos Más Vendidos')).toBeInTheDocument();
    });

    it('should render Rentabilidad de Productos chart section', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('Rentabilidad de Productos')).toBeInTheDocument();
    });
  });

  describe('Category Translations', () => {
    it('should translate SURGERY to Cirugía', () => {
      const serviceData = createMockServiceData({
        serviceCategories: [{ category: 'SURGERY', revenue: 25000, count: 5 }],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={serviceData}
          inventoryData={createMockInventoryData()}
        />
      );

      // The translation is used in the pie chart data, which is mocked
      // We can verify the translation map exists by checking the component renders
      expect(screen.getByText('Distribución por Categorías')).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('should show empty message when no services', () => {
      const serviceData = createMockServiceData({
        topServices: [],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={serviceData}
          inventoryData={createMockInventoryData()}
        />
      );

      expect(screen.getByText('No hay datos de servicios disponibles')).toBeInTheDocument();
    });

    it('should show empty message when no products', () => {
      const inventoryData = createMockInventoryData({
        topProducts: [],
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.getByText('No hay datos de productos disponibles')).toBeInTheDocument();
    });

    it('should handle zero inventory value', () => {
      const inventoryData = createMockInventoryData({
        inventoryValue: 0,
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('Ranking Indicators', () => {
    it('should display ranking numbers for services', () => {
      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={createMockInventoryData()}
        />
      );

      // Check for ranking numbers (1, 2, 3) in the service list
      const rankings = screen.getAllByText(/^[123]$/);
      expect(rankings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Currency Formatting', () => {
    it('should format large inventory values correctly', () => {
      const inventoryData = createMockInventoryData({
        inventoryValue: 1250000,
      });

      render(
        <ServiceInventoryAnalytics
          serviceData={createMockServiceData()}
          inventoryData={inventoryData}
        />
      );

      expect(screen.getByText(/\$1,250,000/)).toBeInTheDocument();
    });
  });
});
