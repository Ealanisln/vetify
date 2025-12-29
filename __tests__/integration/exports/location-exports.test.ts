/**
 * Integration tests for Location Reports Export functionality
 * Tests the integration between export functions and report data structures
 */

// Mock ExcelJS module
const mockAddRow = jest.fn();
const mockGetRow = jest.fn(() => ({
  font: {},
  fill: {},
}));
const mockWorksheet = {
  columns: null as unknown,
  addRow: mockAddRow,
  getRow: mockGetRow,
};
const mockAddWorksheet = jest.fn(() => mockWorksheet);
const mockWriteBuffer = jest.fn(() => Promise.resolve(new ArrayBuffer(8)));
const mockWorkbook = {
  addWorksheet: mockAddWorksheet,
  xlsx: {
    writeBuffer: mockWriteBuffer,
  },
};

jest.mock('exceljs', () => ({
  __esModule: true,
  default: {
    Workbook: jest.fn(() => mockWorkbook),
  },
}));

// Mock jspdf module
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    text: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    setPage: jest.fn(),
    getNumberOfPages: jest.fn(() => 1),
    addPage: jest.fn(),
    lastAutoTable: { finalY: 100 },
  }));
});

// Mock jspdf-autotable
jest.mock('jspdf-autotable', () => jest.fn());

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
    if (formatStr === 'd-MMM') return '1-ene';
    if (formatStr === 'd-MMM-yyyy') return '31-ene-2024';
    if (formatStr.includes('MMMM')) return '15 de enero de 2024';
    return '2024-01-15';
  }),
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock browser APIs for ExcelJS download (node environment)
const mockClick = jest.fn();
const mockAnchorElement = {
  href: '',
  download: '',
  click: mockClick,
};

// Mock document and URL for node environment
const mockDocument = {
  createElement: jest.fn(() => mockAnchorElement),
};

const mockURL = {
  createObjectURL: jest.fn(() => 'blob:test-url'),
  revokeObjectURL: jest.fn(),
};

// Set up global mocks before imports
(global as unknown as { document: typeof mockDocument }).document = mockDocument;
(global as unknown as { URL: typeof mockURL }).URL = mockURL;
(global as unknown as { Blob: typeof Blob }).Blob = class MockBlob {
  constructor(public parts: unknown[], public options: { type: string }) {}
} as unknown as typeof Blob;

// Import mocked modules
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import after mocks
import {
  createLocationReportExcel,
  createLocationReportPDF,
  createComparisonReportExcel,
  createComparisonReportPDF,
} from '@/lib/exports';

import type {
  LocationRevenueAnalytics,
  LocationInventoryAnalytics,
  LocationPerformanceMetrics,
  LocationComparison,
} from '@/lib/reports-location';

// Get mock references
const mockAutoTable = autoTable as jest.Mock;

