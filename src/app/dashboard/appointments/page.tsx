import { requireAuth } from '@/lib/auth';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentStats } from '@/components/appointments/AppointmentStats';
import { TodayAppointments } from '@/components/appointments/TodayAppointments';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function AppointmentsPage() {
  const { tenant } = await requireAuth();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
          <p className="text-gray-500">Gestiona las citas y horarios de tu clínica</p>
        </div>
        <Link href="/dashboard/appointments/new">
          <Button className="inline-flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <AppointmentStats tenantId={tenant.id} />

      {/* Calendar and Today's Appointments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <AppointmentCalendar tenantId={tenant.id} />
        </div>
        
        {/* Today's Appointments */}
        <div>
          <TodayAppointments tenantId={tenant.id} />
        </div>
      </div>
    </div>
  );
} 