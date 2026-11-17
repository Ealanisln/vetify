'use client';

import { useCallback, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const PAGE_SIZE = 10;

type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'SKIPPED';

interface DeliveryLog {
  id: string;
  eventType: string;
  attempt: number;
  status: DeliveryStatus;
  httpStatusCode: number | null;
  responseBody: string | null;
  error: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface WebhookDeliveryLogsProps {
  webhook: { id: string; name: string };
  onClose: () => void;
}

const STATUS_BADGES: Record<DeliveryStatus, { label: string; className: string }> = {
  DELIVERED: {
    label: 'Entregado',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  FAILED: {
    label: 'Fallido',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  PENDING: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  SKIPPED: {
    label: 'Omitido',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
};

export function WebhookDeliveryLogs({ webhook, onClose }: WebhookDeliveryLogsProps) {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(onClose);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/settings/webhooks/${webhook.id}/logs?page=${page}&limit=${PAGE_SIZE}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar el historial de entregas');
      }
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [webhook.id, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="webhook-logs-title"
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] flex flex-col"
        >
          <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0">
              <h2 id="webhook-logs-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Historial de entregas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{webhook.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div role="status" aria-label="Cargando entregas" className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={loadLogs}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                >
                  Reintentar
                </button>
              </div>
            ) : logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Aún no hay entregas para este webhook.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                {logs.map((log) => (
                  <DeliveryRow key={log.id} log={log} />
                ))}
              </ul>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && !error && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={loading || !pagination.hasPreviousPage}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || !pagination.hasNextPage}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveryRow({ log }: { log: DeliveryLog }) {
  const badge = STATUS_BADGES[log.status] ?? STATUS_BADGES.PENDING;
  // Failed responses are stored as "HTTP <code>", which the status already shows
  const errorDetail = log.error && log.error !== `HTTP ${log.httpStatusCode}` ? log.error : null;

  return (
    <li className="p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
          {log.eventType}
        </code>
        {log.httpStatusCode !== null && (
          <span className="text-xs text-gray-500 dark:text-gray-400">HTTP {log.httpStatusCode}</span>
        )}
        {log.attempt > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">Intento {log.attempt}</span>
        )}
        <span className="ml-auto text-xs text-gray-400" title={new Date(log.createdAt).toLocaleString('es-MX')}>
          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: es })}
        </span>
      </div>
      {errorDetail && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 break-words">{errorDetail}</p>
      )}
    </li>
  );
}
