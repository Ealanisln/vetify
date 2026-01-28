'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AppointmentModal, TodayAppointments, AppointmentStats } from '../../../components/appointments';
import { AppointmentsProvider, useAppointmentsContext } from '../../../components/providers/AppointmentsProvider';
import { type AppointmentWithDetails } from '../../../lib/appointments';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { PlusIcon, Calendar, Clock, Users, Loader2 } from 'lucide-react';
import { useStaffPermissions } from '../../../hooks/useStaffPermissions';
import { DateSelectArg } from '@fullcalendar/core';
import { formatDate, formatTime } from '../../../lib/utils/date-format';
import { POSITION_LABELS_ES, StaffPositionType } from '../../../lib/staff-positions';

// PERFORMANCE FIX: Lazy load FullCalendar to reduce initial bundle size
// FullCalendar with 4 plugins adds significant weight to the JavaScript bundle
const FullCalendarView = dynamic(
  () => import('../../../components/appointments/FullCalendarView').then(mod => ({ default: mod.FullCalendarView })),
  {
    loading: () => (
      <Card className="w-full border-gray-200 dark:border-gray-800">
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#75a99c]" />
            <p className="text-sm text-gray-500">Cargando calendario...</p>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false, // FullCalendar doesn't support SSR
  }
);

// Translation mapping for species (English to Spanish)
const speciesTranslation: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
};
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
  return (
    <AppointmentsProvider>
      <AppointmentsPageContent
        customers={customers}
        pets={pets}
        staff={staff}
      />
    </AppointmentsProvider>
  );
}

/**
 * Inner component that uses AppointmentsContext
 * Separated to allow hooks to be called inside the provider
 */
function AppointmentsPageContent({
  customers,
  pets,
  staff,
}: AppointmentsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Use context for quickAction and refresh (single source of truth)
  const { quickAction, refresh } = useAppointmentsContext();
  const { canAccess: checkPermission } = useStaffPermissions();

  // Check if user has permission to create/edit appointments
  const canWriteAppointments = checkPermission('appointments', 'write');

  // Trigger calendar refresh
  // IMPORTANT: Memoize to prevent infinite re-render loops
  const triggerCalendarRefresh = useCallback(() => {
    setCalendarRefreshTrigger(prev => prev + 1);
  }, []);

  // Auto-refresh calendar data when page mounts
  // This ensures new appointments appear after navigating back from creation page
  useEffect(() => {
    // Small delay to ensure the calendar is mounted
    const timer = setTimeout(() => {
      triggerCalendarRefresh();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Refresh when page becomes visible again (e.g., returning from another tab)
    // IMPORTANT: Add debounce to prevent rapid successive calls that can cause infinite loops
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any pending refresh
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        // Debounce the refresh to prevent rapid successive calls
        debounceTimer = setTimeout(() => {
          triggerCalendarRefresh();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [triggerCalendarRefresh]);

  // IMPORTANT: Memoize all handlers to prevent infinite re-render loops
  const handleNewAppointment = useCallback(() => {
    setSelectedAppointment(undefined);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  }, []);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedAppointment(undefined);
    setSelectedDate(selectInfo.start);
    setIsModalOpen(true);
  }, []);

  const handleEventClick = useCallback(() => {
    // This is handled by the FullCalendarView component's internal modal
    // We could add additional logic here if needed
  }, []);

  const handleEventEdit = useCallback((appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  }, []);

  const handleModalSuccess = useCallback(async () => {
    await refresh();
    triggerCalendarRefresh();
  }, [refresh, triggerCalendarRefresh]);

  const handleQuickAction = useCallback(async (appointmentId: string, action: string) => {
    try {
      // quickAction already invalidates the cache and triggers revalidation
      // No need to call refresh() or triggerCalendarRefresh() separately
      // as this can cause "Maximum update depth exceeded" errors
      await quickAction(appointmentId, action);
    } catch (error) {
      throw error; // Re-throw to be handled by the QuickActions component
    }
  }, [quickAction]);

  const handleWhatsApp = useCallback((phone: string, appointment: AppointmentWithDetails) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${appointment.customer.name}, recordamos tu cita para ${appointment.pet.name} el ${formatDate(appointment.dateTime)} a las ${formatTime(appointment.dateTime)}. Motivo: ${appointment.reason}`
    );

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendario de Citas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona las citas y horarios de tu clínica</p>
        </div>
        {canWriteAppointments && (
          <Button onClick={handleNewAppointment} className="inline-flex items-center" data-testid="new-appointment-button">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 dark:border-gray-800">
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

        <Card className="border-gray-200 dark:border-gray-800">
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

        <Card className="border-gray-200 dark:border-gray-800">
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
      <div data-testid="appointment-stats">
        <AppointmentStats />
      </div>

      {/* Today's Appointments */}
      <TodayAppointments
        onQuickAction={handleQuickAction}
        onWhatsApp={handleWhatsApp}
      />

      {/* Calendar */}
      <div data-testid="appointments-calendar">
        <FullCalendarView
          onEventClick={handleEventClick}
          onEventEdit={canWriteAppointments ? handleEventEdit : undefined}
          onDateSelect={canWriteAppointments ? handleDateSelect : undefined}
          defaultView="timeGridWeek"
          editable={canWriteAppointments}
          selectable={canWriteAppointments}
          className="mobile-calendar"
          refreshTrigger={calendarRefreshTrigger}
        />
      </div>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 dark:border-gray-800">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{pets.filter(p => p.customerId === customer.id).length} mascotas</Badge>
                </div>
              ))}
              {customers.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                  +{customers.length - 5} clientes más
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800">
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
                  <span className="font-medium">{speciesTranslation[species] || species}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{POSITION_LABELS_ES[member.position as StaffPositionType] || member.position}</p>
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