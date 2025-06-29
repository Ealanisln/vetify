import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  createTreatmentSchedule, 
  getTreatmentSchedulesByTenant,
  createTreatmentScheduleSchema 
} from '@/lib/treatment-reminders';

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const filters = {
      petId: searchParams.get('petId') || undefined,
      treatmentType: searchParams.get('treatmentType') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
    };

    const schedules = await getTreatmentSchedulesByTenant(tenant.id, filters);

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching treatment schedules:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    // Convert scheduledDate string to Date object
    if (body.scheduledDate) {
      body.scheduledDate = new Date(body.scheduledDate);
    }

    const validatedData = createTreatmentScheduleSchema.parse(body);
    const schedule = await createTreatmentSchedule(tenant.id, validatedData);

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error('Error creating treatment schedule:', error);
    
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