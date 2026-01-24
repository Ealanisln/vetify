'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { ApiKeyCard, type ApiKeyData } from './ApiKeyCard';
import { CreateApiKeyModal } from './CreateApiKeyModal';
import { ApiKeyCreatedModal } from './ApiKeyCreatedModal';

interface Location {
  id: string;
  name: string;
}

interface ApiKeyManagementProps {
  tenantId: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export function ApiKeyManagement({ tenantId }: ApiKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<{
    id: string;
    fullKey: string;
    name: string;
  } | null>(null);

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/settings/api-keys');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar las claves de API');
      }

      setApiKeys(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load locations for the dropdown
  const loadLocations = useCallback(async () => {
    try {
      const response = await fetch(`/api/locations?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (err) {
      // Silently fail - locations are optional
      console.error('Error loading locations:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    loadApiKeys();
    loadLocations();
  }, [loadApiKeys, loadLocations]);

  // Filter API keys
  const filteredKeys = apiKeys.filter((key) => {
    const matchesSearch =
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.keyPrefix.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && key.isActive) ||
      (statusFilter === 'inactive' && !key.isActive);

    return matchesSearch && matchesStatus;
  });

  // Handle key created
  const handleKeyCreated = (data: { id: string; fullKey: string; name: string }) => {
    setIsCreateModalOpen(false);
    setCreatedKey(data);
    loadApiKeys(); // Refresh the list
  };

  // Handle edit
  const handleEdit = async (key: ApiKeyData) => {
    const newName = prompt('Nuevo nombre para la clave:', key.name);
    if (newName && newName.trim() !== key.name) {
      try {
        const response = await fetch(`/api/settings/api-keys/${key.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() }),
        });

        if (response.ok) {
          loadApiKeys();
        } else {
          const data = await response.json();
          alert(data.error || 'Error al actualizar la clave');
        }
      } catch {
        alert('Error al actualizar la clave');
      }
    }
  };

  // Handle delete
  const handleDelete = async (key: ApiKeyData) => {
    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar la clave "${key.name}"?\n\nEsta acción no se puede deshacer y cualquier integración que use esta clave dejará de funcionar.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settings/api-keys/${key.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== key.id));
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar la clave');
      }
    } catch {
      alert('Error al eliminar la clave');
    }
  };

  // Handle toggle active
  const handleToggleActive = async (key: ApiKeyData) => {
    try {
      const response = await fetch(`/api/settings/api-keys/${key.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !key.isActive }),
      });

      if (response.ok) {
        setApiKeys(
          apiKeys.map((k) =>
            k.id === key.id ? { ...k, isActive: !k.isActive } : k
          )
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Error al actualizar la clave');
      }
    } catch {
      alert('Error al actualizar la clave');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            loadApiKeys();
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Las claves de API permiten que aplicaciones externas accedan a los datos de tu clínica de forma segura.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors whitespace-nowrap"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Clave
        </button>
      </div>

      {/* Filters */}
      {apiKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o prefijo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white appearance-none"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      )}

      {/* API Keys Grid */}
      {filteredKeys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      ) : apiKeys.length === 0 ? (
        // Empty state - no keys at all
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No hay claves de API
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Las claves de API permiten que aplicaciones externas accedan a los datos de tu clínica de forma segura.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Crear Primera Clave
          </button>
        </div>
      ) : (
        // Empty state - no results from filter
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Sin resultados
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron claves con los filtros seleccionados.
          </p>
        </div>
      )}

      {/* Documentation Link */}
      {apiKeys.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Consulta nuestra{' '}
            <a
              href="/docs/api"
              className="underline hover:text-blue-800 dark:hover:text-blue-200"
              target="_blank"
            >
              documentación de API
            </a>{' '}
            para aprender cómo integrar tu sistema con Vetify.
          </p>
        </div>
      )}

      {/* Modals */}
      <CreateApiKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleKeyCreated}
        locations={locations}
      />

      {createdKey && (
        <ApiKeyCreatedModal
          isOpen={true}
          onClose={() => setCreatedKey(null)}
          keyName={createdKey.name}
          fullKey={createdKey.fullKey}
        />
      )}
    </div>
  );
}
