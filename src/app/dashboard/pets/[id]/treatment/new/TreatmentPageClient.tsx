'use client';

import { useRouter } from 'next/navigation';
import { MedicalFormLayout } from '@/components/medical/MedicalFormLayout';
import { TreatmentForm } from '@/components/medical/TreatmentForm';
import { Pet, Customer } from '@prisma/client';

type PetWithCustomer = Pet & { customer: Customer };

interface TreatmentPageClientProps {
  pet: PetWithCustomer;
  tenantId: string;
}

export function TreatmentPageClient({ pet, tenantId }: TreatmentPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/dashboard/pets/${pet.id}?success=treatment`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/pets/${pet.id}`);
  };

  return (
    <MedicalFormLayout
      petInfo={pet}
      formTitle="Nuevo Tratamiento"
      formType="treatment"
      onCancel={handleCancel}
    >
      <TreatmentForm
        petId={pet.id}
        tenantId={tenantId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </MedicalFormLayout>
  );
} 