import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logDataAccessEvent } from '@/lib/security/audit-logger';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  isPrimary: z.boolean(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ staffId: string; locationId: string }> }
) {
  try {
    const { user, tenant } = await requireAuth();
    const { staffId, locationId } = await context.params;
    const body = await request.json();

    // Validate data
    const validatedData = updateAssignmentSchema.parse(body);

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

    // Verify assignment exists
    const assignment = await prisma.staffLocation.findUnique({
      where: {
        staffId_locationId: {
          staffId,
          locationId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary assignments
    if (validatedData.isPrimary) {
      await prisma.staffLocation.updateMany({
        where: {
          staffId,
          isPrimary: true,
          locationId: { not: locationId },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Update the assignment
    const updatedAssignment = await prisma.staffLocation.update({
      where: {
        staffId_locationId: {
          staffId,
          locationId,
        },
      },
      data: {
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

    // Audit log: Staff location assignment updated
    await logDataAccessEvent(
      request,
      'data_update',
      user.id,
      tenant.id,
      'staff_location_assignment',
      `${staffId}_${locationId}`,
      true,
      {
        staffId,
        locationId,
        locationName: updatedAssignment.location.name,
        isPrimary: validatedData.isPrimary,
        previousIsPrimary: assignment.isPrimary,
      }
    );

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating staff location assignment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ staffId: string; locationId: string }> }
) {
  try {
    const { user, tenant } = await requireAuth();
    const { staffId, locationId } = await context.params;

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

    // Verify assignment exists and get location details for audit log
    const assignment = await prisma.staffLocation.findUnique({
      where: {
        staffId_locationId: {
          staffId,
          locationId,
        },
      },
      include: {
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    // Check if this is the last location for the staff member
    const assignmentCount = await prisma.staffLocation.count({
      where: {
        staffId,
      },
    });

    if (assignmentCount === 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar la última ubicación asignada al staff' },
        { status: 400 }
      );
    }

    // Delete the assignment
    await prisma.staffLocation.delete({
      where: {
        staffId_locationId: {
          staffId,
          locationId,
        },
      },
    });

    // Audit log: Staff removed from location
    await logDataAccessEvent(
      request,
      'data_delete',
      user.id,
      tenant.id,
      'staff_location_assignment',
      `${staffId}_${locationId}`,
      true,
      {
        staffId,
        locationId,
        locationName: assignment.location.name,
        isPrimary: assignment.isPrimary,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff location assignment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
