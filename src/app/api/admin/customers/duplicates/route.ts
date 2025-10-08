import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Verificar que el usuario pertenece al tenant
    if (user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener clientes que necesitan revisión
    const customersNeedingReview = await prisma.customer.findMany({
      where: {
        tenantId,
        needsReview: true,
        reviewedAt: null
      },
      include: {
        pets: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        },
        appointmentRequests: {
          where: { identificationStatus: 'needs_review' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            petName: true,
            service: true,
            preferredDate: true,
            notes: true,
            similarCustomerIds: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Para cada cliente, obtener los similares
    const reviewData = await Promise.all(
      customersNeedingReview.map(async (customer) => {
        const appointmentRequest = customer.appointmentRequests[0];
        const similarCustomerIds = appointmentRequest?.similarCustomerIds || [];
        
        const similarCustomers = await prisma.customer.findMany({
          where: {
            id: { in: similarCustomerIds },
            tenantId // Asegurar que solo obtenemos clientes del mismo tenant
          },
          include: {
            pets: {
              select: {
                id: true,
                name: true,
                species: true,
                breed: true
              }
            },
            appointmentRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                petName: true,
                service: true,
                createdAt: true
              }
            },
            appointments: {
              orderBy: { dateTime: 'desc' },
              take: 1,
              select: {
                id: true,
                dateTime: true,
                status: true
              }
            }
          }
        });

        return {
          ...customer,
          similarCustomers,
          latestRequest: appointmentRequest,
          totalSimilar: similarCustomers.length
        };
      })
    );

    // Estadísticas
    const stats = {
      totalNeedingReview: reviewData.length,
      totalSimilarCustomers: reviewData.reduce((sum, item) => sum + item.totalSimilar, 0),
      avgSimilarityScore: reviewData.length > 0 ? 
        reviewData.reduce((sum, item) => sum + item.totalSimilar, 0) / reviewData.length : 0
    };

    return NextResponse.json({
      customers: reviewData,
      stats
    });

  } catch (error) {
    console.error('Error fetching duplicate customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 