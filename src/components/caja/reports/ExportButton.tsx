'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ExportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netTotal: number;
    transactionCount: number;
    avgTransactionValue: number;
  };
  byTransactionType: Record<string, { count: number; total: number }>;
  discrepancies: {
    totalDifference: number;
    shiftsWithDifference: number;
  };
  byDrawer?: Array<{
    drawerId: string;
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
    totalDifference: number;
  }>;
  byCashier?: Array<{
    cashierName: string;
    shiftCount: number;
    totalHours: number;
    transactionCount: number;
    totalDifference: number;
    accuracy: number;
  }>;
  shifts: Array<{
    id: string;
    cashier: { name: string };
    startedAt: string;
    endedAt: string | null;
    difference: number | null;
    status: string;
    transactionCount: number;
  }>;
  period: { start: string; end: string };
}

interface ExportButtonProps {
  data: ExportData | null;
  loading?: boolean;
}

const TRANSACTION_LABELS: Record<string, string> = {
  SALE_CASH: 'Ventas (Efectivo)',
  DEPOSIT: 'Depósitos',
  ADJUSTMENT_IN: 'Ajustes (+)',
  REFUND_CASH: 'Devoluciones',
  WITHDRAWAL: 'Retiros',
  ADJUSTMENT_OUT: 'Ajustes (-)'
};

export function ExportButton({ data, loading }: ExportButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateCSV = () => {
    if (!data) return;
    setExporting(true);

    try {
      const lines: string[] = [];

      // Header
      lines.push('REPORTE DE CAJA');
      lines.push(`Período: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`);
      lines.push('');

      // Summary
      lines.push('RESUMEN');
      lines.push(`Total Ingresos,${data.summary.totalIncome}`);
      lines.push(`Total Egresos,${data.summary.totalExpenses}`);
      lines.push(`Balance Neto,${data.summary.netTotal}`);
      lines.push(`Transacciones,${data.summary.transactionCount}`);
      lines.push(`Promedio por Transacción,${data.summary.avgTransactionValue}`);
      lines.push('');

      // Transaction breakdown
      lines.push('DESGLOSE POR TIPO');
      lines.push('Tipo,Cantidad,Total');
      Object.entries(data.byTransactionType).forEach(([type, value]) => {
        lines.push(`${TRANSACTION_LABELS[type] || type},${value.count},${value.total}`);
      });
      lines.push('');

      // Discrepancies
      lines.push('DIFERENCIAS');
      lines.push(`Total Diferencias,${data.discrepancies.totalDifference}`);
      lines.push(`Turnos con Diferencia,${data.discrepancies.shiftsWithDifference}`);
      lines.push('');

      // Drawer comparison
      if (data.byDrawer && data.byDrawer.length > 0) {
        lines.push('POR CAJA');
        lines.push('Caja,Ingresos,Egresos,Neto,Transacciones,Diferencia');
        data.byDrawer.forEach((d, i) => {
          lines.push(`Caja ${i + 1},${d.income},${d.expenses},${d.net},${d.transactionCount},${d.totalDifference}`);
        });
        lines.push('');
      }

      // Cashier performance
      if (data.byCashier && data.byCashier.length > 0) {
        lines.push('POR CAJERO');
        lines.push('Cajero,Turnos,Horas,Transacciones,Diferencia,Precisión');
        data.byCashier.forEach((c) => {
          lines.push(`${c.cashierName},${c.shiftCount},${c.totalHours},${c.transactionCount},${c.totalDifference},${c.accuracy}%`);
        });
        lines.push('');
      }

      // Shifts
      lines.push('TURNOS');
      lines.push('Cajero,Inicio,Fin,Estado,Transacciones,Diferencia');
      data.shifts.forEach((s) => {
        const endTime = s.endedAt ? formatTime(s.endedAt) : 'Activo';
        lines.push(`${s.cashier.name},${formatTime(s.startedAt)},${endTime},${s.status},${s.transactionCount},${s.difference ?? 0}`);
      });

      // Create and download file
      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-caja-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      setShowDropdown(false);
    }
  };

  const handlePrint = () => {
    setShowDropdown(false);
    window.print();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading || !data}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        <span>Exportar</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[160px]">
            <div className="p-1">
              <button
                onClick={generateCSV}
                disabled={exporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <TableCellsIcon className="h-4 w-4 text-green-600" />
                <span>{exporting ? 'Exportando...' : 'Exportar CSV'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                <span>Imprimir PDF</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
