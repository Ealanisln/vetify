/**
 * Unit tests for Excel export utilities (ExcelJS implementation)
 */

import ExcelJS from 'exceljs';

// Mock ExcelJS
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

// Mock browser APIs
const mockClick = jest.fn();
const mockAnchorElement = {
  href: '',
  download: '',
  click: mockClick,
};

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

// Store original URL methods
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('Excel Export Utilities (ExcelJS)', () => {
  let createElementSpy: jest.SpyInstance;

  beforeAll(() => {
    // Override URL methods for all tests
    URL.createObjectURL = jest.fn(() => 'blob:test-url');
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    // Restore original URL methods
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorksheet.columns = null;

    // Mock document.createElement
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchorElement as unknown as HTMLElement);
  });

  afterEach(() => {
    createElementSpy.mockRestore();
  });

  describe('exportToExcel', () => {
    it('should create a new workbook', async () => {
      const sheets = [{ name: 'Test', data: [{ col1: 'value1' }] }];
      await exportToExcel(sheets, 'test-file');

      expect(ExcelJS.Workbook).toHaveBeenCalled();
    });

    it('should create worksheets for each sheet', async () => {
      const sheets = [
        { name: 'Sheet1', data: [{ col1: 'value1' }] },
        { name: 'Sheet2', data: [{ col2: 'value2' }] },
      ];
      await exportToExcel(sheets, 'test-file');

      expect(mockAddWorksheet).toHaveBeenCalledTimes(2);
      expect(mockAddWorksheet).toHaveBeenCalledWith('Sheet1');
      expect(mockAddWorksheet).toHaveBeenCalledWith('Sheet2');
    });

    it('should add data rows to worksheets', async () => {
      const sheets = [{ name: 'Test', data: [{ col1: 'value1' }, { col1: 'value2' }] }];
      await exportToExcel(sheets, 'test-file');

      expect(mockAddRow).toHaveBeenCalledTimes(2);
      expect(mockAddRow).toHaveBeenCalledWith({ col1: 'value1' });
      expect(mockAddRow).toHaveBeenCalledWith({ col1: 'value2' });
    });

    it('should trigger download with correct filename', async () => {
      const sheets = [{ name: 'Test', data: [{ col1: 'value1' }] }];
      await exportToExcel(sheets, 'test-report');

      expect(mockWriteBuffer).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('should handle empty sheets array', async () => {
      await exportToExcel([], 'empty-file');

      expect(ExcelJS.Workbook).toHaveBeenCalled();
      expect(mockAddWorksheet).not.toHaveBeenCalled();
      expect(mockWriteBuffer).toHaveBeenCalled();
    });

    it('should handle sheets with empty data', async () => {
      const sheets = [{ name: 'Empty', data: [] }];
      await exportToExcel(sheets, 'empty-data');

      expect(mockAddWorksheet).toHaveBeenCalledWith('Empty');
      expect(mockAddRow).not.toHaveBeenCalled();
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

    it('should create report with all required sheets', async () => {
      await createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      // Should create 3 worksheets: Ventas, Inventario, Rendimiento
      expect(mockAddWorksheet).toHaveBeenCalledWith('Ventas');
      expect(mockAddWorksheet).toHaveBeenCalledWith('Inventario');
      expect(mockAddWorksheet).toHaveBeenCalledWith('Rendimiento');
    });

    it('should add revenue data rows', async () => {
      await createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      // Check that revenue metrics are added
      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Metrica: 'Ventas Hoy' })
      );
      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Metrica: 'Ventas Mes' })
      );
      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Metrica: 'Ticket Promedio' })
      );
    });

    it('should add inventory data with top products', async () => {
      await createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Metrica: 'Productos Totales' })
      );
      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Metrica: 'TOP PRODUCTOS' })
      );
    });

    it('should add performance metrics', async () => {
      await createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Categoria: 'Citas', Metrica: 'Total' })
      );
      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Categoria: 'Clientes', Metrica: 'Total' })
      );
      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({ Categoria: 'Personal', Metrica: 'Total' })
      );
    });

    it('should trigger file download', async () => {
      await createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      expect(mockWriteBuffer).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle empty top products array', async () => {
      const inventoryNoProducts = {
        ...mockInventory,
        topProducts: [],
      };

      await createLocationReportExcel(mockRevenue, inventoryNoProducts, mockPerformance, 'Centro');

      expect(mockWriteBuffer).toHaveBeenCalled();
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

    it('should create comparison sheet', async () => {
      await createComparisonReportExcel(mockComparison);

      expect(mockAddWorksheet).toHaveBeenCalledWith('Comparación');
    });

    it('should add location data rows sorted by rank', async () => {
      const unsortedComparison = [
        { ...mockComparison[1] },
        { ...mockComparison[0] },
      ];

      await createComparisonReportExcel(unsortedComparison);

      // First call should be for rank 1
      const firstRowCall = mockAddRow.mock.calls[0][0];
      expect(firstRowCall.Ranking).toBe(1);
    });

    it('should include all comparison metrics in rows', async () => {
      await createComparisonReportExcel(mockComparison);

      expect(mockAddRow).toHaveBeenCalledWith(
        expect.objectContaining({
          Ranking: 1,
          Ubicacion: 'Sucursal Norte',
        })
      );
    });

    it('should trigger file download', async () => {
      await createComparisonReportExcel(mockComparison);

      expect(mockWriteBuffer).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
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

    it('should format currency values with $ symbol', async () => {
      await createLocationReportExcel(mockRevenue, mockInventory, mockPerformance, 'Test');

      // Check that at least one row contains formatted currency
      const addRowCalls = mockAddRow.mock.calls;
      const hasFormattedCurrency = addRowCalls.some(
        (call) => call[0].Total && typeof call[0].Total === 'string' && call[0].Total.includes('$')
      );
      expect(hasFormattedCurrency).toBe(true);
    });
  });
});
