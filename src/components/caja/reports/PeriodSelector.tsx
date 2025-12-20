'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export type PeriodType = 'day' | 'week' | 'month' | 'lastMonth' | 'custom';

export interface PeriodValue {
  type: PeriodType;
  startDate: string;
  endDate: string;
  label: string;
}

interface PeriodSelectorProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}

const PERIOD_PRESETS: { type: PeriodType; label: string }[] = [
  { type: 'day', label: 'Hoy' },
  { type: 'week', label: 'Esta semana' },
  { type: 'month', label: 'Este mes' },
  { type: 'lastMonth', label: 'Mes pasado' },
  { type: 'custom', label: 'Personalizado' }
];

export function getPeriodDates(type: PeriodType, customStart?: string, customEnd?: string): PeriodValue {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let label: string;

  switch (type) {
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      label = 'Esta semana';
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      label = format(now, 'MMMM yyyy', { locale: es });
      break;
    case 'lastMonth':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      label = format(subMonths(now, 1), 'MMMM yyyy', { locale: es });
      break;
    case 'custom':
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        label = `${format(startDate, 'd MMM', { locale: es })} - ${format(endDate, 'd MMM', { locale: es })}`;
      } else {
        startDate = now;
        endDate = now;
        label = 'Personalizado';
      }
      break;
    default: // 'day'
      startDate = now;
      endDate = now;
      label = 'Hoy';
  }

  return {
    type,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    label
  };
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(value.type === 'custom');
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);

  const handlePresetSelect = (type: PeriodType) => {
    if (type === 'custom') {
      setShowCustom(true);
      setShowDropdown(false);
    } else {
      setShowCustom(false);
      onChange(getPeriodDates(type));
      setShowDropdown(false);
    }
  };

  const handleCustomApply = () => {
    onChange(getPeriodDates('custom', customStart, customEnd));
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span>{value.label}</span>
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]">
            <div className="p-1">
              {PERIOD_PRESETS.map((preset) => (
                <button
                  key={preset.type}
                  onClick={() => handlePresetSelect(preset.type)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    value.type === preset.type && !showCustom
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {showCustom && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
