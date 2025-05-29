import { requireAuth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/dashboard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentPetsCard } from '@/components/dashboard/RecentPetsCard';
import { UpcomingAppointmentsCard } from '@/components/dashboard/UpcomingAppointmentsCard';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { user, tenant } = await requireAuth();
  const stats = await getDashboardStats(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          ¡Hola, {user.firstName || user.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aquí tienes un resumen de {tenant.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Mascotas Registradas"
          value={stats.totalPets}
          limit={stats.planLimits.maxPets}
          icon="🐕"
        />
        <StatsCard
          title="Citas Programadas"
          value={stats.totalAppointments}
          icon="📅"
        />
        <StatsCard
          title="Plan Actual"
          value={0}
          icon="⭐"
        />
        <StatsCard
          title="Automatizaciones"
          value={0}
          icon="🤖"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentPetsCard pets={stats.recentPets} />
        <UpcomingAppointmentsCard appointments={stats.upcomingAppointments} />
      </div>

      {/* Plan Upgrade Banner */}
      {tenant.planType === 'BASIC' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400">🚀</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Mejora tu plan para más funcionalidades
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Desbloquea más mascotas, automatizaciones y reportes avanzados.
              </p>
              <div className="mt-3">
                <Link
                  href="/precios"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Ver Planes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow-card rounded-lg border border-[#d5e3df] dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/pets/new"
              className="relative group bg-gradient-to-r from-[#75a99c] to-[#5b9788] hover:from-[#5b9788] hover:to-[#4a7c6f] p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🐕</span>
                <div>
                  <p className="text-sm font-medium">Registrar Mascota</p>
                  <p className="text-xs opacity-90">Agregar nueva mascota</p>
                </div>
              </div>
            </Link>
            
            <Link
              href="/dashboard/appointments/new"
              className="relative group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="text-sm font-medium">Nueva Cita</p>
                  <p className="text-xs opacity-90">Programar cita</p>
                </div>
              </div>
            </Link>
            
            <Link
              href="/dashboard/inventory"
              className="relative group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📦</span>
                <div>
                  <p className="text-sm font-medium">Inventario</p>
                  <p className="text-xs opacity-90">Gestionar productos</p>
                </div>
              </div>
            </Link>
            
            <Link
              href="/dashboard/reports"
              className="relative group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="text-sm font-medium">Reportes</p>
                  <p className="text-xs opacity-90">Ver estadísticas</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 