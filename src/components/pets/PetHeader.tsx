import { Pet, Customer } from '@prisma/client';
import { differenceInYears, differenceInMonths } from 'date-fns';
import { getThemeClasses } from '../../utils/theme-colors';
import { parseWeight } from '../../utils/format';
import { PET_SPECIES_MAP, PET_GENDER_MAP, type PetSpecies, type PetGender } from '../../types';

type PetWithOwner = Pet & { customer: Customer };

interface PetHeaderProps {
  pet: PetWithOwner;
}

// Temporary button components
function EditPetButton() {
  return (
    <button className="btn-secondary">
      <span className="hidden sm:inline">✏️ Editar</span>
      <span className="sm:hidden">✏️</span>
    </button>
  );
}

function NewAppointmentButton() {
  return (
    <button className="btn-primary">
      <span className="hidden sm:inline">📅 Nueva Cita</span>
      <span className="sm:hidden">📅</span>
    </button>
  );
}

export function PetHeader({ pet }: PetHeaderProps) {
  const age = differenceInYears(new Date(), pet.dateOfBirth);
  const ageInMonths = differenceInMonths(new Date(), pet.dateOfBirth);

  const displayAge = age > 0
    ? `${age} año${age !== 1 ? 's' : ''}`
    : `${ageInMonths} mes${ageInMonths !== 1 ? 'es' : ''}`;

  // Get species icon and label from type-safe mapping
  const speciesInfo = PET_SPECIES_MAP[pet.species as PetSpecies] || PET_SPECIES_MAP.other;
  const genderLabel = PET_GENDER_MAP[pet.gender as PetGender] || pet.gender;

  return (
    <div className={`card p-4 md:p-6 ${getThemeClasses('background.card', 'border.card')}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className={`h-16 w-16 rounded-full ${getThemeClasses('background.muted')} flex items-center justify-center`}>
            <span className="text-3xl">{speciesInfo.icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className={`text-xl md:text-2xl font-bold ${getThemeClasses('text.primary')}`}>{pet.name}</h1>
              <div className="flex flex-wrap gap-2">
                {pet.isDeceased && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${getThemeClasses('background.muted')} ${getThemeClasses('text.secondary')}`}>
                    🕊️ Fallecido
                  </span>
                )}
                {pet.isNeutered && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    ✂️ Esterilizado
                  </span>
                )}
              </div>
            </div>
            <div className={`flex flex-wrap items-center gap-2 text-sm ${getThemeClasses('text.tertiary')} mt-1`}>
              <span className="capitalize">{pet.species}</span>
              {pet.breed && (
                <>
                  <span>•</span>
                  <span>{pet.breed}</span>
                </>
              )}
              <span>•</span>
              <span>{genderLabel}</span>
              <span>•</span>
              <span>{displayAge}</span>
              {parseWeight(pet.weight) !== null && (
                <>
                  <span>•</span>
                  <span>{parseWeight(pet.weight)!.toFixed(1)} {pet.weightUnit || 'kg'}</span>
                </>
              )}
            </div>
            <p className={`text-sm ${getThemeClasses('text.secondary')} mt-1`}>
              <span className="font-medium">Dueño:</span> {pet.customer?.name || pet.customer?.email || 'Sin datos'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <EditPetButton />
          <NewAppointmentButton />
        </div>
      </div>
    </div>
  );
} 