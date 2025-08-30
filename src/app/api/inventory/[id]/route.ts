import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { 
  getInventoryItemById, 
  updateInventoryItem, 
  deleteInventoryItem 
} from '../../../../lib/inventory';
import { prisma } from '../../../../lib/prisma';
import { InventoryFormData } from '@/types';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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

    const item = await getInventoryItemById(userWithTenant.tenant.id, params.id);

    if (!item) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error en GET /api/inventory/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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

    const updateData: Partial<InventoryFormData> = await request.json();

    // Validaciones básicas
    if (updateData.name && updateData.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del producto no puede estar vacío' },
        { status: 400 }
      );
    }

    const updatedItem = await updateInventoryItem(
      userWithTenant.tenant.id,
      params.id,
      updateData
    );

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error en PUT /api/inventory/[id]:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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

    await deleteInventoryItem(userWithTenant.tenant.id, params.id);

    return NextResponse.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error en DELETE /api/inventory/[id]:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 