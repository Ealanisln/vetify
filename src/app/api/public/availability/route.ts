import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { addMinutes, format } from 'date-fns';
import { es } from 'date-fns/locale';

const availabilitySchema = z.object({
  tenantSlug: z.string().min(1),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  duration: z.number().min(15).max(300).optional().default(30),
});

interface BusinessHours {
  start: number;
  startMinute: number;
  end: number;
  endMinute: number;
  lunchStart: number | null;
  lunchStartMinute: number;
  lunchEnd: number | null;
  lunchEndMinute: number;
  slotDuration: number;
}

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

    const dayBusinessHours = tenantSettings?.businessHours?.[0];

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

function generateDaySlots(date: Date, businessHours: BusinessHours) {
  const slots = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Morning slots
  const morningEnd = businessHours.lunchStart ?? businessHours.end;
  for (let hour = businessHours.start; hour < morningEnd; hour++) {
    const startMinute = hour === businessHours.start ? businessHours.startMinute : 0;
    const endMinute = 60;

    for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
      const slotTime = new Date(year, month, day, hour, minute, 0, 0);
      slots.push({
        dateTime: slotTime,
        period: 'morning'
      });
    }
  }

  // Afternoon slots (if there's a lunch break)
  if (businessHours.lunchStart && businessHours.lunchEnd) {
    for (let hour = businessHours.lunchEnd; hour < businessHours.end; hour++) {
      const startMinute = hour === businessHours.lunchEnd ? businessHours.lunchEndMinute : 0;
      const endMinute = hour === businessHours.end - 1 ? (businessHours.endMinute || 60) : 60;

      for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
        const slotTime = new Date(year, month, day, hour, minute, 0, 0);
        slots.push({
          dateTime: slotTime,
          period: 'afternoon'
        });
      }
    }
  }

  return slots;
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
        publicPageEnabled: true
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

    // Parse date
    let targetDate: Date;
    try {
      if (validatedData.date.includes('T')) {
        targetDate = new Date(validatedData.date);
      } else {
        const [year, month, day] = validatedData.date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);
      }

      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          availableSlots: [],
          workingDay: false,
          message: 'No se pueden agendar citas en el pasado'
        }
      });
    }

    const dayOfWeek = targetDate.getDay();
    const businessHours = await getBusinessHours(tenant.id, dayOfWeek);

    if (!businessHours) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          availableSlots: [],
          workingDay: false,
          message: 'Día no laborable'
        }
      });
    }

    // Generate all slots for the day
    const slots = generateDaySlots(targetDate, businessHours);

    // Get existing appointments
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

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

    // Get confirmed appointment requests for the day (to avoid double booking)
    const confirmedRequests = await prisma.appointmentRequest.findMany({
      where: {
        tenantId: tenant.id,
        status: 'CONFIRMED',
        preferredDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        preferredDate: true,
        preferredTime: true
      }
    });

    // Filter available slots
    const now = new Date();
    const availableSlots = slots.filter(slot => {
      // Don't show past slots for today
      if (slot.dateTime <= now) {
        return false;
      }

      const slotEnd = addMinutes(slot.dateTime, validatedData.duration);

      // Check against existing appointments
      const hasAppointmentConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.dateTime);
        const appointmentEnd = addMinutes(appointmentStart, appointment.duration);

        return (
          (slot.dateTime >= appointmentStart && slot.dateTime < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slot.dateTime <= appointmentStart && slotEnd >= appointmentEnd)
        );
      });

      if (hasAppointmentConflict) return false;

      // Check against confirmed requests
      const hasRequestConflict = confirmedRequests.some(request => {
        if (!request.preferredDate || !request.preferredTime) return false;

        const requestDate = new Date(request.preferredDate);
        const [hours, minutes] = request.preferredTime.split(':').map(Number);
        requestDate.setHours(hours, minutes, 0, 0);

        const requestEnd = addMinutes(requestDate, validatedData.duration);

        return (
          (slot.dateTime >= requestDate && slot.dateTime < requestEnd) ||
          (slotEnd > requestDate && slotEnd <= requestEnd) ||
          (slot.dateTime <= requestDate && slotEnd >= requestEnd)
        );
      });

      return !hasRequestConflict;
    });

    return NextResponse.json({
      success: true,
      data: {
        date: validatedData.date,
        duration: validatedData.duration,
        availableSlots: availableSlots.map(slot => ({
          dateTime: slot.dateTime.toISOString(),
          time: format(slot.dateTime, 'HH:mm', { locale: es }),
          displayTime: format(slot.dateTime, 'h:mm a', { locale: es }),
          period: slot.period
        })),
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
