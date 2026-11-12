import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { completeWeek } from '@/lib/business-hours';
import { getClinicTimeZone } from '@/lib/clinic-timezone';

/**
 * Read-only weekly schedule for the appointments calendar.
 *
 * /api/settings/business-hours requires settings:read (admins), but every
 * staff member who sees the calendar needs the clinic's hours to size the
 * time grid. This returns only open/close times per day and the timezone,
 * scoped to the caller's tenant, and never writes.
 */
export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: {
        timezone: true,
        defaultStartTime: true,
        defaultEndTime: true,
        defaultLunchStart: true,
        defaultLunchEnd: true,
        defaultSlotDuration: true,
        businessHours: {
          where: { locationId: null },
          orderBy: { dayOfWeek: 'asc' },
          select: { dayOfWeek: true, isWorkingDay: true, startTime: true, endTime: true },
        },
      },
    });

    const days = completeWeek(settings?.businessHours ?? [], settings).map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isWorkingDay: day.isWorkingDay,
      startTime: day.startTime,
      endTime: day.endTime,
    }));

    return NextResponse.json({
      success: true,
      data: {
        timeZone: getClinicTimeZone({ countryCode: tenant.countryCode, tenantSettings: settings }),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar business hours:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar el horario de la clínica' },
      { status: 500 }
    );
  }
}
