import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: true
      }
    });

    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        tenantId: userWithTenant.tenant.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            paymentMethod: true,
            amount: true,
            paymentDate: true,
            notes: true
          }
        },
        tenant: {
          select: {
            name: true,
            publicPhone: true,
            publicEmail: true,
            publicAddress: true,
            tenantSettings: {
              select: {
                taxRate: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error en GET /api/sales/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
