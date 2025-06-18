interface Customer {
  id: string;
  name: string;
  isActive: boolean;
  _count?: {
    pets: number;
    appointments: number;
  };
}

interface CustomerStatsProps {
  customers: Customer[];
}

export function CustomerStats({ customers }: CustomerStatsProps) {
  const totalCustomers = customers.length;
  const totalPets = customers.reduce((sum, customer) => sum + (customer._count?.pets || 0), 0);
  const activeCustomers = customers.filter(customer => customer.isActive).length;
  const averagePetsPerCustomer = totalCustomers > 0 ? (totalPets / totalCustomers).toFixed(1) : 0;

  const stats = [
    {
      name: 'Total Clientes',
      value: totalCustomers,
      icon: '👥',
      color: 'blue'
    },
    {
      name: 'Clientes Activos',
      value: activeCustomers,
      icon: '✅',
      color: 'green'
    },
    {
      name: 'Total Mascotas',
      value: totalPets,
      icon: '🐕',
      color: 'purple'
    },
    {
      name: 'Promedio Mascotas/Cliente',
      value: averagePetsPerCustomer,
      icon: '📊',
      color: 'orange'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
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
                  <dd className="text-2xl font-bold text-gray-900">
                    {stat.value}
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