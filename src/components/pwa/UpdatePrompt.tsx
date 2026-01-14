'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWA Update Prompt Component
 *
 * Shows a notification when a new version of the service worker is available.
 * Users can click to reload and get the latest version.
 */
export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Only run in browser and production
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'development') {
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;

    // Listen for controller change (new SW activated)
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      // Don't auto-reload, let user decide
      setShowPrompt(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for updates on the current registration
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // New SW is installed and waiting
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowPrompt(true);
              }
            });
          }
        });

        // Also check if there's already a waiting SW
        if (registration.waiting) {
          setShowPrompt(true);
        }
      } catch (error) {
        console.error('Error checking for SW updates:', error);
      }
    };

    checkForUpdates();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      // Tell waiting SW to skip waiting and become active
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Reload after a short delay to allow SW to activate
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error updating SW:', error);
      // Fallback: just reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Nueva version disponible
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hay una actualizacion de Vetify disponible con mejoras y correcciones.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Actualizar ahora
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Mas tarde
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
