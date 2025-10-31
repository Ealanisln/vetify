/**
 * Pet Enum Mapping Utilities
 *
 * Maps Spanish UI values to English API enum values for pet species and gender.
 * This ensures data consistency while maintaining Spanish UI for better UX.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Structured logger for pet enum mapping operations
 */
function logMapping(type: 'species' | 'gender', input: string, output: string, isError = false) {
  const logData = {
    timestamp: new Date().toISOString(),
    type: 'PET_ENUM_MAPPING',
    operation: type,
    input,
    output,
    level: isError ? 'ERROR' : 'DEBUG'
  };

  if (isError) {
    console.error('[PET_ENUM_MAPPING_ERROR]', JSON.stringify(logData, null, 2));
  } else if (isDevelopment) {
    console.debug('[PET_ENUM_MAPPING]', JSON.stringify(logData, null, 2));
  }
}

/**
 * Maps Spanish species names to English enum values expected by the API
 * @param species - Spanish species name from the UI
 * @returns English species enum value ('dog', 'cat', 'bird', 'rabbit', or 'other')
 */
export function mapSpeciesToEnglish(species: string): string {
  const speciesMap: Record<string, string> = {
    'Perro': 'dog',
    'Gato': 'cat',
    'Ave': 'bird',
    'Conejo': 'rabbit',
    'Reptil': 'other',
    'Otro': 'other'
  };

  const mapped = speciesMap[species];

  if (!mapped) {
    logMapping('species', species, 'other', true);
    return 'other';
  }

  logMapping('species', species, mapped);
  return mapped;
}

/**
 * Maps Spanish gender values to English enum values expected by the API
 * @param gender - Spanish gender value from the UI
 * @returns English gender enum value ('male' or 'female')
 */
export function mapGenderToEnglish(gender: string): string {
  const genderMap: Record<string, string> = {
    'Macho': 'male',
    'Hembra': 'female'
  };

  const mapped = genderMap[gender];

  if (!mapped) {
    logMapping('gender', gender, 'male', true);
    return 'male';
  }

  logMapping('gender', gender, mapped);
  return mapped;
}

/**
 * Valid species values accepted by the API
 */
export const VALID_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'other'] as const;

/**
 * Valid gender values accepted by the API
 */
export const VALID_GENDERS = ['male', 'female'] as const;

export type Species = typeof VALID_SPECIES[number];
export type Gender = typeof VALID_GENDERS[number];
