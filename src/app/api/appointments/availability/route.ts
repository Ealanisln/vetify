import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { addMinutes } from 'date-fns';
import { defaultDayHours } from '../../../../lib/business-hours';
import {
  generateDaySlots,
  filterAvailableSlots,
  isWithinBusinessHours,
  serializeSlot,
  DEFAULT_BUSINESS_HOURS,
} from '../../../../lib/appointments/availability';
import {
  clinicDayRange,
  clinicToday,
  dayOfWeekForDate,
  getClinicTimeZone,
  parseClinicDate,
} from '../../../../lib/clinic-timezone';
import { findConflictingAppointment } from '../../../../lib/appointments/conflicts';

const availabilitySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  duration: z.string()
    .nullable()
    .optional()
    .transform(val => val ? parseInt(val) : 30)
    .refine(val => val >= 15 && val <= 300, {
      message: "Duration must be between 15 and 300 minutes"
    }),
  staffId: z.string().nullable().optional(),
  excludeAppointmentId: z.string().nullable().optional(), // Para edición de citas
});

// Resolve the clinic timezone. TenantSettings.timezone is only trusted when it
// is not the 'UTC' signup placeholder; otherwise it derives from the country.
async function getTenantTimeZone(tenant: { id: string; countryCode?: string | null }) {
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
    select: { timezone: true },
  });
  return getClinicTimeZone({ countryCode: tenant.countryCode, tenantSettings });
}

// Helper function to get business hours from database
async function getBusinessHours(tenantId: string, dayOfWeek: number) {
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
    
    // Return parsed business hours or null if not a working day
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
      slotDuration: dayBusinessHours.slotDuration || tenantSettings?.defaultSlotDuration || 15,
    };
  } catch (error) {
    console.error('Error fetching business hours:', error);
    // Fallback to default hours
    return DEFAULT_BUSINESS_HOURS;
  }
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const duration = searchParams.get('duration');
    const staffId = searchParams.get('staffId');
    const excludeAppointmentId = searchParams.get('excludeAppointmentId');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Fecha requerida' },
        { status: 400 }
      );
    }

    const validatedData = availabilitySchema.parse({
      date,
      duration,
      staffId,
      excludeAppointmentId
    });

    const timeZone = await getTenantTimeZone(tenant);

    // The requested day is a clinic calendar day, never a server-local one
    const clinicDate = parseClinicDate(validatedData.date, timeZone);
    if (!clinicDate) {
      return NextResponse.json(
        { success: false, error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    const dayOfWeek = dayOfWeekForDate(clinicDate);

    // Get business hours from database
    const businessHours = await getBusinessHours(tenant.id, dayOfWeek);

    // Check if it's a working day
    if (!businessHours) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          duration: validatedData.duration,
          timeZone,
          availableSlots: [],
          totalSlots: 0,
          availableCount: 0,
          occupiedCount: 0,
          workingDay: false,
          message: 'Día no laborable'
        }
      });
    }

    // Generar slots disponibles del día (en la zona horaria de la clínica)
    const slots = generateDaySlots(clinicDate, businessHours, timeZone);

    // Obtener citas existentes del día de la clínica
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
        },
        ...(validatedData.excludeAppointmentId && {
          id: { not: validatedData.excludeAppointmentId }
        }),
        ...(validatedData.staffId && {
          staffId: validatedData.staffId
        })
      },
      select: {
        id: true,
        dateTime: true,
        duration: true,
        staffId: true
      }
    });

    // Filtrar slots disponibles; para hoy se ocultan los que ya pasaron
    const now = new Date();
    const isToday = clinicToday(timeZone, now) === clinicDate;

    const availableSlots = filterAvailableSlots(slots, {
      durationMinutes: validatedData.duration,
      busy: existingAppointments.map((appointment) => ({
        start: appointment.dateTime,
        durationMinutes: appointment.duration,
      })),
      notBefore: isToday ? now : undefined,
    });

    // Obtener estadísticas del staff si se especifica
    let staffStats = null;
    if (validatedData.staffId) {
      const todayAppointments = existingAppointments.filter(app => app.staffId === validatedData.staffId);
      staffStats = {
        totalAppointments: todayAppointments.length,
        busyMinutes: todayAppointments.reduce((sum, app) => sum + app.duration, 0),
        availableSlots: availableSlots.length
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        date: validatedData.date,
        duration: validatedData.duration,
        timeZone,
        availableSlots: availableSlots.map(slot => serializeSlot(slot, timeZone)),
        totalSlots: slots.length,
        availableCount: availableSlots.length,
        occupiedCount: slots.length - availableSlots.length,
        workingDay: true,
        businessHours: businessHours,
        staffStats
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error checking availability:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const body = await request.json();
    
    const { dateTime, duration, staffId, excludeAppointmentId } = body;
    
    if (!dateTime) {
      return NextResponse.json(
        { success: false, error: 'Fecha y hora requeridas' },
        { status: 400 }
      );
    }

    const targetDateTime = new Date(dateTime);
    if (isNaN(targetDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }
    const slotDuration = duration || 30;
    const endDateTime = addMinutes(targetDateTime, slotDuration);

    // Verificar si está dentro del horario laboral, leído en hora de la clínica
    const timeZone = await getTenantTimeZone(tenant);
    const dayOfWeek = dayOfWeekForDate(parseClinicDate(targetDateTime.toISOString(), timeZone)!);

    // Get business hours for this day
    const businessHours = await getBusinessHours(tenant.id, dayOfWeek);

    if (!businessHours) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Día no laborable'
      });
    }

    if (!isWithinBusinessHours(targetDateTime, businessHours, timeZone)) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Fuera del horario laboral'
      });
    }

    // Verificar conflictos con citas existentes (con su duración real)
    const conflictingAppointment = await findConflictingAppointment({
      tenantId: tenant.id,
      start: targetDateTime,
      durationMinutes: slotDuration,
      staffId,
      excludeAppointmentId,
    });

    if (conflictingAppointment) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Horario no disponible',
        conflict: {
          appointmentId: conflictingAppointment.id,
          dateTime: conflictingAppointment.dateTime,
          customer: conflictingAppointment.customer?.name,
          pet: conflictingAppointment.pet.name,
          duration: conflictingAppointment.duration
        }
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      dateTime: targetDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      duration: slotDuration
    });

  } catch (error) {
    console.error('Error checking specific slot availability:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}