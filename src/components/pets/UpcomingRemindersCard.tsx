'use client';

export function UpcomingRemindersCard() {
  // Mock upcoming reminders
  const upcomingReminders = [
    {
      id: '1',
      type: 'VACCINATION',
      message: 'Vacuna anual DHPPI',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'high'
    },
    {
      id: '2',
      type: 'DEWORMING',
      message: 'Desparasitación trimestral',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      priority: 'medium'
    },
    {
      id: '3',
      type: 'CHECKUP',
      message: 'Revisión general',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: 'low'
    }
  ];

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'VACCINATION': return '💉';
      case 'DEWORMING': return '🪱';
      case 'CHECKUP': return '🩺';
      default: return '⏰';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    }
  };

  const formatDaysUntil = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    if (days < 7) return `En ${days} días`;
    if (days < 14) return 'La próxima semana';
    if (days < 30) return `En ${Math.ceil(days / 7)} semanas`;
    return `En ${Math.ceil(days / 30)} meses`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Próximos Recordatorios
        </h3>

        {upcomingReminders.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¡Todo al día! No hay recordatorios pendientes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`rounded-lg border p-3 ${getPriorityColor(reminder.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getReminderIcon(reminder.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {reminder.message}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatDaysUntil(reminder.dueDate)}
                    </p>
                  </div>
                  <button className="text-xs font-medium px-2 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-center text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium transition-colors">
            Ver todos los recordatorios →
          </button>
        </div>
      </div>
    </div>
  );
} 