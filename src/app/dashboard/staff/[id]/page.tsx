import { notFound } from 'next/navigation';
import { requireAuth } from '../../../../lib/auth';
import { getStaffById } from '../../../../lib/staff';
import StaffDetailClient from './StaffDetailClient';

interface StaffDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { user, tenant } = await requireAuth();
  
  if (!user || !tenant) {
    notFound();
  }

  try {
    const { id } = await params;
    const staff = await getStaffById(tenant.id, id);
    
    if (!staff) {
      notFound();
    }

    return (
      <StaffDetailClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialStaff={staff as any}
        tenantId={tenant.id}
      />
    );
  } catch (error) {
    console.error('Error loading staff detail:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground">
            No se pudo cargar la información del personal. Por favor, intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }
}

export const metadata = {
  title: 'Detalles del Personal - Vetify',
  description: 'Ver y editar información del personal',
}; 