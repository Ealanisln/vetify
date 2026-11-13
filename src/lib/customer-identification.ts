import { prisma } from './prisma';
import { Customer as PrismaCustomer, User as PrismaUser } from '@prisma/client';
import { phoneMatchKey, phonesMatch } from './phone';

interface Customer extends Omit<PrismaCustomer, 'phone'> {
  phone: string | null;
  pets?: Pet[];
  user?: PrismaUser | null;
  appointmentRequests?: AppointmentRequest[];
}

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface AppointmentRequest {
  id: string;
  status: string;
  createdAt: Date;
}

interface SimilarCustomer extends Customer {
  similarityScore?: number;
}

export interface CustomerIdentificationResult {
  customer: Customer;
  status: 'existing' | 'new' | 'needs_review';
  existingPets?: Pet[];
  hasUserAccount: boolean;
  similarCustomers?: SimilarCustomer[];
  confidence: 'high' | 'medium' | 'low';
  /** Booker contact that differs from the matched customer, for staff review. */
  providedContactNote?: string;
}

/**
 * Customers of the clinic whose phone is the same number as `phone`, whatever
 * the formatting on either side (see src/lib/phone.ts). Partial phones never
 * match. Shared by public booking and the public customer lookup so both
 * identify the same customer.
 */
export async function findCustomersByPhone(
  tenantId: string,
  phone: string,
  options: { activeOnly?: boolean } = {}
): Promise<Array<{ id: string; name: string; email: string | null; phone: string | null }>> {
  const key = phoneMatchKey(phone);
  if (!key) return [];

  // Stored phones keep their formatting, so the database cannot compare
  // normalized numbers. The last two digits are contiguous in every common
  // format ("55 12 34 56 78", "(55) 1234-5678"), which narrows the rows
  // fetched; the exact comparison happens below on the normalized digits.
  const candidates = await prisma.customer.findMany({
    where: {
      tenantId,
      phone: { contains: key.slice(-2) },
      // Archived customers are hidden from searches (same rule as the lists)
      ...(options.activeOnly && { isActive: true }),
    },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { createdAt: 'asc' },
  });

  return candidates.filter((candidate) => phoneMatchKey(candidate.phone) === key);
}

/** Case, accent and whitespace insensitive name comparison. */
export function namesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const normalize = (value: string | null | undefined) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const left = normalize(a);
  return left.length > 0 && left === normalize(b);
}

function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = (a ?? '').trim().toLowerCase();
  return left.length > 0 && left === (b ?? '').trim().toLowerCase();
}

/**
 * An anonymous booking never edits an existing customer's contact data (that
 * would let anyone redirect a client's emails). When the booker's contact
 * differs from the record, it is kept on the request for staff instead.
 */
function describeProvidedContact(
  stored: { name: string; phone: string | null; email: string | null },
  provided: { name: string; phone: string; email?: string }
): string | undefined {
  const differs =
    !namesMatch(stored.name, provided.name) ||
    !phonesMatch(stored.phone, provided.phone) ||
    (!!provided.email && !emailsMatch(stored.email, provided.email));
  if (!differs) return undefined;

  const parts = [`nombre "${provided.name}"`, `teléfono "${provided.phone}"`];
  if (provided.email) parts.push(`email "${provided.email}"`);
  return `Datos de contacto proporcionados en la solicitud (el cliente no se modificó): ${parts.join(', ')}.`;
}

