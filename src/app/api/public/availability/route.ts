import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import {
  filterAvailableSlots,
  generateDaySlots,
  serializeSlot,
  type BusinessHours,
} from '../../../../lib/appointments/availability';
import {
  clinicDayRange,
  clinicToday,
  dayOfWeekForDate,
  getClinicTimeZone,
  parseClinicDate,
} from '../../../../lib/clinic-timezone';
import { defaultDayHours } from '../../../../lib/business-hours';

const availabilitySchema = z.object({
  tenantSlug: z.string().min(1),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  duration: z.number().min(15).max(300).optional().default(30),
});

// Get business hours from database for a tenant
async function getBusinessHours(tenantId: string, dayOfWeek: number): Promise<BusinessHours | null> {
  try {
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      include: {
        businessHours: {
          where: { dayOfWeek }
        }
      }
    });

    // No row yet (tenant predates signup seeding): use the default week
    const dayBusinessHours = tenantSettings?.businessHours?.[0] ?? defaultDayHours(dayOfWeek, tenantSettings);

    if (!dayBusinessHours?.isWorkingDay) {
      return null;
    }

    return {
      start: parseInt(dayBusinessHours.startTime.split(':')[0]),
      startMinute: parseInt(dayBusinessHours.startTime.split(':')[1]),
      end: parseInt(dayBusinessHours.endTime.split(':')[0]),
      endMinute: parseInt(dayBusinessHours.endTime.split(':')[1]),
      lunchStart: dayBusinessHours.lunchStart ? parseInt(dayBusinessHours.lunchStart.split(':')[0]) : null,
      lunchStartMinute: dayBusinessHours.lunchStart ? parseInt(dayBusinessHours.lunchStart.split(':')[1]) : 0,
      lunchEnd: dayBusinessHours.lunchEnd ? parseInt(dayBusinessHours.lunchEnd.split(':')[0]) : null,
      lunchEndMinute: dayBusinessHours.lunchEnd ? parseInt(dayBusinessHours.lunchEnd.split(':')[1]) : 0,
      slotDuration: dayBusinessHours.slotDuration || tenantSettings?.defaultSlotDuration || 30,
    };
  } catch (error) {
    console.error('Error fetching business hours:', error);
    // Fallback to default hours
    return {
      start: 9,
      startMinute: 0,
      end: 18,
      endMinute: 0,
      lunchStart: 13,
      lunchStartMinute: 0,
      lunchEnd: 14,
      lunchEndMinute: 0,
      slotDuration: 30,
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const tenantSlug = searchParams.get('tenantSlug');
    const date = searchParams.get('date');
    const durationParam = searchParams.get('duration');

    if (!tenantSlug || !date) {
      return NextResponse.json(
        { success: false, error: 'tenantSlug y date son requeridos' },
        { status: 400 }
      );
    }

    const duration = durationParam ? parseInt(durationParam) : 30;

    const validatedData = availabilitySchema.parse({
      tenantSlug,
      date,
      duration
    });

    // Get tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: validatedData.tenantSlug,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        publicBookingEnabled: true,
        publicPageEnabled: true,
        countryCode: true,
        tenantSettings: { select: { timezone: true } }
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    if (!tenant.publicPageEnabled || !tenant.publicBookingEnabled) {
      return NextResponse.json(
        { success: false, error: 'Reservas públicas no habilitadas' },
        { status: 403 }
      );
    }

    const timeZone = getClinicTimeZone(tenant);

    // The requested day is a clinic calendar day, never a server-local one
    const clinicDate = parseClinicDate(validatedData.date, timeZone);
    if (!clinicDate) {
      return NextResponse.json(
        { success: false, error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Check if date is in the past (for the clinic)
    const now = new Date();
    if (clinicDate < clinicToday(timeZone, now)) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          timeZone,
          availableSlots: [],
          workingDay: false,
          message: 'No se pueden agendar citas en el pasado'
        }
      });
    }

    const dayOfWeek = dayOfWeekForDate(clinicDate);
    const businessHours = await getBusinessHours(tenant.id, dayOfWeek);

    if (!businessHours) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          timeZone,
          availableSlots: [],
          workingDay: false,
          message: 'Día no laborable'
        }
      });
    }

    // Generate all slots for the clinic day
    const slots = generateDaySlots(clinicDate, businessHours, timeZone);

    // Get existing appointments within the clinic day
    const { start: startOfDay, end: endOfDay } = clinicDayRange(clinicDate, timeZone);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        dateTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']
        }
      },
      select: {
        id: true,
        dateTime: true,
        duration: true
      }
    });

    // Only real appointments hold a slot. AppointmentRequests are created
    // PENDING and no flow confirms them; an accepted request becomes an
    // Appointment, which this query already covers.
    const busy = existingAppointments.map((appointment) => ({
      start: new Date(appointment.dateTime),
      durationMinutes: appointment.duration,
    }));

    // Past slots (in clinic time) are never bookable publicly
    const availableSlots = filterAvailableSlots(slots, {
      durationMinutes: validatedData.duration,
      busy,
      notBefore: now,
    });

    return NextResponse.json({
      success: true,
      data: {
        date: validatedData.date,
        duration: validatedData.duration,
        timeZone,
        availableSlots: availableSlots.map(slot => serializeSlot(slot, timeZone)),
        totalSlots: slots.length,
        availableCount: availableSlots.length,
        workingDay: true,
        businessHours: {
          open: `${businessHours.start.toString().padStart(2, '0')}:${businessHours.startMinute.toString().padStart(2, '0')}`,
          close: `${businessHours.end.toString().padStart(2, '0')}:${businessHours.endMinute.toString().padStart(2, '0')}`,
          lunchStart: businessHours.lunchStart ? `${businessHours.lunchStart.toString().padStart(2, '0')}:${businessHours.lunchStartMinute.toString().padStart(2, '0')}` : null,
          lunchEnd: businessHours.lunchEnd ? `${businessHours.lunchEnd.toString().padStart(2, '0')}:${businessHours.lunchEndMinute.toString().padStart(2, '0')}` : null
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error checking public availability:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
