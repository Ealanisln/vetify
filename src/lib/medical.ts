import { prisma } from './prisma';
import { TreatmentType } from '@prisma/client';
import { n8nService } from './n8n';
import type { 
  ConsultationFormData, 
  TreatmentFormData, 
  VaccinationFormData, 
  VitalSignsFormData 
} from './medical-validation';

// Create a new consultation (medical history entry)
export async function createConsultation(
  petId: string,
  tenantId: string,
  data: ConsultationFormData
) {
  try {
    const consultation = await prisma.medicalHistory.create({
      data: {
        petId,
        tenantId,
        visitDate: new Date(),
        reasonForVisit: data.reason,
        diagnosis: data.diagnosis,
        treatment: data.treatment_plan,
        notes: data.notes,
        staffId: data.veterinarian_id,
      },
      include: {
        pet: {
          include: {
            customer: true,
          },
        },
        staff: true,
      },
    });

    // Trigger WhatsApp notification
    await n8nService.triggerWorkflow('consultation-summary', {
      tenantId,
      petName: consultation.pet.name,
      ownerName: consultation.pet.customer.name,
      ownerPhone: consultation.pet.customer.phone,
      diagnosis: data.diagnosis,
      treatment: data.treatment_plan,
      veterinarian: consultation.staff?.name || 'Dr. Veterinario',
      consultationDate: new Date().toLocaleDateString('es-MX'),
    });

    return consultation;
  } catch (error) {
    console.error('Error creating consultation:', error);
    throw new Error('Error al crear la consulta médica');
  }
}

