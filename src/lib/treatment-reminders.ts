import { prisma } from './prisma';
import { n8nService } from './n8n';
import { z } from 'zod';
import { formatDate } from './utils/date-format';

// Validation schemas
export const createTreatmentScheduleSchema = z.object({
  petId: z.string().uuid(),
  treatmentType: z.enum(['VACCINATION', 'DEWORMING', 'FLEA_TICK', 'OTHER_PREVENTATIVE']),
  productName: z.string().optional(),
  scheduledDate: z.date(),
  vaccineStage: z.enum(['PUPPY_KITTEN', 'ADULT', 'SENIOR', 'BOOSTER']).optional(),
  dewormingType: z.enum(['INTERNAL', 'EXTERNAL', 'BOTH']).optional(),
});

export const updateTreatmentScheduleSchema = createTreatmentScheduleSchema.partial();

export type CreateTreatmentScheduleData = z.infer<typeof createTreatmentScheduleSchema>;
export type UpdateTreatmentScheduleData = z.infer<typeof updateTreatmentScheduleSchema>;

// Treatment schedule service functions
export async function createTreatmentSchedule(tenantId: string, data: CreateTreatmentScheduleData) {
  const schedule = await prisma.treatmentSchedule.create({
    data: {
      ...data,
      tenantId,
    },
    include: {
      pet: {
        include: {
          customer: true
        }
      }
    }
  });

  // Create reminder 7 days before treatment
  const reminderDate = new Date(data.scheduledDate);
  reminderDate.setDate(reminderDate.getDate() - 7);

  await prisma.reminder.create({
    data: {
      tenantId,
      petId: data.petId,
      customerId: schedule.pet.customerId,
      type: 'TREATMENT',
      title: `Recordatorio de ${data.treatmentType.toLowerCase()}`,
      message: `Tu mascota ${schedule.pet.name} tiene programado un ${data.treatmentType.toLowerCase()} el ${formatDate(data.scheduledDate)}`,
      dueDate: reminderDate,
      status: 'PENDING'
    }
  });

  return schedule;
}

