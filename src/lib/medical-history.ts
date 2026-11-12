import { prisma } from './prisma';
import { MedicalHistoryFormData, MedicalHistoryWithDetails } from '@/types';

/** Invalid input detected while creating a history entry (answer 400). */
export class MedicalHistoryInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MedicalHistoryInputError';
  }
}

type PrescriptionInput = NonNullable<MedicalHistoryFormData['prescriptions']>[number];

function prescriptionLine(prescription: PrescriptionInput, name: string): string | null {
  const details = [prescription.dosage, prescription.frequency, prescription.duration]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');
  const instructions = prescription.instructions?.trim();
  if (!name && !details && !instructions) return null;
  const quantity = prescription.quantity ? ` (cantidad: ${prescription.quantity})` : '';
  return `- ${name || 'Medicamento'}${quantity}${details ? `: ${details}` : ''}${instructions ? `. ${instructions}` : ''}`;
}

/**
 * Crear nueva entrada en la historia clínica.
 *
 * Prescription rows need an inventory product and a responsible staff member
 * (both required foreign keys). Prescriptions typed as free text, or written
 * by a user without a staff record, are kept in the notes instead.
 */
export async function createMedicalHistory(
  tenantId: string,
  staffId: string | null,
  data: MedicalHistoryFormData
): Promise<MedicalHistoryWithDetails> {
  const prescriptions = data.prescriptions ?? [];
  const productIds = [...new Set(prescriptions.map((p) => p.productId?.trim()).filter((id): id is string => !!id))];

  const productNames = new Map<string, string>();
  if (productIds.length > 0) {
    const products = await prisma.inventoryItem.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true, name: true },
    });
    if (products.length !== productIds.length) {
      throw new MedicalHistoryInputError('Uno de los productos recetados no existe en el inventario de la clínica');
    }
    products.forEach((product) => productNames.set(product.id, product.name));
  }

  const ordered = staffId
    ? prescriptions.flatMap((p) => (p.productId?.trim() ? [{ ...p, productId: p.productId.trim() }] : []))
    : [];
  const asText = staffId ? prescriptions.filter((p) => !p.productId?.trim()) : prescriptions;
  const textLines = asText
    .map((p) => prescriptionLine(p, p.productName?.trim() || productNames.get(p.productId?.trim() ?? '') || ''))
    .filter((line): line is string => !!line);
  const notes = textLines.length > 0
    ? [data.notes?.trim(), `RECETA:\n${textLines.join('\n')}`].filter(Boolean).join('\n\n')
    : data.notes;

  const visitDate = new Date(data.visitDate);

  const medicalHistory = await prisma.$transaction(async (tx) => {
    // Crear la entrada de historia clínica
    const newHistory = await tx.medicalHistory.create({
      data: {
        tenantId,
        petId: data.petId,
        staffId,
        visitDate,
        reasonForVisit: data.reasonForVisit,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        notes
      }
    });

    // Si hay prescripciones de inventario, crear la orden médica
    if (staffId && ordered.length > 0) {
      const medicalOrder = await tx.medicalOrder.create({
        data: {
          tenantId,
          petId: data.petId,
          staffId,
          visitDate,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          notes,
          status: 'PENDING'
        }
      });

      // Crear las prescripciones
      for (const prescription of ordered) {
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
      staff: { select: { id: true, name: true } },
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