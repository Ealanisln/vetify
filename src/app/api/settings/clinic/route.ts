import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getClinicSettings, 
  updateClinicSettings,
  clinicSettingsSchema 
} from '@/lib/enhanced-settings';

export async function GET() {
  try {
    const { tenant } = await requireAuth();
    const settings = await getClinicSettings(tenant.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    const validatedData = clinicSettingsSchema.parse(body);
    const settings = await updateClinicSettings(tenant.id, validatedData);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating clinic settings:', error);
    
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