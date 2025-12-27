import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  LocationRevenueAnalytics,
  LocationInventoryAnalytics,
  LocationPerformanceMetrics,
} from '../reports-location';

// ============================================================================
// Types
// ============================================================================

export interface ExcelSheet {
  name: string;
  data: Record<string, unknown>[];
}

// ============================================================================
// Browser Download Helper
// ============================================================================

/**
 * Trigger a file download in the browser from an ArrayBuffer
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Generic Excel Export
// ============================================================================

/**
 * Export data to an Excel file with multiple sheets
 */
export async function exportToExcel(sheets: ExcelSheet[], filename: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);

    if (sheet.data.length > 0) {
      // Get column keys from first row
      const keys = Object.keys(sheet.data[0]);

      // Set columns with headers
      worksheet.columns = keys.map((key) => ({
        header: key,
        key: key,
        width: 20,
      }));

      // Add data rows
      for (const row of sheet.data) {
        worksheet.addRow(row);
      }

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }
  }

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  await downloadWorkbook(workbook, `${filename}-${dateStr}.xlsx`);
}

// ============================================================================
// Location Report Excel Export
// ============================================================================

/**
 * Create a location report Excel file with all report sections
 */
export async function createLocationReportExcel(
  revenue: LocationRevenueAnalytics,
  inventory: LocationInventoryAnalytics,
  performance: LocationPerformanceMetrics,
  locationName: string,
  dateRange?: { startDate: Date | null; endDate: Date | null }
): Promise<void> {
  const sheets: ExcelSheet[] = [];

  // Revenue sheet
  const revenueData = [
    { Metrica: 'Ventas Hoy', Total: formatCurrency(revenue.todaySales.total), Transacciones: revenue.todaySales.count },
    { Metrica: 'Ventas Semana', Total: formatCurrency(revenue.weekSales.total), Transacciones: revenue.weekSales.count },
    { Metrica: 'Ventas Mes', Total: formatCurrency(revenue.monthSales.total), Transacciones: revenue.monthSales.count },
    { Metrica: 'Ventas Año', Total: formatCurrency(revenue.yearSales.total), Transacciones: revenue.yearSales.count },
    { Metrica: 'Ticket Promedio', Total: formatCurrency(revenue.averageTicket), Transacciones: '-' },
    { Metrica: 'Crecimiento Mensual', Total: `${revenue.monthlyGrowth.toFixed(1)}%`, Transacciones: '-' },
  ];
  sheets.push({ name: 'Ventas', data: revenueData });

  // Inventory sheet
  const inventoryData: Record<string, unknown>[] = [
    { Metrica: 'Productos Totales', Valor: inventory.totalItems },
    { Metrica: 'Valor del Inventario', Valor: formatCurrency(inventory.inventoryValue) },
    { Metrica: 'Productos con Stock Bajo', Valor: inventory.lowStockCount },
  ];

  // Add top products
  if (inventory.topProducts.length > 0) {
    inventoryData.push({ Metrica: '', Valor: '' }); // Empty row separator
    inventoryData.push({ Metrica: 'TOP PRODUCTOS', Valor: '' });
    inventory.topProducts.forEach((product, index) => {
      inventoryData.push({
        Metrica: `${index + 1}. ${product.name}`,
        Valor: formatCurrency(product.revenue),
      });
    });
  }

  sheets.push({ name: 'Inventario', data: inventoryData });

  // Performance sheet
  const performanceData = [
    { Categoria: 'Citas', Metrica: 'Total', Valor: performance.appointments.total },
    { Categoria: 'Citas', Metrica: 'Completadas', Valor: performance.appointments.completed },
    { Categoria: 'Citas', Metrica: 'Canceladas', Valor: performance.appointments.cancelled },
    { Categoria: 'Citas', Metrica: 'No Shows', Valor: performance.appointments.noShow },
    { Categoria: 'Citas', Metrica: 'Tasa Completación', Valor: `${performance.appointments.completionRate.toFixed(1)}%` },
    { Categoria: 'Clientes', Metrica: 'Total', Valor: performance.customers.total },
    { Categoria: 'Clientes', Metrica: 'Nuevos (mes)', Valor: performance.customers.new },
    { Categoria: 'Clientes', Metrica: 'Activos', Valor: performance.customers.active },
    { Categoria: 'Clientes', Metrica: 'Retención', Valor: `${performance.customers.retentionRate.toFixed(1)}%` },
    { Categoria: 'Personal', Metrica: 'Total', Valor: performance.staff.total },
    { Categoria: 'Personal', Metrica: 'Activos', Valor: performance.staff.active },
    { Categoria: 'Personal', Metrica: 'Citas por Staff', Valor: performance.staff.appointmentsPerStaff.toFixed(1) },
  ];
  sheets.push({ name: 'Rendimiento', data: performanceData });

  // Build filename
  const safeName = sanitizeFilename(locationName);
  let filename = `reporte-${safeName}`;
  if (dateRange?.startDate && dateRange?.endDate) {
    const startStr = format(dateRange.startDate, 'd-MMM', { locale: es });
    const endStr = format(dateRange.endDate, 'd-MMM-yyyy', { locale: es });
    filename = `reporte-${safeName}-${startStr}-a-${endStr}`;
  }

  await exportToExcel(sheets, filename);
}

// ============================================================================
// Comparison Report Excel Export
// ============================================================================

interface ComparisonLocation {
  locationId: string;
  locationName: string;
  revenue: number;
  appointments: number;
  customers: number;
  inventoryValue: number;
  averageTicket: number;
  rank: number;
}

/**
 * Create a comparison report Excel file
 */
export async function createComparisonReportExcel(
  comparison: ComparisonLocation[],
  dateRange?: { startDate: Date | null; endDate: Date | null }
): Promise<void> {
  const comparisonData = comparison
    .sort((a, b) => a.rank - b.rank)
    .map((loc) => ({
      Ranking: loc.rank,
      Ubicacion: loc.locationName,
      Ingresos: formatCurrency(loc.revenue),
      Citas: loc.appointments,
      Clientes: loc.customers,
      'Valor Inventario': formatCurrency(loc.inventoryValue),
      'Ticket Promedio': formatCurrency(loc.averageTicket),
    }));

  let filename = 'comparacion-ubicaciones';
  if (dateRange?.startDate && dateRange?.endDate) {
    const startStr = format(dateRange.startDate, 'd-MMM', { locale: es });
    const endStr = format(dateRange.endDate, 'd-MMM-yyyy', { locale: es });
    filename = `comparacion-${startStr}-a-${endStr}`;
  }

  await exportToExcel([{ name: 'Comparación', data: comparisonData }], filename);
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
