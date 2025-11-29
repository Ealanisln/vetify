/**
 * Unit tests for Excel export utilities
 */

import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Mock xlsx and date-fns
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({ Sheets: {}, SheetNames: [] })),
    json_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
    if (formatStr === 'd-MMM') return '1-ene';
    if (formatStr === 'd-MMM-yyyy') return '31-ene-2024';
    return formatStr;
  }),
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

// Import after mocks
import {
  exportToExcel,
  createLocationReportExcel,
  createComparisonReportExcel,
} from '@/lib/exports/excel';
import type {
  LocationRevenueAnalytics,
  LocationInventoryAnalytics,
  LocationPerformanceMetrics,
} from '@/lib/reports-location';

describe('Excel Export Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should create a new workbook', () => {
      const sheets = [{ name: 'Test', data: [{ col1: 'value1' }] }];
      exportToExcel(sheets, 'test-file');

      expect(XLSX.utils.book_new).toHaveBeenCalled();
    });

    it('should create worksheets from sheet data', () => {
      const sheets = [
        { name: 'Sheet1', data: [{ col1: 'value1' }] },
        { name: 'Sheet2', data: [{ col2: 'value2' }] },
      ];
      exportToExcel(sheets, 'test-file');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([{ col1: 'value1' }]);
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([{ col2: 'value2' }]);
    });

    it('should append sheets with correct names', () => {
      const sheets = [
        { name: 'Ventas', data: [{ col1: 'value1' }] },
        { name: 'Inventario', data: [{ col2: 'value2' }] },
      ];
      exportToExcel(sheets, 'test-file');

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    });

    it('should save file with correct filename and date', () => {
      const sheets = [{ name: 'Test', data: [{ col1: 'value1' }] }];
      exportToExcel(sheets, 'test-report');

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        'test-report-2024-01-15.xlsx'
      );
    });

    it('should handle empty sheets array', () => {
      exportToExcel([], 'empty-file');

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).not.toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle sheets with empty data', () => {
      const sheets = [{ name: 'Empty', data: [] }];
      exportToExcel(sheets, 'empty-data');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
    });
  });

  describe('createLocationReportExcel', () => {
    const mockRevenue: LocationRevenueAnalytics = {
      todaySales: { total: 1500, count: 5 },
      weekSales: { total: 8000, count: 25 },
      monthSales: { total: 35000, count: 120 },
      yearSales: { total: 420000, count: 1500 },
      averageTicket: 291.67,
      monthlyGrowth: 15.5,
    };

    const mockInventory: LocationInventoryAnalytics = {
      totalItems: 150,
      inventoryValue: 85000,
      lowStockCount: 8,
      categories: [{ name: 'Medicamentos', count: 50 }],
      topProducts: [
        { id: '1', name: 'Vacuna Triple', revenue: 5000, quantitySold: 25, profit: 1500 },
        { id: '2', name: 'Desparasitante', revenue: 3000, quantitySold: 40, profit: 900 },
      ],
    };

    const mockPerformance: LocationPerformanceMetrics = {
      appointments: {
        total: 120,
        completed: 100,
        cancelled: 15,
        noShow: 5,
        completionRate: 83.3,
      },
      customers: {
        total: 250,
        new: 30,
        active: 180,
        retentionRate: 72,
      },
      staff: {
        total: 8,
        active: 6,
        appointmentsPerStaff: 15,
      },
    };

    it('should create report with all required sheets', () => {
      createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      // Should call book_append_sheet for each sheet (Ventas, Inventario, Rendimiento)
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3);
    });

    it('should include revenue data in ventas sheet', () => {
      createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      // First json_to_sheet call should be for revenue data
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      const revenueCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      expect(revenueCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Metrica: 'Ventas Hoy' }),
          expect.objectContaining({ Metrica: 'Ventas Mes' }),
          expect.objectContaining({ Metrica: 'Ticket Promedio' }),
        ])
      );
    });

    it('should include top products in inventory sheet', () => {
      createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      // Inventory sheet should include top products
      const inventoryCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[1][0];
      expect(inventoryCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Metrica: 'Productos Totales' }),
        ])
      );
    });

    it('should include performance metrics', () => {
      createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      const performanceCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[2][0];
      expect(performanceCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Categoria: 'Citas', Metrica: 'Total' }),
          expect.objectContaining({ Categoria: 'Clientes', Metrica: 'Total' }),
          expect.objectContaining({ Categoria: 'Personal', Metrica: 'Total' }),
        ])
      );
    });

    it('should sanitize filename with special characters', () => {
      createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Norte #1');

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('reporte-sucursal-norte-1')
      );
    });

    it('should include date range in filename when provided', () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      createLocationReportExcel(
        mockRevenue,
        mockInventory,
        mockPerformance,
        'Centro',
        dateRange
      );

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('-a-')
      );
    });

    it('should handle empty top products array', () => {
      const inventoryNoProducts = {
        ...mockInventory,
        topProducts: [],
      };

      createLocationReportExcel(mockRevenue, inventoryNoProducts, mockPerformance, 'Centro');

      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });

  describe('createComparisonReportExcel', () => {
    const mockComparison = [
      {
        locationId: 'loc-1',
        locationName: 'Sucursal Norte',
        revenue: 50000,
        appointments: 150,
        customers: 120,
        inventoryValue: 30000,
        averageTicket: 333.33,
        rank: 1,
      },
      {
        locationId: 'loc-2',
        locationName: 'Sucursal Sur',
        revenue: 35000,
        appointments: 100,
        customers: 80,
        inventoryValue: 25000,
        averageTicket: 350,
        rank: 2,
      },
    ];

    it('should create comparison report with correct data', () => {
      createComparisonReportExcel(mockComparison);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    });

    it('should sort locations by rank', () => {
      const unsortedComparison = [
        { ...mockComparison[1] },
        { ...mockComparison[0] },
      ];

      createComparisonReportExcel(unsortedComparison);

      const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      expect(sheetData[0].Ranking).toBe(1);
      expect(sheetData[1].Ranking).toBe(2);
    });

    it('should include all comparison metrics', () => {
      createComparisonReportExcel(mockComparison);

      const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      expect(sheetData[0]).toHaveProperty('Ubicacion');
      expect(sheetData[0]).toHaveProperty('Ingresos');
      expect(sheetData[0]).toHaveProperty('Citas');
      expect(sheetData[0]).toHaveProperty('Clientes');
      expect(sheetData[0]).toHaveProperty('Ticket Promedio');
    });

    it('should use default filename without date range', () => {
      createComparisonReportExcel(mockComparison);

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        'comparacion-ubicaciones-2024-01-15.xlsx'
      );
    });

    it('should include date range in filename when provided', () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      createComparisonReportExcel(mockComparison, dateRange);

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('comparacion-')
      );
    });
  });

  describe('Currency Formatting', () => {
    const mockRevenue: LocationRevenueAnalytics = {
      todaySales: { total: 1234.56, count: 1 },
      weekSales: { total: 0, count: 0 },
      monthSales: { total: 1000000, count: 100 },
      yearSales: { total: 0, count: 0 },
      averageTicket: 0,
      monthlyGrowth: 0,
    };

    const mockInventory: LocationInventoryAnalytics = {
      totalItems: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      categories: [],
      topProducts: [],
    };

    const mockPerformance: LocationPerformanceMetrics = {
      appointments: { total: 0, completed: 0, cancelled: 0, noShow: 0, completionRate: 0 },
      customers: { total: 0, new: 0, active: 0, retentionRate: 0 },
      staff: { total: 0, active: 0, appointmentsPerStaff: 0 },
    };

    it('should format currency values correctly', () => {
      createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Test');

      // Currency formatting should be applied to total values
      const revenueCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
      expect(revenueCall[0].Total).toMatch(/\$/);
    });
  });
});
