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
import { parsePagination } from '../../../lib/security/validation-schemas';
import { requirePermission } from '@/lib/auth';

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

    // SECURITY FIX: Use validated pagination with enforced limits
    const { page, limit } = parsePagination(searchParams);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const locationId = searchParams.get('locationId') || undefined;

    const result = await getInventoryItems(
      userWithTenant.tenant.id,
      page,
      limit,
      category,
      search,
      locationId
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
    // Check permission - only MANAGER and ADMINISTRATOR can create inventory items
    const { tenant } = await requirePermission('inventory', 'write');

    const itemData: InventoryFormData = await request.json();

    // Validaciones básicas
    if (!itemData.name || !itemData.category) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Sanitize empty strings to undefined for optional fields
    // Empty string "" as foreign key causes Prisma to fail
    const sanitizedData: InventoryFormData = {
      ...itemData,
      locationId: itemData.locationId || undefined,
      description: itemData.description || undefined,
      activeCompound: itemData.activeCompound || undefined,
      presentation: itemData.presentation || undefined,
      measure: itemData.measure || undefined,
      brand: itemData.brand || undefined,
      storageLocation: itemData.storageLocation || undefined,
      batchNumber: itemData.batchNumber || undefined,
      specialNotes: itemData.specialNotes || undefined,
    };

    // Crear el producto
    const item = await createInventoryItem(
      tenant.id,
      sanitizedData
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/inventory:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear productos en inventario' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 