import { prisma } from '@/lib/prisma';
import { Customer as PrismaCustomer, User as PrismaUser } from '@prisma/client';

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
  
  // 1️⃣ BÚSQUEDA EXACTA POR TELÉFONO (ALTA CONFIANZA)
  const phoneMatch = await prisma.customer.findFirst({
    where: {
      tenantId,
      phone: phone
    },
    include: {
      pets: true,
      user: true,
      appointmentRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (phoneMatch) {
    // Actualizar email si no tenía y ahora proporcionó uno
    if (email && !phoneMatch.email) {
      await prisma.customer.update({
        where: { id: phoneMatch.id },
        data: { email }
      });
      phoneMatch.email = email;
    }

    return {
      customer: phoneMatch,
      status: 'existing',
      existingPets: phoneMatch.pets,
      hasUserAccount: !!phoneMatch.user,
      confidence: 'high'
    };
  }

  // 2️⃣ BÚSQUEDA EXACTA POR EMAIL (ALTA CONFIANZA)
  let emailMatch = null;
  if (email) {
    emailMatch = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: email
      },
      include: {
        pets: true,
        user: true
      }
    });

    if (emailMatch) {
      // Actualizar teléfono si no tenía
      if (!emailMatch.phone) {
        await prisma.customer.update({
          where: { id: emailMatch.id },
          data: { phone }
        });
        emailMatch.phone = phone;
      }

      return {
        customer: emailMatch,
        status: 'existing',
        existingPets: emailMatch.pets,
        hasUserAccount: !!emailMatch.user,
        confidence: 'high'
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

export async function createPublicAppointmentRequest({
  tenantId,
  customerId,
  appointmentData,
  identificationResult
}: {
  tenantId: string;
  customerId: string;
  appointmentData: {
    petName: string;
    service?: string;
    preferredDate?: string;
    preferredTime?: string;
    notes?: string;
  };
  identificationResult: CustomerIdentificationResult;
}) {
  return await prisma.appointmentRequest.create({
    data: {
      tenantId,
      customerId,
      petName: appointmentData.petName,
      service: appointmentData.service,
      preferredDate: appointmentData.preferredDate ? new Date(appointmentData.preferredDate) : null,
      preferredTime: appointmentData.preferredTime,
      notes: appointmentData.notes,
      status: 'PENDING',
      source: 'PUBLIC_BOOKING',
      identificationStatus: identificationResult.status,
      similarCustomerIds: identificationResult.similarCustomers?.map(c => c.id) || [],
      reviewNotes: identificationResult.status === 'needs_review' 
        ? `Similitud encontrada con ${identificationResult.similarCustomers?.length} clientes existentes`
        : null
    },
    include: {
      customer: {
        include: {
          pets: true,
          user: true
        }
      }
    }
  });
} 