'use client';

export function ClinicAnalytics() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Métricas de Clínicas
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Clínicas Activas</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">48</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Promedio de Citas/Día</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">156</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Satisfacción</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">94%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio de Sesión</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">8.5min</span>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Datos del último mes
        </p>
      </div>
    </div>
  );
} 