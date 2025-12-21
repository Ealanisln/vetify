import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { createCustomer, createCustomerSchema, getCustomersByTenant } from '../../../lib/customers';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const validatedData = createCustomerSchema.parse(body);
    const customer = await createCustomer(tenant.id as string, validatedData);
    
    return NextResponse.json(customer, { status: 201 });

  } catch (error) {
    console.error('Error creating customer:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;

    const customers = await getCustomersByTenant(tenant.id as string, locationId);

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 