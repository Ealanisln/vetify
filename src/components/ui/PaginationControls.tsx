'use client';

import { themeColors, responsive } from '../../utils/theme-colors';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string; // e.g., "productos", "clientes", "mascotas"
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'elementos',
  className = '',
}: PaginationControlsProps) {
  // Don't render if there's only one page or less
  if (totalPages <= 1) {
    return null;
  }

  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`${responsive.padding.card} border-t ${themeColors.border.primary} ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={`text-sm ${themeColors.text.secondary} text-center sm:text-left`}>
          Mostrando {startItem} a {endItem} de {totalItems} {itemLabel}
        </div>
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">&lsaquo;</span>
          </button>
          <span className={`px-3 py-1 text-sm font-medium ${themeColors.text.primary}`}>
            {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <span className="sm:hidden">&rsaquo;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Export a compact version for smaller spaces
export function PaginationControlsCompact({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: Pick<PaginationControlsProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'className'>) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className={`text-sm font-medium ${themeColors.text.primary}`}>
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Página siguiente"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
