'use client';

import { useRouter } from 'next/navigation';
import { TreatmentForm } from '../../../../../../components/medical/TreatmentForm';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Nuevo Tratamiento - {pet.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {pet.species} • {pet.breed} • Propietario: {pet.customer.name}
          </p>
          
          <TreatmentForm
            petId={pet.id}
            tenantId={tenantId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
} 