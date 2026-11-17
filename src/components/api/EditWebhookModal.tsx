'use client';

import { useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { WebhookEventSelector } from './WebhookEventSelector';
import type { WebhookData } from './WebhookCard';

interface EditWebhookModalProps {
  webhook: WebhookData;
  onClose: () => void;
  onUpdated: (webhook: WebhookData) => void;
  onSecretRegenerated: (data: { name: string; secret: string }) => void;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function EditWebhookModal({
  webhook,
  onClose,
  onUpdated,
  onSecretRegenerated,
}: EditWebhookModalProps) {
  const [name, setName] = useState(webhook.name);
  const [url, setUrl] = useState(webhook.url);
  const [events, setEvents] = useState<string[]>(webhook.events);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(onClose, !isSubmitting);

  const updateWebhook = async (body: Record<string, unknown>) => {
    const response = await fetch(`/api/settings/webhooks/${webhook.id}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar el webhook');
    }
    return data.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!url.trim()) {
      setError('La URL es requerida');
      return;
    }
    if (!url.trim().startsWith('https://')) {
      setError('La URL debe usar HTTPS');
      return;
    }
    if (events.length === 0) {
      setError('Debes seleccionar al menos un evento');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateWebhook({ name: name.trim(), url: url.trim(), events });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await updateWebhook({ regenerateSecret: true });
      onSecretRegenerated({ name: webhook.name, secret: updated.secret });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setConfirmingRegenerate(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={isSubmitting ? undefined : onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-webhook-title"
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 z-10">
            <h2 id="edit-webhook-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar Webhook
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="edit-webhook-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-webhook-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-webhook-url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                URL del Endpoint <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="edit-webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                required
              />
            </div>

            <WebhookEventSelector selectedEvents={events} onChange={setEvents} disabled={isSubmitting} />

            {/* Secret rotation */}
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Secreto de firma</p>
              {confirmingRegenerate ? (
                <div className="mt-2 space-y-3">
                  <p role="alert" className="flex gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    El secreto actual dejará de funcionar de inmediato. Tendrás que actualizarlo en tu
                    servidor para seguir validando las firmas.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Sí, regenerar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingRegenerate(false)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Genera un secreto nuevo si el actual se perdió o quedó expuesto.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmingRegenerate(true)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                    Regenerar Secreto
                  </button>
                </div>
              )}
            </div>

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
                disabled={isSubmitting || events.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
