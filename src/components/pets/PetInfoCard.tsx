import { Pet, User } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PetWithOwner = Pet & { user: User };

interface PetInfoCardProps {
  pet: PetWithOwner;
}

export function PetInfoCard({ pet }: PetInfoCardProps) {
  const infoItems = [
    { label: 'ID Interno', value: pet.internalId || 'No asignado' },
    { label: 'Fecha de nacimiento', value: format(pet.dateOfBirth, 'dd MMMM yyyy', { locale: es }) },
    { label: 'Peso', value: pet.weight ? `${pet.weight.toString()} ${pet.weightUnit}` : 'No registrado' },
    { label: 'Microchip', value: pet.microchipNumber || 'No tiene' },
    { label: 'Registrado', value: format(pet.createdAt, 'dd MMM yyyy', { locale: es }) },
  ];

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Información General
        </h3>
        
        <dl className="grid grid-cols-1 gap-4">
          {infoItems.map((item, index) => (
            <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
              <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.value}</dd>
            </div>
          ))}
        </dl>
        
        {/* Owner Info Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Dueño</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">
              {pet.user.name || 'Nombre no registrado'}
            </p>
            <p className="text-sm text-gray-600">{pet.user.email}</p>
            {pet.user.phone && (
              <p className="text-sm text-gray-600">📞 {pet.user.phone}</p>
            )}
            {pet.user.address && (
              <p className="text-sm text-gray-600">📍 {pet.user.address}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 