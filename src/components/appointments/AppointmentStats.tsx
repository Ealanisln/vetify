'use client';

import { useAppointmentStats } from '../../hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  CalendarCheck, 
  Clock, 
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react';

export function AppointmentStats() {
  const { 
    today, 
    thisWeek, 
    thisMonth, 
    completionRate, 
    loading, 
    error, 
    refresh 
  } = useAppointmentStats();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full border-gray-200 dark:border-gray-800">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar estadísticas</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Citas de Hoy */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
          <CalendarCheck className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{today}</div>
          <p className="text-xs text-muted-foreground">
            Programadas para hoy
          </p>
        </CardContent>
      </Card>

      {/* Esta Semana */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{thisWeek}</div>
          <p className="text-xs text-muted-foreground">
            Citas programadas
          </p>
        </CardContent>
      </Card>

      {/* Tasa de Completitud */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completitud</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Citas completadas este mes
          </p>
        </CardContent>
      </Card>

      {/* Este Mes */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{thisMonth}</div>
          <p className="text-xs text-muted-foreground">
            Total de citas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}