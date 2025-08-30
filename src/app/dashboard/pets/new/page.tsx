import { requireAuth } from '../../../../lib/auth';
import { AddPetForm } from '../../../../components/pets/AddPetForm';
import { prisma } from '../../../../lib/prisma';
import Link from 'next/link';

export default async function AddPetPage() {
  const { tenant } = await requireAuth();
  
  // Check limits
  const petCount = await prisma.pet.count({ where: { tenantId: tenant.id } });
  const maxPets = tenant.tenantSubscription?.plan?.maxPets || 50;
  
  if (petCount >= maxPets) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">🚫</span>
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          Límite de mascotas alcanzado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Has alcanzado el límite de {maxPets} mascotas de tu plan actual.
        </p>
        <Link
          href="/dashboard/settings/billing"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          Mejorar Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Agregar Nueva Mascota</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra una nueva mascota en el sistema
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <AddPetForm />
        </div>
      </div>
    </div>
  );
} 