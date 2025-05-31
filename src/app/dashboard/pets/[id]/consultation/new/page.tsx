import { requireAuth } from '@/lib/auth';
import { getPetById } from '@/lib/pets';
import { notFound } from 'next/navigation';
import { ConsultationPageClient } from './ConsultationPageClient';

interface ConsultationPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewConsultationPage({ params }: ConsultationPageProps) {
  const { tenant } = await requireAuth();
  const { id } = await params;
  
  const pet = await getPetById(id, tenant.id);
  
  if (!pet) {
    notFound();
  }

  return (
    <ConsultationPageClient 
      pet={pet} 
      tenantId={tenant.id}
    />
  );
} 