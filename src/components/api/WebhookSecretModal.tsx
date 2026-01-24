'use client';

import { useState } from 'react';
import {
  CheckIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface WebhookSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookName: string;
  secret: string;
}

export function WebhookSecretModal({
  isOpen,
  onClose,
  webhookName,
  secret,
}: WebhookSecretModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(secret);
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
              <LinkIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Webhook Creado
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu webhook <strong>{webhookName}</strong> ha sido creado exitosamente
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
                  Esta es la única vez que verás el secreto completo. Cópialo ahora y
                  guárdalo en un lugar seguro. Lo necesitarás para verificar las firmas
                  de los webhooks.
                </p>
              </div>
            </div>
          </div>

          {/* Secret Display */}
          <div className="p-6 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tu secreto de webhook:
            </label>
            <div className="relative">
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 pr-12 overflow-x-auto">
                <code className="text-sm text-green-400 font-mono break-all select-all">
                  {secret}
                </code>
              </div>
              <button
                onClick={handleCopy}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={copied ? 'Copiado' : 'Copiar secreto'}
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
                Secreto copiado al portapapeles
              </p>
            )}
          </div>

          {/* Usage hint */}
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Verifica las firmas de los webhooks usando este secreto:
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 overflow-x-auto">
              <code className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre">
{`const crypto = require('crypto');
const signature = req.headers['x-vetify-signature'];
const timestamp = req.headers['x-vetify-timestamp'];
const payload = \`\${timestamp}.\${JSON.stringify(req.body)}\`;
const expected = 'sha256=' + crypto
  .createHmac('sha256', '${secret.slice(6, 12)}...')
  .update(payload)
  .digest('hex');
const valid = signature === expected;`}
              </code>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Entendido, ya copié mi secreto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
