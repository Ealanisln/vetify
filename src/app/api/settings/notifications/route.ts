import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  notificationPreferencesSchema,
  type NotificationPreferencesData
} from '../../../../lib/enhanced-settings';
import { z } from 'zod';

/**
 * GET /api/settings/notifications
 * Get notification preferences for the authenticated tenant
 */
export async function GET() {
  try {
    const { tenant } = await requireAuth();
    const preferences = await getNotificationPreferences(tenant.id);

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('[SETTINGS] Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/notifications
 * Update notification preferences for the authenticated tenant
 */
export async function PUT(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();

    // Validate the input data
    const validatedData = notificationPreferencesSchema.partial().parse(body) as Partial<NotificationPreferencesData>;

    // Update preferences (merges with existing)
    const preferences = await updateNotificationPreferences(tenant.id, validatedData);

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Preferencias actualizadas correctamente'
    });
  } catch (error) {
    console.error('[SETTINGS] Error updating notification preferences:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
