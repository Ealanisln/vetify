/**
 * Pet form rules shared by the dashboard pet forms and the server schema.
 * Client-safe: no server-only imports.
 */

/** Weight units the dashboard stores and displays (Pet.weightUnit). */
export const PET_WEIGHT_UNITS = ['kg', 'lbs'] as const;
export type PetWeightUnit = (typeof PET_WEIGHT_UNITS)[number];

export const PET_FIELD_MESSAGES = {
  weightPositive: 'El peso debe ser mayor a 0',
  weightUnit: 'La unidad de peso debe ser kg o lbs',
  futureBirthDate: 'La fecha de nacimiento no puede ser una fecha futura',
} as const;

export interface PetFormFieldErrors {
  weight?: string;
  dateOfBirth?: string;
}

/**
 * Client-side checks the browser does not enforce on its own (a typed "0" in
 * the weight field, a pasted future date). `today` is a yyyy-MM-dd string.
 */
export function validatePetFormFields(
  pet: { weight?: string; dateOfBirth?: string },
  today: string
): PetFormFieldErrors {
  const errors: PetFormFieldErrors = {};

  const weight = pet.weight?.trim();
  if (weight) {
    const value = Number(weight);
    if (!Number.isFinite(value) || value <= 0) {
      errors.weight = PET_FIELD_MESSAGES.weightPositive;
    }
  }

  if (pet.dateOfBirth && pet.dateOfBirth > today) {
    errors.dateOfBirth = PET_FIELD_MESSAGES.futureBirthDate;
  }

  return errors;
}
