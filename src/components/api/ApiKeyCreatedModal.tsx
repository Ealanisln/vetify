'use client';

import { useState } from 'react';
import {
  CheckIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface ApiKeyCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyName: string;
  fullKey: string;
}

export function ApiKeyCreatedModal({
  isOpen,
  onClose,
  keyName,
  fullKey,
}: ApiKeyCreatedModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop - non-dismissable */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-auto">
          {/* Header */}
          <div className="p-6 pb-4 text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <KeyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Clave de API Creada
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu nueva clave <strong>{keyName}</strong> ha sido creada exitosamente
            </p>
          </div>

          {/* Warning */}
          <div className="mx-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  ¡Importante!
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Esta es la única vez que verás la clave completa. Cópiala ahora y
                  guárdala en un lugar seguro. No podrás recuperarla después.
                </p>
              </div>
            </div>
          </div>

          {/* Key Display */}
          <div className="p-6 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tu clave de API:
            </label>
            <div className="relative">
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 pr-12 overflow-x-auto">
                <code className="text-sm text-green-400 font-mono break-all select-all">
                  {fullKey}
                </code>
              </div>
              <button
                onClick={handleCopy}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={copied ? 'Copiado' : 'Copiar clave'}
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {copied && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckIcon className="h-4 w-4" />
                Clave copiada al portapapeles
              </p>
            )}
          </div>

          {/* Usage hint */}
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usa esta clave en el header de tus peticiones API:
            </p>
            <code className="mt-1 block text-xs bg-gray-100 dark:bg-gray-900 rounded px-2 py-1 text-gray-600 dark:text-gray-400">
              Authorization: Bearer {fullKey.substring(0, 12)}...
            </code>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Entendido, ya copié mi clave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
