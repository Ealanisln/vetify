import { requireAuth } from '../../lib/auth';
import { getDashboardStats } from '../../lib/dashboard';
import { StatsCard, RecentPetsCard, UpcomingAppointmentsCard, SubscriptionNotifications, WelcomeBanner } from '../../components/dashboard';
import { PlanLimitsDisplay } from '../../components/subscription';
import Link from 'next/link';
import { Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { user, tenant } = await requireAuth();
  // Pass tenant object to avoid duplicate query
  const stats = await getDashboardStats(tenant.id, tenant);

  return (
    <div className="space-y-6">
      <div data-testid="dashboard-header">
        <h1 className="text-2xl font-semibold text-foreground">
          ¡Hola, {user.firstName || user.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí tienes un resumen de {tenant.name}
        </p>
      </div>

      {/* Welcome Banner - Shows once after successful subscription */}
      <Suspense fallback={null}>
        <WelcomeBanner tenant={tenant} />
      </Suspense>

      {/* Subscription Notifications */}
      <SubscriptionNotifications tenant={tenant} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        {/* FUTURE FEATURE: Automatizaciones - n8n integration not yet implemented */}
        {/* <StatsCard
          title="Automatizaciones"
          value={0}
          icon="🤖"
        /> */}
      </div>

      {/* Plan Limits Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentPetsCard pets={stats.recentPets} />
            <UpcomingAppointmentsCard appointments={stats.upcomingAppointments} />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <PlanLimitsDisplay
            tenant={{
              ...tenant,
              tenantUsageStats: {
                totalUsers: 1, // Placeholder - would come from actual stats
                totalPets: stats.totalPets
              }
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-content">
          <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/pets/new"
              className="relative group bg-primary hover:bg-primary/90 p-4 rounded-lg text-primary-foreground transition-all duration-200 transform hover:scale-105"
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
              className="relative group bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
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
              className="relative group bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
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
              className="relative group bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105"
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