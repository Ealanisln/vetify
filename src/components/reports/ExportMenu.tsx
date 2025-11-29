'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ExportMenu({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  disabled = false,
  className = '',
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (exportFn: () => void) => {
    exportFn();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} data-testid="export-menu">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Exportar
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
          <ul className="py-1" role="menu" aria-orientation="vertical">
            <li>
              <button
                type="button"
                onClick={() => handleExport(onExportCSV)}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                CSV
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleExport(onExportExcel)}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <TableCellsIcon className="h-4 w-4 text-green-500" />
                Excel (.xlsx)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleExport(onExportPDF)}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <DocumentChartBarIcon className="h-4 w-4 text-red-500" />
                PDF
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
