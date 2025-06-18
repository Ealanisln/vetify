interface AppointmentStatsProps {
  tenantId: string;
}

export function AppointmentStats({ tenantId }: AppointmentStatsProps) {
  // TODO: Fetch real data using tenantId
  console.log('Loading stats for tenant:', tenantId);
  
  // Datos mock por ahora - más tarde conectaremos con la API
  const stats = [
    {
      name: 'Citas Hoy',
      value: 8,
      icon: '📅',
      color: 'blue',
      change: '+2'
    },
    {
      name: 'Citas Esta Semana',
      value: 24,
      icon: '🗓️',
      color: 'green',
      change: '+12%'
    },
    {
      name: 'Próximas Citas',
      value: 15,
      icon: '⏰',
      color: 'orange',
      change: '+5'
    },
    {
      name: 'Cancelaciones',
      value: 3,
      icon: '❌',
      color: 'red',
      change: '-1'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className={`overflow-hidden shadow rounded-lg border ${getColorClasses(stat.color)}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 