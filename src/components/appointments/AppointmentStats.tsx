'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';

interface AppointmentStatsProps {
  tenantId: string;
}

interface StatsData {
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  todayCancelled: number;
  weekTotal: number;
  monthTotal: number;
  avgDuration: number;
  totalClients: number;
}

export function AppointmentStats({ tenantId }: AppointmentStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // TODO: Reemplazar con llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockStats: StatsData = {
          todayTotal: 8,
          todayCompleted: 5,
          todayPending: 2,
          todayCancelled: 1,
          weekTotal: 42,
          monthTotal: 165,
          avgDuration: 35,
          totalClients: 147
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
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

  if (!stats) return null;

  const completionRate = stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Citas de Hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
          <CalendarCheck className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.todayTotal}</div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              {stats.todayCompleted} completadas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.todayPending}</div>
          <p className="text-xs text-muted-foreground">
            Por confirmar hoy
          </p>
        </CardContent>
      </Card>

      {/* Tasa de Completitud */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completitud</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completionRate.toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">
            Citas completadas hoy
          </p>
        </CardContent>
      </Card>

      {/* Total Clientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">
            En la base de datos
          </p>
        </CardContent>
      </Card>

      {/* Estadísticas adicionales - pantalla completa */}
      <div className="col-span-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CalendarCheck className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Esta Semana</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.weekTotal}</p>
                  <p className="text-xs text-gray-500">citas programadas</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Este Mes</p>
                  <p className="text-2xl font-bold text-green-600">{stats.monthTotal}</p>
                  <p className="text-xs text-gray-500">citas totales</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Duración Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgDuration}m</p>
                  <p className="text-xs text-gray-500">por consulta</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 