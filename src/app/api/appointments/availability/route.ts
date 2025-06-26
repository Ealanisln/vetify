import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addMinutes, format, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const availabilitySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  duration: z.number().min(15).max(300).default(30),
  staffId: z.string().optional(),
  excludeAppointmentId: z.string().optional(), // Para edición de citas
});

// Configuración de horarios de trabajo (esto podría venir de la base de datos)
const BUSINESS_HOURS = {
  start: 8, // 8:00 AM
  end: 18,  // 6:00 PM
  lunchStart: 13, // 1:00 PM
  lunchEnd: 14,   // 2:00 PM
  slotDuration: 15, // 15 minutos
  workingDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
};

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');
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

    const targetDate = parseISO(validatedData.date);
    const dayOfWeek = targetDate.getDay();

    // Verificar si es día laborable
    if (!BUSINESS_HOURS.workingDays.includes(dayOfWeek)) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedData.date,
          availableSlots: [],
          message: 'Día no laborable'
        }
      });
    }

    // Generar slots disponibles del día
    const slots = generateDaySlots(targetDate);

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
        businessHours: BUSINESS_HOURS,
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

function generateDaySlots(date: Date) {
  const slots = [];
  const baseDate = new Date(date);
  
  // Slots de la mañana (8:00 - 13:00)
  for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.lunchStart; hour++) {
    for (let minute = 0; minute < 60; minute += BUSINESS_HOURS.slotDuration) {
      const slotTime = new Date(baseDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      slots.push({
        dateTime: slotTime,
        period: 'morning'
      });
    }
  }
  
  // Slots de la tarde (14:00 - 18:00)
  for (let hour = BUSINESS_HOURS.lunchEnd; hour < BUSINESS_HOURS.end; hour++) {
    for (let minute = 0; minute < 60; minute += BUSINESS_HOURS.slotDuration) {
      const slotTime = new Date(baseDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      slots.push({
        dateTime: slotTime,
        period: 'afternoon'
      });
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
    
    if (!BUSINESS_HOURS.workingDays.includes(dayOfWeek)) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Día no laborable'
      });
    }

    if (hour < BUSINESS_HOURS.start || hour >= BUSINESS_HOURS.end || 
        (hour >= BUSINESS_HOURS.lunchStart && hour < BUSINESS_HOURS.lunchEnd)) {
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