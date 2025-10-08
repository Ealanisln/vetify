'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.731 0 2.814-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            ¡Oops! Algo salió mal
          </h3>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Se ha producido un error inesperado. Por favor, inténtalo de nuevo o contacta con soporte si el problema persiste.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-xs text-left">
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400">
                Detalles técnicos
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-700 p-2 rounded text-red-600 dark:text-red-400">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={reset}
              className="flex-1"
            >
              Intentar de nuevo
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 