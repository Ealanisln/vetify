import { NextRequest, NextResponse } from 'next/server';
import { runAfterResponse } from '@/lib/after-response';
import { getTenantBySlug } from '../../../../lib/tenant';
import { findOrCreateCustomer, createPublicAppointmentRequest } from '../../../../lib/customer-identification';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { addMinutes } from 'date-fns';
import {
  DEFAULT_CLINIC_TIME_ZONE,
  clinicDateTime,
  clinicDayRange,
  parseClinicDate,
} from '../../../../lib/clinic-timezone';
import type { AnalyticsEventType } from '@prisma/client';

const appointmentRequestSchema = z.object({
  tenantSlug: z.string(),
  customerName: z.string().min(1),
  sessionId: z.string().uuid().optional(), // For analytics tracking
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  petId: z.string().optional(), // ID de mascota existente seleccionada
  petName: z.string().min(1),
  service: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = appointmentRequestSchema.parse(body);

    const tenant = await getTenantBySlug(validatedData.tenantSlug);
    
    if (!tenant || !tenant.publicBookingEnabled) {
      return NextResponse.json(
        { error: 'Booking not available for this clinic' },
        { status: 404 }
      );
    }

    // 📅 VALIDACIÓN DE DISPONIBILIDAD (si se proporciona fecha y hora)
    if (validatedData.preferredDate && validatedData.preferredTime) {
      const appointmentDuration = 30; // Default duration in minutes

      // preferredDate + preferredTime are clinic wall-clock labels; resolve
      // them in the clinic timezone (the server runs in UTC).
      const timeZone = tenant.timeZone ?? DEFAULT_CLINIC_TIME_ZONE;
      const clinicDate = parseClinicDate(validatedData.preferredDate, timeZone);
      const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(validatedData.preferredTime);
      if (!clinicDate || !validTime) {
        return NextResponse.json({
          success: false,
          error: 'Fecha u hora inválida'
        }, { status: 400 });
      }
      const requestedDateTime = clinicDateTime(clinicDate, validatedData.preferredTime, timeZone);
      const requestedEndTime = addMinutes(requestedDateTime, appointmentDuration);

      // Check if the date is in the past
      const now = new Date();
      if (requestedDateTime < now) {
        return NextResponse.json({
          success: false,
          error: 'No se pueden agendar citas en el pasado'
        }, { status: 400 });
      }

      // Check for conflicts with existing appointments
      // Un conflicto ocurre cuando:
      // - La cita existente empieza antes de que termine la nueva Y
      // - La cita existente termina después de que empiece la nueva
      // Esto detecta cualquier solapamiento

      // Find appointments that could potentially conflict (on the same clinic day)
      const { start: dayStart, end: dayEnd } = clinicDayRange(clinicDate, timeZone);
      const potentialConflicts = await prisma.appointment.findMany({
        where: {
          tenantId: tenant.id,
          status: {
            notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']
          },
          dateTime: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        select: {
          id: true,
          dateTime: true,
          duration: true
        }
      });

      // Check each appointment for time overlap
      const conflictingAppointment = potentialConflicts.find(existing => {
        const existingStart = existing.dateTime.getTime();
        const existingEnd = existingStart + (existing.duration * 60000);
        const requestedStart = requestedDateTime.getTime();
        const requestedEnd = requestedEndTime.getTime();

        // Overlap occurs when: existingStart < requestedEnd AND existingEnd > requestedStart
        const hasOverlap = existingStart < requestedEnd && existingEnd > requestedStart;

        return hasOverlap;
      });

      if (conflictingAppointment) {
        return NextResponse.json({
          success: false,
          error: 'El horario seleccionado ya no está disponible. Por favor selecciona otro horario.',
          conflictType: 'appointment'
        }, { status: 409 });
      }

      // Check for conflicts with confirmed appointment requests. preferredDate
      // is a calendar date stored at UTC midnight, so match the UTC calendar day.
      const startOfDay = new Date(`${clinicDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${clinicDate}T23:59:59.999Z`);

      const conflictingRequest = await prisma.appointmentRequest.findFirst({
        where: {
          tenantId: tenant.id,
          status: 'CONFIRMED',
          preferredDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          preferredTime: validatedData.preferredTime
        }
      });

      if (conflictingRequest) {
        return NextResponse.json({
          success: false,
          error: 'El horario seleccionado ya no está disponible. Por favor selecciona otro horario.',
          conflictType: 'request'
        }, { status: 409 });
      }
    }

    // 🔍 IDENTIFICACIÓN INTELIGENTE DE CLIENTE
    const identificationResult = await findOrCreateCustomer({
      tenantId: tenant.id,
      phone: validatedData.customerPhone,
      email: validatedData.customerEmail || undefined,
      name: validatedData.customerName
    });

    // 📅 CREAR SOLICITUD DE CITA
    const appointmentRequest = await createPublicAppointmentRequest({
      tenantId: tenant.id,
      customerId: identificationResult.customer.id,
      appointmentData: {
        petId: validatedData.petId,
        petName: validatedData.petName,
        service: validatedData.service,
        preferredDate: validatedData.preferredDate,
        preferredTime: validatedData.preferredTime,
        notes: validatedData.notes
      },
      identificationResult
    });

    // 📧 ENVIAR NOTIFICACIONES (implementar después)
    // await sendAppointmentNotification({
    //   tenant,
    //   appointmentRequest,
    //   customer: identificationResult.customer,
    //   identificationStatus: identificationResult.status
    // });

    // 📈 TRACK CONVERSION (non-blocking)
    if (validatedData.sessionId) {
      const sessionId = validatedData.sessionId;
      runAfterResponse(
        () => prisma.landingPageAnalytics.create({
          data: {
            tenantId: tenant.id,
            eventType: 'CONVERSION' as AnalyticsEventType,
            eventName: 'appointment_booked',
            pageSlug: 'agendar',
            sessionId,
            conversionId: appointmentRequest.id,
          },
        }),
        '[Analytics] Failed to track conversion:'
      );
    }

    // Generic answer: an anonymous caller must not learn whether the phone or
    // name belongs to a client, nor anything about that client or others.
    return NextResponse.json({
      success: true,
      message: 'Solicitud de cita recibida',
      data: {
        appointmentRequest: {
          id: appointmentRequest.id,
          petName: appointmentRequest.petName,
          service: appointmentRequest.service,
          preferredDate: appointmentRequest.preferredDate,
          status: appointmentRequest.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating appointment request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Public appointments API is running' },
    { status: 200 }
  );
} 