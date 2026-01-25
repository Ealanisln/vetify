'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { WebhookCard, type WebhookData } from './WebhookCard';
import { CreateWebhookModal } from './CreateWebhookModal';
import { WebhookSecretModal } from './WebhookSecretModal';

type StatusFilter = 'all' | 'active' | 'inactive';

export function WebhookConfig() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [testingId, setTestingId] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState<{
    id: string;
    secret: string;
    name: string;
  } | null>(null);

  // Load webhooks
  const loadWebhooks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/settings/webhooks');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar los webhooks');
      }

      setWebhooks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  // Filter webhooks
  const filteredWebhooks = webhooks.filter((webhook) => {
    const matchesSearch =
      webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webhook.url.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && webhook.isActive) ||
      (statusFilter === 'inactive' && !webhook.isActive);

    return matchesSearch && matchesStatus;
  });

  // Handle webhook created
  const handleWebhookCreated = (data: { id: string; secret: string; name: string }) => {
    setIsCreateModalOpen(false);
    setCreatedWebhook(data);
    loadWebhooks(); // Refresh the list
  };

  // Handle edit
  const handleEdit = async (webhook: WebhookData) => {
    const newName = prompt('Nuevo nombre para el webhook:', webhook.name);
    if (newName && newName.trim() !== webhook.name) {
      try {
        const response = await fetch(`/api/settings/webhooks/${webhook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() }),
        });

        if (response.ok) {
          loadWebhooks();
        } else {
          const data = await response.json();
          alert(data.error || 'Error al actualizar el webhook');
        }
      } catch {
        alert('Error al actualizar el webhook');
      }
    }
  };

  // Handle delete
  const handleDelete = async (webhook: WebhookData) => {
    const confirmed = confirm(
      `¿Estas seguro de que deseas eliminar el webhook "${webhook.name}"?\n\nEsta accion no se puede deshacer y dejara de recibir notificaciones.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settings/webhooks/${webhook.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== webhook.id));
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar el webhook');
      }
    } catch {
      alert('Error al eliminar el webhook');
    }
  };

  // Handle toggle active
  const handleToggleActive = async (webhook: WebhookData) => {
    try {
      const response = await fetch(`/api/settings/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });

      if (response.ok) {
        setWebhooks(
          webhooks.map((w) =>
            w.id === webhook.id ? { ...w, isActive: !w.isActive, consecutiveFailures: !w.isActive ? 0 : w.consecutiveFailures } : w
          )
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Error al actualizar el webhook');
      }
    } catch {
      alert('Error al actualizar el webhook');
    }
  };

  // Handle test
  const handleTest = async (webhook: WebhookData) => {
    setTestingId(webhook.id);

    try {
      const response = await fetch(`/api/settings/webhooks/${webhook.id}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert(`Prueba exitosa!\n\nCodigo HTTP: ${data.data.httpStatusCode}`);
      } else {
        alert(
          `Prueba fallida\n\n${data.error || 'Error desconocido'}${
            data.data?.httpStatusCode ? `\nCodigo HTTP: ${data.data.httpStatusCode}` : ''
          }`
        );
      }

      loadWebhooks(); // Refresh to update delivery stats
    } catch {
      alert('Error al probar el webhook');
    } finally {
      setTestingId(null);
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
            loadWebhooks();
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
            Los webhooks permiten recibir notificaciones en tiempo real cuando ocurren eventos en tu clinica.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors whitespace-nowrap"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Webhook
        </button>
      </div>

      {/* Filters */}
      {webhooks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o URL..."
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
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      )}

      {/* Webhooks Grid */}
      {filteredWebhooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWebhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onTest={handleTest}
            />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        // Empty state - no webhooks at all
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No hay webhooks configurados
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Los webhooks permiten que tu sistema externo reciba notificaciones en tiempo real cuando se crean mascotas, se agendan citas, y mas.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Crear Primer Webhook
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
            No se encontraron webhooks con los filtros seleccionados.
          </p>
        </div>
      )}

      {/* Documentation Link */}
      {webhooks.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Los webhooks envian peticiones POST firmadas con HMAC-SHA256.
            Verifica el header <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">X-Vetify-Signature</code> para
            asegurar que los eventos provienen de Vetify.
          </p>
        </div>
      )}

      {/* Modals */}
      <CreateWebhookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWebhookCreated}
      />

      {createdWebhook && (
        <WebhookSecretModal
          isOpen={true}
          onClose={() => setCreatedWebhook(null)}
          webhookName={createdWebhook.name}
          secret={createdWebhook.secret}
        />
      )}

      {/* Testing indicator overlay */}
      {testingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-gray-700 dark:text-gray-300">Enviando prueba...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
