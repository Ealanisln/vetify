import { prisma } from './prisma';
import { MedicalHistoryFormData, MedicalHistoryWithDetails } from '@/types';

/**
 * Crear nueva entrada en la historia clínica
 */
export async function createMedicalHistory(
  tenantId: string,
  staffId: string,
  data: MedicalHistoryFormData
): Promise<MedicalHistoryWithDetails> {
  const medicalHistory = await prisma.$transaction(async (tx) => {
    // Crear la entrada de historia clínica
    const newHistory = await tx.medicalHistory.create({
      data: {
        tenantId,
        petId: data.petId,
        staffId,
        visitDate: new Date(data.visitDate),
        reasonForVisit: data.reasonForVisit,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        notes: data.notes
      }
    });

    // Si hay prescripciones, crear la orden médica
    if (data.prescriptions && data.prescriptions.length > 0) {
      const medicalOrder = await tx.medicalOrder.create({
        data: {
          tenantId,
          petId: data.petId,
          staffId,
          visitDate: new Date(data.visitDate),
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          notes: data.notes,
          status: 'PENDING'
        }
      });

      // Crear las prescripciones
      for (const prescription of data.prescriptions) {
        await tx.prescription.create({
          data: {
            orderId: medicalOrder.id,
            productId: prescription.productId,
            quantity: prescription.quantity,
            unitPrice: 0, // Se puede calcular basado en el precio del producto
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            instructions: prescription.instructions
          }
        });
      }

      // Actualizar la historia clínica con la referencia a la orden médica
      await tx.medicalHistory.update({
        where: { id: newHistory.id },
        data: { medicalOrderId: medicalOrder.id }
      });
    }

    return newHistory;
  });

  // Obtener la historia clínica completa con relaciones
  return getMedicalHistoryById(tenantId, medicalHistory.id);
}

/**
 * Obtener historia clínica por ID
 */
