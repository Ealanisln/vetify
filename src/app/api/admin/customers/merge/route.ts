import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';

const mergeRequestSchema = z.object({
  primaryId: z.string().uuid(),
  duplicateId: z.string().uuid(),
  mergeData: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = mergeRequestSchema.parse(body);
    const { primaryId, duplicateId, mergeData } = validatedData;

    if (primaryId === duplicateId) {
      return NextResponse.json(
        { error: 'Cannot merge customer with itself' },
        { status: 400 }
      );
    }

    // Fusionar clientes en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener ambos clientes y verificar pertenencia al tenant
      const [primaryCustomer, duplicateCustomer] = await Promise.all([
        tx.customer.findUnique({ 
          where: { id: primaryId }, 
          include: { 
            pets: true,
            appointments: { orderBy: { dateTime: 'desc' }, take: 5 },
            appointmentRequests: { orderBy: { createdAt: 'desc' }, take: 5 }
          } 
        }),
        tx.customer.findUnique({ 
          where: { id: duplicateId }, 
          include: { 
            pets: true,
            appointments: { orderBy: { dateTime: 'desc' }, take: 5 },
            appointmentRequests: { orderBy: { createdAt: 'desc' }, take: 5 }
          } 
        })
      ]);

      if (!primaryCustomer || !duplicateCustomer) {
        throw new Error('Customer not found');
      }

      // Verificar que ambos clientes pertenecen al tenant del usuario
      if (primaryCustomer.tenantId !== user.tenantId || duplicateCustomer.tenantId !== user.tenantId) {
        throw new Error('Unauthorized access to customer data');
      }

      // 2. Preparar datos consolidados
      const consolidatedData = {
        name: mergeData?.name || primaryCustomer.name || duplicateCustomer.name,
        phone: mergeData?.phone || primaryCustomer.phone || duplicateCustomer.phone,
        email: mergeData?.email || primaryCustomer.email || duplicateCustomer.email,
        address: mergeData?.address || primaryCustomer.address || duplicateCustomer.address,
        mergedFrom: [
          ...(primaryCustomer.mergedFrom || []),
          duplicateId,
          ...(duplicateCustomer.mergedFrom || [])
        ],
        needsReview: false,
        reviewedAt: new Date(),
        reviewedBy: user.id,
        // Mantener el source más confiable
        source: primaryCustomer.source === 'MANUAL' ? 'MANUAL' : duplicateCustomer.source
      };

      // 3. Transferir todas las relaciones del cliente duplicado al principal
      await Promise.all([
        // Transferir mascotas (verificar duplicados por nombre)
        tx.pet.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        }),
        
        // Transferir citas
        tx.appointment.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        }),
        
        // Transferir solicitudes de citas
        tx.appointmentRequest.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        }),

        // Transferir transacciones de venta si existen
        tx.sale.updateMany({
          where: { customerId: duplicateId },
          data: { customerId: primaryId }
        }).catch(() => {
          // Ignore if sale table doesn't exist
        })
      ]);

      // 4. Actualizar el cliente principal con los datos consolidados
      const updatedPrimaryCustomer = await tx.customer.update({
        where: { id: primaryId },
        data: consolidatedData,
        include: { 
          pets: true,
          appointments: { 
            orderBy: { dateTime: 'desc' }, 
            take: 10,
            include: { 
              pet: { select: { name: true, species: true } }
            }
          },
          appointmentRequests: { 
            orderBy: { createdAt: 'desc' }, 
            take: 5 
          }
        }
      });

      // 5. Eliminar cliente duplicado
      await tx.customer.delete({
        where: { id: duplicateId }
      });

      // Log de auditoría (implementar cuando sea necesario)
      console.log(`Customer merge completed: ${duplicateCustomer.name} merged into ${primaryCustomer.name}`);

      return {
        mergedCustomer: updatedPrimaryCustomer,
        transferredData: {
          pets: duplicateCustomer.pets.length,
          appointments: duplicateCustomer.appointments.length,
          appointmentRequests: duplicateCustomer.appointmentRequests.length
        },
        duplicateCustomerName: duplicateCustomer.name
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Customers merged successfully',
      data: result
    });

  } catch (error) {
    console.error('Error merging customers:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// API para obtener preview de merge (sin ejecutar)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const primaryId = searchParams.get('primaryId');
    const duplicateId = searchParams.get('duplicateId');

    if (!primaryId || !duplicateId) {
      return NextResponse.json(
        { error: 'Primary ID and Duplicate ID required' },
        { status: 400 }
      );
    }

    // Obtener ambos clientes para preview
    const [primaryCustomer, duplicateCustomer] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: primaryId },
        include: {
          pets: true,
          appointments: { orderBy: { dateTime: 'desc' }, take: 5 },
          appointmentRequests: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      }),
      prisma.customer.findUnique({
        where: { id: duplicateId },
        include: {
          pets: true,
          appointments: { orderBy: { dateTime: 'desc' }, take: 5 },
          appointmentRequests: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      })
    ]);

    if (!primaryCustomer || !duplicateCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verificar pertenencia al tenant
    if (primaryCustomer.tenantId !== user.tenantId || duplicateCustomer.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calcular preview de datos consolidados
    const previewData = {
      name: primaryCustomer.name || duplicateCustomer.name,
      phone: primaryCustomer.phone || duplicateCustomer.phone,
      email: primaryCustomer.email || duplicateCustomer.email,
      address: primaryCustomer.address || duplicateCustomer.address,
      totalPets: primaryCustomer.pets.length + duplicateCustomer.pets.length,
      totalAppointments: primaryCustomer.appointments.length + duplicateCustomer.appointments.length,
      totalAppointmentRequests: primaryCustomer.appointmentRequests.length + duplicateCustomer.appointmentRequests.length
    };

    return NextResponse.json({
      primaryCustomer,
      duplicateCustomer,
      previewData
    });

  } catch (error) {
    console.error('Error getting merge preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 