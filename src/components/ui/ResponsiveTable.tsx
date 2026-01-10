'use client';

import { ReactNode } from 'react';
import { themeColors, responsiveTable } from '../../utils/theme-colors';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Custom label for mobile view
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
  className = "",
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className={`${themeColors.background.card} rounded-lg border ${themeColors.border.primary} p-8`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#75a99c]"></div>
          <span className={`ml-3 ${themeColors.text.secondary}`}>Cargando...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`${themeColors.background.card} rounded-lg border ${themeColors.border.primary} p-8`}>
        <div className="text-center">
          <p className={themeColors.text.secondary}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${responsiveTable.container} ${className}`}>
      {/* Desktop Table with horizontal scroll */}
      <div className="hidden sm:block overflow-x-auto">
        <table className={`${responsiveTable.table} min-w-full`}>
          <thead className={themeColors.table.header}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={String(column.key) + index}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    index === 0
                      ? 'sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gray-200 dark:after:bg-gray-700'
                      : ''
                  } ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${themeColors.background.primary} divide-y ${themeColors.border.primary}`}>
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${themeColors.table.rowHover} ${onRowClick ? 'cursor-pointer' : ''} transition-colors`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={String(column.key) + colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${themeColors.table.cell} ${
                      colIndex === 0
                        ? 'sticky left-0 z-10 bg-white dark:bg-gray-900 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gray-200 dark:after:bg-gray-700'
                        : ''
                    } ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4 p-4">
        {data.map((item, index) => {
          // Separate actions column from other columns
          const actionsColumn = columns.find(col => col.key === 'actions');
          const regularColumns = columns.filter(col => col.key !== 'actions');

          return (
            <div
              key={index}
              className={`${themeColors.background.card} border ${themeColors.border.primary} rounded-lg p-4 ${
                onRowClick ? 'cursor-pointer hover:shadow-md' : ''
              } transition-shadow`}
              onClick={() => onRowClick?.(item)}
            >
              {regularColumns.map((column, colIndex) => {
                const value = column.render
                  ? column.render(item)
                  : String(item[column.key as keyof T] || '-');

                return (
                  <div key={String(column.key) + colIndex} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <dt className={`font-medium ${themeColors.text.secondary} text-sm flex-shrink-0 mr-4`}>
                      {column.mobileLabel || column.header}:
                    </dt>
                    <dd className={`${themeColors.text.primary} text-sm text-right flex-1`}>
                      {value}
                    </dd>
                  </div>
                );
              })}

              {/* Actions rendered at the bottom as prominent buttons */}
              {actionsColumn && (
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  {actionsColumn.render
                    ? actionsColumn.render(item)
                    : null
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export specific table components for more control
export function TableContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${themeColors.background.card} shadow rounded-lg border ${themeColors.border.primary} ${className}`}>
      {children}
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-5 sm:px-6 border-b ${themeColors.border.primary} ${className}`}>
      {children}
    </div>
  );
}

export function TableContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${responsiveTable.container} ${className}`}>
      {children}
    </div>
  );
} 