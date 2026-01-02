import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import {
  sendAppointmentCancellation,
  sendAppointmentRescheduled,
} from '@/lib/email/email-service';
import type {
  AppointmentCancellationData,
  AppointmentRescheduledData,
} from '@/lib/email/types';
import { shouldSendNotification } from '@/lib/enhanced-settings';

const updateAppointmentSchema = z.object({
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  duration: z.number().min(15).max(300).optional(),
  customerId: z.string().optional(),
  petId: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  staffId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await context.params;
    const appointmentId = id;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
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
        }
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    // Log error for production monitoring
    console.error('[APPOINTMENT] Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await context.params;
    const appointmentId = id;
    const body = await request.json();

    // Validar datos
    const validatedData = updateAppointmentSchema.parse(body);

    // Verificar que la cita existe y pertenece al tenant
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId: tenant.id
      }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar cliente y mascota si se actualizan
    if (validatedData.customerId) {
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
    }

    if (validatedData.petId) {
      const customerId = validatedData.customerId || existingAppointment.customerId;
      const pet = await prisma.pet.findFirst({
        where: {
          id: validatedData.petId,
          customerId: customerId
        }
      });

      if (!pet) {
        return NextResponse.json(
          { success: false, error: 'Mascota no encontrada' },
          { status: 404 }
        );
      }
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

    // Verificar disponibilidad si se cambia la fecha/hora
    if (validatedData.dateTime || validatedData.duration || validatedData.staffId !== undefined) {
      const appointmentDateTime = validatedData.dateTime
        ? new Date(validatedData.dateTime)
        : existingAppointment.dateTime;
      const duration = validatedData.duration || existingAppointment.duration;
      const staffId = validatedData.staffId !== undefined ? validatedData.staffId : existingAppointment.staffId;
      const endDateTime = new Date(appointmentDateTime.getTime() + duration * 60000);

      // Solo verificar conflictos si hay un staff asignado
      if (staffId) {
        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            tenantId: tenant.id,
            id: { not: appointmentId }, // Excluir la cita actual
            staffId: staffId, // Solo conflictos con el mismo veterinario
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
                  gte: new Date(appointmentDateTime.getTime() - (duration * 60000))
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
    }

    // Actualizar la cita
    const updateData: Record<string, unknown> = {};

    if (validatedData.dateTime) updateData.dateTime = new Date(validatedData.dateTime);
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.customerId) updateData.customerId = validatedData.customerId;
    if (validatedData.petId) updateData.petId = validatedData.petId;
    if (validatedData.reason) updateData.reason = validatedData.reason;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.staffId !== undefined) updateData.staffId = validatedData.staffId || null;
    if (validatedData.locationId !== undefined) updateData.locationId = validatedData.locationId || null;

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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

    // Determine what type of notification to send
    const wasCancelled =
      validatedData.status &&
      (validatedData.status === 'CANCELLED_CLIENT' || validatedData.status === 'CANCELLED_CLINIC') &&
      existingAppointment.status !== 'CANCELLED_CLIENT' &&
      existingAppointment.status !== 'CANCELLED_CLINIC';

    const wasRescheduled =
      validatedData.dateTime &&
      existingAppointment.dateTime.getTime() !== new Date(validatedData.dateTime).getTime() &&
      !wasCancelled;

    // Send appropriate notification email (check preferences first)
    if (appointment.customer.email) {
      if (wasCancelled) {
        // Check notification preference before sending
        const sendCancellation = await shouldSendNotification(tenant.id, 'appointmentCancellation');
        if (sendCancellation) {
          // Send cancellation email
          const cancelledBy = validatedData.status === 'CANCELLED_CLIENT' ? 'CLIENT' : 'CLINIC';
          const appointmentTime = existingAppointment.dateTime.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const cancellationEmailData: AppointmentCancellationData = {
            template: 'appointment-cancellation',
            to: {
              email: appointment.customer.email,
              name: appointment.customer.name,
            },
            subject: `Cita Cancelada - ${appointment.pet.name}`,
            tenantId: tenant.id,
            data: {
              appointmentId: appointment.id,
              petName: appointment.pet.name,
              ownerName: appointment.customer.name,
              appointmentDate: existingAppointment.dateTime,
              appointmentTime,
              serviceName: appointment.reason,
              clinicName: appointment.tenant.name,
              clinicPhone: appointment.tenant.publicPhone || undefined,
              cancelledBy,
              cancellationReason: validatedData.notes,
            },
          };

          sendAppointmentCancellation(cancellationEmailData).catch((error) => {
            console.error('[APPOINTMENT] Failed to send cancellation email:', error);
          });
        }
      } else if (wasRescheduled) {
        // Check notification preference before sending
        const sendRescheduled = await shouldSendNotification(tenant.id, 'appointmentRescheduled');
        if (sendRescheduled) {
          // Send rescheduled email
          const previousTime = existingAppointment.dateTime.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const newTime = appointment.dateTime.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const rescheduledEmailData: AppointmentRescheduledData = {
            template: 'appointment-rescheduled',
            to: {
              email: appointment.customer.email,
              name: appointment.customer.name,
            },
            subject: `Cita Reprogramada - ${appointment.pet.name}`,
            tenantId: tenant.id,
            data: {
              appointmentId: appointment.id,
              petName: appointment.pet.name,
              ownerName: appointment.customer.name,
              previousDate: existingAppointment.dateTime,
              previousTime,
              newDate: appointment.dateTime,
              newTime,
              serviceName: appointment.reason,
              clinicName: appointment.tenant.name,
              clinicAddress: appointment.tenant.publicAddress || undefined,
              clinicPhone: appointment.tenant.publicPhone || undefined,
              veterinarianName: appointment.staff?.name,
            },
          };

          sendAppointmentRescheduled(rescheduledEmailData).catch((error) => {
            console.error('[APPOINTMENT] Failed to send rescheduled email:', error);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    // Log error for production monitoring
    console.error('[APPOINTMENT] Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth();
    const { id } = await context.params;
    const appointmentId = id;

    // Verificar que la cita existe y pertenece al tenant
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId: tenant.id
      }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // En lugar de eliminar físicamente, marcamos como cancelada
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED_CLINIC',
        notes: existingAppointment.notes
          ? `${existingAppointment.notes}\n\nCancelada desde el sistema el ${new Date().toISOString()}`
          : `Cancelada desde el sistema el ${new Date().toISOString()}`
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
          }
        }
      }
    });

    // Send cancellation email to customer (check preferences first)
    const sendCancellation = await shouldSendNotification(tenant.id, 'appointmentCancellation');
    if (sendCancellation && appointment.customer.email) {
      const appointmentTime = existingAppointment.dateTime.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const cancellationEmailData: AppointmentCancellationData = {
        template: 'appointment-cancellation',
        to: {
          email: appointment.customer.email,
          name: appointment.customer.name,
        },
        subject: `Cita Cancelada - ${appointment.pet.name}`,
        tenantId: tenant.id,
        data: {
          appointmentId: appointment.id,
          petName: appointment.pet.name,
          ownerName: appointment.customer.name,
          appointmentDate: existingAppointment.dateTime,
          appointmentTime,
          serviceName: existingAppointment.reason,
          clinicName: appointment.tenant.name,
          clinicPhone: appointment.tenant.publicPhone || undefined,
          cancelledBy: 'CLINIC',
        },
      };

      sendAppointmentCancellation(cancellationEmailData).catch((error) => {
        console.error('[APPOINTMENT] Failed to send cancellation email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Cita cancelada exitosamente'
    });

  } catch (error) {
    // Log error for production monitoring
    console.error('[APPOINTMENT] Error cancelling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}