import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';

const resolveDuplicateSchema = z.object({
  customerId: z.string().uuid(),
  action: z.enum(['not_duplicate', 'keep_for_review']),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = resolveDuplicateSchema.parse(body);
    const { customerId, action, notes } = validatedData;

    // Verificar que el cliente pertenece al tenant del usuario
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointmentRequests: {
          where: { identificationStatus: 'needs_review' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Actualizar el cliente y sus solicitudes de cita
    await prisma.$transaction(async (tx) => {
      // Actualizar el cliente
      await tx.customer.update({
        where: { id: customerId },
        data: {
          needsReview: action === 'keep_for_review',
          reviewedAt: new Date(),
          reviewedBy: user.id,
          // Agregar notas si se proporcionan
          ...(notes && { 
            address: customer.address ? `${customer.address}\n\nNotas de revisión: ${notes}` : `Notas de revisión: ${notes}`
          })
        }
      });

      // Actualizar las solicitudes de cita relacionadas
      if (customer.appointmentRequests.length > 0) {
        await tx.appointmentRequest.updateMany({
          where: {
            customerId: customerId,
            identificationStatus: 'needs_review'
          },
          data: {
            identificationStatus: action === 'not_duplicate' ? 'existing' : 'needs_review',
            reviewNotes: notes || (action === 'not_duplicate' ? 'Marcado como no duplicado por staff' : 'Mantenido para revisión')
          }
        });
      }
    });

    // Obtener el cliente actualizado
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        pets: true,
        appointmentRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: action === 'not_duplicate' 
        ? 'Customer marked as not duplicate' 
        : 'Customer kept for further review',
      data: {
        customer: updatedCustomer,
        action
      }
    });

  } catch (error) {
    console.error('Error resolving duplicate:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 