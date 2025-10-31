import { z } from 'zod';
import { TreatmentType, VaccinationStage } from '@prisma/client';

// Consultation Form Schema
export const consultationSchema = z.object({
  reason: z.string().min(10, "Describe el motivo de la consulta (mínimo 10 caracteres)"),
  symptoms: z.array(z.string()).min(1, "Selecciona al menos un síntoma"),
  diagnosis: z.string().min(5, "Ingresa un diagnóstico válido"),
  treatment_plan: z.string().min(10, "Describe el plan de tratamiento"),
  notes: z.string().optional(),
  next_appointment: z.union([z.date(), z.string().datetime()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
  veterinarian_id: z.string().min(1, "Selecciona un veterinario"),
});

// Treatment Form Schema
export const treatmentSchema = z.object({
  medication_name: z.string().min(2, "Nombre del medicamento requerido"),
  dosage: z.string().min(1, "Especifica la dosis"),
  frequency: z.string().min(5, "Especifica la frecuencia de administración"),
  duration_days: z.number().min(1, "Duración mínima 1 día").max(365, "Duración máxima 365 días"),
  instructions: z.string().min(10, "Proporciona instrucciones detalladas"),
  start_date: z.union([z.date(), z.string().datetime()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  treatment_type: z.nativeEnum(TreatmentType),
  consultation_id: z.string().optional(),
  veterinarian_id: z.string().optional(),
});

// Vaccination Form Schema  
export const vaccinationSchema = z.object({
  vaccine_type: z.literal(TreatmentType.VACCINATION),
  vaccine_brand: z.string().min(2, "Especifica la marca de la vacuna"),
  batch_number: z.string().min(1, "Número de lote requerido"),
  administered_date: z.union([z.date(), z.string().datetime()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  next_due_date: z.union([z.date(), z.string().datetime()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  veterinarian_id: z.string().min(1, "Selecciona un veterinario"),
  side_effects: z.string().optional(),
  vaccine_stage: z.nativeEnum(VaccinationStage).optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
});

// Vital Signs Form Schema
export const vitalSignsSchema = z.object({
  weight: z.number().min(0.1, "Peso debe ser mayor a 0").max(200, "Peso excesivo"),
  temperature: z.number().min(35, "Temperatura muy baja").max(45, "Temperatura muy alta"),
  heart_rate: z.number().min(30, "Frecuencia cardíaca muy baja").max(300, "Frecuencia cardíaca muy alta"),
  respiratory_rate: z.number().min(5, "Frecuencia respiratoria muy baja").max(100, "Frecuencia respiratoria muy alta"),
  blood_pressure: z.string().optional(),
  notes: z.string().optional(),
  recorded_date: z.union([z.date(), z.string().datetime()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  consultation_id: z.string().optional(),
});

// Type exports for TypeScript
export type ConsultationFormData = z.infer<typeof consultationSchema>;
export type TreatmentFormData = z.infer<typeof treatmentSchema>;
export type VaccinationFormData = z.infer<typeof vaccinationSchema>;
export type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;

// Common symptoms list for consultation form
export const COMMON_SYMPTOMS = [
  'Vómito',
  'Diarrea',
  'Pérdida de apetito',
  'Letargo',
  'Fiebre',
  'Tos',
  'Dificultad respiratoria',
  'Cojera',
  'Pérdida de peso',
  'Secreción ocular',
  'Secreción nasal',
  'Rascado excesivo',
  'Temblores',
  'Convulsiones',
  'Dificultad para orinar',
  'Sangre en orina',
  'Hinchazón',
  'Dolor',
  'Comportamiento anormal',
  'Otros'
];

// Common medications for autocomplete
export const COMMON_MEDICATIONS = [
  'Amoxicilina',
  'Prednisolona',
  'Carprofeno',
  'Gabapentina',
  'Furosemida',
  'Prednisona',
  'Tramadol',
  'Ceftriaxona',
  'Meloxicam',
  'Doxiciclina',
  'Metronidazol',
  'Cefalexina',
  'Enrofloxacina',
  'Diazepam',
  'Ranitidina'
];

// Common vaccines for autocomplete
export const COMMON_VACCINES = [
  'DHPPI (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
  'Antirrábica',
  'Parvovirus',
  'Bordetella',
  'Leptospirosis',
  'FVRCP (Felino)',
  'FeLV (Leucemia Felina)',
  'Triple Felina',
  'Tos de las Perreras',
  'Coronavirus Canino'
];

// Validate dates
export const validateDates = {
  isNotFuture: (date: Date) => date <= new Date(),
  isNotPast: (date: Date) => date >= new Date(),
  isReasonableFuture: (date: Date) => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return date <= oneYearFromNow;
  }
}; 