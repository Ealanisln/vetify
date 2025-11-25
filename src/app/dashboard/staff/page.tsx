import { notFound } from 'next/navigation';
import { requireActiveSubscription } from '../../../lib/auth';
import { getStaffByTenant } from '../../../lib/staff';
import StaffList from '../../../components/staff/StaffList';

interface SearchParams {
  page?: string;
  search?: string;
  position?: string;
  isActive?: string;
}

interface StaffPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { user, tenant } = await requireActiveSubscription();
  
  if (!user || !tenant) {
    notFound();
  }

  // Parse search parameters
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 20;
  const search = params.search?.trim();
  const position = params.position?.trim();
  const isActive = params.isActive === 'true' ? true : 
                   params.isActive === 'false' ? false : undefined;

  try {
    // Fetch staff with statistics
    const result = await getStaffByTenant(tenant.id, {
      page,
      limit,
      search,
      position,
      isActive
    });

    return (
      <div className="container mx-auto px-4 py-6">
        <StaffList 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialStaff={result.staff as any}
          pagination={result.pagination}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading staff page:', error);
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
  title: 'Personal - Vetify',
  description: 'Administra el personal de tu veterinaria',
}; 