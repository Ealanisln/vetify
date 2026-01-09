import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { sendAppointmentConfirmation, sendAppointmentStaffNotification } from '@/lib/email/email-service';
import type { AppointmentConfirmationData, AppointmentStaffNotificationData } from '@/lib/email/types';
import { shouldSendNotification } from '@/lib/enhanced-settings';
import { parsePaginationParams, createPaginatedResponse } from '@/lib/pagination';

// Helper to transform empty strings to undefined
const emptyStringToUndefined = z.string().transform(val => val === '' ? undefined : val).optional();

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
  staffId: emptyStringToUndefined,
  locationId: emptyStringToUndefined,
});

export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId') || undefined;

    // Parse pagination params
    const paginationParams = parsePaginationParams(searchParams);

    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: tenant.id,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    if (startDate && endDate) {
      where.dateTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    // Get total count and appointments in parallel
    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
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
          },
          location: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        },
        orderBy: [
          { dateTime: 'asc' }
        ],
        skip: paginationParams.skip,
        take: paginationParams.limit,
      })
    ]);

    const response = createPaginatedResponse(appointments, total, paginationParams);

    return NextResponse.json({
      success: true,
      ...response
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
    
    // Verificar disponibilidad (no permitir citas superpuestas para el mismo veterinario)
    const appointmentDateTime = new Date(validatedData.dateTime);
    const endDateTime = new Date(appointmentDateTime.getTime() + validatedData.duration * 60000);

    // Solo verificar conflictos si hay un staff asignado
    if (validatedData.staffId) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: tenant.id,
          staffId: validatedData.staffId, // Solo conflictos con el mismo veterinario
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
                gte: new Date(appointmentDateTime.getTime() - (validatedData.duration * 60000))
              }
            }
          ]
        },
        include: {
          staff: { select: { name: true } }
        }
      });

      if (conflictingAppointment) {
        const staffName = conflictingAppointment.staff?.name || 'este veterinario';
        return NextResponse.json(
          { success: false, error: `${staffName} ya tiene una cita en este horario` },
          { status: 409 }
        );
      }
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
        locationId: validatedData.locationId,
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
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
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
    // Check notification preference before sending
    const sendConfirmation = await shouldSendNotification(tenant.id, 'appointmentConfirmation');
    if (sendConfirmation && appointment.customer.email) {
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

    // Send notification to assigned staff if exists
    // Check notification preference before sending
    const sendStaffNotification = await shouldSendNotification(tenant.id, 'staffAppointmentNotification');
    if (sendStaffNotification && appointment.staffId && appointment.staff) {
      // Get staff email
      const staffWithEmail = await prisma.staff.findUnique({
        where: { id: appointment.staffId },
        select: { email: true, name: true },
      });

      if (staffWithEmail?.email) {
        const appointmentTime = appointmentDateTime.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const staffEmailData: AppointmentStaffNotificationData = {
          template: 'appointment-staff-notification',
          to: {
            email: staffWithEmail.email,
            name: staffWithEmail.name,
          },
          subject: `Nueva Cita Asignada - ${appointment.pet.name}`,
          tenantId: tenant.id,
          data: {
            appointmentId: appointment.id,
            staffName: staffWithEmail.name,
            petName: appointment.pet.name,
            petSpecies: appointment.pet.species,
            petBreed: appointment.pet.breed || undefined,
            ownerName: appointment.customer.name,
            ownerPhone: appointment.customer.phone || undefined,
            appointmentDate: appointmentDateTime,
            appointmentTime,
            serviceName: appointment.reason,
            clinicName: appointment.tenant.name,
            notes: appointment.notes || undefined,
          },
        };

        // Send email without awaiting (fire and forget)
        sendAppointmentStaffNotification(staffEmailData).catch((error) => {
          console.error('[APPOINTMENT] Failed to send staff notification email:', error);
        });
      }
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