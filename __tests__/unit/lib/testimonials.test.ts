import { prismaMock } from '../../mocks/prisma';
import {
  createTestTestimonial,
  createTestTenant,
  createTestStaff,
} from '../../utils/test-utils';

// Mock Prisma enums
jest.mock('@prisma/client', () => ({
  TestimonialStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    ARCHIVED: 'ARCHIVED',
  },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      constructor(message: string, { code }: { code: string }) {
        super(message);
        this.code = code;
      }
    },
  },
}));

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

// Import after mocking
import {
  createTestimonialSchema,
  // updateTestimonialSchema - tested via updateTestimonial function
  moderateTestimonialSchema,
  publicTestimonialSchema,
  createTestimonial,
  getTestimonialsByTenant,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  moderateTestimonial,
  getTestimonialStats,
  getApprovedTestimonials,
  getPublicTestimonialStats,
  submitPublicTestimonial,
  hasApprovedTestimonials,
} from '@/lib/testimonials';

describe('Testimonials Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    describe('createTestimonialSchema', () => {
      it('should validate valid testimonial data', () => {
        const validData = {
          reviewerName: 'Juan Perez',
          reviewerEmail: 'juan@example.com',
          rating: 5,
          text: 'Excelente servicio veterinario',
        };

        const result = createTestimonialSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty reviewer name', () => {
        const invalidData = {
          reviewerName: '',
          rating: 5,
          text: 'Good service',
        };

        const result = createTestimonialSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject rating outside 1-5 range', () => {
        const invalidData = {
          reviewerName: 'Test User',
          rating: 6,
          text: 'Good service',
        };

        const result = createTestimonialSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject text shorter than 10 characters', () => {
        const invalidData = {
          reviewerName: 'Test User',
          rating: 5,
          text: 'Short',
        };

        const result = createTestimonialSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept optional email', () => {
        const validData = {
          reviewerName: 'Test User',
          rating: 4,
          text: 'This is a valid testimonial text',
        };

        const result = createTestimonialSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('publicTestimonialSchema', () => {
      it('should accept honeypot field (website)', () => {
        const validData = {
          reviewerName: 'Test User',
          rating: 5,
          text: 'Great veterinary service!',
          website: '', // honeypot should be empty
        };

        const result = publicTestimonialSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject if honeypot is filled', () => {
        const spamData = {
          reviewerName: 'Spammer',
          rating: 5,
          text: 'Buy products at spam.com',
          website: 'http://spam.com', // filled honeypot = bot
        };

        const result = publicTestimonialSchema.safeParse(spamData);
        expect(result.success).toBe(false);
      });
    });

    describe('moderateTestimonialSchema', () => {
      it('should validate moderation action', () => {
        const validData = {
          action: 'approve',
          setFeatured: true,
          note: 'Good review',
        };

        const result = moderateTestimonialSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept approve and reject actions', () => {
        const actions = ['approve', 'reject'];

        actions.forEach((action) => {
          const result = moderateTestimonialSchema.safeParse({ action });
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('CRUD Operations', () => {
    const mockTenant = createTestTenant();
    const mockTestimonial = createTestTestimonial({ tenantId: mockTenant.id });

    describe('createTestimonial', () => {
      it('should create a new testimonial', async () => {
        prismaMock.testimonial.create.mockResolvedValue(mockTestimonial);

        const result = await createTestimonial(mockTenant.id, {
          reviewerName: 'Maria Garcia',
          rating: 5,
          text: 'Excelente servicio, muy profesionales.',
        });

        expect(prismaMock.testimonial.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              tenantId: mockTenant.id,
              reviewerName: 'Maria Garcia',
              rating: 5,
            }),
          })
        );
        expect(result).toEqual(mockTestimonial);
      });
    });

    describe('getTestimonialsByTenant', () => {
      it('should return paginated testimonials', async () => {
        const testimonials = [
          mockTestimonial,
          createTestTestimonial({ id: 'testimonial-2' }),
        ];

        prismaMock.testimonial.findMany.mockResolvedValue(testimonials);
        prismaMock.testimonial.count.mockResolvedValue(2);

        const result = await getTestimonialsByTenant(mockTenant.id, {
          page: 1,
          limit: 10,
        });

        expect(result.testimonials).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
      });

      it('should filter by status', async () => {
        prismaMock.testimonial.findMany.mockResolvedValue([mockTestimonial]);
        prismaMock.testimonial.count.mockResolvedValue(1);

        await getTestimonialsByTenant(mockTenant.id, {
          status: 'PENDING',
        });

        expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'PENDING',
            }),
          })
        );
      });

      it('should filter by rating', async () => {
        prismaMock.testimonial.findMany.mockResolvedValue([mockTestimonial]);
        prismaMock.testimonial.count.mockResolvedValue(1);

        await getTestimonialsByTenant(mockTenant.id, {
          rating: 5,
        });

        expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              rating: 5,
            }),
          })
        );
      });

      it('should search by text', async () => {
        prismaMock.testimonial.findMany.mockResolvedValue([mockTestimonial]);
        prismaMock.testimonial.count.mockResolvedValue(1);

        await getTestimonialsByTenant(mockTenant.id, {
          search: 'excelente',
        });

        expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.any(Array),
            }),
          })
        );
      });
    });

    describe('getTestimonialById', () => {
      it('should return testimonial with relations', async () => {
        const testimonialWithRelations = {
          ...mockTestimonial,
          customer: null,
          appointment: null,
          moderatedBy: null,
        };

        prismaMock.testimonial.findFirst.mockResolvedValue(testimonialWithRelations);

        const result = await getTestimonialById(mockTenant.id, mockTestimonial.id);

        expect(result).toEqual(testimonialWithRelations);
        expect(prismaMock.testimonial.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: mockTestimonial.id,
              tenantId: mockTenant.id,
            },
          })
        );
      });

      it('should throw error if not found', async () => {
        prismaMock.testimonial.findFirst.mockResolvedValue(null);

        await expect(
          getTestimonialById(mockTenant.id, 'nonexistent')
        ).rejects.toThrow('Testimonio no encontrado');
      });
    });

    describe('updateTestimonial', () => {
      it('should update testimonial fields', async () => {
        const updatedTestimonial = {
          ...mockTestimonial,
          rating: 4,
          text: 'Updated review text here',
        };

        // Mock existence check
        prismaMock.testimonial.findFirst.mockResolvedValue(mockTestimonial);
        prismaMock.testimonial.update.mockResolvedValue(updatedTestimonial);

        const result = await updateTestimonial(
          mockTenant.id,
          mockTestimonial.id,
          {
            rating: 4,
            text: 'Updated review text here',
          }
        );

        expect(result.rating).toBe(4);
        expect(prismaMock.testimonial.update).toHaveBeenCalled();
      });

      it('should throw error if testimonial not found', async () => {
        prismaMock.testimonial.findFirst.mockResolvedValue(null);

        await expect(
          updateTestimonial(mockTenant.id, 'nonexistent', { rating: 4 })
        ).rejects.toThrow('Testimonio no encontrado');
      });
    });

    describe('deleteTestimonial', () => {
      it('should delete testimonial', async () => {
        // Mock the existence check
        prismaMock.testimonial.findFirst.mockResolvedValue(mockTestimonial);
        prismaMock.testimonial.delete.mockResolvedValue(mockTestimonial);

        const result = await deleteTestimonial(mockTenant.id, mockTestimonial.id);

        // Function returns { success: true }, not the deleted record
        expect(result).toEqual({ success: true });
        expect(prismaMock.testimonial.delete).toHaveBeenCalledWith({
          where: { id: mockTestimonial.id },
        });
      });

      it('should throw error if testimonial not found', async () => {
        prismaMock.testimonial.findFirst.mockResolvedValue(null);

        await expect(
          deleteTestimonial(mockTenant.id, 'nonexistent')
        ).rejects.toThrow('Testimonio no encontrado');
      });
    });
  });

  describe('Moderation', () => {
    const mockTenant = createTestTenant();
    const mockStaff = createTestStaff({ tenantId: mockTenant.id });
    const mockTestimonial = createTestTestimonial({ tenantId: mockTenant.id });

    describe('moderateTestimonial', () => {
      beforeEach(() => {
        // Mock existence check for all moderation tests
        prismaMock.testimonial.findFirst.mockResolvedValue(mockTestimonial);
      });

      it('should approve testimonial', async () => {
        const approvedTestimonial = {
          ...mockTestimonial,
          status: 'APPROVED',
          moderatedAt: new Date(),
          moderatedById: mockStaff.id,
        };

        prismaMock.testimonial.update.mockResolvedValue(approvedTestimonial);

        // Use action: 'approve' instead of status: 'APPROVED'
        const result = await moderateTestimonial(
          mockTenant.id,
          mockTestimonial.id,
          mockStaff.id,
          { action: 'approve' }
        );

        expect(result.status).toBe('APPROVED');
        expect(prismaMock.testimonial.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'APPROVED',
              moderatedById: mockStaff.id,
            }),
          })
        );
      });

      it('should reject testimonial with note', async () => {
        const rejectedTestimonial = {
          ...mockTestimonial,
          status: 'REJECTED',
          moderationNote: 'Inappropriate content',
        };

        prismaMock.testimonial.update.mockResolvedValue(rejectedTestimonial);

        // Use action: 'reject' and note instead of status and moderationNote
        const result = await moderateTestimonial(
          mockTenant.id,
          mockTestimonial.id,
          mockStaff.id,
          {
            action: 'reject',
            note: 'Inappropriate content',
          }
        );

        expect(result.status).toBe('REJECTED');
      });

      it('should mark as featured', async () => {
        const featuredTestimonial = {
          ...mockTestimonial,
          status: 'APPROVED',
          isFeatured: true,
        };

        prismaMock.testimonial.update.mockResolvedValue(featuredTestimonial);

        // Use action: 'approve' and setFeatured instead of status and isFeatured
        const result = await moderateTestimonial(
          mockTenant.id,
          mockTestimonial.id,
          mockStaff.id,
          {
            action: 'approve',
            setFeatured: true,
          }
        );

        expect(result.isFeatured).toBe(true);
      });

      it('should throw error if testimonial not found', async () => {
        prismaMock.testimonial.findFirst.mockResolvedValue(null);

        await expect(
          moderateTestimonial(mockTenant.id, 'nonexistent', mockStaff.id, { status: 'APPROVED' })
        ).rejects.toThrow('Testimonio no encontrado');
      });
    });
  });

  describe('Statistics', () => {
    const mockTenant = createTestTenant();

    describe('getTestimonialStats', () => {
      it('should return stats by status', async () => {
        prismaMock.testimonial.groupBy.mockResolvedValue([
          { status: 'PENDING', _count: { id: 5 } },
          { status: 'APPROVED', _count: { id: 10 } },
          { status: 'REJECTED', _count: { id: 2 } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any);

        prismaMock.testimonial.aggregate.mockResolvedValue({
          _avg: { rating: 4.5 },
          _count: { id: 17 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const stats = await getTestimonialStats(mockTenant.id);

        expect(stats.pending).toBe(5);
        expect(stats.approved).toBe(10);
        expect(stats.rejected).toBe(2);
        expect(stats.total).toBe(17);
      });
    });

    describe('getPublicTestimonialStats', () => {
      it('should return average rating and count', async () => {
        prismaMock.testimonial.aggregate.mockResolvedValue({
          _avg: { rating: 4.5 },
          _count: { id: 20 },
        });

        prismaMock.testimonial.groupBy.mockResolvedValue([
          { rating: 5, _count: { id: 15 } },
          { rating: 4, _count: { id: 5 } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any);

        const stats = await getPublicTestimonialStats(mockTenant.id);

        expect(stats.averageRating).toBe(4.5);
        expect(stats.totalCount).toBe(20);
        expect(stats.distribution).toBeDefined();
      });

      it('should return zero for tenants with no testimonials', async () => {
        prismaMock.testimonial.aggregate.mockResolvedValue({
          _avg: { rating: null },
          _count: { id: 0 },
        });

        prismaMock.testimonial.groupBy.mockResolvedValue([]);

        const stats = await getPublicTestimonialStats(mockTenant.id);

        expect(stats.averageRating).toBe(0);
        expect(stats.totalCount).toBe(0);
      });
    });
  });

  describe('Public Functions', () => {
    const mockTenant = createTestTenant();

    describe('getApprovedTestimonials', () => {
      it('should return only approved testimonials', async () => {
        const approvedTestimonials = [
          createTestTestimonial({ status: 'APPROVED', isFeatured: true }),
          createTestTestimonial({ id: 'testimonial-2', status: 'APPROVED' }),
        ];

        prismaMock.testimonial.findMany.mockResolvedValue(approvedTestimonials);

        const result = await getApprovedTestimonials(mockTenant.id);

        expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'APPROVED',
            }),
          })
        );
        expect(result).toHaveLength(2);
      });

      it('should filter featured only when requested', async () => {
        prismaMock.testimonial.findMany.mockResolvedValue([]);

        await getApprovedTestimonials(mockTenant.id, { featuredOnly: true });

        expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isFeatured: true,
            }),
          })
        );
      });

      it('should respect limit parameter', async () => {
        prismaMock.testimonial.findMany.mockResolvedValue([]);

        await getApprovedTestimonials(mockTenant.id, { limit: 5 });

        expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 5,
          })
        );
      });
    });

    describe('submitPublicTestimonial', () => {
      it('should create testimonial with PENDING status', async () => {
        const newTestimonial = createTestTestimonial({
          status: 'PENDING',
          source: 'PUBLIC_FORM',
        });

        prismaMock.testimonial.create.mockResolvedValue(newTestimonial);

        const result = await submitPublicTestimonial(mockTenant.id, {
          reviewerName: 'New Reviewer',
          rating: 5,
          text: 'This is a great veterinary clinic!',
          website: '', // honeypot empty
        });

        expect(prismaMock.testimonial.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'PENDING',
              source: 'PUBLIC_FORM',
            }),
          })
        );
        expect(result.id).toBeDefined();
      });
    });

    describe('hasApprovedTestimonials', () => {
      it('should return true if tenant has approved testimonials', async () => {
        prismaMock.testimonial.count.mockResolvedValue(5);

        const result = await hasApprovedTestimonials(mockTenant.id);

        expect(result).toBe(true);
        expect(prismaMock.testimonial.count).toHaveBeenCalledWith({
          where: {
            tenantId: mockTenant.id,
            status: 'APPROVED',
          },
        });
      });

      it('should return false if tenant has no approved testimonials', async () => {
        prismaMock.testimonial.count.mockResolvedValue(0);

        const result = await hasApprovedTestimonials(mockTenant.id);

        expect(result).toBe(false);
      });
    });
  });
});
