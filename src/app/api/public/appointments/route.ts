import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { findOrCreateCustomer, createPublicAppointmentRequest } from '@/lib/customer-identification';
import { z } from 'zod';

const appointmentRequestSchema = z.object({
  tenantSlug: z.string(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
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