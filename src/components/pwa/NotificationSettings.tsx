'use client';

import { Bell, BellOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationSettingsProps {
  className?: string;
}

/**
 * Component for managing push notification settings
 * Can be used in settings page or as a standalone prompt
 */
export function NotificationSettings({ className }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // Not supported message
  if (!isSupported) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Notificaciones no disponibles
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tu navegador no soporta notificaciones push. Intenta con Chrome, Firefox, Edge o Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission denied message
  if (permission === 'denied') {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <BellOff className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Notificaciones bloqueadas
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Has bloqueado las notificaciones. Para habilitarlas, ve a la configuración de tu navegador y permite notificaciones para este sitio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Bell className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isSubscribed ? 'text-[#75a99c]' : 'text-gray-400'}`} />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Notificaciones push
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isSubscribed
              ? 'Recibirás notificaciones de citas, recordatorios y alertas importantes.'
              : 'Activa las notificaciones para recibir recordatorios de citas y alertas importantes.'}
          </p>

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}

          <div className="mt-3">
            {isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribe}
                disabled={isLoading}
                className="border-gray-200 dark:border-gray-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desactivando...
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Desactivar notificaciones
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={subscribe}
                disabled={isLoading}
                className="bg-[#75a99c] hover:bg-[#5d8a7f] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activando...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Activar notificaciones
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
