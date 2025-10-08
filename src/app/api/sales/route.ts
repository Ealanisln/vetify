import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createSale, getRecentSales, getSalesStats } from '../../../lib/sales';
import { prisma } from '../../../lib/prisma';
import { SaleFormData } from '@/types';

export async function GET(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });
    
    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Obtener estadísticas de ventas
    if (action === 'stats') {
      const stats = await getSalesStats(userWithTenant.tenant.id);
      return NextResponse.json(stats);
    }

    // Obtener ventas recientes por defecto
    const limit = parseInt(searchParams.get('limit') || '10');
    const sales = await getRecentSales(userWithTenant.tenant.id, limit);

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error en GET /api/sales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });
    
    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const saleData: SaleFormData = await request.json();

    // Validaciones básicas
    if (!saleData.customerId || !saleData.items || saleData.items.length === 0) {
      return NextResponse.json(
        { error: 'Datos de venta incompletos' },
        { status: 400 }
      );
    }

    // Crear la venta
    const sale = await createSale(
      userWithTenant.tenant.id,
      user.id,
      saleData
    );

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/sales:', error);
    
    // Si es un error de validación de caja, devolver mensaje específico
    if (error instanceof Error && error.message.includes('caja abierta')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 