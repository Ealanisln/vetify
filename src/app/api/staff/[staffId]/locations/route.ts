import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkFeatureAccess } from '@/lib/plan-limits';
import { logDataAccessEvent } from '@/lib/security/audit-logger';
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
  request: NextRequest,
  context: { params: Promise<{ staffId: string }> }
) {
  try {
    const { user, tenant } = await requireAuth();
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

    // Check if staff already has location assignments (multi-location check)
    const existingAssignments = await prisma.staffLocation.count({
      where: { staffId },
    });

    // If staff already has a location assignment and trying to add another,
    // verify tenant has multi-location feature
    if (existingAssignments > 0) {
      const hasMultiLocation = await checkFeatureAccess(tenant.id, 'multiLocation');

      if (!hasMultiLocation) {
        return NextResponse.json(
          {
            error: 'Multi-ubicación no disponible en tu plan',
            details: {
              message: 'El Plan Básico solo permite 1 ubicación. Actualiza a Plan Profesional para asignar staff a múltiples ubicaciones.',
              requiresUpgrade: true,
            },
          },
          { status: 403 }
        );
      }
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

    // Audit log: Staff assigned to location
    await logDataAccessEvent(
      request,
      'data_create',
      user.id,
      tenant.id,
      'staff_location_assignment',
      assignment.id,
      true,
      {
        staffId,
        locationId: validatedData.locationId,
        locationName: assignment.location.name,
        isPrimary: validatedData.isPrimary,
      }
    );

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
