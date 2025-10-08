import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  DocumentTextIcon,
  HeartIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { getThemeClasses } from '../../utils/theme-colors';

interface MedicalHistoryStatsProps {
  tenantId: string;
}

interface MedicalStats {
  totalHistories: number;
  thisMonth: number;
  commonDiagnoses: string[];
  avgVisitsPerPet: number;
}

async function fetchMedicalStats(tenantId: string): Promise<MedicalStats> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/medical-history?action=stats`, {
      headers: {
        'x-tenant-id': tenantId,
      },
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching medical stats:', error);
  }
  
  return {
    totalHistories: 0,
    thisMonth: 0,
    commonDiagnoses: [],
    avgVisitsPerPet: 0
  };
}

export async function MedicalHistoryStats({ tenantId }: MedicalHistoryStatsProps) {
  const stats = await fetchMedicalStats(tenantId);

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
              <CardTitle className={`text-sm font-medium ${getThemeClasses('text.secondary')}`}>
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getThemeClasses('text.primary')}`}>
                {stat.value}
              </div>
              {stat.title === 'Diagnósticos Comunes' && stats.commonDiagnoses.length > 0 && (
                <div className="mt-2">
                  <p className={`text-xs ${getThemeClasses('text.muted')} mb-1`}>Más frecuentes:</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.commonDiagnoses.slice(0, 2).map((diagnosis, index) => (
                      <span 
                        key={index}
                        className={`text-xs px-2 py-1 rounded ${getThemeClasses('background.tertiary', 'text.secondary')}`}
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