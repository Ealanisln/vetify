'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { WebhookEventSelector } from './WebhookEventSelector';

interface CreateWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (data: { id: string; secret: string; name: string }) => void;
}

export function CreateWebhookModal({
  isOpen,
  onClose,
  onCreated,
}: CreateWebhookModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setUrl('');
      setEvents([]);
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

    if (!url.trim()) {
      setError('La URL es requerida');
      return;
    }

    if (!url.startsWith('https://')) {
      setError('La URL debe usar HTTPS');
      return;
    }

    if (events.length === 0) {
      setError('Debes seleccionar al menos un evento');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          events,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el webhook');
      }

      onCreated({
        id: data.data.id,
        secret: data.data.secret,
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
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 z-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nuevo Webhook
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
                htmlFor="webhook-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="webhook-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Notificaciones a CRM"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Un nombre descriptivo para identificar este webhook
              </p>
            </div>

            {/* URL */}
            <div>
              <label
                htmlFor="webhook-url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                URL del Endpoint <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tu-servidor.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                La URL debe usar HTTPS. Recibirá peticiones POST con los eventos
              </p>
            </div>

            {/* Events */}
            <WebhookEventSelector
              selectedEvents={events}
              onChange={setEvents}
              disabled={isSubmitting}
            />

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
                disabled={isSubmitting || events.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Webhook'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