export async function getTreatmentSchedulesByTenant(tenantId: string, filters: {
  petId?: string;
  treatmentType?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
} = {}) {
  const where: Record<string, unknown> = {
    tenantId,
  };

  if (filters.petId) {
    where.petId = filters.petId;
  }

  if (filters.treatmentType) {
    where.treatmentType = filters.treatmentType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.fromDate || filters.toDate) {
    where.scheduledDate = {};
    if (filters.fromDate) {
      (where.scheduledDate as Record<string, unknown>).gte = filters.fromDate;
    }
    if (filters.toDate) {
      (where.scheduledDate as Record<string, unknown>).lte = filters.toDate;
    }
  }

  const schedules = await prisma.treatmentSchedule.findMany({
    where,
    include: {
      pet: {
        include: {
          customer: true
        }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  return schedules;
}

export async function updateTreatmentSchedule(tenantId: string, scheduleId: string, data: UpdateTreatmentScheduleData) {
  const existingSchedule = await prisma.treatmentSchedule.findFirst({
    where: {
      id: scheduleId,
      tenantId,
    }
  });

  if (!existingSchedule) {
    throw new Error('Programa de tratamiento no encontrado');
  }

  const updatedSchedule = await prisma.treatmentSchedule.update({
    where: { id: scheduleId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      pet: {
        include: {
          customer: true
        }
      }
    }
  });

  return updatedSchedule;
}

export async function markTreatmentAsCompleted(tenantId: string, scheduleId: string, staffId?: string) {
  const schedule = await prisma.treatmentSchedule.findFirst({
    where: {
      id: scheduleId,
      tenantId,
    },
    include: {
      pet: {
        include: {
          customer: true
        }
      }
    }
  });

  if (!schedule) {
    throw new Error('Programa de tratamiento no encontrado');
  }

  // Update schedule status
  await prisma.treatmentSchedule.update({
    where: { id: scheduleId },
    data: {
      status: 'COMPLETED',
      updatedAt: new Date(),
    }
  });

  // Create treatment record
  await prisma.treatmentRecord.create({
    data: {
      tenantId,
      petId: schedule.petId,
      treatmentType: schedule.treatmentType,
      productName: schedule.productName || 'No especificado',
      administrationDate: new Date(),
      staffId,
      vaccineStage: schedule.vaccineStage,
      dewormingType: schedule.dewormingType,
      notes: `Tratamiento completado desde programa programado`
    }
  });

  return { success: true };
}

// Reminder processing functions
export async function processPendingReminders(tenantId: string) {
  const now = new Date();
  const pendingReminders = await prisma.reminder.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: {
        lte: now
      }
    },
    include: {
      pet: {
        include: {
          customer: true
        }
      },
      customer: true
    }
  });

  const results = [];

  for (const reminder of pendingReminders) {
    try {
      // Send WhatsApp reminder via N8N
      if (reminder.customer.phone && reminder.pet) {
        const reminderResult = await n8nService.sendVaccinationReminder({
          petName: reminder.pet.name,
          ownerName: reminder.customer.name,
          ownerPhone: reminder.customer.phone,
          vaccinationType: reminder.title,
          dueDate: formatDate(reminder.dueDate),
          clinicName: 'Tu Clínica Veterinaria', // This should come from tenant settings
          clinicPhone: '+1234567890' // This should come from tenant settings
        });

        if (reminderResult.success) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          });

          results.push({ 
            id: reminder.id, 
            success: true, 
            message: 'Recordatorio enviado exitosamente' 
          });
        } else {
          results.push({ 
            id: reminder.id, 
            success: false, 
            error: reminderResult.error 
          });
        }
      } else {
        results.push({ 
          id: reminder.id, 
          success: false, 
          error: 'No se encontró teléfono del cliente o mascota' 
        });
      }
    } catch (error) {
      results.push({ 
        id: reminder.id, 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }

  return results;
}

// Automatic treatment scheduling
export async function createVaccinationSchedule(tenantId: string, petId: string, vaccinationType: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId }
  });

  if (!pet) {
    throw new Error('Mascota no encontrada');
  }

  const now = new Date();
  const schedules = [];

  // Different vaccination schedules based on age and type
  if (vaccinationType === 'PUPPY_SERIES') {
    // Puppy vaccination series (6, 9, 12 weeks)
    const doses = [
      { weeks: 6, stage: 'PUPPY_KITTEN' as const },
      { weeks: 9, stage: 'ADULT' as const },
      { weeks: 12, stage: 'SENIOR' as const }
    ];

    for (const dose of doses) {
      const scheduledDate = new Date(pet.dateOfBirth);
      scheduledDate.setDate(scheduledDate.getDate() + (dose.weeks * 7));

      if (scheduledDate > now) {
        const schedule = await createTreatmentSchedule(tenantId, {
          petId,
          treatmentType: 'VACCINATION',
          productName: 'Vacuna múltiple canina',
          scheduledDate,
          vaccineStage: dose.stage
        });
        schedules.push(schedule);
      }
    }
  } else if (vaccinationType === 'ANNUAL_BOOSTERS') {
    // Annual boosters
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const schedule = await createTreatmentSchedule(tenantId, {
      petId,
      treatmentType: 'VACCINATION',
      productName: 'Refuerzo anual',
      scheduledDate: nextYear,
      vaccineStage: 'BOOSTER'
    });
    schedules.push(schedule);
  }

  return schedules;
}

export async function createDewormingSchedule(tenantId: string, petId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId }
  });

  if (!pet) {
    throw new Error('Mascota no encontrada');
  }

  const now = new Date();
  const schedules = [];

  // Quarterly deworming schedule
  for (let i = 1; i <= 4; i++) {
    const scheduledDate = new Date(now);
    scheduledDate.setMonth(scheduledDate.getMonth() + (i * 3));

    const schedule = await createTreatmentSchedule(tenantId, {
      petId,
      treatmentType: 'DEWORMING',
      productName: 'Desparasitante interno',
      scheduledDate,
      dewormingType: 'INTERNAL'
    });
    schedules.push(schedule);
  }

  return schedules;
} 