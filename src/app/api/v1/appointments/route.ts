/**
 * API v1 Appointments List/Create Endpoint
 *
 * GET /api/v1/appointments - List appointments
 * POST /api/v1/appointments - Create a new appointment
 *
 * Query Parameters (GET):
 * - locationId: Filter by location (string)
 * - start_date: Filter by start date (ISO string)
 * - end_date: Filter by end date (ISO string)
 * - status: Filter by status (string)
 * - petId: Filter by pet (string)
 * - customerId: Filter by customer (string)
 * - staffId: Filter by staff (string)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Number to skip (default: 0)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withApiAuth,
  parsePaginationParams,
  paginatedResponse,
  buildWhereClause,
  apiError,
} from '@/lib/api/api-key-auth';
import { serializeAppointmentWithRelations } from '../_shared/serializers';

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

// Validation schema for creating an appointment
const createAppointmentSchema = z.object({
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  duration: z.number().min(15).max(480).default(30),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(APPOINTMENT_STATUSES).default('SCHEDULED'),
  petId: z.string().uuid('Invalid pet ID'),
  customerId: z.string().uuid('Invalid customer ID').optional().nullable(),
  staffId: z.string().uuid('Invalid staff ID').optional().nullable(),
  locationId: z.string().uuid('Invalid location ID').optional().nullable(),
});

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(request);

    // Parse filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');
    const petId = searchParams.get('petId');
    const customerId = searchParams.get('customerId');
    const staffId = searchParams.get('staffId');

    // Build base where clause with tenant and location
    const baseWhere = buildWhereClause(apiKey, locationId, {});

    // Build date range filter
    const dateFilter =
      startDate || endDate
        ? {
            dateTime: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {};

    const where = {
      ...baseWhere,
      ...dateFilter,
      ...(status && { status }),
      ...(petId && { petId }),
      ...(customerId && { customerId }),
      ...(staffId && { staffId }),
    };

    // Fetch appointments and count in parallel
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
        orderBy: { dateTime: 'asc' },
        skip: pagination.offset,
        take: pagination.limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    const serializedAppointments = appointments.map(serializeAppointmentWithRelations);

    return NextResponse.json(paginatedResponse(serializedAppointments, total, pagination));
  },
  { requiredScope: 'read:appointments' }
);

export const POST = withApiAuth(
  async (request, { apiKey, locationId }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    // Validate input
    const result = createAppointmentSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = result.data;
    const appointmentDateTime = new Date(data.dateTime);

    // Verify pet exists and belongs to tenant
    const pet = await prisma.pet.findFirst({
      where: {
        id: data.petId,
        tenantId: apiKey.tenantId,
        isDeceased: false,
      },
      include: {
        customer: {
          select: { id: true },
        },
      },
    });

    if (!pet) {
      return apiError('Pet not found or is deceased', 'NOT_FOUND', 404);
    }

    // If API key is scoped to a location, verify pet belongs to that location
    if (locationId && pet.locationId && pet.locationId !== locationId) {
      return apiError('Pet does not belong to your location', 'FORBIDDEN', 403);
    }

    // Auto-set customerId from pet if not provided
    const effectiveCustomerId = data.customerId || pet.customer.id;

    // Verify customer if explicitly provided
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!customer) {
        return apiError('Customer not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Verify staff if provided
    if (data.staffId) {
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

    // Determine effective location ID
    const effectiveLocationId = locationId || data.locationId || pet.locationId || null;

    // Validate location if provided
    if (effectiveLocationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: effectiveLocationId,
          tenantId: apiKey.tenantId,
          isActive: true,
        },
      });

      if (!location) {
        return apiError('Location not found or inactive', 'NOT_FOUND', 404);
      }
    }

    // Check for conflicting appointments if staff is assigned
    if (data.staffId) {
      const endDateTime = new Date(appointmentDateTime.getTime() + data.duration * 60000);

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: apiKey.tenantId,
          staffId: data.staffId,
          status: {
            notIn: ['CANCELLED_CLIENT', 'CANCELLED_CLINIC', 'NO_SHOW'],
          },
          AND: [
            { dateTime: { lt: endDateTime } },
            { dateTime: { gte: new Date(appointmentDateTime.getTime() - data.duration * 60000) } },
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

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: apiKey.tenantId,
        petId: data.petId,
        customerId: effectiveCustomerId,
        staffId: data.staffId,
        locationId: effectiveLocationId,
        dateTime: appointmentDateTime,
        duration: data.duration,
        reason: data.reason,
        notes: data.notes,
        status: data.status,
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

    return NextResponse.json(
      { data: serializeAppointmentWithRelations(appointment) },
      { status: 201 }
    );
  },
  { requiredScope: 'write:appointments' }
);
