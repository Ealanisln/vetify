import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export interface PDFSection {
  title: string;
  data: Record<string, unknown>[];
  columns: { header: string; dataKey: string }[];
}

export interface PDFOptions {
  title?: string;
  subtitle?: string;
}

// Extend jsPDF type for autoTable
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

// ============================================================================
// Generic PDF Export
// ============================================================================

/**
 * Export data to a PDF file with sections
 */
export function exportToPDF(
  sections: PDFSection[],
  filename: string,
  options?: PDFOptions
): void {
  const doc = new jsPDF() as JsPDFWithAutoTable;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options?.title || 'Reporte', 14, 22);

  // Subtitle
  if (options?.subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(options.subtitle, 14, 30);
    doc.setTextColor(0);
  }

  let yPosition = options?.subtitle ? 40 : 35;

  for (const section of sections) {
    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 14, yPosition);

    // Table
    autoTable(doc, {
      startY: yPosition + 5,
      head: [section.columns.map((c) => c.header)],
      body: section.data.map((row) =>
        section.columns.map((c) => String(row[c.dataKey] ?? ''))
      ),
      theme: 'striped',
      headStyles: {
        fillColor: [117, 169, 156], // #75a99c
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 15;

    // Check if we need a new page
    if (yPosition > 260 && sections.indexOf(section) < sections.length - 1) {
      doc.addPage();
      yPosition = 20;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`,
      14,
      285
    );
    doc.text(`Página ${i} de ${pageCount}`, 180, 285);
  }

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  doc.save(`${filename}-${dateStr}.pdf`);
}

// ============================================================================
// Location Report PDF Export
// ============================================================================

/**
 * Create a location report PDF with all sections
 */
export function createLocationReportPDF(
  revenue: LocationRevenueAnalytics,
  inventory: LocationInventoryAnalytics,
  performance: LocationPerformanceMetrics,
  locationName: string,
  dateRange?: { startDate: Date | null; endDate: Date | null }
): void {
  const sections: PDFSection[] = [];

  // Revenue section
  sections.push({
    title: 'Ventas',
    data: [
      { metric: 'Ventas Hoy', total: formatCurrency(revenue.todaySales.total), count: revenue.todaySales.count },
      { metric: 'Ventas Semana', total: formatCurrency(revenue.weekSales.total), count: revenue.weekSales.count },
      { metric: 'Ventas Mes', total: formatCurrency(revenue.monthSales.total), count: revenue.monthSales.count },
      { metric: 'Ventas Año', total: formatCurrency(revenue.yearSales.total), count: revenue.yearSales.count },
      { metric: 'Ticket Promedio', total: formatCurrency(revenue.averageTicket), count: '-' },
      { metric: 'Crecimiento Mensual', total: `${revenue.monthlyGrowth.toFixed(1)}%`, count: '-' },
    ],
    columns: [
      { header: 'Métrica', dataKey: 'metric' },
      { header: 'Total', dataKey: 'total' },
      { header: 'Transacciones', dataKey: 'count' },
    ],
  });

  // Inventory section
  const inventoryData = [
    { metric: 'Productos Totales', value: inventory.totalItems },
    { metric: 'Valor del Inventario', value: formatCurrency(inventory.inventoryValue) },
    { metric: 'Productos con Stock Bajo', value: inventory.lowStockCount },
  ];

  sections.push({
    title: 'Inventario',
    data: inventoryData,
    columns: [
      { header: 'Métrica', dataKey: 'metric' },
      { header: 'Valor', dataKey: 'value' },
    ],
  });

  // Top products section (if any)
  if (inventory.topProducts.length > 0) {
    sections.push({
      title: 'Top 5 Productos',
      data: inventory.topProducts.map((p, i) => ({
        rank: i + 1,
        name: p.name,
        revenue: formatCurrency(p.revenue),
        quantity: p.quantitySold,
        profit: formatCurrency(p.profit),
      })),
      columns: [
        { header: '#', dataKey: 'rank' },
        { header: 'Producto', dataKey: 'name' },
        { header: 'Ingresos', dataKey: 'revenue' },
        { header: 'Cantidad', dataKey: 'quantity' },
        { header: 'Ganancia', dataKey: 'profit' },
      ],
    });
  }

  // Performance section
  sections.push({
    title: 'Rendimiento',
    data: [
      { category: 'Citas', metric: 'Total', value: performance.appointments.total },
      { category: 'Citas', metric: 'Completadas', value: performance.appointments.completed },
      { category: 'Citas', metric: 'Canceladas', value: performance.appointments.cancelled },
      { category: 'Citas', metric: 'No Shows', value: performance.appointments.noShow },
      { category: 'Citas', metric: 'Tasa Completación', value: `${performance.appointments.completionRate.toFixed(1)}%` },
      { category: 'Clientes', metric: 'Total', value: performance.customers.total },
      { category: 'Clientes', metric: 'Nuevos (mes)', value: performance.customers.new },
      { category: 'Clientes', metric: 'Activos', value: performance.customers.active },
      { category: 'Clientes', metric: 'Retención', value: `${performance.customers.retentionRate.toFixed(1)}%` },
      { category: 'Personal', metric: 'Total', value: performance.staff.total },
      { category: 'Personal', metric: 'Activos', value: performance.staff.active },
      { category: 'Personal', metric: 'Citas por Staff', value: performance.staff.appointmentsPerStaff.toFixed(1) },
    ],
    columns: [
      { header: 'Categoría', dataKey: 'category' },
      { header: 'Métrica', dataKey: 'metric' },
      { header: 'Valor', dataKey: 'value' },
    ],
  });

  // Build title and subtitle
  let subtitle = '';
  if (dateRange?.startDate && dateRange?.endDate) {
    const startStr = format(dateRange.startDate, "d 'de' MMMM", { locale: es });
    const endStr = format(dateRange.endDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    subtitle = `${startStr} - ${endStr}`;
  }

  const safeName = sanitizeFilename(locationName);
  let filename = `reporte-${safeName}`;
  if (dateRange?.startDate && dateRange?.endDate) {
    const startStr = format(dateRange.startDate, 'd-MMM', { locale: es });
    const endStr = format(dateRange.endDate, 'd-MMM-yyyy', { locale: es });
    filename = `reporte-${safeName}-${startStr}-a-${endStr}`;
  }

  exportToPDF(sections, filename, {
    title: `Reporte: ${locationName}`,
    subtitle,
  });
}

// ============================================================================
// Comparison Report PDF Export
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
 * Create a comparison report PDF
 */
export function createComparisonReportPDF(
  comparison: ComparisonLocation[],
  dateRange?: { startDate: Date | null; endDate: Date | null }
): void {
  const sortedData = comparison
    .sort((a, b) => a.rank - b.rank)
    .map((loc) => ({
      rank: getRankMedal(loc.rank),
      location: loc.locationName,
      revenue: formatCurrency(loc.revenue),
      appointments: loc.appointments,
      customers: loc.customers,
      inventoryValue: formatCurrency(loc.inventoryValue),
      averageTicket: formatCurrency(loc.averageTicket),
    }));

  const sections: PDFSection[] = [
    {
      title: 'Ranking de Ubicaciones',
      data: sortedData,
      columns: [
        { header: 'Rank', dataKey: 'rank' },
        { header: 'Ubicación', dataKey: 'location' },
        { header: 'Ingresos', dataKey: 'revenue' },
        { header: 'Citas', dataKey: 'appointments' },
        { header: 'Clientes', dataKey: 'customers' },
        { header: 'Ticket Prom.', dataKey: 'averageTicket' },
      ],
    },
  ];

  let subtitle = '';
  let filename = 'comparacion-ubicaciones';
  if (dateRange?.startDate && dateRange?.endDate) {
    const startStr = format(dateRange.startDate, "d 'de' MMMM", { locale: es });
    const endStr = format(dateRange.endDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    subtitle = `${startStr} - ${endStr}`;
    const startFilename = format(dateRange.startDate, 'd-MMM', { locale: es });
    const endFilename = format(dateRange.endDate, 'd-MMM-yyyy', { locale: es });
    filename = `comparacion-${startFilename}-a-${endFilename}`;
  }

  exportToPDF(sections, filename, {
    title: 'Comparación de Ubicaciones',
    subtitle,
  });
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

function getRankMedal(rank: number): string {
  const medals: Record<number, string> = {
    1: '1',
    2: '2',
    3: '3',
  };
  return medals[rank] || String(rank);
}
