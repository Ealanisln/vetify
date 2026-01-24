'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ApiKeyScopes } from './ApiKeyScopes';
import { SCOPE_BUNDLES } from '@/lib/api/api-key-utils';

interface Location {
  id: string;
  name: string;
}

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (data: { id: string; fullKey: string; name: string }) => void;
  locations: Location[];
}

export function CreateApiKeyModal({
  isOpen,
  onClose,
  onCreated,
  locations,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([...SCOPE_BUNDLES.readonly]);
  const [locationId, setLocationId] = useState<string>('');
  const [rateLimit, setRateLimit] = useState(1000);
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setScopes([...SCOPE_BUNDLES.readonly]);
      setLocationId('');
      setRateLimit(1000);
      setExpiresAt('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (scopes.length === 0) {
      setError('Debes seleccionar al menos un permiso');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scopes,
          locationId: locationId || null,
          rateLimit,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la clave de API');
      }

      onCreated({
        id: data.data.id,
        fullKey: data.data.fullKey,
        name: data.data.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nueva Clave de API
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="api-key-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="api-key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Integración con sistema externo"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Un nombre descriptivo para identificar el uso de esta clave
              </p>
            </div>

            {/* Scopes */}
            <ApiKeyScopes
              selectedScopes={scopes}
              onChange={setScopes}
              disabled={isSubmitting}
            />

            {/* Location (optional) */}
            {locations.length > 0 && (
              <div>
                <label
                  htmlFor="api-key-location"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Ubicación (opcional)
                </label>
                <select
                  id="api-key-location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Todas las ubicaciones (Global)</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Limita el acceso de la API a una ubicación específica
                </p>
              </div>
            )}

            {/* Advanced Options */}
            <details className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                Opciones avanzadas
              </summary>
              <div className="p-4 pt-2 space-y-4 border-t border-gray-200 dark:border-gray-700">
                {/* Rate Limit */}
                <div>
                  <label
                    htmlFor="api-key-rate-limit"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Límite de peticiones por hora
                  </label>
                  <input
                    type="number"
                    id="api-key-rate-limit"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Math.max(100, Math.min(100000, parseInt(e.target.value) || 1000)))}
                    min={100}
                    max={100000}
                    step={100}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label
                    htmlFor="api-key-expires"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Fecha de expiración (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    id="api-key-expires"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Deja vacío para que la clave no expire
                  </p>
                </div>
              </div>
            </details>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || scopes.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Clave'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
