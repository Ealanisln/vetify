'use client';

import { useRouter } from 'next/navigation';
import { MedicalFormLayout } from '@/components/medical/MedicalFormLayout';
import { VaccinationForm } from '@/components/medical/VaccinationForm';
import { Pet, Customer } from '@prisma/client';

type PetWithCustomer = Pet & { customer: Customer };

interface VaccinationPageClientProps {
  pet: PetWithCustomer;
  tenantId: string;
}

export function VaccinationPageClient({ pet, tenantId }: VaccinationPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/dashboard/pets/${pet.id}?success=vaccination`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/pets/${pet.id}`);
  };

  return (
    <MedicalFormLayout
      petInfo={pet}
      formTitle="Nueva Vacunación"
      formType="vaccination"
      onCancel={handleCancel}
    >
      <VaccinationForm
        petId={pet.id}
        tenantId={tenantId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </MedicalFormLayout>
  );
} 