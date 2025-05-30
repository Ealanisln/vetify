import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createPet, createPetSchema, getPetsByTenant } from '@/lib/pets';
import { n8nService } from '@/lib/n8n';
// import { prisma } from '@/lib/prisma'; // TODO: Uncomment after running prisma db push

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
    
    // 🚀 TRIGGER N8N WORKFLOW - The Magic Moment!
    if (user.phone) {
      try {
        const speciesInSpanish = {
          'dog': 'Perro',
          'cat': 'Gato',
          'bird': 'Ave',
          'rabbit': 'Conejo',
          'other': 'Mascota'
        }[pet.species] || 'Mascota';

        const n8nResult = await n8nService.sendPetWelcomeMessage({
          petName: pet.name,
          petSpecies: speciesInSpanish,
          ownerName: user.name || user.firstName || user.email,
          ownerPhone: user.phone,
          clinicName: tenant.name
        });

        if (n8nResult.success) {
          console.log('🎉 Pet welcome message triggered successfully!');
          
          // Log the automation in database for tracking
          // TODO: Uncomment after running prisma db push
          /*
          await prisma.automationLog.create({
            data: {
              tenantId: tenant.id,
              workflowType: 'PET_WELCOME',
              triggeredBy: user.id,
              payload: {
                petId: pet.id,
                petName: pet.name,
                ownerPhone: user.phone
              },
              status: 'SUCCESS',
              executionId: n8nResult.executionId
            }
          }).catch((err: Error) => {
            // Don't fail the pet creation if logging fails
            console.warn('Failed to log automation:', err);
          });
          */
        } else {
          console.error('❌ N8N workflow failed:', n8nResult.error);
        }
      } catch (automationError) {
        // Don't fail pet creation if automation fails
        console.error('❌ Automation error (non-blocking):', automationError);
      }
    }
    
    return NextResponse.json({
      ...pet,
      automationTriggered: !!user.phone
    }, { status: 201 });
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