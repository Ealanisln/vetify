interface TodayAppointmentsProps {
  tenantId: string;
}

interface Appointment {
  id: string;
  time: string;
  customerName: string;
  petName: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  phone?: string;
}

export function TodayAppointments({ tenantId }: TodayAppointmentsProps) {
  // TODO: Fetch real appointments using tenantId
  console.log('Loading appointments for tenant:', tenantId);
  
  // Datos mock
  const appointments: Appointment[] = [
    {
      id: '1',
      time: '09:00',
      customerName: 'María García',
      petName: 'Max',
      service: 'Consulta General',
      status: 'confirmed',
      phone: '+34 600 123 456'
    },
    {
      id: '2',
      time: '10:30',
      customerName: 'Carlos López',
      petName: 'Luna',
      service: 'Vacunación',
      status: 'pending',
      phone: '+34 600 789 012'
    },
    {
      id: '3',
      time: '12:00',
      customerName: 'Ana Martín',
      petName: 'Toby',
      service: 'Revisión Post-Operatoria',
      status: 'confirmed',
      phone: '+34 600 345 678'
    },
    {
      id: '4',
      time: '14:30',
      customerName: 'Pedro Sánchez',
      petName: 'Mila',
      service: 'Limpieza Dental',
      status: 'pending'
    },
    {
      id: '5',
      time: '16:00',
      customerName: 'Laura Ruiz',
      petName: 'Rocky',
      service: 'Consulta Dermatológica',
      status: 'completed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  const currentTime = new Date().toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Citas de Hoy
          </h3>
          <div className="text-sm text-gray-500">
            {currentTime}
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📅</div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Sin citas programadas
            </h4>
            <p className="text-sm text-gray-500">
              No hay citas programadas para hoy
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold text-gray-900">
                      {appointment.time}
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.customerName} - {appointment.petName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.service}
                    </p>
                    {appointment.phone && (
                      <p className="text-xs text-gray-500 mt-1">
                        📱 {appointment.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {appointment.status === 'pending' && (
                    <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors">
                      Confirmar
                    </button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors">
                      Completar
                    </button>
                  )}
                  {appointment.phone && (
                    <button 
                      onClick={() => window.open(`https://wa.me/${appointment.phone?.replace(/\D/g, '')}`, '_blank')}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                    >
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 