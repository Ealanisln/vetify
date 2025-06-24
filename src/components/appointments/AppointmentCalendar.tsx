'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Heart, 
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, isToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentCalendarProps {
  tenantId: string;
}

interface CalendarEvent {
  id: string;
  date: Date;
  time: string;
  duration: number; // en minutos
  customerName: string;
  petName: string;
  petType: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  notes?: string;
  veterinarian?: string;
}

export function AppointmentCalendar({ tenantId }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');

  // TODO: Reemplazar con llamada real a la API
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Simular llamada a API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockEvents: CalendarEvent[] = [
          {
            id: '1',
            date: new Date(),
            time: '09:00',
            duration: 30,
            customerName: 'María García',
            petName: 'Max',
            petType: 'Perro',
            service: 'Consulta General',
            status: 'confirmed',
            priority: 'medium',
            veterinarian: 'Dr. González',
            notes: 'Primera consulta del cachorro'
          },
          {
            id: '2',
            date: new Date(),
            time: '10:30',
            duration: 45,
            customerName: 'Carlos López',
            petName: 'Luna',
            petType: 'Gato',
            service: 'Vacunación',
            status: 'pending',
            priority: 'high',
            veterinarian: 'Dr. González'
          },
          {
            id: '3',
            date: new Date(),
            time: '14:00',
            duration: 60,
            customerName: 'Ana Martín',
            petName: 'Rocky',
            petType: 'Perro',
            service: 'Cirugía Menor',
            status: 'confirmed',
            priority: 'high',
            veterinarian: 'Dr. Rodríguez'
          },
          {
            id: '4',
            date: addDays(new Date(), 1),
            time: '11:00',
            duration: 30,
            customerName: 'Pedro Sánchez',
            petName: 'Toby',
            petType: 'Perro',
            service: 'Revisión',
            status: 'confirmed',
            priority: 'low',
            veterinarian: 'Dr. González'
          },
          {
            id: '5',
            date: addDays(new Date(), 2),
            time: '09:30',
            duration: 120,
            customerName: 'Laura Fernández',
            petName: 'Mimi',
            petType: 'Gato',
            service: 'Cirugía',
            status: 'confirmed',
            priority: 'emergency',
            veterinarian: 'Dr. Rodríguez',
            notes: 'Cirugía de emergencia - fractura'
          }
        ];
        
        setEvents(mockEvents);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [tenantId]);

  // Filtrar eventos por fecha seleccionada
  const selectedDateEvents = selectedDate 
    ? events.filter(event => 
        format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      ).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  // Verificar si una fecha tiene eventos
  const hasEventsOnDate = (date: Date) => {
    return events.some(event => 
      format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };



  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Obtener color de prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendario de Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando calendario...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendario de Citas
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="px-3"
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Calendario
                </Button>
                <Button
                  variant={viewMode === 'agenda' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('agenda')}
                  className="px-3"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Agenda
                </Button>
              </div>
              <Button className="ml-2">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cita
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border shadow-sm w-full flex justify-center"
                  captionLayout="dropdown"
                  modifiers={{
                    hasEvents: (date) => hasEventsOnDate(date),
                    today: (date) => isToday(date)
                  }}
                  modifiersStyles={{
                    hasEvents: {
                      backgroundColor: '#dbeafe',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      fontWeight: 'bold'
                    }
                  }}
                />
                
                {/* Leyenda */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded"></div>
                    <span>Días con citas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent rounded"></div>
                    <span>Hoy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de citas del día */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>
                    {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
                  </span>
                  {selectedDateEvents.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'cita' : 'citas'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                    <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-3">
                      No hay citas programadas para esta fecha
                    </p>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar Cita
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedDateEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={`p-4 rounded-lg border ${getStatusColor(event.status)} hover:shadow-md transition-shadow`}
                      >
                        {/* Header de la cita */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {event.time}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}></div>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {getStatusIcon(event.status)}
                            <span>{getStatusText(event.status)}</span>
                          </div>
                        </div>

                        {/* Información de la cita */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{event.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-gray-500" />
                            <span>{event.petName} ({event.petType})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{event.service} • {event.duration} min</span>
                          </div>
                          {event.veterinarian && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Veterinario:</span> {event.veterinarian}
                            </div>
                          )}
                          {event.notes && (
                            <div className="text-sm text-gray-600 bg-white bg-opacity-50 p-2 rounded mt-2">
                              <span className="font-medium">Notas:</span> {event.notes}
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="ghost" className="text-xs">
                            Ver Detalles
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs">
                            Editar
                          </Button>
                          {event.status === 'pending' && (
                            <Button size="sm" variant="ghost" className="text-xs text-green-600">
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Vista de Agenda (próximas implementaciones)
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vista de Agenda</h3>
              <p className="text-gray-500">Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 