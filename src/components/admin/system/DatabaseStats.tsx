'use client';

export function DatabaseStats() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Estadísticas de Base de Datos
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total de Registros</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">125,492</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tamaño de DB</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">2.4 GB</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Conexiones Activas</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">12</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo de Consulta Promedio</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">45ms</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Último Backup</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Hace 2 horas</span>
        </div>
      </div>
      
      <div className="mt-6">
        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors">
          Ejecutar Backup Manual
        </button>
      </div>
    </div>
  );
} 