import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DocumentTextIcon,
  HeartIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { getMedicalHistoryStats } from '@/lib/medical-history';

interface MedicalHistoryStatsProps {
  tenantId: string;
}

export async function MedicalHistoryStats({ tenantId }: MedicalHistoryStatsProps) {
  // Call the function directly instead of making an API request
  // This is more efficient and avoids session/auth issues in Server Components
  const stats = await getMedicalHistoryStats(tenantId);

  const statCards = [
    {
      title: 'Total Consultas',
      value: stats.totalHistories.toString(),
      icon: DocumentTextIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Este Mes',
      value: stats.thisMonth.toString(),
      icon: CalendarDaysIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Promedio por Mascota',
      value: stats.avgVisitsPerPet.toFixed(1),
      icon: HeartIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Diagnósticos Comunes',
      value: stats.commonDiagnoses.length.toString(),
      icon: ChartBarIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              {stat.title === 'Diagnósticos Comunes' && stats.commonDiagnoses.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Más frecuentes:</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.commonDiagnoses.slice(0, 2).map((diagnosis, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                      >
                        {diagnosis}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 