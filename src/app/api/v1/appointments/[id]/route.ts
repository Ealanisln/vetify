/**
 * API v1 Appointment Detail Endpoint
 *
 * GET /api/v1/appointments/:id - Get a specific appointment
 * PUT /api/v1/appointments/:id - Update an appointment
 * DELETE /api/v1/appointments/:id - Cancel an appointment
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withApiAuth, apiError } from '@/lib/api/api-key-auth';
import { serializeAppointmentWithRelations } from '../../_shared/serializers';
import { triggerWebhookEvent } from '@/lib/webhooks';

// Valid appointment statuses
const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_CLIENT',
  'CANCELLED_CLINIC',
  'NO_SHOW',
] as const;

// Validation schema for updating an appointment
const updateAppointmentSchema = z.object({
  dateTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
  duration: z.number().min(15).max(480).optional(),
  reason: z.string().min(1).max(500).optional(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  staffId: z.string().uuid('Invalid staff ID').optional().nullable(),
  locationId: z.string().uuid('Invalid location ID').optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Appointment ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!appointment) {
      return apiError('Appointment not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({ data: serializeAppointmentWithRelations(appointment) });
  },
  { requiredScope: 'read:appointments' }
);

export const PUT = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Appointment ID is required', 'BAD_REQUEST', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = updateAppointmentSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if appointment exists
    const existing = await prisma.appointment.findFirst({ where });
    if (!existing) {
      return apiError('Appointment not found', 'NOT_FOUND', 404);
    }

    // Don't allow updates to cancelled or completed appointments
    const finalStatuses = ['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'];
    if (finalStatuses.includes(existing.status) && data.status === undefined) {
      return apiError(
        'Cannot modify a completed or cancelled appointment',
        'CONFLICT',
        409
      );
    }

    // Verify staff if changing
    if (data.staffId && data.staffId !== existing.staffId) {
      const staff = await prisma.staff.findFirst({
        where: {
          id: data.staffId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!staff) {
        return apiError('Staff not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Verify location if changing
    if (data.locationId && data.locationId !== existing.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: data.locationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!location) {
        return apiError('Location not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Check for conflicts if time or staff is changing
    const newDateTime = data.dateTime ? new Date(data.dateTime) : existing.dateTime;
    const newDuration = data.duration ?? existing.duration;
    const newStaffId = data.staffId !== undefined ? data.staffId : existing.staffId;

    if (newStaffId && (data.dateTime || data.duration || data.staffId)) {
      const endDateTime = new Date(newDateTime.getTime() + newDuration * 60000);

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: apiKey.tenantId,
          staffId: newStaffId,
          id: { not: id },
          status: {
            notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'],
          },
          AND: [
            { dateTime: { lt: endDateTime } },
            { dateTime: { gte: new Date(newDateTime.getTime() - newDuration * 60000) } },
          ],
        },
      });

      if (conflictingAppointment) {
        return apiError(
          'Staff member has a conflicting appointment at this time',
          'CONFLICT',
          409
        );
      }
    }

    // Update the appointment
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.dateTime !== undefined && { dateTime: new Date(data.dateTime) }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.staffId !== undefined && { staffId: data.staffId }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Trigger appropriate webhook event based on status change (fire-and-forget)
    const cancelledStatuses = ['CANCELLED_CLIENT', 'CANCELLED_CLINIC'];
    const serialized = serializeAppointmentWithRelations(appointment);

    if (data.status && cancelledStatuses.includes(data.status) && !cancelledStatuses.includes(existing.status)) {
      triggerWebhookEvent(apiKey.tenantId, 'appointment.cancelled', serialized);
    } else {
      triggerWebhookEvent(apiKey.tenantId, 'appointment.updated', serialized);
    }

    return NextResponse.json({ data: serialized });
  },
  { requiredScope: 'write:appointments' }
);

export const DELETE = withApiAuth(
  async (request, { apiKey, locationId, params }) => {
    const id = params?.id;

    if (!id) {
      return apiError('Appointment ID is required', 'BAD_REQUEST', 400);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      id,
      tenantId: apiKey.tenantId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Check if appointment exists
    const existing = await prisma.appointment.findFirst({ where });
    if (!existing) {
      return apiError('Appointment not found', 'NOT_FOUND', 404);
    }

    // Don't allow cancelling already cancelled or completed appointments
    const finalStatuses = ['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'];
    if (finalStatuses.includes(existing.status)) {
      return apiError(
        'Appointment is already completed or cancelled',
        'CONFLICT',
        409
      );
    }

    // Cancel the appointment (via API implies clinic-initiated)
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED_CLINIC' },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Trigger webhook event (fire-and-forget)
    triggerWebhookEvent(apiKey.tenantId, 'appointment.cancelled', serializeAppointmentWithRelations(appointment));

    return new NextResponse(null, { status: 204 });
  },
  { requiredScope: 'write:appointments' }
);
