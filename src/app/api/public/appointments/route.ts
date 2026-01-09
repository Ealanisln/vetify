import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '../../../../lib/tenant';
import { findOrCreateCustomer, createPublicAppointmentRequest } from '../../../../lib/customer-identification';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { addMinutes } from 'date-fns';
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

      // Parse the date and time as UTC to match how PostgreSQL stores timestamps
      // La BD almacena timestamps sin timezone, y Prisma los interpreta como UTC
      // Por lo tanto, debemos crear la fecha del request como UTC también
      const dateTimeString = `${validatedData.preferredDate}T${validatedData.preferredTime}:00.000Z`;
      const requestedDateTime = new Date(dateTimeString);
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

      // Find appointments that could potentially conflict (on the same day)
      const potentialConflicts = await prisma.appointment.findMany({
        where: {
          tenantId: tenant.id,
          status: {
            notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW']
          },
          dateTime: {
            gte: new Date(`${validatedData.preferredDate}T00:00:00.000Z`),
            lt: new Date(`${validatedData.preferredDate}T23:59:59.999Z`)
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

      // Check for conflicts with confirmed appointment requests
      // Use UTC dates to match PostgreSQL storage
      const startOfDay = new Date(`${validatedData.preferredDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${validatedData.preferredDate}T23:59:59.999Z`);

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
      prisma.landingPageAnalytics.create({
        data: {
          tenantId: tenant.id,
          eventType: 'CONVERSION' as AnalyticsEventType,
          eventName: 'appointment_booked',
          pageSlug: 'agendar',
          sessionId: validatedData.sessionId,
          conversionId: appointmentRequest.id,
        },
      }).catch((err) => {
        // Don't fail the request if analytics fails
        console.error('[Analytics] Failed to track conversion:', err);
      });
    }

    // 📊 RESPUESTA CON INFORMACIÓN DE IDENTIFICACIÓN
    return NextResponse.json({
      success: true,
      message: 'Appointment request created successfully',
      data: {
        appointmentRequest: {
          id: appointmentRequest.id,
          petName: appointmentRequest.petName,
          service: appointmentRequest.service,
          preferredDate: appointmentRequest.preferredDate,
          status: appointmentRequest.status
        },
        customerStatus: identificationResult.status,
        existingPets: identificationResult.existingPets || [],
        hasAccount: identificationResult.hasUserAccount,
        confidence: identificationResult.confidence,
        loginPrompt: identificationResult.hasUserAccount ? {
          message: "¡Te reconocemos! Inicia sesión para ver tu historial completo",
          loginUrl: `/sign-in?redirect=dashboard${identificationResult.customer.email ? `&email=${identificationResult.customer.email}` : ''}`
        } : null,
        similarCustomers: identificationResult.status === 'needs_review' 
          ? identificationResult.similarCustomers?.slice(0, 2) 
          : null
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