import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createPet, createPetSchema, getPetsByTenant } from '@/lib/pets';
import { n8nService } from '@/lib/n8n';
import { prisma } from '@/lib/prisma';
// import { prisma } from '@/lib/prisma'; // TODO: Uncomment after running prisma db push

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    // Convert dateOfBirth string to Date object if needed
    if (body.dateOfBirth && typeof body.dateOfBirth === 'string') {
      body.dateOfBirth = new Date(body.dateOfBirth);
    }
    
    const validatedData = createPetSchema.parse(body);
    const pet = await createPet(tenant.id as string, validatedData);
    
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

    return NextResponse.json({ 
      pet, 
      automationTriggered: false,
      message: 'Mascota registrada (sin WhatsApp - número no disponible)' 
    });

  } catch (error) {
    console.error('Error creating pet:', error);
    
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

export async function GET() {
  try {
    const { tenant } = await requireAuth();
    const pets = await getPetsByTenant(tenant.id as string);
    
    return NextResponse.json(pets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 