import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addMinutes, format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

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

    const dayBusinessHours = tenantSettings?.businessHours?.[0];
    
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
    return {
      start: 8,
      startMinute: 0,
      end: 18,
      endMinute: 0,
      lunchStart: 13,
      lunchStartMinute: 0,
      lunchEnd: 14,
      lunchEndMinute: 0,
      slotDuration: 15,
    };
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

    // Parse the date and ensure it's in local timezone
    let targetDate: Date;
    try {
      if (validatedData.date.includes('T')) {
        // If it's an ISO string with time
        targetDate = new Date(validatedData.date);
      } else {
        // If it's just a date string (YYYY-MM-DD), parse as local date
        // Split the date to avoid timezone issues
        const [year, month, day] = validatedData.date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day); // month is 0-indexed
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

    const dayOfWeek = targetDate.getDay();

    // Get business hours from database
    const businessHours = await getBusinessHours(tenant.id, dayOfWeek);

    // Check if it's a working day
    if (!businessHours) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          duration: validatedData.duration,
          availableSlots: [],
          totalSlots: 0,
          availableCount: 0,
          occupiedCount: 0,
          workingDay: false,
          message: 'Día no laborable'
        }
      });
    }

    // Generar slots disponibles del día
    const slots = generateDaySlots(targetDate, businessHours);

    // Obtener citas existentes del día
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

    // Filtrar slots disponibles
    const availableSlots = slots.filter(slot => {
      const slotEnd = addMinutes(slot.dateTime, validatedData.duration);
      
      // Verificar si el slot no se solapa con citas existentes
      return !existingAppointments.some(appointment => {
        const appointmentStart = appointment.dateTime;
        const appointmentEnd = addMinutes(appointmentStart, appointment.duration);
        
        // Verificar solapamiento
        return isWithinInterval(slot.dateTime, { start: appointmentStart, end: appointmentEnd }) ||
               isWithinInterval(slotEnd, { start: appointmentStart, end: appointmentEnd }) ||
               (slot.dateTime <= appointmentStart && slotEnd >= appointmentEnd);
      });
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
        availableSlots: availableSlots.map(slot => ({
          dateTime: slot.dateTime.toISOString(),
          time: format(slot.dateTime, 'HH:mm', { locale: es }),
          displayTime: format(slot.dateTime, 'h:mm a', { locale: es }),
          period: slot.period
        })),
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

function generateDaySlots(date: Date, businessHours: BusinessHours) {
  const slots = [];
  
  // Create a new date using the exact year, month, day to avoid timezone issues
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Morning slots (start - lunch or end if no lunch)
  const morningEnd = businessHours.lunchStart ? businessHours.lunchStart : businessHours.end;
  for (let hour = businessHours.start; hour < morningEnd; hour++) {
    const startMinute = hour === businessHours.start ? businessHours.startMinute : 0;
    // For morning slots, always go to full hour unless it's the last hour before lunch
    const endMinute = 60;
    
    for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
      // Create slot time with explicit year, month, day to maintain local timezone
      const slotTime = new Date(year, month, day, hour, minute, 0, 0);
      
      slots.push({
        dateTime: slotTime,
        period: 'morning'
      });
    }
  }
  
  // Afternoon slots (lunch end - end) - only if there's a lunch break
  if (businessHours.lunchStart && businessHours.lunchEnd) {
    for (let hour = businessHours.lunchEnd; hour < businessHours.end; hour++) {
      const startMinute = hour === businessHours.lunchEnd ? businessHours.lunchEndMinute : 0;
      // For afternoon slots, always go to full hour except for the last hour
      // If endMinute is 0 (meaning end at the top of the hour), treat it as if it goes to the full previous hour
      const endMinute = hour === businessHours.end - 1 ? (businessHours.endMinute || 60) : 60;
      
      for (let minute = startMinute; minute < endMinute; minute += businessHours.slotDuration) {
        // Create slot time with explicit year, month, day to maintain local timezone
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
    const slotDuration = duration || 30;
    const endDateTime = addMinutes(targetDateTime, slotDuration);

    // Verificar si está dentro del horario laboral
    const hour = targetDateTime.getHours();
    const dayOfWeek = targetDateTime.getDay();
    
    // Get business hours for this day
    const businessHours = await getBusinessHours(tenant.id, dayOfWeek);
    
    if (!businessHours) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Día no laborable'
      });
    }

    if (hour < businessHours.start || hour >= businessHours.end || 
        (businessHours.lunchStart && businessHours.lunchEnd && 
         hour >= businessHours.lunchStart && hour < businessHours.lunchEnd)) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Fuera del horario laboral'
      });
    }

    // Verificar conflictos con citas existentes
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        status: {
          notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']
        },
        ...(excludeAppointmentId && {
          id: { not: excludeAppointmentId }
        }),
        ...(staffId && {
          staffId: staffId
        }),
        AND: [
          {
            dateTime: {
              lt: endDateTime
            }
          },
          {
            dateTime: {
              gte: new Date(targetDateTime.getTime() - (slotDuration * 60000))
            }
          }
        ]
      },
      include: {
        customer: { select: { name: true } },
        pet: { select: { name: true } }
      }
    });

    if (conflictingAppointment) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Horario no disponible',
        conflict: {
          appointmentId: conflictingAppointment.id,
          dateTime: conflictingAppointment.dateTime,
          customer: conflictingAppointment.customer.name,
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