import { Suspense } from 'react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { getFullReportsData } from '@/lib/reports';
import EnhancedReportsClient from '@/components/reports/EnhancedReportsClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getReportsData(tenantId: string) {
  try {
    const reportsData = await getFullReportsData(tenantId);
    return reportsData;
  } catch (error) {
    console.error('Error fetching reports data:', error);
    throw error;
  }
}

function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Cargando datos de análisis...</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function ReportsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get tenant info from user metadata
  const tenantId = user.email?.split('@')[0] || 'default';

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<ReportsLoading />}>
        <ReportsContent tenantId={tenantId} />
      </Suspense>
    </div>
  );
}

async function ReportsContent({ tenantId }: { tenantId: string }) {
  try {
    const reportsData = await getReportsData(tenantId);
    
    return <EnhancedReportsClient reportsData={reportsData} />;
  } catch (error) {
    console.error('Error in ReportsContent:', error);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Reportes y Análisis</h1>
            <p className="text-muted-foreground">Error al cargar los datos</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Error al cargar reportes
              </h3>
              <p className="text-gray-500 mb-4">
                No se pudieron cargar los datos de análisis. Por favor, intenta recargar la página.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Recargar página
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
} 