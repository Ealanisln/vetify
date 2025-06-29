import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getStaffById, 
  updateStaff, 
  deleteStaff, 
  updateStaffSchema 
} from '@/lib/staff';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await params;
    
    const staff = await getStaffById(tenant.id as string, id);
    
    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    
    if (error instanceof Error) {
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
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = updateStaffSchema.parse(body);
    const updatedStaff = await updateStaff(tenant.id as string, id, validatedData);
    
    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff:', error);
    
    if (error instanceof Error) {
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await params;
    
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
    console.error('Error deleting staff:', error);
    
    if (error instanceof Error) {
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
} 