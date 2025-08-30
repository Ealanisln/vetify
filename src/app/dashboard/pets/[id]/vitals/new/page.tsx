import { requireAuth } from '../../../../../../lib/auth';
import { getPetById } from '../../../../../../lib/pets';
import { notFound } from 'next/navigation';
import { VitalSignsPageClient } from './VitalSignsPageClient';

interface VitalSignsPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewVitalSignsPage({ params }: VitalSignsPageProps) {
  const { tenant } = await requireAuth();
  const { id } = await params;
  
  const pet = await getPetById(id, tenant.id);
  
  if (!pet) {
    notFound();
  }

  return (
    <VitalSignsPageClient 
      pet={pet} 
      tenantId={tenant.id}
    />
  );
} 