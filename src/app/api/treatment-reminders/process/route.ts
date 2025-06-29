import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  processPendingReminders,
  createVaccinationSchedule,
  createDewormingSchedule
} from '@/lib/treatment-reminders';

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    const { action, petId, vaccinationType } = body;

    if (action === 'process-reminders') {
      const results = await processPendingReminders(tenant.id);
      return NextResponse.json({ results });
    }

    if (action === 'create-vaccination-schedule') {
      if (!petId || !vaccinationType) {
        return NextResponse.json(
          { error: 'petId y vaccinationType son requeridos' },
          { status: 400 }
        );
      }
      
      const schedules = await createVaccinationSchedule(tenant.id, petId, vaccinationType);
      return NextResponse.json({ schedules });
    }

    if (action === 'create-deworming-schedule') {
      if (!petId) {
        return NextResponse.json(
          { error: 'petId es requerido' },
          { status: 400 }
        );
      }
      
      const schedules = await createDewormingSchedule(tenant.id, petId);
      return NextResponse.json({ schedules });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing treatment reminders:', error);
    
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