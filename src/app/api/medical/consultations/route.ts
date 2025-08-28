import { NextRequest } from 'next/server';
import { createConsultation } from '@/lib/medical';
import { createSensitiveDataHandler } from '@/lib/security/api-middleware';
import { medicalSchemas } from '@/lib/security/validation-schemas';
import { createSecureResponse } from '@/lib/security/input-sanitization';
import { prisma } from '@/lib/prisma';

export const POST = createSensitiveDataHandler(
  async (req: NextRequest, { tenant, body, userId, tenantId }) => {
    if (!body) {
      throw new Error('Request body is required');
    }

    const { petId, ...consultationData } = body;
    
    if (typeof petId !== 'string') {
      throw new Error('Invalid petId provided');
    }

    // Verify that the pet exists and belongs to the tenant
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        customer: {
          tenantId: tenantId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
      },
    });

    if (!pet) {
      return createSecureResponse(
        { success: false, error: 'Pet not found or access denied' },
        404
      );
    }

    // Verify staff member exists and belongs to tenant
    if (consultationData.staffId) {
      const staff = await prisma.staff.findFirst({
        where: {
          id: consultationData.staffId,
          tenantId: tenantId,
          isActive: true,
        },
      });

      if (!staff) {
        return createSecureResponse(
          { success: false, error: 'Staff member not found or inactive' },
          404
        );
      }
    }

    // Create the consultation with enhanced data validation
    const consultation = await createConsultation(petId, tenantId, consultationData as {
      reason: string;
      diagnosis: string;
      symptoms: string[];
      treatment_plan: string;
      veterinarian_id: string;
      notes?: string;
      next_appointment?: Date;
    });

    return createSecureResponse(
      {
        success: true,
        data: consultation,
        message: 'Medical consultation created successfully',
      },
      201
    );
  },
  {
    bodySchema: medicalSchemas.consultation,
    resourceType: 'medical_consultation',
  }
); 