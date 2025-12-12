import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { validateDateOfBirth } from '@/lib/utils/date-validation';

const updatePetSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.string().optional(),
  breed: z.string().nullable().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.string().optional(),
  weight: z.number().nullable().optional(),
  weightUnit: z.string().nullable().optional(),
  microchipNumber: z.string().nullable().optional(),
  isNeutered: z.boolean().optional(),
  isDeceased: z.boolean().optional(),
  internalId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveSubscription();
    const { id } = await params;

    const pet = await prisma.pet.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        customer: true,
      },
    });

    if (!pet) {
      return NextResponse.json(
        { message: 'Mascota no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(pet);
  } catch (error) {
    console.error('Error fetching pet:', error);
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
    const { tenant } = await requireActiveSubscription();
    const { id } = await params;
    const body = await request.json();

    // Verify pet belongs to tenant
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingPet) {
      return NextResponse.json(
        { message: 'Mascota no encontrada' },
        { status: 404 }
      );
    }

    // Convert and validate dateOfBirth string to Date object if needed
    if (body.dateOfBirth && typeof body.dateOfBirth === 'string') {
      try {
        body.dateOfBirth = validateDateOfBirth(body.dateOfBirth);
      } catch (error) {
        return NextResponse.json(
          { message: error instanceof Error ? error.message : 'Fecha de nacimiento invalida.' },
          { status: 400 }
        );
      }
    }

    const validatedData = updatePetSchema.parse(body);

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: validatedData,
      include: {
        customer: true,
      },
    });

    return NextResponse.json({
      pet: updatedPet,
      message: 'Mascota actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating pet:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos invalidos', errors: error.errors },
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
    const { tenant } = await requireActiveSubscription();
    const { id } = await params;

    // Verify pet belongs to tenant
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingPet) {
      return NextResponse.json(
        { message: 'Mascota no encontrada' },
        { status: 404 }
      );
    }

    await prisma.pet.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Mascota eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
