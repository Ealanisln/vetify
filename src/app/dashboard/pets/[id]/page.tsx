import { requireActiveSubscription } from '../../../../lib/auth';
import { getPetById } from '../../../../lib/pets';
import { getTenantTimeZone } from '../../../../lib/clinical-dates';
import { notFound } from 'next/navigation';
import { PetHeader } from '../../../../components/pets/PetHeader';
import { PetInfoCard } from '../../../../components/pets/PetInfoCard';
import { MedicalHistoryCard } from '../../../../components/pets/MedicalHistoryCard';
import { TreatmentTimelineCard } from '../../../../components/pets/TreatmentTimelineCard';
import { QuickActionsCard } from '../../../../components/pets/QuickActionsCard';

interface PetProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function PetProfilePage({ params }: PetProfilePageProps) {
  // CRITICAL FIX: Use requireActiveSubscription to block access with expired trial
  const { tenant } = await requireActiveSubscription();
  const { id } = await params;
  const [pet, timeZone] = await Promise.all([
    getPetById(id, tenant.id),
    getTenantTimeZone(tenant.id),
  ]);
  
  if (!pet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PetHeader pet={pet} />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Pet Info & Quick Actions */}
        <div className="space-y-6">
          <PetInfoCard pet={pet} />
          <QuickActionsCard pet={pet} />
        </div>
        
        {/* Right Column - Medical Activity */}
        <div className="lg:col-span-2 space-y-6">
          <MedicalHistoryCard pet={pet} timeZone={timeZone} />
          <TreatmentTimelineCard pet={pet} timeZone={timeZone} />
        </div>
      </div>
    </div>
  );
} 