export async function findOrCreateCustomer({
  tenantId,
  phone,
  email,
  name
}: {
  tenantId: string;
  phone: string;
  email?: string;
  name: string;
}): Promise<CustomerIdentificationResult> {
  const provided = { name, phone, email };

  // 1️⃣ BÚSQUEDA POR TELÉFONO NORMALIZADO (ALTA CONFIANZA)
  const phoneMatches = await findCustomersByPhone(tenantId, phone);
  const phoneCandidate =
    phoneMatches.find((candidate) => namesMatch(candidate.name, name)) ?? phoneMatches[0];

  const phoneMatch = phoneCandidate
    ? await prisma.customer.findFirst({
        where: { id: phoneCandidate.id, tenantId },
        include: {
          pets: true,
          user: true
        }
      })
    : null;

  if (phoneMatch) {
    return {
      customer: phoneMatch,
      status: 'existing',
      existingPets: phoneMatch.pets,
      hasUserAccount: !!phoneMatch.user,
      confidence: 'high',
      providedContactNote: describeProvidedContact(phoneMatch, provided)
    };
  }

  // 2️⃣ BÚSQUEDA EXACTA POR EMAIL (ALTA CONFIANZA)
  if (email) {
    const emailMatch = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: { equals: email.trim(), mode: 'insensitive' }
      },
      include: {
        pets: true,
        user: true
      }
    });

    if (emailMatch) {
      return {
        customer: emailMatch,
        status: 'existing',
        existingPets: emailMatch.pets,
        hasUserAccount: !!emailMatch.user,
        confidence: 'high',
        providedContactNote: describeProvidedContact(emailMatch, provided)
      };
    }
  }

  // 3️⃣ BÚSQUEDA FUZZY POR NOMBRE (CONFIANZA MEDIA/BAJA)
  const similarCustomers = await findSimilarCustomers(tenantId, name, phone, email);

  // 4️⃣ CREAR NUEVO CLIENTE
  const needsReview = similarCustomers.length > 0;
  
  const newCustomer = await prisma.customer.create({
    data: {
      tenantId,
      name,
      phone,
      email,
      source: 'PUBLIC_BOOKING',
      needsReview
    },
    include: {
      pets: true,
      user: true
    }
  });

  return {
    customer: newCustomer,
    status: needsReview ? 'needs_review' : 'new',
    existingPets: [],
    hasUserAccount: false,
    similarCustomers,
    confidence: needsReview ? 'low' : 'high'
  };
}