// Create a new treatment record
export async function createTreatment(
  petId: string,
  tenantId: string,
  data: TreatmentFormData,
  veterinarianId?: string
) {
  try {
    const treatment = await prisma.treatmentRecord.create({
      data: {
        petId,
        tenantId,
        treatmentType: data.treatment_type,
        productName: data.medication_name,
        administrationDate: data.start_date,
        staffId: data.veterinarian_id || veterinarianId,
        notes: `Dosis: ${data.dosage}\nFrecuencia: ${data.frequency}\nDuración: ${data.duration_days} días\nInstrucciones: ${data.instructions}`,
      },
      include: {
        pet: {
          include: {
            customer: true,
          },
        },
        staff: true,
      },
    });

    // Create treatment schedule for follow-ups if needed
    if (data.duration_days > 1) {
      await prisma.treatmentSchedule.create({
        data: {
          petId,
          tenantId,
          treatmentType: data.treatment_type,
          productName: data.medication_name,
          scheduledDate: new Date(data.start_date.getTime() + data.duration_days * 24 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });
    }

    // Trigger WhatsApp notification
    await n8nService.triggerWorkflow('treatment-prescribed', {
      tenantId,
      petName: treatment.pet.name,
      ownerName: treatment.pet.customer.name,
      ownerPhone: treatment.pet.customer.phone,
      medication: data.medication_name,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: `${data.duration_days} días`,
      instructions: data.instructions,
    });

    return treatment;
  } catch (error) {
    console.error('Error creating treatment:', error);
    throw new Error('Error al crear el registro de tratamiento');
  }
}

// Create a new vaccination record
export async function createVaccination(
  petId: string,
  tenantId: string,
  data: VaccinationFormData
) {
  try {
    const vaccination = await prisma.treatmentRecord.create({
      data: {
        petId,
        tenantId,
        treatmentType: TreatmentType.VACCINATION,
        productName: data.vaccine_brand,
        administrationDate: data.administered_date,
        batchNumber: data.batch_number,
        manufacturer: data.manufacturer,
        staffId: data.veterinarian_id,
        notes: data.side_effects ? `Efectos secundarios: ${data.side_effects}\n${data.notes || ''}` : data.notes,
        vaccineStage: data.vaccine_stage,
      },
      include: {
        pet: {
          include: {
            customer: true,
          },
        },
        staff: true,
      },
    });

    // Schedule next vaccination if provided
    if (data.next_due_date) {
      await prisma.treatmentSchedule.create({
        data: {
          petId,
          tenantId,
          treatmentType: TreatmentType.VACCINATION,
          productName: data.vaccine_brand,
          scheduledDate: data.next_due_date,
          status: 'SCHEDULED',
          vaccineStage: data.vaccine_stage,
        },
      });
    }

    // Trigger WhatsApp notification
    await n8nService.triggerWorkflow('vaccination-completed', {
      tenantId,
      petName: vaccination.pet.name,
      ownerName: vaccination.pet.customer.name,
      ownerPhone: vaccination.pet.customer.phone,
      vaccineName: data.vaccine_brand,
      applicationDate: data.administered_date.toLocaleDateString('es-MX'),
      nextDueDate: data.next_due_date?.toLocaleDateString('es-MX'),
      veterinarian: vaccination.staff?.name || 'Dr. Veterinario',
    });

    return vaccination;
  } catch (error) {
    console.error('Error creating vaccination:', error);
    throw new Error('Error al registrar la vacunación');
  }
}

// Record vital signs (we'll need to create a new model or extend existing ones)
export async function recordVitalSigns(
  petId: string,
  tenantId: string,
  data: VitalSignsFormData
) {
  try {
    // For now, we'll store vital signs as a special medical history entry
    // In a real implementation, you might want a separate VitalSigns model
    const vitals = await prisma.medicalHistory.create({
      data: {
        petId,
        tenantId,
        visitDate: data.recorded_date,
        reasonForVisit: 'Registro de Signos Vitales',
        diagnosis: 'N/A',
        treatment: 'N/A',
        notes: `SIGNOS VITALES:
Peso: ${data.weight} kg
Temperatura: ${data.temperature}°C
Frecuencia Cardíaca: ${data.heart_rate} lpm
Frecuencia Respiratoria: ${data.respiratory_rate} rpm
${data.blood_pressure ? `Presión Arterial: ${data.blood_pressure}` : ''}
${data.notes ? `Observaciones: ${data.notes}` : ''}`,
      },
      include: {
        pet: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Trigger WhatsApp notification
    await n8nService.triggerWorkflow('vital-signs-recorded', {
      tenantId,
      petName: vitals.pet.name,
      ownerName: vitals.pet.customer.name,
      ownerPhone: vitals.pet.customer.phone,
      weight: `${data.weight} kg`,
      temperature: `${data.temperature}°C`,
      heartRate: `${data.heart_rate} lpm`,
      respiratoryRate: `${data.respiratory_rate} rpm`,
      recordDate: data.recorded_date.toLocaleDateString('es-MX'),
    });

    return vitals;
  } catch (error) {
    console.error('Error recording vital signs:', error);
    throw new Error('Error al registrar los signos vitales');
  }
}

// Get staff members (veterinarians) for dropdowns
export async function getStaffMembers(tenantId: string) {
  try {
    const staff = await prisma.staff.findMany({
      where: {
        tenantId,
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

    return staff;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw new Error('Error al cargar el personal');
  }
}

// Get pet's medical history for context
export async function getPetMedicalHistory(petId: string, tenantId: string) {
  try {
    const history = await prisma.medicalHistory.findMany({
      where: {
        petId,
        tenantId,
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
      take: 10, // Last 10 entries
    });

    return history;
  } catch (error) {
    console.error('Error fetching medical history:', error);
    throw new Error('Error al cargar el historial médico');
  }
}

// Get pet's treatment records
export async function getPetTreatmentRecords(petId: string, tenantId: string) {
  try {
    const treatments = await prisma.treatmentRecord.findMany({
      where: {
        petId,
        tenantId,
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
      take: 20, // Last 20 treatments
    });

    return treatments;
  } catch (error) {
    console.error('Error fetching treatment records:', error);
    throw new Error('Error al cargar los registros de tratamiento');
  }
} 