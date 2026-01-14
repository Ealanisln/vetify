'use client';

import { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

/**
 * PWA Install Prompt Component
 *
 * Shows a prompt to help users install the PWA:
 * - On Android/Chrome: Shows install button that triggers native prompt
 * - On iOS/Safari: Shows step-by-step instructions for manual installation
 *
 * The prompt is hidden when:
 * - App is already installed (standalone mode)
 * - User dismissed it recently (7 days)
 * - Browser doesn't support installation (desktop Firefox, etc.)
 */
export function InstallPrompt() {
  const {
    isInstallable,
    isIOS,
    isStandalone,
    isDismissed,
    promptInstall,
    dismiss,
  } = usePWAInstall();

  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Delay showing the prompt to avoid being intrusive
    const timer = setTimeout(() => {
      // Show if: not installed, not dismissed, and (installable OR iOS)
      const shouldShow = !isStandalone && !isDismissed && (isInstallable || isIOS);
      setShowPrompt(shouldShow);
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, [isInstallable, isIOS, isStandalone, isDismissed]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    dismiss();
  };

  if (!showPrompt) {
    return null;
  }

  // iOS variant - show instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Instalar Vetify
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Para instalar la app en tu dispositivo:
              </p>

              <ol className="text-sm text-muted-foreground mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">1</span>
                  <span>Toca el boton</span>
                  <Share className="h-4 w-4 inline text-primary" />
                  <span>Compartir</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">2</span>
                  <span>Selecciona &quot;Agregar a inicio&quot;</span>
                </li>
              </ol>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Entendido
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

  // Android/Chrome variant - show install button
  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Instalar Vetify
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Instala la app para acceso rapido y uso sin conexion.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isInstalling ? (
                  <>
                    <Download className="h-4 w-4 animate-bounce" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Instalar
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
