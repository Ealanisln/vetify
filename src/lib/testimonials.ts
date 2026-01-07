import { prisma } from './prisma';
import { z } from 'zod';
import { TestimonialStatus } from '@prisma/client';

// Validation schemas
export const createTestimonialSchema = z.object({
  customerId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  reviewerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  reviewerEmail: z.string().email('Email inválido').optional().nullable(),
  rating: z.number().min(1, 'La calificación mínima es 1').max(5, 'La calificación máxima es 5'),
  text: z.string().min(10, 'El testimonio debe tener al menos 10 caracteres'),
  status: z.nativeEnum(TestimonialStatus).optional().default('PENDING'),
  isFeatured: z.boolean().optional().default(false),
  source: z.enum(['MANUAL', 'POST_APPOINTMENT', 'PUBLIC_FORM']).optional().default('MANUAL'),
});

export const updateTestimonialSchema = z.object({
  reviewerName: z.string().min(2).optional(),
  reviewerEmail: z.string().email().optional().nullable(),
  rating: z.number().min(1).max(5).optional(),
  text: z.string().min(10).optional(),
  status: z.nativeEnum(TestimonialStatus).optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional().nullable(),
  moderationNote: z.string().optional().nullable(),
});

export const moderateTestimonialSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional(),
  setFeatured: z.boolean().optional(),
});

export const testimonialFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TestimonialStatus).optional(),
  rating: z.number().min(1).max(5).optional(),
  isFeatured: z.boolean().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

// Public form schema (simpler, no auth)
export const publicTestimonialSchema = z.object({
  reviewerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  reviewerEmail: z.string().email('Email inválido').optional(),
  rating: z.number().min(1, 'Selecciona una calificación').max(5),
  text: z.string().min(10, 'El testimonio debe tener al menos 10 caracteres').max(1000, 'El testimonio no puede exceder 1000 caracteres'),
  // Honeypot field for spam prevention
  website: z.string().max(0, 'Bot detected').optional(),
});

export type CreateTestimonialData = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialData = z.infer<typeof updateTestimonialSchema>;
export type ModerateTestimonialData = z.infer<typeof moderateTestimonialSchema>;
export type TestimonialFilters = z.infer<typeof testimonialFiltersSchema>;
export type PublicTestimonialData = z.infer<typeof publicTestimonialSchema>;

// Type for where clause
type TestimonialWhereInput = {
  tenantId: string;
  OR?: Array<{
    reviewerName?: { contains: string; mode: 'insensitive' };
    reviewerEmail?: { contains: string; mode: 'insensitive' };
    text?: { contains: string; mode: 'insensitive' };
  }>;
  status?: TestimonialStatus;
  rating?: number;
  isFeatured?: boolean;
};

// Service functions
export async function createTestimonial(tenantId: string, data: CreateTestimonialData) {
  const testimonial = await prisma.testimonial.create({
    data: {
      ...data,
      tenantId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      appointment: {
        select: {
          id: true,
          dateTime: true,
          reason: true,
        },
      },
    },
  });

  return testimonial;
}

