import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { sendAppointmentConfirmation } from '@/lib/email/email-service';
import type { AppointmentConfirmationData } from '@/lib/email/types';

// Schema de validación para las citas
const appointmentSchema = z.object({
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  duration: z.number().min(15).max(300).default(30),
  customerId: z.string(),
  petId: z.string(),
  reason: z.string(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']).default('SCHEDULED'),
  notes: z.string().optional(),
  staffId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');
    
    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: tenant.id,
    };
    
    if (startDate && endDate) {
      where.dateTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    // Obtener citas con información relacionada
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        }
      },
      orderBy: [
        { dateTime: 'asc' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: appointments
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
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
    
    // Validar datos
    const validatedData = appointmentSchema.parse(body);
    
    // Verificar que el cliente y la mascota existan y pertenezcan al tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: validatedData.customerId,
        tenantId: tenant.id
      }
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }
    
    const pet = await prisma.pet.findFirst({
      where: {
        id: validatedData.petId,
        customerId: validatedData.customerId
      }
    });
    
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Mascota no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar staff si se proporciona
    if (validatedData.staffId) {
      const staff = await prisma.staff.findFirst({
        where: {
          id: validatedData.staffId,
          tenantId: tenant.id,
          isActive: true
        }
      });
      
      if (!staff) {
        return NextResponse.json(
          { success: false, error: 'Staff no encontrado' },
          { status: 404 }
        );
      }
    }
    
    // Verificar disponibilidad (no permitir citas superpuestas en el mismo horario)
    const appointmentDateTime = new Date(validatedData.dateTime);
    const endDateTime = new Date(appointmentDateTime.getTime() + validatedData.duration * 60000);
    
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        status: {
          notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']
        },
        AND: [
          {
            dateTime: {
              lt: endDateTime
            }
          },
                     {
             dateTime: {
               gte: new Date(appointmentDateTime.getTime() - (120 * 60000)) // 2 horas antes
             }
           }
        ]
      }
    });
    
    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una cita en este horario' },
        { status: 409 }
      );
    }
    
    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        dateTime: appointmentDateTime,
        duration: validatedData.duration,
        customerId: validatedData.customerId,
        petId: validatedData.petId,
        reason: validatedData.reason,
        status: validatedData.status,
        notes: validatedData.notes,
        staffId: validatedData.staffId,
        tenantId: tenant.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            publicPhone: true,
            publicAddress: true,
          }
        }
      }
    });

    // Send confirmation email asynchronously (don't block response)
    if (appointment.customer.email) {
      const appointmentTime = appointmentDateTime.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const emailData: AppointmentConfirmationData = {
        template: 'appointment-confirmation',
        to: {
          email: appointment.customer.email,
          name: appointment.customer.name,
        },
        subject: `Confirmación de Cita - ${appointment.pet.name}`,
        tenantId: tenant.id,
        data: {
          appointmentId: appointment.id,
          petName: appointment.pet.name,
          ownerName: appointment.customer.name,
          appointmentDate: appointmentDateTime,
          appointmentTime,
          serviceName: appointment.reason,
          clinicName: appointment.tenant.name,
          clinicAddress: appointment.tenant.publicAddress || undefined,
          clinicPhone: appointment.tenant.publicPhone || undefined,
          veterinarianName: appointment.staff?.name,
          notes: appointment.notes || undefined,
        },
      };

      // Send email without awaiting (fire and forget)
      sendAppointmentConfirmation(emailData).catch((error) => {
        console.error('[APPOINTMENT] Failed to send confirmation email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: appointment
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 