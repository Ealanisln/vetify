import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '../../../lib/auth';
import { createPet, createPetSchema, getPetsByTenant, PETS_ALLOWED_SORT_FIELDS } from '../../../lib/pets';
import { validatePlanAction, PlanLimitError } from '../../../lib/plan-limits';
import { validateDateOfBirth } from '../../../lib/utils/date-validation';
import { parsePaginationParams, parseSortParams, createPaginatedResponse } from '../../../lib/pagination';

export async function POST(request: NextRequest) {
  try {
    // CRITICAL FIX: Use requireActiveSubscription to block access with expired trial
    const { tenant } = await requireActiveSubscription();
    const body = await request.json();

    // Check plan limits before creating pet (also checks trial expiration now)
    await validatePlanAction(tenant.id, 'addPet');
    
    // Convert and validate dateOfBirth string to Date object if needed
    if (body.dateOfBirth && typeof body.dateOfBirth === 'string') {
      try {
        body.dateOfBirth = validateDateOfBirth(body.dateOfBirth);
      } catch (error) {
        return NextResponse.json(
          { message: error instanceof Error ? error.message : 'Invalid date of birth.' },
          { status: 400 }
        );
      }
    }
    
    const validatedData = createPetSchema.parse(body);
    const pet = await createPet(tenant.id as string, validatedData);
    
    // NOTE: N8N integration temporarily disabled - focusing on core functionality
    /*
    // Get customer data for WhatsApp automation
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId }
    });
    
    // 🚀 TRIGGER N8N WORKFLOW - The Magic Moment!
    if (customer?.phone) {
      try {
        const speciesInSpanish = {
          'dog': 'Perro',
          'cat': 'Gato',
          'bird': 'Ave',
          'rabbit': 'Conejo',
          'other': 'Mascota'
        }[pet?.species as string] || 'Mascota';

        await n8nService.triggerWorkflow('pet-registration', {
          petName: pet?.name as string,
          species: speciesInSpanish,
          ownerName: customer.name,
          ownerPhone: customer.phone,
          clinicName: tenant.name as string
        });

        return NextResponse.json({ 
          pet, 
          automationTriggered: true,
          message: 'Mascota registrada y WhatsApp enviado' 
        });
      } catch (n8nError) {
        console.error('N8N workflow error:', n8nError);
        // Continue without failing the pet creation
        return NextResponse.json({ 
          pet, 
          automationTriggered: false,
          message: 'Mascota registrada, pero falló el envío de WhatsApp' 
        });
      }
    }
    */

    return NextResponse.json({
      pet,
      message: 'Mascota registrada exitosamente'
    });

  } catch (error) {
    console.error('Error creating pet:', error);
    
    // Handle plan limit errors with specific messaging
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        { 
          error: 'plan_limit_exceeded',
          message: error.message,
          limitType: error.limitType,
          current: error.current,
          limit: error.limit
        },
        { status: 403 }
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

export async function GET(request: NextRequest) {
  try {
    // CRITICAL FIX: Use requireActiveSubscription to block access with expired trial
    const { tenant } = await requireActiveSubscription();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;

    // Parse pagination and sort params
    const paginationParams = parsePaginationParams(searchParams);
    const sortParams = parseSortParams(searchParams, PETS_ALLOWED_SORT_FIELDS);

    const result = await getPetsByTenant(
      tenant.id as string,
      locationId,
      paginationParams,
      sortParams
    );

    // Handle paginated response
    if ('pets' in result && 'total' in result) {
      const response = createPaginatedResponse(result.pets, result.total, paginationParams);
      return NextResponse.json({
        success: true,
        ...response
      });
    }

    // Backwards compatible response (shouldn't happen with pagination)
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 