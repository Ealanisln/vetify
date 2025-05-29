import { Pet, User } from '@prisma/client';
import { differenceInYears, differenceInMonths } from 'date-fns';

type PetWithOwner = Pet & { user: User };

interface PetHeaderProps {
  pet: PetWithOwner;
}

// Temporary button components
function EditPetButton() {
  return (
    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
      ✏️ Editar
    </button>
  );
}

function NewAppointmentButton() {
  return (
    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
      📅 Nueva Cita
    </button>
  );
}

export function PetHeader({ pet }: PetHeaderProps) {
  const age = differenceInYears(new Date(), pet.dateOfBirth);
  const ageInMonths = differenceInMonths(new Date(), pet.dateOfBirth);
  
  const displayAge = age > 0 
    ? `${age} año${age !== 1 ? 's' : ''}`
    : `${ageInMonths} mes${ageInMonths !== 1 ? 'es' : ''}`;

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      default: return '🐾';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-3xl">{getSpeciesIcon(pet.species)}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
                {pet.isDeceased && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    🕊️ Fallecido
                  </span>
                )}
                {pet.isNeutered && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ✂️ Esterilizado
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span className="capitalize">{pet.species}</span>
                {pet.breed && (
                  <>
                    <span>•</span>
                    <span>{pet.breed}</span>
                  </>
                )}
                <span>•</span>
                <span>{pet.gender === 'male' ? 'Macho' : 'Hembra'}</span>
                <span>•</span>
                <span>{displayAge}</span>
                {pet.weight && (
                  <>
                    <span>•</span>
                    <span>{pet.weight.toString()}{pet.weightUnit}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Dueño:</span> {pet.user.name || pet.user.email}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <EditPetButton />
            <NewAppointmentButton />
          </div>
        </div>
      </div>
    </div>
  );
} 