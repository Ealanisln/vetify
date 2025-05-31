import { requireAuth } from '@/lib/auth';
import { getPetById } from '@/lib/pets';
import { notFound } from 'next/navigation';
import { TreatmentPageClient } from './TreatmentPageClient';

interface TreatmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewTreatmentPage({ params }: TreatmentPageProps) {
  const { tenant } = await requireAuth();
  const { id } = await params;
  
  const pet = await getPetById(id, tenant.id);
  
  if (!pet) {
    notFound();
  }

  return (
    <TreatmentPageClient 
      pet={pet} 
      tenantId={tenant.id}
    />
  );
} 