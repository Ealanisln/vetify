'use client';

import { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  consecutiveFailures: number;
  lastDeliveryAt: string | null;
  lastSuccessAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    deliveries: number;
  };
}

interface WebhookCardProps {
  webhook: WebhookData;
  onEdit: (webhook: WebhookData) => void;
  onDelete: (webhook: WebhookData) => void;
  onToggleActive: (webhook: WebhookData) => void;
  onTest: (webhook: WebhookData) => void;
}

export function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onToggleActive,
  onTest,
}: WebhookCardProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  const hasFailures = webhook.consecutiveFailures > 0;
  const isAutoDisabled = webhook.consecutiveFailures >= 10;

  // Get event badges - show first 3 and count of rest
  const displayEvents = webhook.events.slice(0, 3);
  const remainingEvents = webhook.events.length - 3;

  // Truncate URL for display
  const displayUrl = webhook.url.length > 50
    ? `${webhook.url.substring(0, 47)}...`
    : webhook.url;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
        !webhook.isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {webhook.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <code
              className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400 truncate max-w-[200px]"
              title={webhook.url}
            >
              {displayUrl}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onTest(webhook)}
            disabled={!webhook.isActive}
            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Probar webhook"
          >
            <PlayIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(webhook)}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Editar"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(webhook)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Eliminar"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Warning for failures */}
      {hasFailures && webhook.isActive && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            <span>
              {webhook.consecutiveFailures} fallo{webhook.consecutiveFailures !== 1 ? 's' : ''} consecutivo{webhook.consecutiveFailures !== 1 ? 's' : ''}
              {isAutoDisabled && ' - Auto-desactivado'}
            </span>
          </div>
        </div>
      )}

      {/* Events */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {displayEvents.map((event) => {
            const [resource] = event.split('.');
            const colorClasses: Record<string, string> = {
              pet: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              appointment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              inventory: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              sale: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            };
            return (
              <span
                key={event}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  colorClasses[resource] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {event}
              </span>
            );
          })}
          {remainingEvents > 0 && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              +{remainingEvents} mas
            </button>
          )}
        </div>

        {/* Expanded events */}
        {showAllEvents && remainingEvents > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {webhook.events.slice(3).map((event) => {
              const [resource] = event.split('.');
              const colorClasses: Record<string, string> = {
                pet: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                appointment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                inventory: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                sale: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              };
              return (
                <span
                  key={event}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    colorClasses[resource] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {event}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
        {webhook.lastSuccessAt && (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Exito{' '}
            {formatDistanceToNow(new Date(webhook.lastSuccessAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        )}
        {webhook.lastDeliveryAt && !webhook.lastSuccessAt && (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircleIcon className="h-3.5 w-3.5" />
            Fallo{' '}
            {formatDistanceToNow(new Date(webhook.lastDeliveryAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        )}
        {!webhook.lastDeliveryAt && (
          <span className="inline-flex items-center gap-1 text-gray-400">
            <ClockIcon className="h-3.5 w-3.5" />
            Sin entregas
          </span>
        )}
        {webhook._count && (
          <span className="text-gray-400">
            {webhook._count.deliveries} entrega{webhook._count.deliveries !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Footer with status */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Active status badge */}
          {webhook.isActive ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              Inactivo
            </span>
          )}
        </div>

        {/* Toggle active button */}
        <button
          onClick={() => onToggleActive(webhook)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            webhook.isActive
              ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          {webhook.isActive ? (
            <>
              <EyeSlashIcon className="h-3.5 w-3.5" />
              Desactivar
            </>
          ) : (
            <>
              <EyeIcon className="h-3.5 w-3.5" />
              Activar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
