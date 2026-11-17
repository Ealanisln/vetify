'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface DeleteWebhookDialogProps {
  webhookName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteWebhookDialog({
  webhookName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteWebhookDialogProps) {
  useEscapeKey(onCancel, !isDeleting);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={isDeleting ? undefined : onCancel}
        />

        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-webhook-title"
          aria-describedby="delete-webhook-description"
          className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full mx-auto p-6"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30">
              <ExclamationTriangleIcon
                className="h-6 w-6 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <h2
                id="delete-webhook-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Eliminar Webhook
              </h2>
              <div
                id="delete-webhook-description"
                className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <p className="break-words">
                  ¿Estás seguro de que deseas eliminar el webhook &quot;{webhookName}&quot;?
                </p>
                <p>Esta acción no se puede deshacer y dejará de recibir notificaciones.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              autoFocus
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
