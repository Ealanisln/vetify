/**
 * Unit tests for medical.ts CRUD operations
 * Tests consultation, treatment, vaccination, and vital signs operations
 */

import { TreatmentType, VaccinationStage } from '@prisma/client';

// Mock Prisma before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    medicalHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    treatmentRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    treatmentSchedule: {
      create: jest.fn(),
    },
    staff: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  createConsultation,
  createTreatment,
  createVaccination,
  recordVitalSigns,
  getStaffMembers,
  createStaffMember,
  getPetMedicalHistory,
  getPetTreatmentRecords,
} from '@/lib/medical';

describe('medical.ts', () => {
  const testTenantId = 'tenant-test-123';
  const testPetId = 'pet-test-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConsultation', () => {
    const validConsultationData = {
      reason: 'Revisión general del paciente',
      symptoms: ['Vómito', 'Letargo'],
      diagnosis: 'Gastroenteritis leve',
      treatment_plan: 'Dieta blanda por 3 días, hidratación',
      veterinarian_id: 'vet-789',
      notes: 'Paciente presenta deshidratación moderada',
    };

    const mockConsultationResult = {
      id: 'consultation-123',
      petId: testPetId,
      tenantId: testTenantId,
      visitDate: new Date(),
      reasonForVisit: validConsultationData.reason,
      diagnosis: validConsultationData.diagnosis,
      treatment: validConsultationData.treatment_plan,
      notes: 'SÍNTOMAS: Vómito, Letargo\n\nPaciente presenta deshidratación moderada',
      staffId: validConsultationData.veterinarian_id,
      pet: {
        id: testPetId,
        name: 'Max',
        customer: { id: 'customer-1', name: 'Juan Pérez', phone: '5551234567' },
      },
      staff: { id: 'vet-789', name: 'Dr. García' },
    };

    it('should create a consultation with symptoms array', async () => {
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockConsultationResult as never);

      const result = await createConsultation(testPetId, testTenantId, validConsultationData);

      expect(result).toEqual(mockConsultationResult);
      expect(prisma.medicalHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: testPetId,
          tenantId: testTenantId,
          reasonForVisit: validConsultationData.reason,
          diagnosis: validConsultationData.diagnosis,
          treatment: validConsultationData.treatment_plan,
          notes: expect.stringContaining('SÍNTOMAS: Vómito, Letargo'),
          staffId: validConsultationData.veterinarian_id,
        }),
        include: {
          pet: { include: { customer: true } },
          staff: true,
        },
      });
    });

    it('should convert symptoms array to comma-separated string', async () => {
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockConsultationResult as never);

      await createConsultation(testPetId, testTenantId, validConsultationData);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.notes).toContain('SÍNTOMAS: Vómito, Letargo');
    });

    it('should handle symptoms as string (legacy support)', async () => {
      const dataWithStringSymptoms = {
        ...validConsultationData,
        symptoms: 'Vómito, Letargo' as unknown as string[],
      };
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockConsultationResult as never);

      await createConsultation(testPetId, testTenantId, dataWithStringSymptoms);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.notes).toContain('Vómito, Letargo');
    });

    it('should handle consultation without notes', async () => {
      const dataWithoutNotes = { ...validConsultationData, notes: undefined };
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockConsultationResult as never);

      await createConsultation(testPetId, testTenantId, dataWithoutNotes);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.notes).toBe('SÍNTOMAS: Vómito, Letargo');
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.medicalHistory.create).mockRejectedValue(new Error('Database error'));

      await expect(createConsultation(testPetId, testTenantId, validConsultationData)).rejects.toThrow(
        'Error al crear la consulta médica'
      );
    });
  });

  describe('createTreatment', () => {
    const validTreatmentData = {
      medication_name: 'Amoxicilina',
      dosage: '250mg cada 12 horas',
      frequency: 'Cada 12 horas con alimento',
      duration_days: 7,
      instructions: 'Administrar con comida para evitar molestias estomacales',
      start_date: new Date('2025-01-10'),
      treatment_type: TreatmentType.DEWORMING,
      veterinarian_id: 'vet-789',
    };

    const mockTreatmentResult = {
      id: 'treatment-123',
      petId: testPetId,
      tenantId: testTenantId,
      treatmentType: TreatmentType.DEWORMING,
      productName: validTreatmentData.medication_name,
      administrationDate: validTreatmentData.start_date,
      staffId: validTreatmentData.veterinarian_id,
      notes: expect.any(String),
      pet: {
        id: testPetId,
        name: 'Max',
        customer: { id: 'customer-1', name: 'Juan Pérez', phone: '5551234567' },
      },
      staff: { id: 'vet-789', name: 'Dr. García' },
    };

    it('should create a treatment record', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockTreatmentResult as never);

      const result = await createTreatment(testPetId, testTenantId, validTreatmentData);

      expect(result).toBeDefined();
      expect(prisma.treatmentRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: testPetId,
          tenantId: testTenantId,
          treatmentType: TreatmentType.DEWORMING,
          productName: validTreatmentData.medication_name,
          administrationDate: validTreatmentData.start_date,
          staffId: validTreatmentData.veterinarian_id,
        }),
        include: {
          pet: { include: { customer: true } },
          staff: true,
        },
      });
    });

    it('should include dosage, frequency, duration in notes', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockTreatmentResult as never);

      await createTreatment(testPetId, testTenantId, validTreatmentData);

      const createCall = jest.mocked(prisma.treatmentRecord.create).mock.calls[0][0];
      expect(createCall.data.notes).toContain('Dosis: 250mg cada 12 horas');
      expect(createCall.data.notes).toContain('Frecuencia: Cada 12 horas con alimento');
      expect(createCall.data.notes).toContain('Duración: 7 días');
      expect(createCall.data.notes).toContain('Instrucciones:');
    });

    it('should create treatment schedule for multi-day treatments', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockTreatmentResult as never);
      jest.mocked(prisma.treatmentSchedule.create).mockResolvedValue({} as never);

      await createTreatment(testPetId, testTenantId, validTreatmentData);

      expect(prisma.treatmentSchedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: testPetId,
          tenantId: testTenantId,
          treatmentType: TreatmentType.DEWORMING,
          productName: validTreatmentData.medication_name,
          status: 'SCHEDULED',
        }),
      });
    });

    it('should not create schedule for single-day treatment', async () => {
      const singleDayTreatment = { ...validTreatmentData, duration_days: 1 };
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockTreatmentResult as never);

      await createTreatment(testPetId, testTenantId, singleDayTreatment);

      expect(prisma.treatmentSchedule.create).not.toHaveBeenCalled();
    });

    it('should use veterinarianId parameter if veterinarian_id not in data', async () => {
      const dataWithoutVet = { ...validTreatmentData, veterinarian_id: undefined };
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockTreatmentResult as never);

      await createTreatment(testPetId, testTenantId, dataWithoutVet, 'fallback-vet-id');

      const createCall = jest.mocked(prisma.treatmentRecord.create).mock.calls[0][0];
      expect(createCall.data.staffId).toBe('fallback-vet-id');
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockRejectedValue(new Error('Database error'));

      await expect(createTreatment(testPetId, testTenantId, validTreatmentData)).rejects.toThrow(
        'Error al crear el registro de tratamiento'
      );
    });
  });

  describe('createVaccination', () => {
    const validVaccinationData = {
      vaccine_type: TreatmentType.VACCINATION,
      vaccine_brand: 'DHPPI Nobivac',
      batch_number: 'LOT-2024-ABC123',
      administered_date: new Date('2025-01-10'),
      next_due_date: new Date('2025-02-10'),
      veterinarian_id: 'vet-789',
      manufacturer: 'MSD Animal Health',
      vaccine_stage: VaccinationStage.PUPPY_KITTEN,
      side_effects: 'Leve inflamación',
      notes: 'Aplicada sin problemas',
    };

    const mockVaccinationResult = {
      id: 'vaccination-123',
      petId: testPetId,
      tenantId: testTenantId,
      treatmentType: TreatmentType.VACCINATION,
      productName: validVaccinationData.vaccine_brand,
      administrationDate: validVaccinationData.administered_date,
      batchNumber: validVaccinationData.batch_number,
      manufacturer: validVaccinationData.manufacturer,
      staffId: validVaccinationData.veterinarian_id,
      vaccineStage: validVaccinationData.vaccine_stage,
      notes: 'Efectos secundarios: Leve inflamación\nAplicada sin problemas',
      pet: {
        id: testPetId,
        name: 'Max',
        customer: { id: 'customer-1', name: 'Juan Pérez', phone: '5551234567' },
      },
      staff: { id: 'vet-789', name: 'Dr. García' },
    };

    it('should create a vaccination record', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockVaccinationResult as never);
      jest.mocked(prisma.treatmentSchedule.create).mockResolvedValue({} as never);

      const result = await createVaccination(testPetId, testTenantId, validVaccinationData);

      expect(result).toBeDefined();
      expect(prisma.treatmentRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: testPetId,
          tenantId: testTenantId,
          treatmentType: TreatmentType.VACCINATION,
          productName: validVaccinationData.vaccine_brand,
          batchNumber: validVaccinationData.batch_number,
          manufacturer: validVaccinationData.manufacturer,
          vaccineStage: validVaccinationData.vaccine_stage,
        }),
        include: {
          pet: { include: { customer: true } },
          staff: true,
        },
      });
    });

    it('should include side effects in notes when provided', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockVaccinationResult as never);
      jest.mocked(prisma.treatmentSchedule.create).mockResolvedValue({} as never);

      await createVaccination(testPetId, testTenantId, validVaccinationData);

      const createCall = jest.mocked(prisma.treatmentRecord.create).mock.calls[0][0];
      expect(createCall.data.notes).toContain('Efectos secundarios: Leve inflamación');
    });

    it('should schedule next vaccination when next_due_date provided', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockVaccinationResult as never);
      jest.mocked(prisma.treatmentSchedule.create).mockResolvedValue({} as never);

      await createVaccination(testPetId, testTenantId, validVaccinationData);

      expect(prisma.treatmentSchedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: testPetId,
          tenantId: testTenantId,
          treatmentType: TreatmentType.VACCINATION,
          productName: validVaccinationData.vaccine_brand,
          scheduledDate: validVaccinationData.next_due_date,
          status: 'SCHEDULED',
          vaccineStage: validVaccinationData.vaccine_stage,
        }),
      });
    });

    it('should not schedule next vaccination without next_due_date', async () => {
      const dataWithoutNextDue = { ...validVaccinationData, next_due_date: undefined as unknown as Date };
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue(mockVaccinationResult as never);

      await createVaccination(testPetId, testTenantId, dataWithoutNextDue);

      expect(prisma.treatmentSchedule.create).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.treatmentRecord.create).mockRejectedValue(new Error('Database error'));

      await expect(createVaccination(testPetId, testTenantId, validVaccinationData)).rejects.toThrow(
        'Error al registrar la vacunación'
      );
    });
  });

  describe('recordVitalSigns', () => {
    const validVitalSignsData = {
      weight: 15.5,
      temperature: 38.5,
      heart_rate: 100,
      respiratory_rate: 25,
      blood_pressure: '120/80',
      notes: 'Paciente tranquilo',
      recorded_date: new Date('2025-01-10'),
    };

    const mockVitalSignsResult = {
      id: 'vitals-123',
      petId: testPetId,
      tenantId: testTenantId,
      visitDate: validVitalSignsData.recorded_date,
      reasonForVisit: 'Registro de Signos Vitales',
      diagnosis: 'N/A',
      treatment: 'N/A',
      notes: expect.any(String),
      pet: {
        id: testPetId,
        name: 'Max',
        customer: { id: 'customer-1', name: 'Juan Pérez', phone: '5551234567' },
      },
    };

    it('should record vital signs as medical history entry', async () => {
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockVitalSignsResult as never);

      const result = await recordVitalSigns(testPetId, testTenantId, validVitalSignsData);

      expect(result).toBeDefined();
      expect(prisma.medicalHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petId: testPetId,
          tenantId: testTenantId,
          visitDate: validVitalSignsData.recorded_date,
          reasonForVisit: 'Registro de Signos Vitales',
          diagnosis: 'N/A',
          treatment: 'N/A',
        }),
        include: {
          pet: { include: { customer: true } },
        },
      });
    });

    it('should include all vital signs in notes', async () => {
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockVitalSignsResult as never);

      await recordVitalSigns(testPetId, testTenantId, validVitalSignsData);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.notes).toContain('Peso: 15.5 kg');
      expect(createCall.data.notes).toContain('Temperatura: 38.5°C');
      expect(createCall.data.notes).toContain('Frecuencia Cardíaca: 100 lpm');
      expect(createCall.data.notes).toContain('Frecuencia Respiratoria: 25 rpm');
      expect(createCall.data.notes).toContain('Presión Arterial: 120/80');
      expect(createCall.data.notes).toContain('Observaciones: Paciente tranquilo');
    });

    it('should handle missing blood_pressure', async () => {
      const dataWithoutBP = { ...validVitalSignsData, blood_pressure: undefined };
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockVitalSignsResult as never);

      await recordVitalSigns(testPetId, testTenantId, dataWithoutBP);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.notes).not.toContain('Presión Arterial:');
    });

    it('should handle missing notes', async () => {
      const dataWithoutNotes = { ...validVitalSignsData, notes: undefined };
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue(mockVitalSignsResult as never);

      await recordVitalSigns(testPetId, testTenantId, dataWithoutNotes);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.notes).not.toContain('Observaciones:');
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.medicalHistory.create).mockRejectedValue(new Error('Database error'));

      await expect(recordVitalSigns(testPetId, testTenantId, validVitalSignsData)).rejects.toThrow(
        'Error al registrar los signos vitales'
      );
    });
  });

  describe('getStaffMembers', () => {
    const mockStaffList = [
      { id: 'staff-1', name: 'Dr. García', position: 'Veterinario', licenseNumber: 'VET-001' },
      { id: 'staff-2', name: 'Dr. López', position: 'Veterinario', licenseNumber: 'VET-002' },
      { id: 'staff-3', name: 'Ana Martínez', position: 'Asistente', licenseNumber: null },
    ];

    it('should return list of active staff members', async () => {
      jest.mocked(prisma.staff.findMany).mockResolvedValue(mockStaffList as never);

      const result = await getStaffMembers(testTenantId);

      expect(result).toEqual(mockStaffList);
      expect(prisma.staff.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: testTenantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          position: true,
          licenseNumber: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should return empty array when no staff exists', async () => {
      jest.mocked(prisma.staff.findMany).mockResolvedValue([]);

      const result = await getStaffMembers(testTenantId);

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.staff.findMany).mockRejectedValue(new Error('Database error'));

      await expect(getStaffMembers(testTenantId)).rejects.toThrow('Error al cargar el personal');
    });
  });

  describe('createStaffMember', () => {
    const validStaffData = {
      name: 'Dr. Nuevo García',
      position: 'Veterinario',
      licenseNumber: 'VET-NEW-001',
    };

    const mockStaffResult = {
      id: 'new-staff-123',
      name: validStaffData.name,
      position: validStaffData.position,
      licenseNumber: validStaffData.licenseNumber,
    };

    it('should create a new staff member', async () => {
      jest.mocked(prisma.staff.create).mockResolvedValue(mockStaffResult as never);

      const result = await createStaffMember(testTenantId, validStaffData);

      expect(result).toEqual(mockStaffResult);
      expect(prisma.staff.create).toHaveBeenCalledWith({
        data: {
          tenantId: testTenantId,
          name: validStaffData.name,
          position: validStaffData.position,
          licenseNumber: validStaffData.licenseNumber,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          position: true,
          licenseNumber: true,
        },
      });
    });

    it('should handle null licenseNumber', async () => {
      const dataWithoutLicense = { ...validStaffData, licenseNumber: null };
      jest.mocked(prisma.staff.create).mockResolvedValue({ ...mockStaffResult, licenseNumber: null } as never);

      await createStaffMember(testTenantId, dataWithoutLicense);

      const createCall = jest.mocked(prisma.staff.create).mock.calls[0][0];
      expect(createCall.data.licenseNumber).toBeNull();
    });

    it('should handle undefined licenseNumber', async () => {
      const dataWithoutLicense = { name: validStaffData.name, position: validStaffData.position };
      jest.mocked(prisma.staff.create).mockResolvedValue({ ...mockStaffResult, licenseNumber: null } as never);

      await createStaffMember(testTenantId, dataWithoutLicense);

      const createCall = jest.mocked(prisma.staff.create).mock.calls[0][0];
      expect(createCall.data.licenseNumber).toBeNull();
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.staff.create).mockRejectedValue(new Error('Database error'));

      await expect(createStaffMember(testTenantId, validStaffData)).rejects.toThrow(
        'Error al crear el miembro del personal'
      );
    });
  });

  describe('getPetMedicalHistory', () => {
    const mockHistory = [
      {
        id: 'history-1',
        petId: testPetId,
        visitDate: new Date('2025-01-10'),
        reasonForVisit: 'Revisión',
        staff: { name: 'Dr. García', position: 'Veterinario' },
      },
      {
        id: 'history-2',
        petId: testPetId,
        visitDate: new Date('2025-01-05'),
        reasonForVisit: 'Vacunación',
        staff: { name: 'Dr. López', position: 'Veterinario' },
      },
    ];

    it('should return medical history for pet', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue(mockHistory as never);

      const result = await getPetMedicalHistory(testPetId, testTenantId);

      expect(result).toEqual(mockHistory);
      expect(prisma.medicalHistory.findMany).toHaveBeenCalledWith({
        where: {
          petId: testPetId,
          tenantId: testTenantId,
        },
        include: {
          staff: {
            select: {
              name: true,
              position: true,
            },
          },
        },
        orderBy: {
          visitDate: 'desc',
        },
        take: 10,
      });
    });

    it('should return empty array when no history exists', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);

      const result = await getPetMedicalHistory(testPetId, testTenantId);

      expect(result).toEqual([]);
    });

    it('should limit results to 10 entries', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue(mockHistory as never);

      await getPetMedicalHistory(testPetId, testTenantId);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.take).toBe(10);
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockRejectedValue(new Error('Database error'));

      await expect(getPetMedicalHistory(testPetId, testTenantId)).rejects.toThrow(
        'Error al cargar el historial médico'
      );
    });
  });

  describe('getPetTreatmentRecords', () => {
    const mockTreatments = [
      {
        id: 'treatment-1',
        petId: testPetId,
        treatmentType: TreatmentType.VACCINATION,
        productName: 'DHPPI',
        administrationDate: new Date('2025-01-10'),
        staff: { name: 'Dr. García', position: 'Veterinario' },
      },
      {
        id: 'treatment-2',
        petId: testPetId,
        treatmentType: TreatmentType.DEWORMING,
        productName: 'Drontal',
        administrationDate: new Date('2025-01-05'),
        staff: { name: 'Dr. López', position: 'Veterinario' },
      },
    ];

    it('should return treatment records for pet', async () => {
      jest.mocked(prisma.treatmentRecord.findMany).mockResolvedValue(mockTreatments as never);

      const result = await getPetTreatmentRecords(testPetId, testTenantId);

      expect(result).toEqual(mockTreatments);
      expect(prisma.treatmentRecord.findMany).toHaveBeenCalledWith({
        where: {
          petId: testPetId,
          tenantId: testTenantId,
        },
        include: {
          staff: {
            select: {
              name: true,
              position: true,
            },
          },
        },
        orderBy: {
          administrationDate: 'desc',
        },
        take: 20,
      });
    });

    it('should return empty array when no treatments exist', async () => {
      jest.mocked(prisma.treatmentRecord.findMany).mockResolvedValue([]);

      const result = await getPetTreatmentRecords(testPetId, testTenantId);

      expect(result).toEqual([]);
    });

    it('should limit results to 20 entries', async () => {
      jest.mocked(prisma.treatmentRecord.findMany).mockResolvedValue(mockTreatments as never);

      await getPetTreatmentRecords(testPetId, testTenantId);

      const findCall = jest.mocked(prisma.treatmentRecord.findMany).mock.calls[0][0];
      expect(findCall.take).toBe(20);
    });

    it('should throw error on database failure', async () => {
      jest.mocked(prisma.treatmentRecord.findMany).mockRejectedValue(new Error('Database error'));

      await expect(getPetTreatmentRecords(testPetId, testTenantId)).rejects.toThrow(
        'Error al cargar los registros de tratamiento'
      );
    });
  });

  describe('Tenant Isolation', () => {
    it('should always include tenantId in consultation creation', async () => {
      const data = {
        reason: 'Test reason for visit',
        symptoms: ['Test symptom'],
        diagnosis: 'Test diagnosis',
        treatment_plan: 'Test treatment plan',
        veterinarian_id: 'vet-test',
      };
      jest.mocked(prisma.medicalHistory.create).mockResolvedValue({} as never);

      await createConsultation(testPetId, testTenantId, data);

      const createCall = jest.mocked(prisma.medicalHistory.create).mock.calls[0][0];
      expect(createCall.data.tenantId).toBe(testTenantId);
    });

    it('should always include tenantId in treatment creation', async () => {
      const data = {
        medication_name: 'Test Med',
        dosage: '100mg',
        frequency: 'Once daily',
        duration_days: 5,
        instructions: 'Take with food',
        start_date: new Date(),
        treatment_type: TreatmentType.DEWORMING,
      };
      jest.mocked(prisma.treatmentRecord.create).mockResolvedValue({} as never);

      await createTreatment(testPetId, testTenantId, data);

      const createCall = jest.mocked(prisma.treatmentRecord.create).mock.calls[0][0];
      expect(createCall.data.tenantId).toBe(testTenantId);
    });

    it('should always filter staff by tenantId', async () => {
      jest.mocked(prisma.staff.findMany).mockResolvedValue([]);

      await getStaffMembers(testTenantId);

      const findCall = jest.mocked(prisma.staff.findMany).mock.calls[0][0];
      expect(findCall.where?.tenantId).toBe(testTenantId);
    });
  });
});
