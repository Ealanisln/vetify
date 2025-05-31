'use client';

import { useRouter } from 'next/navigation';
import { MedicalFormLayout } from '@/components/medical/MedicalFormLayout';
import { VitalSignsForm } from '@/components/medical/VitalSignsForm';
import { Pet, Customer } from '@prisma/client';

type PetWithCustomer = Pet & { customer: Customer };

interface VitalSignsPageClientProps {
  pet: PetWithCustomer;
  tenantId: string;
}

export function VitalSignsPageClient({ pet, tenantId }: VitalSignsPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/dashboard/pets/${pet.id}?success=vitals`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/pets/${pet.id}`);
  };

  return (
    <MedicalFormLayout
      petInfo={pet}
      formTitle="Registro de Signos Vitales"
      formType="vitals"
      onCancel={handleCancel}
    >
      <VitalSignsForm
        petId={pet.id}
        tenantId={tenantId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </MedicalFormLayout>
  );
} 