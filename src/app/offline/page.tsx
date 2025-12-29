'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-gray-500 dark:text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Sin conexión
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Parece que no tienes conexión a internet. Verifica tu conexión e intenta nuevamente.
        </p>

        <Button
          onClick={handleRetry}
          className="bg-[#75a99c] hover:bg-[#5d8a7f] text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>

        <p className="text-sm text-gray-500 dark:text-gray-500 mt-8">
          Algunas funciones pueden estar disponibles sin conexión una vez que hayas visitado la página anteriormente.
        </p>
      </div>
    </div>
  );
}
