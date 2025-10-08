'use client';

export function SystemAnalytics() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Métricas del Sistema
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">62%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Storage Usage</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">78%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">120ms</span>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Datos actualizados hace 5 minutos
        </p>
      </div>
    </div>
  );
} 