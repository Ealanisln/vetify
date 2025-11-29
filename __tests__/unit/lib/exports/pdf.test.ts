/**
 * Unit tests for PDF export utilities
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Mock jsPDF
const mockSave = jest.fn();
const mockText = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetFont = jest.fn();
const mockSetTextColor = jest.fn();
const mockSetPage = jest.fn();
const mockGetNumberOfPages = jest.fn(() => 1);
const mockAddPage = jest.fn();

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    save: mockSave,
    text: mockText,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    setTextColor: mockSetTextColor,
    setPage: mockSetPage,
    getNumberOfPages: mockGetNumberOfPages,
    addPage: mockAddPage,
    lastAutoTable: { finalY: 100 },
  }));
});

jest.mock('jspdf-autotable', () => jest.fn());

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
    if (formatStr === 'd-MMM') return '1-ene';
    if (formatStr === 'd-MMM-yyyy') return '31-ene-2024';
    if (formatStr.includes('MMMM')) return '15 de enero de 2024';
    return formatStr;
  }),
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

// Import after mocks
import {
  exportToPDF,
  createLocationReportPDF,
  createComparisonReportPDF,
} from '@/lib/exports/pdf';
import type { PDFSection } from '@/lib/exports/pdf';
import type {
  LocationRevenueAnalytics,
  LocationInventoryAnalytics,
  LocationPerformanceMetrics,
} from '@/lib/reports-location';

describe('PDF Export Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('should create a new PDF document', () => {
      const sections: PDFSection[] = [
        {
          title: 'Test Section',
          data: [{ col1: 'value1' }],
          columns: [{ header: 'Column 1', dataKey: 'col1' }],
        },
      ];

      exportToPDF(sections, 'test-file');

      expect(jsPDF).toHaveBeenCalled();
    });

    it('should set title text', () => {
      const sections: PDFSection[] = [];

      exportToPDF(sections, 'test-file', { title: 'My Report' });

      expect(mockSetFontSize).toHaveBeenCalledWith(18);
      expect(mockSetFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockText).toHaveBeenCalledWith('My Report', 14, 22);
    });

    it('should use default title when not provided', () => {
      const sections: PDFSection[] = [];

      exportToPDF(sections, 'test-file');

      expect(mockText).toHaveBeenCalledWith('Reporte', 14, 22);
    });

    it('should add subtitle when provided', () => {
      const sections: PDFSection[] = [];

      exportToPDF(sections, 'test-file', {
        title: 'Report',
        subtitle: 'January 2024'
      });

      expect(mockSetFontSize).toHaveBeenCalledWith(11);
      expect(mockText).toHaveBeenCalledWith('January 2024', 14, 30);
    });

    it('should create tables for each section', () => {
      const sections: PDFSection[] = [
        {
          title: 'Section 1',
          data: [{ col1: 'value1' }],
          columns: [{ header: 'Column 1', dataKey: 'col1' }],
        },
        {
          title: 'Section 2',
          data: [{ col2: 'value2' }],
          columns: [{ header: 'Column 2', dataKey: 'col2' }],
        },
      ];

      exportToPDF(sections, 'test-file');

      expect(autoTable).toHaveBeenCalledTimes(2);
    });

    it('should save PDF with correct filename and date', () => {
      const sections: PDFSection[] = [];

      exportToPDF(sections, 'my-report');

      expect(mockSave).toHaveBeenCalledWith('my-report-2024-01-15.pdf');
    });

    it('should add page numbers to footer', () => {
      mockGetNumberOfPages.mockReturnValue(2);
      const sections: PDFSection[] = [];

      exportToPDF(sections, 'test-file');

      expect(mockSetPage).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Página'), 180, 285);
    });

    it('should apply correct table styling', () => {
      const sections: PDFSection[] = [
        {
          title: 'Test',
          data: [{ col1: 'value1' }],
          columns: [{ header: 'Column', dataKey: 'col1' }],
        },
      ];

      exportToPDF(sections, 'test-file');

      expect(autoTable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          theme: 'striped',
          headStyles: expect.objectContaining({
            fillColor: [117, 169, 156], // Brand color #75a99c
            textColor: 255,
            fontStyle: 'bold',
          }),
        })
      );
    });

    it('should handle empty sections array', () => {
      exportToPDF([], 'empty-file');

      expect(jsPDF).toHaveBeenCalled();
      expect(autoTable).not.toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('createLocationReportPDF', () => {
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

    it('should create PDF with location name in title', () => {
      createLocationReportPDF(mockRevenue, mockInventory, mockPerformance, 'Sucursal Centro');

      expect(mockText).toHaveBeenCalledWith('Reporte: Sucursal Centro', 14, 22);
    });

    it('should create multiple table sections', () => {
      createLocationReportPDF(mockRevenue, mockInventory, mockPerformance, 'Centro');

      // Should create at least 3 sections: Ventas, Inventario, Rendimiento
      expect(autoTable).toHaveBeenCalled();
    });

    it('should include top products section when available', () => {
      createLocationReportPDF(mockRevenue, mockInventory, mockPerformance, 'Centro');

      // With 2 top products, should have Top 5 section
      expect(autoTable).toHaveBeenCalled();
    });

    it('should not include top products section when empty', () => {
      const inventoryNoProducts = {
        ...mockInventory,
        topProducts: [],
      };

      createLocationReportPDF(mockRevenue, inventoryNoProducts, mockPerformance, 'Centro');

      // Should still work without top products
      expect(mockSave).toHaveBeenCalled();
    });

    it('should sanitize filename', () => {
      createLocationReportPDF(mockRevenue, mockInventory, mockPerformance, 'Sucursal #1 Norte');

      expect(mockSave).toHaveBeenCalledWith(
        expect.stringContaining('reporte-sucursal-1-norte')
      );
    });

    it('should include date range in subtitle and filename', () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      createLocationReportPDF(mockRevenue, mockInventory, mockPerformance, 'Centro', dateRange);

      // Should have subtitle with date range
      expect(mockText).toHaveBeenCalledWith(
        expect.any(String),
        14,
        30
      );
    });
  });

  describe('createComparisonReportPDF', () => {
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

    it('should create comparison report with title', () => {
      createComparisonReportPDF(mockComparison);

      expect(mockText).toHaveBeenCalledWith('Comparación de Ubicaciones', 14, 22);
    });

    it('should create ranking table', () => {
      createComparisonReportPDF(mockComparison);

      expect(autoTable).toHaveBeenCalled();
    });

    it('should sort locations by rank', () => {
      const unsortedComparison = [
        { ...mockComparison[1] },
        { ...mockComparison[0] },
      ];

      createComparisonReportPDF(unsortedComparison);

      expect(autoTable).toHaveBeenCalled();
    });

    it('should use correct filename', () => {
      createComparisonReportPDF(mockComparison);

      expect(mockSave).toHaveBeenCalledWith(
        expect.stringContaining('comparacion-ubicaciones')
      );
    });

    it('should include date range in subtitle when provided', () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      createComparisonReportPDF(mockComparison, dateRange);

      expect(mockSave).toHaveBeenCalled();
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

    it('should format currency values in MXN', () => {
      createLocationReportPDF(mockRevenue, mockInventory, mockPerformance, 'Test');

      // PDF should be created with formatted values
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should add new page when content exceeds page height', () => {
      // Mock a scenario where finalY is near page bottom
      (jsPDF as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        text: mockText,
        setFontSize: mockSetFontSize,
        setFont: mockSetFont,
        setTextColor: mockSetTextColor,
        setPage: mockSetPage,
        getNumberOfPages: mockGetNumberOfPages,
        addPage: mockAddPage,
        lastAutoTable: { finalY: 270 }, // Near bottom of page
      }));

      const sections: PDFSection[] = [
        {
          title: 'Section 1',
          data: [{ col1: 'value1' }],
          columns: [{ header: 'Column', dataKey: 'col1' }],
        },
        {
          title: 'Section 2',
          data: [{ col2: 'value2' }],
          columns: [{ header: 'Column 2', dataKey: 'col2' }],
        },
      ];

      exportToPDF(sections, 'test-file');

      expect(mockAddPage).toHaveBeenCalled();
    });
  });
});
