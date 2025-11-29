'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  value: { startDate: Date | null; endDate: Date | null };
  onChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  className?: string;
}

type PresetKey = 'today' | 'week' | 'month' | '30days' | 'year' | 'custom';

interface Preset {
  key: PresetKey;
  label: string;
  getRange: () => { startDate: Date; endDate: Date };
}

const PRESETS: Preset[] = [
  {
    key: 'today',
    label: 'Hoy',
    getRange: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    key: 'week',
    label: 'Semana',
    getRange: () => ({
      startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    key: 'month',
    label: 'Mes',
    getRange: () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    key: '30days',
    label: '30 días',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    key: 'year',
    label: 'Año',
    getRange: () => ({
      startDate: startOfYear(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
];

export default function DateRangePicker({
  value,
  onChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>('month');
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    value.startDate && value.endDate
      ? { from: value.startDate, to: value.endDate }
      : undefined
  );
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

  // Determine active preset based on current value
  useEffect(() => {
    if (!value.startDate || !value.endDate) {
      setActivePreset('month');
      return;
    }

    const startStr = format(value.startDate, 'yyyy-MM-dd');
    const endStr = format(value.endDate, 'yyyy-MM-dd');

    for (const preset of PRESETS) {
      const { startDate, endDate } = preset.getRange();
      if (
        format(startDate, 'yyyy-MM-dd') === startStr &&
        format(endDate, 'yyyy-MM-dd') === endStr
      ) {
        setActivePreset(preset.key);
        return;
      }
    }

    setActivePreset('custom');
  }, [value]);

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getRange();
    setActivePreset(preset.key);
    setTempRange({ from: range.startDate, to: range.endDate });
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomSelect = () => {
    setActivePreset('custom');
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from && range?.to) {
      onChange({
        startDate: startOfDay(range.from),
        endDate: endOfDay(range.to),
      });
    }
  };

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onChange({
        startDate: startOfDay(tempRange.from),
        endDate: endOfDay(tempRange.to),
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    // Reset to current month
    const defaultRange = PRESETS.find((p) => p.key === 'month')!.getRange();
    setTempRange({ from: defaultRange.startDate, to: defaultRange.endDate });
    onChange(defaultRange);
    setActivePreset('month');
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!value.startDate || !value.endDate) {
      return 'Seleccionar fechas';
    }

    const startStr = format(value.startDate, 'd MMM', { locale: es });
    const endStr = format(value.endDate, 'd MMM yyyy', { locale: es });

    // Same day
    if (format(value.startDate, 'yyyy-MM-dd') === format(value.endDate, 'yyyy-MM-dd')) {
      return format(value.startDate, 'd MMM yyyy', { locale: es });
    }

    return `${startStr} - ${endStr}`;
  };

  const getActivePresetLabel = () => {
    if (activePreset === 'custom') return 'Personalizado';
    const preset = PRESETS.find((p) => p.key === activePreset);
    return preset?.label || 'Mes';
  };

  return (
    <div className={className} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Período
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-10 text-left text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:outline-none focus:ring-1 focus:ring-[#75a99c]"
        >
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
          <span className="block truncate">
            <span className="font-medium">{getActivePresetLabel()}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-gray-600 dark:text-gray-300">{formatDateRange()}</span>
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-1 w-auto min-w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 p-3">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  variant={activePreset === preset.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                variant={activePreset === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={handleCustomSelect}
                className="text-xs"
              >
                Personalizado
              </Button>
            </div>

            {/* Calendar */}
            {activePreset === 'custom' && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <Calendar
                  mode="range"
                  selected={tempRange}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={2}
                  defaultMonth={tempRange?.from || new Date()}
                  locale={es}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDateRange()}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  Limpiar
                </Button>
                {activePreset === 'custom' && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApply}
                    disabled={!tempRange?.from || !tempRange?.to}
                  >
                    Aplicar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
