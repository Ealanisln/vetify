'use client';

import { useState } from 'react';
import {
  ClipboardDocumentIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsed: string | null;
  isActive: boolean;
  expiresAt: string | null;
  rateLimit: number;
  createdAt: string;
  locationId: string | null;
  location?: {
    id: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

interface ApiKeyCardProps {
  apiKey: ApiKeyData;
  onEdit: (apiKey: ApiKeyData) => void;
  onDelete: (apiKey: ApiKeyData) => void;
  onToggleActive: (apiKey: ApiKeyData) => void;
}

export function ApiKeyCard({ apiKey, onEdit, onDelete, onToggleActive }: ApiKeyCardProps) {
  const [copied, setCopied] = useState(false);
  const [showScopes, setShowScopes] = useState(false);

  const handleCopyPrefix = async () => {
    await navigator.clipboard.writeText(apiKey.keyPrefix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

  // Get scope badges - show first 3 and count of rest
  const displayScopes = apiKey.scopes.slice(0, 3);
  const remainingScopes = apiKey.scopes.length - 3;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
        !apiKey.isActive || isExpired ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {apiKey.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400">
              {apiKey.keyPrefix}...
            </code>
            <button
              onClick={handleCopyPrefix}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copiar prefijo"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onEdit(apiKey)}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Editar"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(apiKey)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Eliminar"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scopes */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {displayScopes.map((scope) => {
            const isRead = scope.startsWith('read:');
            return (
              <span
                key={scope}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isRead
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {scope.replace(':', ':')}
              </span>
            );
          })}
          {remainingScopes > 0 && (
            <button
              onClick={() => setShowScopes(!showScopes)}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              +{remainingScopes} más
            </button>
          )}
        </div>

        {/* Expanded scopes */}
        {showScopes && remainingScopes > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {apiKey.scopes.slice(3).map((scope) => {
              const isRead = scope.startsWith('read:');
              return (
                <span
                  key={scope}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isRead
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {scope}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
        {apiKey.location && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5" />
            {apiKey.location.name}
          </span>
        )}
        {!apiKey.location && (
          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <MapPinIcon className="h-3.5 w-3.5" />
            Global
          </span>
        )}
        {apiKey.lastUsed && (
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            Usado{' '}
            {formatDistanceToNow(new Date(apiKey.lastUsed), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        )}
        {!apiKey.lastUsed && (
          <span className="inline-flex items-center gap-1 text-gray-400">
            <ClockIcon className="h-3.5 w-3.5" />
            Nunca usada
          </span>
        )}
      </div>

      {/* Footer with status */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Active status badge */}
          {isExpired ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Expirada
            </span>
          ) : apiKey.isActive ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Activa
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              Inactiva
            </span>
          )}

          {/* Rate limit */}
          <span className="text-xs text-gray-400">
            {apiKey.rateLimit.toLocaleString()} req/hora
          </span>
        </div>

        {/* Toggle active button */}
        {!isExpired && (
          <button
            onClick={() => onToggleActive(apiKey)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              apiKey.isActive
                ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            {apiKey.isActive ? (
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
        )}
      </div>
    </div>
  );
}
