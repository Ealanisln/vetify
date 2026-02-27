import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, tenant } = await requireAuth();
    const tenantId = tenant.id;

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
