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
import { evaluateStatusChange, isCancelledStatus } from '@/lib/appointments/status-transitions';
import { findConflictingAppointment, v1ConflictMessage } from '@/lib/appointments/conflicts';

/** Prisma raises P2025 when a guarded update matches no row */
const isRecordNotFound = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025';

const concurrentChangeError = () =>
  apiError(
    'Appointment status changed concurrently; fetch it again and retry',
    'CONFLICT',
    409
  );

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

    // Status changes must follow the allowed-transition map
    const statusChange = data.status ? evaluateStatusChange(existing.status, data.status) : null;
    if (statusChange?.type === 'invalid') {
      return apiError(
        `Invalid status transition from ${existing.status} to ${data.status}`,
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

    // Check for conflicts if time, duration or staff is changing
    if (data.dateTime || data.duration || data.staffId !== undefined) {
      const newStaffId = data.staffId !== undefined ? data.staffId : existing.staffId;
      const conflictingAppointment = await findConflictingAppointment({
        tenantId: apiKey.tenantId,
        start: data.dateTime ? new Date(data.dateTime) : existing.dateTime,
        durationMinutes: data.duration ?? existing.duration,
        staffId: newStaffId,
        locationId: data.locationId !== undefined ? data.locationId : existing.locationId,
        excludeAppointmentId: id,
      });

      if (conflictingAppointment) {
        return apiError(v1ConflictMessage(newStaffId), 'CONFLICT', 409);
      }
    }

    // Update the appointment. A status change only applies if nobody changed
    // the status since we read it; "unchanged" (e.g. re-cancel) keeps it as is.
    const statusChanges = statusChange?.type === 'allowed';
    const appointment = await prisma.appointment.update({
      where: { id, tenantId: apiKey.tenantId, ...(statusChanges && { status: existing.status }) },
      data: {
        ...(data.dateTime !== undefined && { dateTime: new Date(data.dateTime) }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(statusChanges && { status: data.status }),
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
    }).catch((error: unknown) => {
      if (isRecordNotFound(error)) return null;
      throw error;
    });

    if (!appointment) {
      return concurrentChangeError();
    }

    // Trigger appropriate webhook event based on status change (fire-and-forget)
    const serialized = serializeAppointmentWithRelations(appointment);

    if (statusChanges && isCancelledStatus(data.status!)) {
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
    // Guarded on the status we read, so concurrent cancels only win once
    const appointment = await prisma.appointment.update({
      where: { id, tenantId: apiKey.tenantId, status: existing.status },
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
    }).catch((error: unknown) => {
      if (isRecordNotFound(error)) return null;
      throw error;
    });

    if (!appointment) {
      return concurrentChangeError();
    }

    // Trigger webhook event (fire-and-forget)
    triggerWebhookEvent(apiKey.tenantId, 'appointment.cancelled', serializeAppointmentWithRelations(appointment));

    return new NextResponse(null, { status: 204 });
  },
  { requiredScope: 'write:appointments' }
);
