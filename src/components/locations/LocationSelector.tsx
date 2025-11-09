'use client';

import { useEffect, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/solid';

interface Location {
  id: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface LocationSelectorProps {
  value: string;
  onChange: (locationId: string) => void;
  required?: boolean;
  defaultToPrimary?: boolean;
  className?: string;
}

export default function LocationSelector({
  value,
  onChange,
  required = false,
  defaultToPrimary = true,
  className = '',
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Set default to primary location if specified and no value is set
        if (defaultToPrimary && !value && activeLocations.length > 0) {
          const primaryLocation = activeLocations.find(
            (loc: Location) => loc.isPrimary
          );
          if (primaryLocation) {
            onChange(primaryLocation.id);
          } else if (activeLocations.length > 0) {
            // Fallback to first active location if no primary
            onChange(activeLocations[0].id);
          }
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
  }, [defaultToPrimary, value, onChange]);

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

  if (locations.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No hay ubicaciones activas disponibles
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Ubicación {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPinIcon className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="form-input block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-[#75a99c] focus:border-[#75a99c]"
        >
          <option value="">Seleccionar ubicación</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
              {location.isPrimary && ' (Principal)'}
            </option>
          ))}
        </select>
      </div>
      {locations.length === 1 && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Solo tienes una ubicación activa
        </p>
      )}
    </div>
  );
}
