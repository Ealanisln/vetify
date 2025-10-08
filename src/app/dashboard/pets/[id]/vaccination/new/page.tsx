import { requireAuth } from '../../../../../../lib/auth';
import { getPetById } from '../../../../../../lib/pets';
import { notFound } from 'next/navigation';
import { VaccinationPageClient } from './VaccinationPageClient';

interface VaccinationPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewVaccinationPage({ params }: VaccinationPageProps) {
  const { tenant } = await requireAuth();
  const { id } = await params;
  
  const pet = await getPetById(id, tenant.id);
  
  if (!pet) {
    notFound();
  }

  return (
    <VaccinationPageClient 
      pet={pet} 
      tenantId={tenant.id}
    />
  );
} 