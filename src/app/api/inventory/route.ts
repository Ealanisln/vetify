import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { 
  getInventoryItems, 
  createInventoryItem, 
  getInventoryStats,
  getLowStockItems 
} from '../../../lib/inventory';
import { prisma } from '../../../lib/prisma';
import { InventoryFormData } from '@/types';

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
    const action = searchParams.get('action');

    // Obtener estadísticas del inventario
    if (action === 'stats') {
      const stats = await getInventoryStats(userWithTenant.tenant.id);
      return NextResponse.json(stats);
    }

    // Obtener productos con stock bajo
    if (action === 'low-stock') {
      const items = await getLowStockItems(userWithTenant.tenant.id);
      return NextResponse.json(items);
    }

    // Obtener lista de productos por defecto
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getInventoryItems(
      userWithTenant.tenant.id,
      page,
      limit,
      category,
      search
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en GET /api/inventory:', error);
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
      include: { tenant: true }
    });
    
    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const itemData: InventoryFormData = await request.json();

    // Validaciones básicas
    if (!itemData.name || !itemData.category) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Crear el producto
    const item = await createInventoryItem(
      userWithTenant.tenant.id,
      itemData
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/inventory:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 