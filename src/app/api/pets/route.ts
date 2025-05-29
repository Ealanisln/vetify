import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createPet, createPetSchema, getPetsByTenant } from '@/lib/pets';

export async function POST(request: NextRequest) {
  try {
    const { user, tenant } = await requireAuth();
    const body = await request.json();
    
    // Convert dateOfBirth string to Date object if needed
    if (body.dateOfBirth && typeof body.dateOfBirth === 'string') {
      body.dateOfBirth = new Date(body.dateOfBirth);
    }
    
    const validatedData = createPetSchema.parse(body);
    const pet = await createPet(tenant.id, user.id, validatedData);
    
    return NextResponse.json(pet, { status: 201 });
  } catch (error) {
    console.error('Error creating pet:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { tenant } = await requireAuth();
    const pets = await getPetsByTenant(tenant.id);
    
    return NextResponse.json(pets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 