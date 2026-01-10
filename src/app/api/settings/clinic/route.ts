import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '../../../../lib/auth';
import {
  getClinicSettings,
  updateClinicSettings,
  clinicSettingsSchema
} from '../../../../lib/enhanced-settings';

export async function GET() {
  try {
    // Only admins can view clinic settings
    const { tenant } = await requirePermission('settings', 'read');
    const settings = await getClinicSettings(tenant.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching clinic settings:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver la configuración' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Only admins can update clinic settings
    const { tenant } = await requirePermission('settings', 'write');
    const body = await request.json();

    const validatedData = clinicSettingsSchema.parse(body);
    const settings = await updateClinicSettings(tenant.id, validatedData);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating clinic settings:', error);

    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'No tienes permiso para modificar la configuración' },
          { status: 403 }
        );
      }
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