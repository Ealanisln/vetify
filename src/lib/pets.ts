import { prisma } from './prisma';
import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
  breed: z.string().optional(),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female']),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['kg', 'lbs']).default('kg'),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean().default(false),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export async function createPet(
  tenantId: string, 
  userId: string, 
  data: CreatePetInput
) {
  // Check plan limits
  const petCount = await prisma.pet.count({ where: { tenantId } });
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { tenantSubscription: { include: { plan: true } } }
  });
  
  const maxPets = tenant?.tenantSubscription?.plan?.maxPets || 50;
  
  if (petCount >= maxPets) {
    throw new Error('Plan limit reached. Upgrade to add more pets.');
  }

  return prisma.pet.create({
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed || '',
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      weight: data.weight || null,
      weightUnit: data.weightUnit,
      microchipNumber: data.microchipNumber || null,
      isNeutered: data.isNeutered,
      tenantId,
      userId,
    },
    include: {
      user: true,
      medicalHistories: true,
      appointments: true
    }
  });
}

export async function getPetsByTenant(tenantId: string) {
  return prisma.pet.findMany({
    where: { tenantId },
    include: {
      user: true,
      medicalHistories: true,
      appointments: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getPetById(petId: string, tenantId: string) {
  return prisma.pet.findFirst({
    where: { id: petId, tenantId },
    include: {
      user: true,
      medicalHistories: {
        orderBy: { visitDate: 'desc' }
      },
      appointments: {
        orderBy: { dateTime: 'desc' }
      },
      treatmentRecords: {
        orderBy: { administrationDate: 'desc' }
      }
    }
  });
} 