export async function getMedicalHistoryById(
  tenantId: string,
  historyId: string
): Promise<MedicalHistoryWithDetails> {
  const history = await prisma.medicalHistory.findUniqueOrThrow({
    where: { id: historyId, tenantId },
    include: {
      pet: {
        include: {
          customer: true
        }
      },
      medicalOrder: {
        include: {
          prescriptions: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  return history as MedicalHistoryWithDetails;
}

/**
 * Obtener historia clínica de una mascota
 */
export async function getPetMedicalHistory(
  tenantId: string,
  petId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ histories: MedicalHistoryWithDetails[], total: number }> {
  const [histories, total] = await Promise.all([
    prisma.medicalHistory.findMany({
      where: { tenantId, petId },
      include: {
        pet: {
          include: {
            customer: true
          }
        },
        medicalOrder: {
          include: {
            prescriptions: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { visitDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.medicalHistory.count({
      where: { tenantId, petId }
    })
  ]);

  return {
    histories: histories as MedicalHistoryWithDetails[],
    total
  };
}

/**
 * Obtener historias médicas recientes
 */
export async function getRecentMedicalHistories(
  tenantId: string,
  limit: number = 10
): Promise<MedicalHistoryWithDetails[]> {
  const histories = await prisma.medicalHistory.findMany({
    where: { tenantId },
    include: {
      pet: {
        include: {
          customer: true
        }
      },
      medicalOrder: {
        include: {
          prescriptions: {
            include: {
              product: true
            }
          }
        }
      }
    },
    orderBy: { visitDate: 'desc' },
    take: limit
  });

  return histories as MedicalHistoryWithDetails[];
}

/**
 * Actualizar entrada de historia clínica
 */
export async function updateMedicalHistory(
  tenantId: string,
  historyId: string,
  data: Partial<MedicalHistoryFormData>
): Promise<MedicalHistoryWithDetails> {
  const updatedHistory = await prisma.medicalHistory.update({
    where: { id: historyId, tenantId },
    data: {
      ...(data.visitDate && { visitDate: new Date(data.visitDate) }),
      ...(data.reasonForVisit && { reasonForVisit: data.reasonForVisit }),
      ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
      ...(data.treatment !== undefined && { treatment: data.treatment }),
      ...(data.notes !== undefined && { notes: data.notes })
    }
  });

  return getMedicalHistoryById(tenantId, updatedHistory.id);
}

/**
 * Eliminar entrada de historia clínica (soft delete)
 */
export async function deleteMedicalHistory(
  tenantId: string,
  historyId: string
): Promise<void> {
  // En lugar de eliminar, podrías marcar como inactivo
  // Por ahora, eliminar directamente
  await prisma.medicalHistory.delete({
    where: { id: historyId, tenantId }
  });
}

/**
 * Buscar en historias médicas
 */
export async function searchMedicalHistories(
  tenantId: string,
  query: string,
  petId?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ histories: MedicalHistoryWithDetails[], total: number }> {
  if (!query || query.length < 2) {
    return { histories: [], total: 0 };
  }

  const where = {
    tenantId,
    ...(petId && { petId }),
    OR: [
      { reasonForVisit: { contains: query, mode: 'insensitive' as const } },
      { diagnosis: { contains: query, mode: 'insensitive' as const } },
      { treatment: { contains: query, mode: 'insensitive' as const } },
      { notes: { contains: query, mode: 'insensitive' as const } },
      {
        pet: {
          name: { contains: query, mode: 'insensitive' as const }
        }
      },
      {
        pet: {
          customer: {
            name: { contains: query, mode: 'insensitive' as const }
          }
        }
      }
    ]
  };

  const [histories, total] = await Promise.all([
    prisma.medicalHistory.findMany({
      where,
      include: {
        pet: {
          include: {
            customer: true
          }
        },
        medicalOrder: {
          include: {
            prescriptions: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { visitDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.medicalHistory.count({ where })
  ]);

  return {
    histories: histories as MedicalHistoryWithDetails[],
    total
  };
}

/**
 * Obtener estadísticas de historias médicas
 *
 * Returns comprehensive statistics about medical histories for a tenant,
 * including total consultations, monthly count, average visits per pet,
 * and most common diagnoses.
 *
 * @param tenantId - The tenant ID to get statistics for
 * @returns Object containing medical history statistics:
 *   - totalHistories: Total number of consultations (renamed from 'total' for clarity)
 *   - thisMonth: Number of consultations this month
 *   - avgVisitsPerPet: Average visits per unique pet (handles division by zero)
 *   - commonDiagnoses: Top 5 most common diagnoses as string array (null values filtered)
 *
 * @example
 * ```typescript
 * const stats = await getMedicalHistoryStats('tenant-123');
 * console.log(stats.totalHistories); // 80
 * console.log(stats.avgVisitsPerPet); // 1.7
 * ```
 *
 * @note The 'today' stat was removed as it's not currently used in the UI.
 *       If needed in the future, it can be added back by including another count
 *       query with today's date range.
 *
 * @note This function is designed to be called directly from Server Components
 *       rather than through an API route to avoid authentication/session issues.
 */
export async function getMedicalHistoryStats(tenantId: string) {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 1);

  const [monthConsultations, totalConsultations, uniquePetsGroups, commonDiagnosesRaw] = await Promise.all([
    // Consultas del mes
    prisma.medicalHistory.count({
      where: {
        tenantId,
        visitDate: { gte: thisMonth, lt: nextMonth }
      }
    }),

    // Total de consultas
    prisma.medicalHistory.count({
      where: { tenantId }
    }),

    // Mascotas únicas con historial médico (optimized with groupBy)
    prisma.medicalHistory.groupBy({
      by: ['petId'],
      where: { tenantId }
    }),

    // Diagnósticos más comunes
    prisma.medicalHistory.groupBy({
      by: ['diagnosis'],
      where: {
        tenantId,
        diagnosis: { not: null }
      },
      _count: {
        diagnosis: true
      },
      orderBy: {
        _count: {
          diagnosis: 'desc'
        }
      },
      take: 5
    })
  ]);

  // Calcular promedio de visitas por mascota
  const totalPets = uniquePetsGroups.length;
  const avgVisitsPerPet = totalPets > 0 ? totalConsultations / totalPets : 0;

  // Transformar diagnósticos a array de strings
  const commonDiagnoses = commonDiagnosesRaw
    .map(item => item.diagnosis)
    .filter((diagnosis): diagnosis is string => diagnosis !== null);

  return {
    totalHistories: totalConsultations,
    thisMonth: monthConsultations,
    avgVisitsPerPet,
    commonDiagnoses
  };
}

/**
 * Obtener template de diagnósticos comunes (para autocompletado)
 */
export async function getCommonDiagnoses(tenantId: string, limit: number = 10): Promise<string[]> {
  const diagnoses = await prisma.medicalHistory.groupBy({
    by: ['diagnosis'],
    where: {
      tenantId,
      diagnosis: { not: null }
    },
    _count: {
      diagnosis: true
    },
    orderBy: {
      _count: {
        diagnosis: 'desc'
      }
    },
    take: limit
  });

  return diagnoses
    .map(item => item.diagnosis)
    .filter((diagnosis): diagnosis is string => diagnosis !== null);
}

/**
 * Obtener template de tratamientos comunes (para autocompletado)
 */
export async function getCommonTreatments(tenantId: string, limit: number = 10): Promise<string[]> {
  const treatments = await prisma.medicalHistory.groupBy({
    by: ['treatment'],
    where: {
      tenantId,
      treatment: { not: null }
    },
    _count: {
      treatment: true
    },
    orderBy: {
      _count: {
        treatment: 'desc'
      }
    },
    take: limit
  });

  return treatments
    .map(item => item.treatment)
    .filter((treatment): treatment is string => treatment !== null);
} 