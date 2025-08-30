'use client';

import { useState } from 'react';
import { FullCalendarView, AppointmentModal, TodayAppointments, AppointmentStats } from '@/components/appointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Calendar, Clock, Users } from 'lucide-react';
import { useAppointments, AppointmentWithDetails } from '@/hooks/useAppointments';
import { useCalendar } from '@/hooks/useCalendar';
import { DateSelectArg } from '@fullcalendar/core';
// Toast notifications will be handled by individual components

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  customerId: string;
}

interface Staff {
  id: string;
  name: string;
  position: string;
}

interface AppointmentsPageClientProps {
  customers: Customer[];
  pets: Pet[];
  staff: Staff[];
}

export function AppointmentsPageClient({
  customers,
  pets,
  staff,
}: AppointmentsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { quickAction, refresh } = useAppointments();
  const { refresh: refreshCalendar } = useCalendar();

  const handleNewAppointment = () => {
    setSelectedAppointment(undefined);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedAppointment(undefined);
    setSelectedDate(selectInfo.start);
    setIsModalOpen(true);
  };

  const handleEventClick = () => {
    // This is handled by the FullCalendarView component's internal modal
    // We could add additional logic here if needed
  };

  const handleModalSuccess = async () => {
    await Promise.all([refresh(), refreshCalendar()]);
  };

  const handleQuickAction = async (appointmentId: string, action: string) => {
    try {
      await quickAction(appointmentId, action);
      await Promise.all([refresh(), refreshCalendar()]);
    } catch (error) {
      throw error; // Re-throw to be handled by the QuickActions component
    }
  };

  const handleWhatsApp = (phone: string, appointment: AppointmentWithDetails) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${appointment.customer.name}, recordamos tu cita para ${appointment.pet.name} el ${appointment.dateTime.toLocaleDateString()} a las ${appointment.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Motivo: ${appointment.reason}`
    );
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
          <p className="text-gray-500">Gestiona las citas y horarios de tu clínica</p>
        </div>
        <Button onClick={handleNewAppointment} className="inline-flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mascotas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pets.length}</div>
            <p className="text-xs text-muted-foreground">
              Mascotas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              Miembros del equipo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Stats */}
      <AppointmentStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-4">
        {/* Calendar - Takes up 3 columns, full width on mobile */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <FullCalendarView
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            defaultView="timeGridWeek"
            editable={true}
            selectable={true}
            className="mobile-calendar"
          />
        </div>
        
        {/* Today's Appointments Sidebar - Takes up 1 column, shows first on mobile */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <TodayAppointments 
            onQuickAction={handleQuickAction}
            onWhatsApp={handleWhatsApp}
          />
        </div>
      </div>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clientes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customers.slice(0, 5).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{pets.filter(p => p.customerId === customer.id).length} mascotas</Badge>
                </div>
              ))}
              {customers.length > 5 && (
                <p className="text-xs text-gray-500 pt-2">
                  +{customers.length - 5} clientes más
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Especies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(
                pets.reduce((acc, pet) => {
                  acc[pet.species] = (acc[pet.species] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([species, count]) => (
                <div key={species} className="flex items-center justify-between">
                  <span className="font-medium">{species}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.position}</p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        appointment={selectedAppointment}
        customers={customers}
        pets={pets}
        staff={staff}
        onSuccess={handleModalSuccess}
        initialDate={selectedDate}
      />
    </div>
  );
}