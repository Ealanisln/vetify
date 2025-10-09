'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface NoActivePlanBannerProps {
  message?: string;
}

/**
 * Banner component to warn users about inactive subscriptions
 * Displayed at the top of allowed pages when user has no active plan
 */
export function NoActivePlanBanner({ message }: NoActivePlanBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const defaultMessage =
    'No tienes un plan activo. Algunas funciones están limitadas. Activa tu suscripción para acceder a todas las características.';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">No tienes un plan activo</p>
            <p className="text-sm opacity-90">
              {message || defaultMessage}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/precios')}
            className="bg-yellow-950 text-yellow-50 px-4 py-2 rounded-lg hover:bg-yellow-900 transition-colors font-medium text-sm whitespace-nowrap"
          >
            Ver Planes
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 hover:bg-yellow-600 rounded-lg transition-colors"
            aria-label="Cerrar banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
