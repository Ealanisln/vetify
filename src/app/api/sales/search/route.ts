import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { searchCustomers, searchProducts } from '@/lib/sales';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });
    
    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'customers' o 'products'
    const query = searchParams.get('q') || '';

    if (!type) {
      return NextResponse.json({ error: 'Tipo de búsqueda requerido' }, { status: 400 });
    }

    let results = [];

    if (type === 'customers') {
      results = await searchCustomers(userWithTenant.tenant.id, query);
    } else if (type === 'products') {
      results = await searchProducts(userWithTenant.tenant.id, query);
    } else {
      return NextResponse.json({ error: 'Tipo de búsqueda inválido' }, { status: 400 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error en GET /api/sales/search:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 