import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getCustomerById, 
  updateCustomer, 
  deleteCustomer, 
  createCustomerSchema 
} from '@/lib/customers';
import { z } from 'zod';

const updateCustomerSchema = createCustomerSchema.partial();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await params;
    const customer = await getCustomerById(id, tenant.id as string);
    
    if (!customer) {
      return NextResponse.json(
        { message: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);

  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    const { id } = await params;
    
    const validatedData = updateCustomerSchema.parse(body);
    const customer = await updateCustomer(id, tenant.id as string, validatedData);
    
    return NextResponse.json(customer);

  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await params;
    
    // Soft delete - archive the customer
    await deleteCustomer(id, tenant.id as string);
    
    return NextResponse.json({ message: 'Cliente archivado exitosamente' });

  } catch (error) {
    console.error('Error archiving customer:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 