describe('Location Exports Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWorksheet.columns = null;
  });

  // Mock data that simulates real report data
  const mockRevenueData: LocationRevenueAnalytics = {
    todaySales: { total: 5250.50, count: 12 },
    weekSales: { total: 28750.00, count: 68 },
    monthSales: { total: 125000.00, count: 285 },
    yearSales: { total: 1450000.00, count: 3420 },
    averageTicket: 438.60,
    monthlyGrowth: 18.5,
  };

  const mockInventoryData: LocationInventoryAnalytics = {
    totalItems: 342,
    inventoryValue: 285000.00,
    lowStockCount: 15,
    categories: [
      { name: 'Medicamentos', count: 120 },
      { name: 'Vacunas', count: 45 },
      { name: 'Alimentos', count: 88 },
      { name: 'Accesorios', count: 89 },
    ],
    topProducts: [
      { id: 'prod-1', name: 'Vacuna Antirrábica', revenue: 15000, quantitySold: 150, profit: 5500 },
      { id: 'prod-2', name: 'Desparasitante Canino', revenue: 12500, quantitySold: 200, profit: 4200 },
      { id: 'prod-3', name: 'Antibiótico Oral', revenue: 10800, quantitySold: 85, profit: 3800 },
      { id: 'prod-4', name: 'Antipulgas', revenue: 9500, quantitySold: 120, profit: 3200 },
      { id: 'prod-5', name: 'Vitaminas Caninas', revenue: 8200, quantitySold: 95, profit: 2800 },
    ],
  };

  const mockPerformanceData: LocationPerformanceMetrics = {
    appointments: {
      total: 285,
      completed: 245,
      cancelled: 28,
      noShow: 12,
      completionRate: 85.96,
    },
    customers: {
      total: 856,
      new: 78,
      active: 524,
      retentionRate: 61.21,
    },
    staff: {
      total: 12,
      active: 10,
      appointmentsPerStaff: 23.75,
    },
  };

  const mockComparisonData: LocationComparison[] = [
    {
      locationId: 'loc-1',
      locationName: 'Sucursal Centro',
      revenue: 125000,
      appointments: 285,
      customers: 856,
      inventoryValue: 285000,
      averageTicket: 438.60,
      rank: 1,
    },
    {
      locationId: 'loc-2',
      locationName: 'Sucursal Norte',
      revenue: 98500,
      appointments: 220,
      customers: 650,
      inventoryValue: 215000,
      averageTicket: 447.73,
      rank: 2,
    },
    {
      locationId: 'loc-3',
      locationName: 'Sucursal Sur',
      revenue: 75000,
      appointments: 175,
      customers: 520,
      inventoryValue: 165000,
      averageTicket: 428.57,
      rank: 3,
    },
  ];

  describe('Excel Export Integration', () => {
    describe('Location Report Export', () => {
      it('should generate complete Excel report with all data sections', async () => {
        await createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Sucursal Centro'
        );

        // Verify workbook was created with all sheets
        expect(ExcelJS.Workbook).toHaveBeenCalled();
        expect(mockAddWorksheet).toHaveBeenCalledWith('Ventas');
        expect(mockAddWorksheet).toHaveBeenCalledWith('Inventario');
        expect(mockAddWorksheet).toHaveBeenCalledWith('Rendimiento');
        expect(mockWriteBuffer).toHaveBeenCalled();
      });

      it('should include correct revenue data in export', async () => {
        await createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        // Verify revenue metrics are added via addRow
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'Ventas Hoy' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'Ventas Semana' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'Ventas Mes' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'Ventas Año' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'Ticket Promedio' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'Crecimiento Mensual' }));
      });

      it('should include top products in inventory section', async () => {
        await createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        // Should have TOP PRODUCTOS row
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Metrica: 'TOP PRODUCTOS' }));
      });

      it('should include all performance categories', async () => {
        await createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        // Verify all categories are present
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Categoria: 'Citas' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Categoria: 'Clientes' }));
        expect(mockAddRow).toHaveBeenCalledWith(expect.objectContaining({ Categoria: 'Personal' }));
      });

      it('should handle date range in filename', async () => {
        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        await createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro',
          dateRange
        );

        expect(mockWriteBuffer).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    });

    describe('Comparison Report Export', () => {
      it('should generate comparison Excel with all locations', async () => {
        await createComparisonReportExcel(mockComparisonData);

        expect(mockAddWorksheet).toHaveBeenCalledWith('Comparación');
        // 3 locations = 3 addRow calls for comparison data
        expect(mockAddRow).toHaveBeenCalledTimes(3);
      });

      it('should sort locations by rank', async () => {
        const unsorted = [...mockComparisonData].reverse();
        await createComparisonReportExcel(unsorted);

        // First addRow call should be for rank 1
        const firstCall = mockAddRow.mock.calls[0][0];
        expect(firstCall.Ranking).toBe(1);
      });

      it('should include all comparison metrics', async () => {
        await createComparisonReportExcel(mockComparisonData);

        expect(mockAddRow).toHaveBeenCalledWith(
          expect.objectContaining({
            Ubicacion: 'Sucursal Centro',
            Ranking: 1,
          })
        );
      });
    });
  });

  describe('PDF Export Integration', () => {
    describe('Location Report Export', () => {
      it('should generate complete PDF report', () => {
        createLocationReportPDF(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Sucursal Centro'
        );

        expect(jsPDF).toHaveBeenCalled();
      });

      it('should create tables for each section', () => {
        createLocationReportPDF(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        // Should have multiple table calls (Ventas, Inventario, Top Products, Rendimiento)
        expect(mockAutoTable).toHaveBeenCalled();
      });

      it('should include top products section when available', () => {
        createLocationReportPDF(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        // Verify autoTable was called with top products data
        expect(mockAutoTable).toHaveBeenCalled();
      });

      it('should handle empty top products gracefully', () => {
        const inventoryNoProducts = {
          ...mockInventoryData,
          topProducts: [],
        };

        expect(() => {
          createLocationReportPDF(
            mockRevenueData,
            inventoryNoProducts,
            mockPerformanceData,
            'Centro'
          );
        }).not.toThrow();
      });
    });

    describe('Comparison Report Export', () => {
      it('should generate comparison PDF', () => {
        createComparisonReportPDF(mockComparisonData);

        expect(jsPDF).toHaveBeenCalled();
      });

      it('should create ranking table', () => {
        createComparisonReportPDF(mockComparisonData);

        expect(mockAutoTable).toHaveBeenCalled();
      });
    });
  });

  describe('Data Transformation', () => {
    it('should format currency values correctly in Excel export', async () => {
      await createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      // Find the Ventas Hoy row call
      const todaySalesCall = mockAddRow.mock.calls.find(
        (call) => call[0].Metrica === 'Ventas Hoy'
      );

      // Should be formatted as currency string
      expect(todaySalesCall[0].Total).toMatch(/\$|MXN/);
    });

    it('should format percentage values correctly', async () => {
      await createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const growthCall = mockAddRow.mock.calls.find(
        (call) => call[0].Metrica === 'Crecimiento Mensual'
      );

      expect(growthCall[0].Total).toMatch(/%$/);
    });

    it('should handle decimal values in performance metrics', async () => {
      await createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const completionRateCall = mockAddRow.mock.calls.find(
        (call) => call[0].Metrica === 'Tasa Completación'
      );

      expect(completionRateCall[0].Valor).toMatch(/%$/);
    });
  });

  describe('Filename Sanitization', () => {
    it('should sanitize special characters in location name', async () => {
      await createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Sucursal #1 - Norte/Centro'
      );

      expect(mockWriteBuffer).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle unicode characters in location name', async () => {
      await createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Sucursal Ñoño'
      );

      expect(mockWriteBuffer).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values in revenue data', async () => {
      const zeroRevenue: LocationRevenueAnalytics = {
        todaySales: { total: 0, count: 0 },
        weekSales: { total: 0, count: 0 },
        monthSales: { total: 0, count: 0 },
        yearSales: { total: 0, count: 0 },
        averageTicket: 0,
        monthlyGrowth: 0,
      };

      await expect(
        createLocationReportExcel(
          zeroRevenue,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        )
      ).resolves.not.toThrow();
    });

    it('should handle negative growth values', async () => {
      const negativeGrowth: LocationRevenueAnalytics = {
        ...mockRevenueData,
        monthlyGrowth: -15.5,
      };

      await createLocationReportExcel(
        negativeGrowth,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const growthCall = mockAddRow.mock.calls.find(
        (call) => call[0].Metrica === 'Crecimiento Mensual'
      );

      expect(growthCall[0].Total).toContain('-15.5%');
    });

    it('should handle single location in comparison', async () => {
      const singleLocation = [mockComparisonData[0]];

      await expect(createComparisonReportExcel(singleLocation)).resolves.not.toThrow();
    });

    it('should handle many locations in comparison', async () => {
      const manyLocations = Array.from({ length: 10 }, (_, i) => ({
        ...mockComparisonData[0],
        locationId: `loc-${i + 1}`,
        locationName: `Sucursal ${i + 1}`,
        rank: i + 1,
      }));

      await expect(createComparisonReportExcel(manyLocations)).resolves.not.toThrow();
    });
  });
});