async function findSimilarCustomers(
  tenantId: string, 
  name: string, 
  phone: string, 
  email?: string
) {
  const nameWords = name.toLowerCase().split(' ');
  const firstName = nameWords[0];
  const lastName = nameWords[nameWords.length - 1];

  // Buscar por similitud de nombre
  const nameSimilar = await prisma.customer.findMany({
    where: {
      tenantId,
      OR: [
        {
          name: {
            contains: firstName,
            mode: 'insensitive' as const
          }
        },
        ...(lastName !== firstName ? [{
          name: {
            contains: lastName,
            mode: 'insensitive' as const
          }
        }] : [])
      ]
    },
    include: {
      pets: true
    },
    take: 5
  });

  // Filtrar resultados con score de similitud
  return nameSimilar
    .map(customer => ({
      ...customer,
      similarityScore: calculateSimilarityScore(
        { name, phone, email },
        { name: customer.name, phone: customer.phone, email: customer.email }
      )
    }))
    .filter(customer => customer.similarityScore > 0.3)
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

function calculateSimilarityScore(
  input: { name: string; phone: string; email?: string },
  existing: { name: string; phone: string | null; email: string | null }
): number {
  let score = 0;
  
  // Similitud de nombre (peso: 0.6)
  const nameScore = levenshteinSimilarity(
    input.name.toLowerCase(), 
    existing.name.toLowerCase()
  );
  score += nameScore * 0.6;
  
  // Similitud de teléfono (peso: 0.3)
  if (existing.phone) {
    const phoneScore = input.phone === existing.phone ? 1 : 0;
    score += phoneScore * 0.3;
  }
  
  // Similitud de email (peso: 0.1)
  if (input.email && existing.email) {
    const emailScore = input.email.toLowerCase() === existing.email.toLowerCase() ? 1 : 0;
    score += emailScore * 0.1;
  }
  
  return score;
}

function levenshteinSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Encuentra una mascota por fuzzy matching del nombre
 */
function findBestPetMatch(pets: Pet[], petName: string): Pet | null {
  if (!pets || pets.length === 0) return null;

  const normalizedInput = petName.toLowerCase().trim();

  // 1. Búsqueda exacta (case insensitive)
  const exactMatch = pets.find(p => p.name.toLowerCase().trim() === normalizedInput);
  if (exactMatch) return exactMatch;

  // 2. Búsqueda por contenido (el input contiene el nombre o viceversa)
  const containsMatch = pets.find(p => {
    const normalizedPetName = p.name.toLowerCase().trim();
    return normalizedPetName.includes(normalizedInput) || normalizedInput.includes(normalizedPetName);
  });
  if (containsMatch) return containsMatch;

  // 3. Fuzzy match usando Levenshtein
  let bestMatch: Pet | null = null;
  let bestScore = 0;

  for (const pet of pets) {
    const score = levenshteinSimilarity(normalizedInput, pet.name.toLowerCase().trim());
    if (score > bestScore && score >= 0.6) { // Umbral de 60% de similitud
      bestScore = score;
      bestMatch = pet;
    }
  }

  return bestMatch;
}

export interface PetMatchResult {
  petId: string | null;
  matchType: 'exact_id' | 'fuzzy_name' | 'new_pet' | 'none';
  matchedPet?: Pet;
  confidence: 'high' | 'medium' | 'low';
}

export async function createPublicAppointmentRequest({
  tenantId,
  customerId,
  appointmentData,
  identificationResult
}: {
  tenantId: string;
  customerId: string;
  appointmentData: {
    petId?: string;
    petName: string;
    service?: string;
    preferredDate?: string;
    preferredTime?: string;
    notes?: string;
  };
  identificationResult: CustomerIdentificationResult;
}) {
  // 🐾 MATCH DE MASCOTA
  let petMatchResult: PetMatchResult = {
    petId: null,
    matchType: 'none',
    confidence: 'low'
  };

  // 1. Si se proporciona petId, verificar que pertenece al cliente
  if (appointmentData.petId) {
    const existingPet = identificationResult.existingPets?.find(p => p.id === appointmentData.petId);
    if (existingPet) {
      petMatchResult = {
        petId: existingPet.id,
        matchType: 'exact_id',
        matchedPet: existingPet,
        confidence: 'high'
      };
    }
  }

  // 2. Si no hay petId pero el cliente tiene mascotas, intentar fuzzy match
  if (!petMatchResult.petId && identificationResult.existingPets && identificationResult.existingPets.length > 0) {
    const matchedPet = findBestPetMatch(identificationResult.existingPets, appointmentData.petName);
    if (matchedPet) {
      petMatchResult = {
        petId: matchedPet.id,
        matchType: 'fuzzy_name',
        matchedPet,
        confidence: 'medium'
      };
    } else {
      // Nueva mascota para cliente existente
      petMatchResult = {
        petId: null,
        matchType: 'new_pet',
        confidence: 'medium'
      };
    }
  }

  // 3. Para clientes nuevos, no hay match posible
  if (identificationResult.status === 'new') {
    petMatchResult = {
      petId: null,
      matchType: 'new_pet',
      confidence: 'high'
    };
  }

  // Generar notas de revisión
  let reviewNotes = identificationResult.status === 'needs_review'
    ? `Similitud encontrada con ${identificationResult.similarCustomers?.length} clientes existentes. `
    : '';

  if (identificationResult.providedContactNote) {
    reviewNotes += `${identificationResult.providedContactNote} `;
  }

  if (petMatchResult.matchType === 'fuzzy_name' && petMatchResult.matchedPet) {
    reviewNotes += `Mascota "${appointmentData.petName}" vinculada automáticamente con "${petMatchResult.matchedPet.name}" (match fuzzy).`;
  } else if (petMatchResult.matchType === 'new_pet' && identificationResult.status === 'existing') {
    reviewNotes += `Nueva mascota "${appointmentData.petName}" para cliente existente.`;
  }

  return await prisma.appointmentRequest.create({
    data: {
      tenantId,
      customerId,
      petId: petMatchResult.petId,
      petName: appointmentData.petName,
      service: appointmentData.service,
      preferredDate: appointmentData.preferredDate ? new Date(appointmentData.preferredDate) : null,
      preferredTime: appointmentData.preferredTime,
      notes: appointmentData.notes,
      status: 'PENDING',
      source: 'PUBLIC_BOOKING',
      identificationStatus: identificationResult.status,
      similarCustomerIds: identificationResult.similarCustomers?.map(c => c.id) || [],
      reviewNotes: reviewNotes.trim() || null
    },
    include: {
      customer: {
        include: {
          pets: true,
          user: true
        }
      },
      pet: true
    }
  });
} 