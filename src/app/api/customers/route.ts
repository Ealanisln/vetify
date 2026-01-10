import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { createCustomer, createCustomerSchema, getCustomersByTenant, CUSTOMERS_ALLOWED_SORT_FIELDS } from '../../../lib/customers';
import { parsePaginationParams, parseSortParams, createPaginatedResponse } from '@/lib/pagination';

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

    // Parse pagination and sort params
    const paginationParams = parsePaginationParams(searchParams);
    const sortParams = parseSortParams(searchParams, CUSTOMERS_ALLOWED_SORT_FIELDS);

    const result = await getCustomersByTenant(
      tenant.id as string,
      locationId,
      paginationParams,
      sortParams
    );

    // Handle paginated response
    if ('customers' in result && 'total' in result) {
      const response = createPaginatedResponse(result.customers, result.total, paginationParams);
      return NextResponse.json({
        success: true,
        ...response
      });
    }

    // Backwards compatible response (shouldn't happen with pagination)
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 