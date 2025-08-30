import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  notificationSettingsSchema 
} from '../../../../lib/enhanced-settings';

export async function GET() {
  try {
    const { tenant } = await requireAuth();
    const settings = await getNotificationSettings(tenant.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
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

    const validatedData = notificationSettingsSchema.parse(body);
    const settings = await updateNotificationSettings(tenant.id, validatedData);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    
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