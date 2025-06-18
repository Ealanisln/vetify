'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

interface AppointmentCalendarProps {
  tenantId: string;
}

interface CalendarEvent {
  id: string;
  date: Date;
  time: string;
  customerName: string;
  petName: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export function AppointmentCalendar({ tenantId }: AppointmentCalendarProps) {
  // TODO: Fetch real appointments using tenantId
  console.log('Loading calendar for tenant:', tenantId);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Datos mock de eventos del calendario
  const events: CalendarEvent[] = [
    {
      id: '1',
      date: new Date(),
      time: '09:00',
      customerName: 'María García',
      petName: 'Max',
      service: 'Consulta General',
      status: 'confirmed'
    },
    {
      id: '2',
      date: new Date(),
      time: '10:30',
      customerName: 'Carlos López',
      petName: 'Luna',
      service: 'Vacunación',
      status: 'pending'
    },
    {
      id: '3',
      date: new Date(Date.now() + 86400000), // Mañana
      time: '11:00',
      customerName: 'Ana Martín',
      petName: 'Toby',
      service: 'Revisión',
      status: 'confirmed'
    }
  ];

  // Filtrar eventos por fecha seleccionada
  const selectedDateEvents = selectedDate 
    ? events.filter(event => 
        event.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  const hasEventsOnDate = (date: Date) => {
    return events.some(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Calendario de Citas
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEvents: (date) => hasEventsOnDate(date)
              }}
              modifiersStyles={{
                hasEvents: {
                  backgroundColor: '#dbeafe',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px'
                }
              }}
            />
            
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded"></div>
                <span>Días con citas programadas</span>
              </div>
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">
                Citas para {selectedDate?.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h4>
              <Button size="sm" variant="outline">
                Nueva Cita
              </Button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm text-gray-500">
                  No hay citas programadas para esta fecha
                </p>
                <Button size="sm" className="mt-3">
                  Agendar Nueva Cita
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((event) => (
                    <div 
                      key={event.id}
                      className={`p-4 rounded-lg border ${getStatusColor(event.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-semibold text-gray-900">
                              {event.time}
                            </span>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-70">
                              {getStatusText(event.status)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {event.customerName} - {event.petName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {event.service}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost">
                            Ver
                          </Button>
                          <Button size="sm" variant="ghost">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 