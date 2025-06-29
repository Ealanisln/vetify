import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  updateTreatmentSchedule, 
  markTreatmentAsCompleted,
  updateTreatmentScheduleSchema 
} from '@/lib/treatment-reminders';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    const { id } = await params;

    // Convert scheduledDate string to Date object if present
    if (body.scheduledDate) {
      body.scheduledDate = new Date(body.scheduledDate);
    }

    const validatedData = updateTreatmentScheduleSchema.parse(body);
    const schedule = await updateTreatmentSchedule(tenant.id, id, validatedData);

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error updating treatment schedule:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    const { action, staffId } = body;
    const { id } = await params;

    if (action === 'complete') {
      const result = await markTreatmentAsCompleted(tenant.id, id, staffId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing treatment schedule action:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 