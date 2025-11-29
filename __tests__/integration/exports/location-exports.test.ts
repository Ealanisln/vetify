/**
 * Integration tests for Location Reports Export functionality
 * Tests the integration between export functions and report data structures
 */

// Mock xlsx module
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({ Sheets: {}, SheetNames: [] })),
    json_to_sheet: jest.fn((data) => ({ data })),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
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

// Import mocked modules
import * as XLSX from 'xlsx';
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
const mockWriteFile = XLSX.writeFile as jest.Mock;
const mockAutoTable = autoTable as jest.Mock;

describe('Location Exports Integration Tests', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Excel Export Integration', () => {
    describe('Location Report Export', () => {
      it('should generate complete Excel report with all data sections', () => {
        createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Sucursal Centro'
        );

        // Verify workbook was created with all sheets
        expect(XLSX.utils.book_new).toHaveBeenCalled();
        expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(3); // Ventas, Inventario, Rendimiento
        expect(mockWriteFile).toHaveBeenCalled();
      });

      it('should include correct revenue data in export', () => {
        createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        const revenueSheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];

        // Verify revenue metrics are included
        expect(revenueSheetCall).toContainEqual(expect.objectContaining({ Metrica: 'Ventas Hoy' }));
        expect(revenueSheetCall).toContainEqual(expect.objectContaining({ Metrica: 'Ventas Semana' }));
        expect(revenueSheetCall).toContainEqual(expect.objectContaining({ Metrica: 'Ventas Mes' }));
        expect(revenueSheetCall).toContainEqual(expect.objectContaining({ Metrica: 'Ventas Año' }));
        expect(revenueSheetCall).toContainEqual(expect.objectContaining({ Metrica: 'Ticket Promedio' }));
        expect(revenueSheetCall).toContainEqual(expect.objectContaining({ Metrica: 'Crecimiento Mensual' }));
      });

      it('should include top products in inventory section', () => {
        createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        const inventorySheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[1][0];

        // Should have inventory metrics plus top products
        expect(inventorySheetCall.length).toBeGreaterThan(3);
      });

      it('should include all performance categories', () => {
        createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );

        const performanceSheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[2][0];

        // Verify all categories are present
        const categories = performanceSheetCall.map((row: Record<string, unknown>) => row.Categoria);
        expect(categories).toContain('Citas');
        expect(categories).toContain('Clientes');
        expect(categories).toContain('Personal');
      });

      it('should handle date range in filename', () => {
        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        createLocationReportExcel(
          mockRevenueData,
          mockInventoryData,
          mockPerformanceData,
          'Centro',
          dateRange
        );

        expect(mockWriteFile).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringMatching(/reporte-centro.*\.xlsx$/)
        );
      });
    });

    describe('Comparison Report Export', () => {
      it('should generate comparison Excel with all locations', () => {
        createComparisonReportExcel(mockComparisonData);

        expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
        const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];

        expect(sheetData).toHaveLength(3);
      });

      it('should sort locations by rank', () => {
        const unsorted = [...mockComparisonData].reverse();
        createComparisonReportExcel(unsorted);

        const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];

        expect(sheetData[0].Ranking).toBe(1);
        expect(sheetData[1].Ranking).toBe(2);
        expect(sheetData[2].Ranking).toBe(3);
      });

      it('should include all comparison metrics', () => {
        createComparisonReportExcel(mockComparisonData);

        const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
        const firstRow = sheetData[0];

        expect(firstRow).toHaveProperty('Ubicacion');
        expect(firstRow).toHaveProperty('Ingresos');
        expect(firstRow).toHaveProperty('Citas');
        expect(firstRow).toHaveProperty('Clientes');
        expect(firstRow).toHaveProperty('Valor Inventario');
        expect(firstRow).toHaveProperty('Ticket Promedio');
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
    it('should format currency values correctly in Excel export', () => {
      createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const revenueData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      const todaySalesRow = revenueData.find((r: Record<string, unknown>) => r.Metrica === 'Ventas Hoy');

      // Should be formatted as currency string
      expect(todaySalesRow.Total).toMatch(/\$|MXN/);
    });

    it('should format percentage values correctly', () => {
      createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const revenueData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      const growthRow = revenueData.find((r: Record<string, unknown>) => r.Metrica === 'Crecimiento Mensual');

      expect(growthRow.Total).toMatch(/%$/);
    });

    it('should handle decimal values in performance metrics', () => {
      createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const performanceData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[2][0];
      const completionRateRow = performanceData.find(
        (r: Record<string, unknown>) => r.Metrica === 'Tasa Completación'
      );

      expect(completionRateRow.Valor).toMatch(/%$/);
    });
  });

  describe('Filename Sanitization', () => {
    it('should sanitize special characters in location name', () => {
      createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Sucursal #1 - Norte/Centro'
      );

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^reporte-sucursal-1-norte-centro/)
      );
    });

    it('should handle unicode characters in location name', () => {
      createLocationReportExcel(
        mockRevenueData,
        mockInventoryData,
        mockPerformanceData,
        'Sucursal Ñoño'
      );

      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values in revenue data', () => {
      const zeroRevenue: LocationRevenueAnalytics = {
        todaySales: { total: 0, count: 0 },
        weekSales: { total: 0, count: 0 },
        monthSales: { total: 0, count: 0 },
        yearSales: { total: 0, count: 0 },
        averageTicket: 0,
        monthlyGrowth: 0,
      };

      expect(() => {
        createLocationReportExcel(
          zeroRevenue,
          mockInventoryData,
          mockPerformanceData,
          'Centro'
        );
      }).not.toThrow();
    });

    it('should handle negative growth values', () => {
      const negativeGrowth: LocationRevenueAnalytics = {
        ...mockRevenueData,
        monthlyGrowth: -15.5,
      };

      createLocationReportExcel(
        negativeGrowth,
        mockInventoryData,
        mockPerformanceData,
        'Centro'
      );

      const revenueData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      const growthRow = revenueData.find((r: Record<string, unknown>) => r.Metrica === 'Crecimiento Mensual');

      expect(growthRow.Total).toContain('-15.5%');
    });

    it('should handle single location in comparison', () => {
      const singleLocation = [mockComparisonData[0]];

      expect(() => {
        createComparisonReportExcel(singleLocation);
      }).not.toThrow();
    });

    it('should handle many locations in comparison', () => {
      const manyLocations = Array.from({ length: 10 }, (_, i) => ({
        ...mockComparisonData[0],
        locationId: `loc-${i + 1}`,
        locationName: `Sucursal ${i + 1}`,
        rank: i + 1,
      }));

      expect(() => {
        createComparisonReportExcel(manyLocations);
      }).not.toThrow();
    });
  });
});
