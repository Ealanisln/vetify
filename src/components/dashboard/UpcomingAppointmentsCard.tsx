import Link from 'next/link';
import { AppointmentWithDetails } from '@/types';
import { formatCalendarDateTime } from '@/lib/utils/date-format';

interface UpcomingAppointmentsCardProps {
  appointments: AppointmentWithDetails[];
}

export function UpcomingAppointmentsCard({ appointments }: UpcomingAppointmentsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Programada';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Próximas Citas
          </h3>
          <Link
            href="/dashboard/appointments"
            className="text-sm font-medium text-[#5b9788] hover:text-[#75a99c] dark:text-[#75a99c] dark:hover:text-[#8cbcb0]"
          >
            Ver todas
          </Link>
        </div>
        <div className="mt-6 flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
            {appointments.length === 0 ? (
              <li className="py-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-2 block">📅</span>
                  <p>No hay citas programadas</p>
                  <Link
                    href="/dashboard/appointments/new"
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#75a99c] hover:bg-[#5b9788] transition-colors"
                  >
                    Programar cita
                  </Link>
                </div>
              </li>
            ) : (
              appointments.map((appointment) => (
                <li key={appointment.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-[#75a99c] flex items-center justify-center text-white font-bold">
                        {appointment.pet.name[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {appointment.pet.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {appointment.reason}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatCalendarDateTime(appointment.dateTime)} • {appointment.pet.customer.firstName || appointment.pet.customer.name}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                      <Link
                        href={`/dashboard/appointments/${appointment.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 