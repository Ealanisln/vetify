import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import {
  completeWeek,
  DEFAULT_SCHEDULE,
  getScheduleErrors,
  type DaySchedule,
  type ScheduleField,
} from '../../../../lib/business-hours';

// Time format regex for HH:MM validation
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Helper for optional time fields that can be null (from Prisma) or undefined
const optionalTimeField = z.string().regex(timeRegex, 'Formato de hora inválido').nullish();

const businessHoursSchema = z.object({
  defaultStartTime: z.string().regex(timeRegex, 'Formato de hora inválido'),
  defaultEndTime: z.string().regex(timeRegex, 'Formato de hora inválido'),
  defaultLunchStart: optionalTimeField,
  defaultLunchEnd: optionalTimeField,
  defaultSlotDuration: z.number().min(5).max(120),
  businessHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    isWorkingDay: z.boolean(),
    startTime: z.string().regex(timeRegex, 'Formato de hora inválido'),
    endTime: z.string().regex(timeRegex, 'Formato de hora inválido'),
    lunchStart: optionalTimeField,
    lunchEnd: optionalTimeField,
    slotDuration: z.number().min(5).max(120).nullish(),
  }).passthrough()).optional() // Make the array optional; passthrough allows extra Prisma fields (id, tenantId, etc.)
}).passthrough() // Allow extra fields from Prisma (id, tenantId, etc.)
  .superRefine((data, ctx) => {
    const defaultFieldNames: Record<ScheduleField, string> = {
      startTime: 'defaultStartTime',
      endTime: 'defaultEndTime',
      lunchStart: 'defaultLunchStart',
      lunchEnd: 'defaultLunchEnd',
    };
    for (const error of getScheduleErrors({
      startTime: data.defaultStartTime,
      endTime: data.defaultEndTime,
      lunchStart: data.defaultLunchStart,
      lunchEnd: data.defaultLunchEnd,
    })) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [defaultFieldNames[error.field]], message: error.message });
    }

    // Closed days keep whatever times they had; only open days must be coherent.
    data.businessHours?.forEach((day, index) => {
      if (!day.isWorkingDay) return;
      const schedule: DaySchedule = {
        startTime: day.startTime,
        endTime: day.endTime,
        lunchStart: day.lunchStart,
        lunchEnd: day.lunchEnd,
      };
      for (const error of getScheduleErrors(schedule)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['businessHours', index, error.field], message: error.message });
      }
    });
  });

export async function GET() {
  try {
    // Only admins can view business hours settings
    const { tenant } = await requirePermission('settings', 'read');

    // Read-only: tenants without settings or rows (created before signup
    // seeding) get the default week in memory. Rows are written on save only,
    // so concurrent GETs can no longer seed duplicate weeks.
    const storedSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      include: {
        businessHours: {
          where: { locationId: null },
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    const defaults = storedSettings ?? {
      tenantId: tenant.id,
      defaultStartTime: DEFAULT_SCHEDULE.startTime,
      defaultEndTime: DEFAULT_SCHEDULE.endTime,
      defaultLunchStart: DEFAULT_SCHEDULE.lunchStart,
      defaultLunchEnd: DEFAULT_SCHEDULE.lunchEnd,
      defaultSlotDuration: DEFAULT_SCHEDULE.slotDuration,
    };

    const tenantSettings = {
      ...defaults,
      businessHours: completeWeek(storedSettings?.businessHours ?? [], defaults),
    };

    return NextResponse.json({
      success: true,
      data: tenantSettings
    });

  } catch (error) {
    console.error('Error fetching business hours:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver la configuración' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Only admins can update business hours settings
    const { tenant } = await requirePermission('settings', 'write');
    const body = await request.json();

    const validatedData = businessHoursSchema.parse(body);
    // The form sends the whole schedule; an absent lunch means "Sin comida".
    const defaultLunchStart = validatedData.defaultLunchStart ?? null;
    const defaultLunchEnd = validatedData.defaultLunchEnd ?? null;

    const updatedSettings = await prisma.$transaction(async (tx) => {
      const tenantSettings = await tx.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: {
          defaultStartTime: validatedData.defaultStartTime,
          defaultEndTime: validatedData.defaultEndTime,
          defaultLunchStart,
          defaultLunchEnd,
          defaultSlotDuration: validatedData.defaultSlotDuration,
        },
        create: {
          tenantId: tenant.id,
          defaultStartTime: validatedData.defaultStartTime,
          defaultEndTime: validatedData.defaultEndTime,
          defaultLunchStart,
          defaultLunchEnd,
          defaultSlotDuration: validatedData.defaultSlotDuration,
        }
      });

      // Rows are addressed by (tenant, tenant-level location, day), never by an
      // id from the request body, so a caller can only write its own tenant.
      for (const businessHour of validatedData.businessHours ?? []) {
        const data = {
          isWorkingDay: businessHour.isWorkingDay,
          startTime: businessHour.startTime,
          endTime: businessHour.endTime,
          lunchStart: businessHour.lunchStart ?? null,
          lunchEnd: businessHour.lunchEnd ?? null,
          slotDuration: businessHour.slotDuration || validatedData.defaultSlotDuration,
        };

        const { count } = await tx.businessHours.updateMany({
          where: { tenantId: tenant.id, locationId: null, dayOfWeek: businessHour.dayOfWeek },
          data,
        });

        if (count === 0) {
          await tx.businessHours.create({
            data: {
              tenantId: tenant.id,
              tenantSettingsId: tenantSettings.id,
              dayOfWeek: businessHour.dayOfWeek,
              ...data,
            }
          });
        }
      }

      return tx.tenantSettings.findUnique({
        where: { tenantId: tenant.id },
        include: {
          businessHours: {
            where: { locationId: null },
            orderBy: { dayOfWeek: 'asc' }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings && {
        ...updatedSettings,
        businessHours: completeWeek(updatedSettings.businessHours, updatedSettings),
      },
      message: 'Horarios de atención actualizados exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating business hours:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para modificar la configuración' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 