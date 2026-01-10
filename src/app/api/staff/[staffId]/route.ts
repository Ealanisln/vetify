import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '../../../../lib/auth';
import {
  getStaffById,
  updateStaff,
  deleteStaff,
  updateStaffSchema
} from '../../../../lib/staff';

/**
 * Helper to handle permission errors
 */
function handleError(error: unknown, context: string) {
  console.error(`Error ${context}:`, error);

  if (error instanceof Error) {
    if (error.message.includes('Access denied')) {
      return NextResponse.json(
        { message: 'No tienes permiso para esta acción' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { message: error.message },
      { status: error.message === 'Personal no encontrado' ? 404 : 400 }
    );
  }

  return NextResponse.json(
    { message: 'Error interno del servidor' },
    { status: 500 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    // Only admins can view staff details
    const { tenant } = await requirePermission('staff', 'read');
    const { staffId: id } = await params;

    const staff = await getStaffById(tenant.id as string, id);

    return NextResponse.json({ staff });
  } catch (error) {
    return handleError(error, 'fetching staff');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    // Only admins can update staff
    const { tenant } = await requirePermission('staff', 'write');
    const { staffId: id } = await params;
    const body = await request.json();

    const validatedData = updateStaffSchema.parse(body);
    const updatedStaff = await updateStaff(tenant.id as string, id, validatedData);

    return NextResponse.json(updatedStaff);
  } catch (error) {
    return handleError(error, 'updating staff');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    // Only admins can delete staff
    const { tenant } = await requirePermission('staff', 'delete');
    const { staffId: id } = await params;

    const result = await deleteStaff(tenant.id as string, id);

    return NextResponse.json({
      success: true,
      message: result.isHardDelete
        ? 'Personal eliminado permanentemente'
        : 'Personal desactivado (tiene registros asociados)',
      isHardDelete: result.isHardDelete,
      staff: result.staff
    });
  } catch (error) {
    return handleError(error, 'deleting staff');
  }
} 