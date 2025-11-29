'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPinIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/solid';

interface Location {
  id: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface LocationMultiSelectorProps {
  value: string[];
  onChange: (locationIds: string[]) => void;
  className?: string;
  minSelected?: number;
  label?: string;
}

export default function LocationMultiSelector({
  value,
  onChange,
  className = '',
  minSelected = 2,
  label = 'Ubicaciones a comparar',
}: LocationMultiSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations?isActive=true');
        if (!response.ok) {
          throw new Error('Error al cargar ubicaciones');
        }

        const data = await response.json();
        const activeLocations = data.data || [];
        setLocations(activeLocations);

        // Auto-select all locations if none selected and there are at least minSelected
        if (value.length === 0 && activeLocations.length >= minSelected) {
          onChange(activeLocations.map((loc: Location) => loc.id));
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError(
          err instanceof Error ? err.message : 'Error al cargar ubicaciones'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleLocation = (locationId: string) => {
    if (value.includes(locationId)) {
      // Don't allow deselecting if we'd go below minimum
      if (value.length <= minSelected) {
        return;
      }
      onChange(value.filter((id) => id !== locationId));
    } else {
      onChange([...value, locationId]);
    }
  };

  const handleSelectAll = () => {
    onChange(locations.map((loc) => loc.id));
  };

  const handleClearAll = () => {
    // Keep minimum selected (first N locations)
    onChange(locations.slice(0, minSelected).map((loc) => loc.id));
  };

  const getSelectedNames = (): string => {
    if (value.length === 0) return 'Seleccionar ubicaciones';
    if (value.length === locations.length) return 'Todas las ubicaciones';
    if (value.length <= 2) {
      return locations
        .filter((loc) => value.includes(loc.id))
        .map((loc) => loc.name)
        .join(', ');
    }
    return `${value.length} ubicaciones seleccionadas`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <MapPinIcon className="w-5 h-5 animate-pulse" />
        <span className="text-sm">Cargando ubicaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
    );
  }

  if (locations.length < minSelected) {
    return (
      <div className="text-sm text-amber-600 dark:text-amber-400">
        Se necesitan al menos {minSelected} ubicaciones activas para comparar
      </div>
    );
  }

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-10 text-left text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:outline-none focus:ring-1 focus:ring-[#75a99c]"
        >
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
          <span className="block truncate">{getSelectedNames()}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
            {/* Select All / Clear All */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-[#75a99c] hover:text-[#5b9788] font-medium"
              >
                Seleccionar todas
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Limpiar
              </button>
            </div>

            {/* Location List */}
            <ul className="max-h-60 overflow-auto py-1">
              {locations.map((location) => {
                const isSelected = value.includes(location.id);
                const isDisabled = isSelected && value.length <= minSelected;

                return (
                  <li key={location.id}>
                    <button
                      type="button"
                      onClick={() => handleToggleLocation(location.id)}
                      disabled={isDisabled}
                      className={`relative w-full cursor-pointer select-none py-2 pl-10 pr-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            isSelected
                              ? 'bg-[#75a99c] border-[#75a99c]'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </span>
                      </span>
                      <span
                        className={`block truncate text-gray-900 dark:text-white ${
                          isSelected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {location.name}
                        {location.isPrimary && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Principal)
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Minimum Selection Warning */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mínimo {minSelected} ubicaciones para comparar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
