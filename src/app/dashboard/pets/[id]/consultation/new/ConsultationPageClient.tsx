'use client';

import { useRouter } from 'next/navigation';
import { MedicalFormLayout } from '@/components/medical/MedicalFormLayout';
import { ConsultationForm } from '@/components/medical/ConsultationForm';
import { Pet, Customer } from '@prisma/client';

type PetWithCustomer = Pet & { customer: Customer };

interface ConsultationPageClientProps {
  pet: PetWithCustomer;
  tenantId: string;
}

export function ConsultationPageClient({ pet, tenantId }: ConsultationPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect back to pet profile with success message
    router.push(`/dashboard/pets/${pet.id}?success=consultation`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/pets/${pet.id}`);
  };

  return (
    <MedicalFormLayout
      petInfo={pet}
      formTitle="Nueva Consulta Médica"
      formType="consultation"
      onCancel={handleCancel}
    >
      <ConsultationForm
        petId={pet.id}
        tenantId={tenantId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </MedicalFormLayout>
  );
} 