import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditPetForm, SerializedPetWithCustomer } from './EditPetForm';

interface EditPetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPetPage({ params }: EditPetPageProps) {
  const { id } = await params;

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      customer: true,
    },
  });

  if (!pet) {
    notFound();
  }

  // Serialize the pet data for the client component
  // Decimal and Date objects need to be converted to plain values
  const serializedPet: SerializedPetWithCustomer = {
    ...pet,
    weight: pet.weight ? Number(pet.weight) : null,
    dateOfBirth: pet.dateOfBirth.toISOString(),
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
    customer: {
      ...pet.customer,
      createdAt: pet.customer.createdAt.toISOString(),
      updatedAt: pet.customer.updatedAt.toISOString(),
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Editar Mascota
        </h1>
      </div>

      <EditPetForm pet={serializedPet} />
    </div>
  );
}
