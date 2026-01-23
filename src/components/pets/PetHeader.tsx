'use client';

import { Pet, Customer } from '@prisma/client';
import { differenceInYears, differenceInMonths } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil, CalendarPlus } from 'lucide-react';
import { getThemeClasses } from '../../utils/theme-colors';
import { parseWeight } from '../../utils/format';
import { PET_SPECIES_MAP, PET_GENDER_MAP, type PetSpecies, type PetGender } from '../../types';
import { ImageLightbox } from '../ui/ImageLightbox';

type PetWithOwner = Pet & { customer: Customer };

interface PetHeaderProps {
  pet: PetWithOwner;
}

export function PetHeader({ pet }: PetHeaderProps) {
  const router = useRouter();
  const age = differenceInYears(new Date(), pet.dateOfBirth);
  const ageInMonths = differenceInMonths(new Date(), pet.dateOfBirth);

  const handleEditPet = () => {
    router.push(`/dashboard/pets/${pet.id}/edit`);
  };

  const handleNewAppointment = () => {
    router.push(`/dashboard/appointments/new?petId=${pet.id}&customerId=${pet.customerId}`);
  };

  const displayAge = age > 0
    ? `${age} año${age !== 1 ? 's' : ''}`
    : `${ageInMonths} mes${ageInMonths !== 1 ? 'es' : ''}`;

  // Get species icon and label from type-safe mapping
  const speciesInfo = PET_SPECIES_MAP[pet.species as PetSpecies] || PET_SPECIES_MAP.other;
  const genderLabel = PET_GENDER_MAP[pet.gender as PetGender] || pet.gender;

  const PhotoContent = (
    <div className={`h-20 w-20 md:h-24 md:w-24 rounded-full ${getThemeClasses('background.muted')} flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-lg`}>
      {pet.profileImage ? (
        <Image
          src={pet.profileImage}
          alt={`Foto de ${pet.name}`}
          width={96}
          height={96}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-4xl">{speciesInfo.icon}</span>
      )}
    </div>
  );

  return (
    <div className={`rounded-xl border overflow-hidden ${getThemeClasses('background.card', 'border.card')}`} data-testid="pet-header">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="p-4 pb-3 flex flex-col items-center text-center bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30">
          {pet.profileImage ? (
            <ImageLightbox src={pet.profileImage} alt={`Foto de ${pet.name}`}>
              {PhotoContent}
            </ImageLightbox>
          ) : (
            PhotoContent
          )}
          <h1 className={`text-xl font-bold ${getThemeClasses('text.primary')} mt-3`}>{pet.name}</h1>
          <div className={`flex flex-wrap items-center justify-center gap-1.5 text-sm ${getThemeClasses('text.tertiary')} mt-1`}>
            <span className="capitalize">{speciesInfo.label}</span>
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
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
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
        {/* Mobile Action Buttons */}
        <div className="p-3 flex gap-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleEditPet}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            data-testid="edit-pet-button"
          >
            <Pencil className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button
            onClick={handleNewAppointment}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg bg-[#75a99c] hover:bg-[#5b9788] text-white transition-colors"
            data-testid="new-appointment-button"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {pet.profileImage ? (
              <ImageLightbox src={pet.profileImage} alt={`Foto de ${pet.name}`}>
                {PhotoContent}
              </ImageLightbox>
            ) : (
              PhotoContent
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-2xl font-bold ${getThemeClasses('text.primary')}`}>{pet.name}</h1>
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
                <span className="capitalize">{speciesInfo.label}</span>
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

          {/* Desktop Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleEditPet}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              data-testid="edit-pet-button"
            >
              <Pencil className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={handleNewAppointment}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#75a99c] hover:bg-[#5b9788] text-white transition-colors"
              data-testid="new-appointment-button"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 