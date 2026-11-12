import { prisma } from './prisma';
import { z } from 'zod';
import { serializePet, serializePets } from './serializers';
import type { PaginationParams, SortParams } from './pagination';
import { PET_FIELD_MESSAGES, PET_WEIGHT_UNITS } from './utils/pet-form-validation';
import type { FieldLabel } from './validations/spanish-errors';

// Allowed sort fields for pets (whitelist for security)
export const PETS_ALLOWED_SORT_FIELDS = ['name', 'species', 'breed', 'createdAt'] as const;
export type PetsSortField = typeof PETS_ALLOWED_SORT_FIELDS[number];

export const PET_FIELD_LABELS: Record<string, FieldLabel> = {
  name: { required: 'El nombre es requerido', invalid: 'El nombre no es válido' },
  species: { required: 'La especie es requerida', invalid: 'La especie no es válida' },
  breed: { required: 'La raza es requerida', invalid: 'La raza no es válida' },
  dateOfBirth: {
    required: 'La fecha de nacimiento es requerida',
    invalid: 'La fecha de nacimiento no es válida',
  },
  gender: { required: 'El sexo es requerido', invalid: 'El sexo no es válido' },
  weight: { required: 'El peso es requerido', invalid: 'El peso debe ser un número' },
  weightUnit: { required: 'La unidad de peso es requerida', invalid: PET_FIELD_MESSAGES.weightUnit },
  microchipNumber: { required: 'El microchip es requerido', invalid: 'El microchip no es válido' },
  isNeutered: { required: 'Indica si está esterilizado', invalid: 'Indica si está esterilizado' },
  customerId: { required: 'El cliente es requerido', invalid: 'El cliente no es válido' },
  locationId: { required: 'La ubicación es requerida', invalid: 'La ubicación no es válida' },
};

const enumMessage = (message: string) => ({ errorMap: () => ({ message }) });

export const createPetSchema = z.object({
  name: z.string().min(1, PET_FIELD_LABELS.name.required),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other'], enumMessage(PET_FIELD_LABELS.species.invalid)),
  breed: z.string().optional(),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female'], enumMessage(PET_FIELD_LABELS.gender.invalid)),
  weight: z.number().positive(PET_FIELD_MESSAGES.weightPositive).optional(),
  weightUnit: z.enum(PET_WEIGHT_UNITS, enumMessage(PET_FIELD_MESSAGES.weightUnit)).default('kg'),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean().default(false),
  customerId: z.string().min(1, PET_FIELD_LABELS.customerId.required),
  locationId: z.string().min(1).nullable().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export async function createPet(
  tenantId: string, 
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

  // Verify customer exists and belongs to tenant
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, tenantId }
  });

  if (!customer) {
    throw new Error('Cliente no encontrado o no pertenece a esta clínica');
  }

  if (data.locationId) {
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, tenantId },
      select: { id: true },
    });

    if (!location) {
      throw new Error('Ubicación no encontrada o no pertenece a esta clínica');
    }
  }

  const pet = await prisma.pet.create({
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
      customerId: data.customerId,
      locationId: data.locationId || null,
    },
    include: {
      customer: true,
      medicalHistories: true,
      appointments: true
    }
  });

  // Serialize the pet data to convert Decimal fields to numbers
  return serializePet(pet);
}

export async function getPetsByTenant(
  tenantId: string,
  locationId?: string,
  pagination?: PaginationParams,
  sort?: SortParams
) {
  const where = {
    tenantId,
    // Include pets with the specified location OR pets without any location assigned
    ...(locationId && {
      OR: [
        { locationId },
        { locationId: null }
      ]
    }),
  };

  // Build orderBy - default to createdAt desc
  const orderBy = sort?.sortBy
    ? { [sort.sortBy]: sort.sortOrder || 'desc' }
    : { createdAt: 'desc' as const };

  // If pagination is provided, return paginated results with total count
  if (pagination) {
    const [total, pets] = await Promise.all([
      prisma.pet.count({ where }),
      prisma.pet.findMany({
        where,
        include: {
          customer: true,
          appointments: true,
          medicalHistories: true,
          location: true
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      })
    ]);

    return { pets: serializePets(pets), total };
  }

  // Without pagination, return all pets (backwards compatible)
  const pets = await prisma.pet.findMany({
    where,
    include: {
      customer: true,
      appointments: true,
      medicalHistories: true,
      location: true
    },
    orderBy
  });

  return serializePets(pets);
}

export async function getPetById(petId: string, tenantId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId },
    include: {
      customer: true,
      location: true,
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

  // Serialize the pet data to convert Decimal fields to numbers
  return serializePet(pet);
} 