export async function getTestimonialsByTenant(
  tenantId: string,
  filters: Partial<TestimonialFilters> = {}
) {
  const { search, status, rating, isFeatured, page, limit } =
    testimonialFiltersSchema.parse(filters);

  const where: TestimonialWhereInput = {
    tenantId,
  };

  if (search) {
    where.OR = [
      { reviewerName: { contains: search, mode: 'insensitive' } },
      { reviewerEmail: { contains: search, mode: 'insensitive' } },
      { text: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (rating) {
    where.rating = rating;
  }

  if (isFeatured !== undefined) {
    where.isFeatured = isFeatured;
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            dateTime: true,
            reason: true,
          },
        },
        moderatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ submittedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return {
    testimonials,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTestimonialById(tenantId: string, testimonialId: string) {
  const testimonial = await prisma.testimonial.findFirst({
    where: {
      id: testimonialId,
      tenantId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      appointment: {
        select: {
          id: true,
          dateTime: true,
          reason: true,
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
            },
          },
        },
      },
      moderatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!testimonial) {
    throw new Error('Testimonio no encontrado');
  }

  return testimonial;
}

export async function updateTestimonial(
  tenantId: string,
  testimonialId: string,
  data: UpdateTestimonialData
) {
  const existing = await prisma.testimonial.findFirst({
    where: {
      id: testimonialId,
      tenantId,
    },
  });

  if (!existing) {
    throw new Error('Testimonio no encontrado');
  }

  const updatedTestimonial = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedTestimonial;
}

export async function moderateTestimonial(
  tenantId: string,
  testimonialId: string,
  staffId: string,
  data: ModerateTestimonialData
) {
  const existing = await prisma.testimonial.findFirst({
    where: {
      id: testimonialId,
      tenantId,
    },
  });

  if (!existing) {
    throw new Error('Testimonio no encontrado');
  }

  const newStatus = data.action === 'approve' ? 'APPROVED' : 'REJECTED';

  const updatedTestimonial = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: {
      status: newStatus,
      moderatedAt: new Date(),
      moderatedById: staffId,
      moderationNote: data.note,
      isFeatured: data.setFeatured ?? existing.isFeatured,
      updatedAt: new Date(),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      moderatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return updatedTestimonial;
}

export async function deleteTestimonial(tenantId: string, testimonialId: string) {
  const existing = await prisma.testimonial.findFirst({
    where: {
      id: testimonialId,
      tenantId,
    },
  });

  if (!existing) {
    throw new Error('Testimonio no encontrado');
  }

  await prisma.testimonial.delete({
    where: { id: testimonialId },
  });

  return { success: true };
}

export async function getTestimonialStats(tenantId: string) {
  const [counts, avgRating] = await Promise.all([
    prisma.testimonial.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.testimonial.aggregate({
      where: { tenantId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  const statusCounts = counts.reduce(
    (acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, archived: 0 } as Record<string, number>
  );

  return {
    ...statusCounts,
    total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    averageRating: avgRating._avg.rating ?? 0,
    approvedCount: avgRating._count.id,
  };
}

// Public functions (for landing page)
export async function getApprovedTestimonials(
  tenantId: string,
  options?: { featuredOnly?: boolean; limit?: number }
) {
  const { featuredOnly = false, limit = 10 } = options ?? {};

  const testimonials = await prisma.testimonial.findMany({
    where: {
      tenantId,
      status: 'APPROVED',
      ...(featuredOnly && { isFeatured: true }),
    },
    select: {
      id: true,
      reviewerName: true,
      rating: true,
      text: true,
      submittedAt: true,
      isFeatured: true,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { displayOrder: 'asc' },
      { submittedAt: 'desc' },
    ],
    take: limit,
  });

  return testimonials;
}

export async function getPublicTestimonialStats(tenantId: string) {
  const stats = await prisma.testimonial.aggregate({
    where: { tenantId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { id: true },
  });

  // Get rating distribution
  const distribution = await prisma.testimonial.groupBy({
    by: ['rating'],
    where: { tenantId, status: 'APPROVED' },
    _count: { id: true },
  });

  const ratingDistribution = distribution.reduce(
    (acc, item) => {
      acc[item.rating] = item._count.id;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
  );

  return {
    averageRating: stats._avg.rating ?? 0,
    totalCount: stats._count.id,
    distribution: ratingDistribution,
  };
}

// Submit testimonial from public form
export async function submitPublicTestimonial(
  tenantId: string,
  data: PublicTestimonialData
) {
  // Remove honeypot field (extracted but not used - intentional for spam prevention)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { website: _honeypot, ...testimonialData } = data;

  const testimonial = await prisma.testimonial.create({
    data: {
      ...testimonialData,
      tenantId,
      source: 'PUBLIC_FORM',
      status: 'PENDING',
    },
    select: {
      id: true,
    },
  });

  return testimonial;
}

// Check if tenant has any approved testimonials
export async function hasApprovedTestimonials(tenantId: string): Promise<boolean> {
  const count = await prisma.testimonial.count({
    where: {
      tenantId,
      status: 'APPROVED',
    },
  });

  return count > 0;
}
