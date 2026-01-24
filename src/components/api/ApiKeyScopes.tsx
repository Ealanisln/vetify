'use client';

import { useState, useEffect } from 'react';
import { SCOPE_BUNDLES, type ApiScope } from '@/lib/api/api-key-utils';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ApiKeyScopesProps {
  selectedScopes: string[];
  onChange: (scopes: string[]) => void;
  disabled?: boolean;
}

type BundleKey = keyof typeof SCOPE_BUNDLES | 'custom';

const BUNDLE_LABELS: Record<BundleKey, { label: string; description: string }> = {
  readonly: {
    label: 'Solo lectura',
    description: 'Acceso de lectura a todos los recursos',
  },
  full: {
    label: 'Acceso completo',
    description: 'Lectura y escritura de todos los recursos',
  },
  appointments_only: {
    label: 'Solo citas',
    description: 'Gestión de citas únicamente',
  },
  inventory_only: {
    label: 'Solo inventario',
    description: 'Gestión de inventario únicamente',
  },
  custom: {
    label: 'Personalizado',
    description: 'Selecciona permisos específicos',
  },
};

// Group scopes by resource
const SCOPE_GROUPS = {
  pets: {
    label: 'Mascotas',
    scopes: ['read:pets', 'write:pets'] as ApiScope[],
  },
  appointments: {
    label: 'Citas',
    scopes: ['read:appointments', 'write:appointments'] as ApiScope[],
  },
  customers: {
    label: 'Clientes',
    scopes: ['read:customers', 'write:customers'] as ApiScope[],
  },
  inventory: {
    label: 'Inventario',
    scopes: ['read:inventory', 'write:inventory'] as ApiScope[],
  },
  locations: {
    label: 'Ubicaciones',
    scopes: ['read:locations'] as ApiScope[],
  },
  reports: {
    label: 'Reportes',
    scopes: ['read:reports'] as ApiScope[],
  },
  sales: {
    label: 'Ventas',
    scopes: ['read:sales', 'write:sales'] as ApiScope[],
  },
};

export function ApiKeyScopes({ selectedScopes, onChange, disabled }: ApiKeyScopesProps) {
  const [selectedBundle, setSelectedBundle] = useState<BundleKey>('readonly');
  const [isCustom, setIsCustom] = useState(false);
  const [showBundleDropdown, setShowBundleDropdown] = useState(false);

  // Determine if current selection matches a bundle
  useEffect(() => {
    const bundleKeys = Object.keys(SCOPE_BUNDLES) as (keyof typeof SCOPE_BUNDLES)[];
    for (const bundleKey of bundleKeys) {
      const bundleScopes = SCOPE_BUNDLES[bundleKey];
      if (
        selectedScopes.length === bundleScopes.length &&
        bundleScopes.every((scope) => selectedScopes.includes(scope))
      ) {
        setSelectedBundle(bundleKey);
        setIsCustom(false);
        return;
      }
    }
    // If no bundle matches, it's custom
    if (selectedScopes.length > 0) {
      setSelectedBundle('custom');
      setIsCustom(true);
    }
  }, [selectedScopes]);

  const handleBundleChange = (bundleKey: BundleKey) => {
    setShowBundleDropdown(false);
    if (bundleKey === 'custom') {
      setIsCustom(true);
      setSelectedBundle('custom');
    } else {
      setIsCustom(false);
      setSelectedBundle(bundleKey);
      onChange([...SCOPE_BUNDLES[bundleKey]]);
    }
  };

  const handleScopeToggle = (scope: string) => {
    if (disabled) return;
    setIsCustom(true);
    setSelectedBundle('custom');

    if (selectedScopes.includes(scope)) {
      onChange(selectedScopes.filter((s) => s !== scope));
    } else {
      onChange([...selectedScopes, scope]);
    }
  };

  const handleGroupToggle = (groupScopes: ApiScope[]) => {
    if (disabled) return;
    setIsCustom(true);
    setSelectedBundle('custom');

    const allSelected = groupScopes.every((scope) => selectedScopes.includes(scope));
    if (allSelected) {
      onChange(selectedScopes.filter((s) => !groupScopes.includes(s as ApiScope)));
    } else {
      const newScopes = new Set([...selectedScopes, ...groupScopes]);
      onChange(Array.from(newScopes));
    }
  };

  return (
    <div className="space-y-4">
      {/* Bundle Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Plantilla de permisos
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowBundleDropdown(!showBundleDropdown)}
            disabled={disabled}
            className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 pl-4 pr-10 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block truncate text-gray-900 dark:text-white">
              {BUNDLE_LABELS[selectedBundle].label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              {BUNDLE_LABELS[selectedBundle].description}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </button>

          {showBundleDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-1">
              {(Object.keys(BUNDLE_LABELS) as BundleKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleBundleChange(key)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedBundle === key ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {BUNDLE_LABELS[key].label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {BUNDLE_LABELS[key].description}
                      </span>
                    </div>
                    {selectedBundle === key && (
                      <CheckIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Scope Selection */}
      {isCustom && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecciona los permisos específicos para esta clave de API:
          </p>

          {Object.entries(SCOPE_GROUPS).map(([groupKey, group]) => {
            const allGroupSelected = group.scopes.every((scope) =>
              selectedScopes.includes(scope)
            );
            const someGroupSelected = group.scopes.some((scope) =>
              selectedScopes.includes(scope)
            );

            return (
              <div key={groupKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGroupToggle(group.scopes)}
                    disabled={disabled}
                    className={`flex items-center justify-center w-5 h-5 rounded border ${
                      allGroupSelected
                        ? 'bg-primary border-primary'
                        : someGroupSelected
                          ? 'bg-primary/50 border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                    } disabled:opacity-50`}
                  >
                    {(allGroupSelected || someGroupSelected) && (
                      <CheckIcon className="h-3 w-3 text-white" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {group.label}
                  </span>
                </div>

                <div className="ml-7 flex flex-wrap gap-2">
                  {group.scopes.map((scope) => {
                    const isSelected = selectedScopes.includes(scope);
                    const isRead = scope.startsWith('read:');

                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => handleScopeToggle(scope)}
                        disabled={disabled}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? isRead
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-500'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-500'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isRead ? '👁️ Leer' : '✏️ Escribir'}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Scopes Summary */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {selectedScopes.length === 0 ? (
          <span className="text-red-500">Debes seleccionar al menos un permiso</span>
        ) : (
          <span>
            {selectedScopes.length} permiso{selectedScopes.length !== 1 ? 's' : ''} seleccionado
            {selectedScopes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
