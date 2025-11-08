import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignLocationSchema = z.object({
  locationId: z.string(),
  isPrimary: z.boolean().default(false),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ staffId: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { staffId } = await context.params;

    // Verify staff belongs to tenant
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId: tenant.id,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff no encontrado' },
        { status: 404 }
      );
    }

    // Get all location assignments for this staff member
    const assignments = await prisma.staffLocation.findMany({
      where: {
        staffId,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            isPrimary: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { location: { name: 'asc' } },
      ],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching staff locations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ staffId: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { staffId } = await context.params;
    const body = await request.json();

    // Validate data
    const validatedData = assignLocationSchema.parse(body);

    // Verify staff belongs to tenant
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId: tenant.id,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff no encontrado' },
        { status: 404 }
      );
    }

    // Verify location belongs to tenant
    const location = await prisma.location.findFirst({
      where: {
        id: validatedData.locationId,
        tenantId: tenant.id,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.staffLocation.findUnique({
      where: {
        staffId_locationId: {
          staffId,
          locationId: validatedData.locationId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'El staff ya está asignado a esta ubicación' },
        { status: 409 }
      );
    }

    // If setting as primary, unset other primary assignments
    if (validatedData.isPrimary) {
      await prisma.staffLocation.updateMany({
        where: {
          staffId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create the assignment
    const assignment = await prisma.staffLocation.create({
      data: {
        staffId,
        locationId: validatedData.locationId,
        isPrimary: validatedData.isPrimary,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            isPrimary: true,
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning staff to location:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
