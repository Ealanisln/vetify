/**
 * Unit tests for medical validation schemas
 * Tests Zod schemas for consultations, treatments, vaccinations, vital signs
 */

import { TreatmentType, VaccinationStage } from '@prisma/client';
import {
  consultationSchema,
  treatmentSchema,
  vaccinationSchema,
  vitalSignsSchema,
  validateDates,
  COMMON_SYMPTOMS,
  COMMON_MEDICATIONS,
  COMMON_VACCINES,
} from '@/lib/medical-validation';

describe('medical-validation', () => {
  describe('consultationSchema', () => {
    const validConsultation = {
      reason: 'Revisión general del paciente',
      symptoms: ['Vómito', 'Letargo'],
      diagnosis: 'Gastroenteritis leve',
      treatment_plan: 'Dieta blanda por 3 días, hidratación',
      veterinarian_id: 'vet-123',
    };

    describe('Valid Data', () => {
      it('should validate a complete consultation', () => {
        const result = consultationSchema.safeParse(validConsultation);
        expect(result.success).toBe(true);
      });

      it('should validate consultation with optional notes', () => {
        const data = {
          ...validConsultation,
          notes: 'Paciente presenta deshidratación moderada',
        };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate consultation with optional next_appointment as Date', () => {
        const data = {
          ...validConsultation,
          next_appointment: new Date('2025-01-15'),
        };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should transform next_appointment string to Date', () => {
        const data = {
          ...validConsultation,
          next_appointment: '2025-01-15T10:00:00.000Z',
        };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.next_appointment).toBeInstanceOf(Date);
        }
      });

      it('should accept multiple symptoms', () => {
        const data = {
          ...validConsultation,
          symptoms: ['Vómito', 'Diarrea', 'Pérdida de apetito', 'Letargo', 'Fiebre'],
        };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid Data', () => {
      it('should reject reason shorter than 10 characters', () => {
        const data = { ...validConsultation, reason: 'Chequeo' };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('mínimo 10 caracteres');
        }
      });

      it('should reject empty symptoms array', () => {
        const data = { ...validConsultation, symptoms: [] };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('al menos un síntoma');
        }
      });

      it('should reject diagnosis shorter than 5 characters', () => {
        const data = { ...validConsultation, diagnosis: 'OK' };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject treatment_plan shorter than 10 characters', () => {
        const data = { ...validConsultation, treatment_plan: 'Descanso' };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject empty veterinarian_id', () => {
        const data = { ...validConsultation, veterinarian_id: '' };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing required fields', () => {
        const data = { reason: 'Revisión general' };
        const result = consultationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('treatmentSchema', () => {
    const validTreatment = {
      medication_name: 'Amoxicilina',
      dosage: '250mg cada 12 horas',
      frequency: 'Cada 12 horas con alimento',
      duration_days: 7,
      instructions: 'Administrar con comida para evitar molestias estomacales',
      start_date: new Date(),
      treatment_type: TreatmentType.DEWORMING,
    };

    describe('Valid Data', () => {
      it('should validate a complete treatment', () => {
        const result = treatmentSchema.safeParse(validTreatment);
        expect(result.success).toBe(true);
      });

      it('should validate treatment with optional consultation_id', () => {
        const data = {
          ...validTreatment,
          consultation_id: 'consultation-123',
        };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate treatment with optional veterinarian_id', () => {
        const data = {
          ...validTreatment,
          veterinarian_id: 'vet-456',
        };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should transform start_date string to Date', () => {
        const data = {
          ...validTreatment,
          start_date: '2025-01-10T08:00:00.000Z',
        };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.start_date).toBeInstanceOf(Date);
        }
      });

      it('should accept all treatment types', () => {
        const treatmentTypes = Object.values(TreatmentType);
        treatmentTypes.forEach((type) => {
          const data = { ...validTreatment, treatment_type: type };
          const result = treatmentSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should accept duration of exactly 1 day', () => {
        const data = { ...validTreatment, duration_days: 1 };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept duration of exactly 365 days', () => {
        const data = { ...validTreatment, duration_days: 365 };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid Data', () => {
      it('should reject medication_name shorter than 2 characters', () => {
        const data = { ...validTreatment, medication_name: 'A' };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject empty dosage', () => {
        const data = { ...validTreatment, dosage: '' };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject frequency shorter than 5 characters', () => {
        const data = { ...validTreatment, frequency: '1x' };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject duration_days less than 1', () => {
        const data = { ...validTreatment, duration_days: 0 };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('mínima 1 día');
        }
      });

      it('should reject duration_days greater than 365', () => {
        const data = { ...validTreatment, duration_days: 400 };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('máxima 365 días');
        }
      });

      it('should reject instructions shorter than 10 characters', () => {
        const data = { ...validTreatment, instructions: 'Tomar' };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid treatment_type', () => {
        const data = { ...validTreatment, treatment_type: 'INVALID_TYPE' };
        const result = treatmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('vaccinationSchema', () => {
    const validVaccination = {
      vaccine_type: TreatmentType.VACCINATION,
      vaccine_brand: 'DHPPI Nobivac',
      batch_number: 'LOT-2024-ABC123',
      administered_date: new Date(),
      next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      veterinarian_id: 'vet-789',
    };

    describe('Valid Data', () => {
      it('should validate a complete vaccination record', () => {
        const result = vaccinationSchema.safeParse(validVaccination);
        expect(result.success).toBe(true);
      });

      it('should validate vaccination with optional side_effects', () => {
        const data = {
          ...validVaccination,
          side_effects: 'Leve inflamación en sitio de inyección',
        };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate vaccination with optional vaccine_stage', () => {
        const data = {
          ...validVaccination,
          vaccine_stage: VaccinationStage.PUPPY_KITTEN,
        };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate vaccination with optional manufacturer', () => {
        const data = {
          ...validVaccination,
          manufacturer: 'MSD Animal Health',
        };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate vaccination with optional notes', () => {
        const data = {
          ...validVaccination,
          notes: 'Paciente toleró bien la vacuna',
        };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should transform date strings to Date objects', () => {
        const data = {
          ...validVaccination,
          administered_date: '2025-01-10T10:00:00.000Z',
          next_due_date: '2025-02-10T10:00:00.000Z',
        };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.administered_date).toBeInstanceOf(Date);
          expect(result.data.next_due_date).toBeInstanceOf(Date);
        }
      });

      it('should accept all vaccination stages', () => {
        const stages = Object.values(VaccinationStage);
        stages.forEach((stage) => {
          const data = { ...validVaccination, vaccine_stage: stage };
          const result = vaccinationSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Invalid Data', () => {
      it('should reject non-VACCINATION vaccine_type', () => {
        const data = { ...validVaccination, vaccine_type: TreatmentType.DEWORMING };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject vaccine_brand shorter than 2 characters', () => {
        const data = { ...validVaccination, vaccine_brand: 'V' };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject empty batch_number', () => {
        const data = { ...validVaccination, batch_number: '' };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject empty veterinarian_id', () => {
        const data = { ...validVaccination, veterinarian_id: '' };
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing administered_date', () => {
        const { administered_date, ...data } = validVaccination;
        const result = vaccinationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('vitalSignsSchema', () => {
    const validVitalSigns = {
      weight: 15.5,
      temperature: 38.5,
      heart_rate: 100,
      respiratory_rate: 25,
      recorded_date: new Date(),
    };

    describe('Valid Data', () => {
      it('should validate complete vital signs', () => {
        const result = vitalSignsSchema.safeParse(validVitalSigns);
        expect(result.success).toBe(true);
      });

      it('should validate vital signs with optional blood_pressure', () => {
        const data = {
          ...validVitalSigns,
          blood_pressure: '120/80',
        };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate vital signs with optional notes', () => {
        const data = {
          ...validVitalSigns,
          notes: 'Paciente tranquilo durante la medición',
        };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate vital signs with optional consultation_id', () => {
        const data = {
          ...validVitalSigns,
          consultation_id: 'consultation-456',
        };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should transform recorded_date string to Date', () => {
        const data = {
          ...validVitalSigns,
          recorded_date: '2025-01-10T09:30:00.000Z',
        };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recorded_date).toBeInstanceOf(Date);
        }
      });
    });

    describe('Weight Validation', () => {
      it('should accept minimum weight of 0.1 kg', () => {
        const data = { ...validVitalSigns, weight: 0.1 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept maximum weight of 200 kg', () => {
        const data = { ...validVitalSigns, weight: 200 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject weight less than 0.1 kg', () => {
        const data = { ...validVitalSigns, weight: 0.05 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('mayor a 0');
        }
      });

      it('should reject weight greater than 200 kg', () => {
        const data = { ...validVitalSigns, weight: 250 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('excesivo');
        }
      });
    });

    describe('Temperature Validation (Plausibility Check)', () => {
      it('should accept minimum temperature of 35°C', () => {
        const data = { ...validVitalSigns, temperature: 35 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept maximum temperature of 45°C', () => {
        const data = { ...validVitalSigns, temperature: 45 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal dog temperature (38-39°C)', () => {
        const data = { ...validVitalSigns, temperature: 38.5 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal cat temperature (38-39.5°C)', () => {
        const data = { ...validVitalSigns, temperature: 39.2 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject temperature below 35°C (hypothermia boundary)', () => {
        const data = { ...validVitalSigns, temperature: 34 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('muy baja');
        }
      });

      it('should reject temperature above 45°C (lethal boundary)', () => {
        const data = { ...validVitalSigns, temperature: 46 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('muy alta');
        }
      });
    });

    describe('Heart Rate Validation (Plausibility Check)', () => {
      it('should accept minimum heart rate of 30 bpm', () => {
        const data = { ...validVitalSigns, heart_rate: 30 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept maximum heart rate of 300 bpm', () => {
        const data = { ...validVitalSigns, heart_rate: 300 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal large dog heart rate (60-100 bpm)', () => {
        const data = { ...validVitalSigns, heart_rate: 80 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal small dog heart rate (100-140 bpm)', () => {
        const data = { ...validVitalSigns, heart_rate: 120 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal cat heart rate (140-220 bpm)', () => {
        const data = { ...validVitalSigns, heart_rate: 180 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject heart rate below 30 bpm (bradycardia boundary)', () => {
        const data = { ...validVitalSigns, heart_rate: 25 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('muy baja');
        }
      });

      it('should reject heart rate above 300 bpm (tachycardia boundary)', () => {
        const data = { ...validVitalSigns, heart_rate: 350 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('muy alta');
        }
      });
    });

    describe('Respiratory Rate Validation (Plausibility Check)', () => {
      it('should accept minimum respiratory rate of 5 rpm', () => {
        const data = { ...validVitalSigns, respiratory_rate: 5 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept maximum respiratory rate of 100 rpm', () => {
        const data = { ...validVitalSigns, respiratory_rate: 100 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal dog respiratory rate (10-30 rpm)', () => {
        const data = { ...validVitalSigns, respiratory_rate: 20 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept normal cat respiratory rate (20-30 rpm)', () => {
        const data = { ...validVitalSigns, respiratory_rate: 25 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject respiratory rate below 5 rpm', () => {
        const data = { ...validVitalSigns, respiratory_rate: 3 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('muy baja');
        }
      });

      it('should reject respiratory rate above 100 rpm', () => {
        const data = { ...validVitalSigns, respiratory_rate: 120 };
        const result = vitalSignsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('muy alta');
        }
      });
    });
  });

  describe('validateDates', () => {
    describe('isNotFuture', () => {
      it('should return true for past date', () => {
        const pastDate = new Date('2020-01-01');
        expect(validateDates.isNotFuture(pastDate)).toBe(true);
      });

      it('should return true for current date', () => {
        const now = new Date();
        expect(validateDates.isNotFuture(now)).toBe(true);
      });

      it('should return false for future date', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        expect(validateDates.isNotFuture(futureDate)).toBe(false);
      });
    });

    describe('isNotPast', () => {
      it('should return false for past date', () => {
        const pastDate = new Date('2020-01-01');
        expect(validateDates.isNotPast(pastDate)).toBe(false);
      });

      it('should return true for current date', () => {
        const now = new Date();
        expect(validateDates.isNotPast(now)).toBe(true);
      });

      it('should return true for future date', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        expect(validateDates.isNotPast(futureDate)).toBe(true);
      });
    });

    describe('isReasonableFuture', () => {
      it('should return true for date within one year', () => {
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        expect(validateDates.isReasonableFuture(sixMonthsFromNow)).toBe(true);
      });

      it('should return true for date exactly one year from now', () => {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        expect(validateDates.isReasonableFuture(oneYearFromNow)).toBe(true);
      });

      it('should return false for date more than one year in the future', () => {
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
        expect(validateDates.isReasonableFuture(twoYearsFromNow)).toBe(false);
      });

      it('should return true for current date', () => {
        const now = new Date();
        expect(validateDates.isReasonableFuture(now)).toBe(true);
      });

      it('should return true for past date', () => {
        const pastDate = new Date('2020-01-01');
        expect(validateDates.isReasonableFuture(pastDate)).toBe(true);
      });
    });
  });

  describe('Constants', () => {
    describe('COMMON_SYMPTOMS', () => {
      it('should contain standard veterinary symptoms', () => {
        expect(COMMON_SYMPTOMS).toContain('Vómito');
        expect(COMMON_SYMPTOMS).toContain('Diarrea');
        expect(COMMON_SYMPTOMS).toContain('Fiebre');
        expect(COMMON_SYMPTOMS).toContain('Letargo');
        expect(COMMON_SYMPTOMS).toContain('Tos');
      });

      it('should be a non-empty array', () => {
        expect(Array.isArray(COMMON_SYMPTOMS)).toBe(true);
        expect(COMMON_SYMPTOMS.length).toBeGreaterThan(0);
      });

      it('should include "Otros" for custom symptoms', () => {
        expect(COMMON_SYMPTOMS).toContain('Otros');
      });
    });

    describe('COMMON_MEDICATIONS', () => {
      it('should contain common veterinary medications', () => {
        expect(COMMON_MEDICATIONS).toContain('Amoxicilina');
        expect(COMMON_MEDICATIONS).toContain('Prednisolona');
        expect(COMMON_MEDICATIONS).toContain('Meloxicam');
      });

      it('should be a non-empty array', () => {
        expect(Array.isArray(COMMON_MEDICATIONS)).toBe(true);
        expect(COMMON_MEDICATIONS.length).toBeGreaterThan(0);
      });
    });

    describe('COMMON_VACCINES', () => {
      it('should contain common veterinary vaccines', () => {
        expect(COMMON_VACCINES).toContain('Antirrábica');
        expect(COMMON_VACCINES).toContain('Parvovirus');
      });

      it('should contain dog-specific vaccines', () => {
        const hasCanineVaccine = COMMON_VACCINES.some(
          (v) => v.includes('DHPPI') || v.includes('Canino')
        );
        expect(hasCanineVaccine).toBe(true);
      });

      it('should contain cat-specific vaccines', () => {
        const hasFelineVaccine = COMMON_VACCINES.some(
          (v) => v.includes('Felino') || v.includes('FeLV') || v.includes('FVRCP')
        );
        expect(hasFelineVaccine).toBe(true);
      });

      it('should be a non-empty array', () => {
        expect(Array.isArray(COMMON_VACCINES)).toBe(true);
        expect(COMMON_VACCINES.length).toBeGreaterThan(0);
      });
    });
  });
});
