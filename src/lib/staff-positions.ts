/**
 * Staff position mappings and utilities
 * Centralized definitions for veterinary staff positions
 */

// =============================================================================
// POSITION ENUM VALUES (Database/API values)
// =============================================================================

export const StaffPosition = {
  VETERINARIAN: 'VETERINARIAN',
  ASSISTANT: 'ASSISTANT',
  VETERINARY_TECHNICIAN: 'VETERINARY_TECHNICIAN',
  RECEPTIONIST: 'RECEPTIONIST',
  MANAGER: 'MANAGER',
  ADMINISTRATOR: 'Administrador',
  GROOMER: 'GROOMER',
  OTHER: 'OTHER',
} as const;

export type StaffPositionType = (typeof StaffPosition)[keyof typeof StaffPosition];

// =============================================================================
// SPANISH DISPLAY NAMES
// =============================================================================

/**
 * Spanish labels for staff positions (display in UI)
 */
export const POSITION_LABELS_ES: Record<StaffPositionType, string> = {
  [StaffPosition.VETERINARIAN]: 'Veterinario',
  [StaffPosition.ASSISTANT]: 'Asistente Veterinario',
  [StaffPosition.VETERINARY_TECHNICIAN]: 'Técnico Veterinario',
  [StaffPosition.RECEPTIONIST]: 'Recepcionista',
  [StaffPosition.MANAGER]: 'Gerente',
  [StaffPosition.ADMINISTRATOR]: 'Administrador',
  [StaffPosition.GROOMER]: 'Peluquero',
  [StaffPosition.OTHER]: 'Otro',
};

// =============================================================================
// SPANISH TO ENUM MAPPING
// =============================================================================

/**
 * Map Spanish position names (from UI) to API enum values
 * Includes specialty variants that map to base positions
 */
export const SPANISH_POSITION_TO_ENUM: Record<string, StaffPositionType> = {
  // Veterinarian variants
  'Veterinario': StaffPosition.VETERINARIAN,
  'Veterinario Especialista': StaffPosition.VETERINARIAN,
  'Cirujano Veterinario': StaffPosition.VETERINARIAN,
  // Other positions
  'Asistente Veterinario': StaffPosition.ASSISTANT,
  'Técnico Veterinario': StaffPosition.VETERINARY_TECHNICIAN,
  'Recepcionista': StaffPosition.RECEPTIONIST,
  'Gerente': StaffPosition.MANAGER,
  'Administrador': StaffPosition.ADMINISTRATOR,
  'Peluquero': StaffPosition.GROOMER,
  'Otro': StaffPosition.OTHER,
};

/**
 * Convert a Spanish position name to its API enum value
 * @param spanishPosition - Position name in Spanish
 * @returns The corresponding enum value, defaults to VETERINARIAN
 */
export function mapPositionToEnum(spanishPosition: string): StaffPositionType {
  return SPANISH_POSITION_TO_ENUM[spanishPosition] || StaffPosition.VETERINARIAN;
}

/**
 * Convert an API enum value to its Spanish display label
 * @param position - Position enum value
 * @returns The Spanish display label
 */
export function getPositionLabel(position: StaffPositionType): string {
  return POSITION_LABELS_ES[position] || 'Otro';
}

// =============================================================================
// POSITION OPTIONS FOR SELECT COMPONENTS
// =============================================================================

/**
 * Position options for dropdown/select components
 * Includes specialty variants for veterinarians
 */
export const POSITION_SELECT_OPTIONS = [
  { value: 'Veterinario', label: 'Veterinario' },
  { value: 'Veterinario Especialista', label: 'Veterinario Especialista' },
  { value: 'Cirujano Veterinario', label: 'Cirujano Veterinario' },
  { value: 'Asistente Veterinario', label: 'Asistente Veterinario' },
  { value: 'Técnico Veterinario', label: 'Técnico Veterinario' },
  { value: 'Recepcionista', label: 'Recepcionista' },
  { value: 'Gerente', label: 'Gerente' },
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Peluquero', label: 'Peluquero' },
  { value: 'Otro', label: 'Otro' },
] as const;

/**
 * Get position options for a select component
 * @returns Array of position options with value and label
 */
export function getPositionOptions(): typeof POSITION_SELECT_OPTIONS {
  return POSITION_SELECT_OPTIONS;
}

// =============================================================================
// POSITION GROUPS
// =============================================================================

/**
 * Positions that can create medical records
 */
export const MEDICAL_STAFF_POSITIONS: StaffPositionType[] = [
  StaffPosition.VETERINARIAN,
  StaffPosition.VETERINARY_TECHNICIAN,
];

/**
 * Positions that require a license number
 */
export const LICENSE_REQUIRED_POSITIONS: StaffPositionType[] = [
  StaffPosition.VETERINARIAN,
];

/**
 * Check if a position can create medical records
 */
export function canCreateMedicalRecords(position: StaffPositionType): boolean {
  return MEDICAL_STAFF_POSITIONS.includes(position);
}

/**
 * Check if a position requires a license number
 */
export function requiresLicense(position: StaffPositionType): boolean {
  return LICENSE_REQUIRED_POSITIONS.includes(position);
}

// =============================================================================
// VETERINARY SPECIALTIES
// =============================================================================

/**
 * Veterinary specialties for public profiles
 */
export const VETERINARY_SPECIALTIES = [
  'Cirugía',
  'Dermatología',
  'Cardiología',
  'Odontología',
  'Oftalmología',
  'Oncología',
  'Traumatología',
  'Neurología',
  'Nutrición',
  'Medicina Interna',
  'Urgencias',
  'Animales Exóticos',
  'Reproducción',
  'Geriatría',
] as const;

export type VeterinarySpecialty = (typeof VETERINARY_SPECIALTIES)[number];

/**
 * Specialty options for select components
 */
export const SPECIALTY_SELECT_OPTIONS = VETERINARY_SPECIALTIES.map((specialty) => ({
  value: specialty,
  label: specialty,
}));

/**
 * Get specialty options for a multi-select component
 */
export function getSpecialtyOptions(): typeof SPECIALTY_SELECT_OPTIONS {
  return SPECIALTY_SELECT_OPTIONS;
}
