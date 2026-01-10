import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

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
}).passthrough(); // Allow extra fields from Prisma (id, tenantId, etc.)

export async function GET() {
  try {
    // Only admins can view business hours settings
    const { tenant } = await requirePermission('settings', 'read');

    // Get tenant settings with business hours
    let tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      include: {
        businessHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    // If no settings exist, create default ones
    if (!tenantSettings) {
      tenantSettings = await prisma.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultLunchStart: '13:00',
          defaultLunchEnd: '14:00',
          defaultSlotDuration: 15,
        },
        include: {
          businessHours: true
        }
      });
    }

    // If no business hours exist, create default ones (Monday to Saturday)
    if (tenantSettings.businessHours.length === 0) {
      const defaultBusinessHours = [];
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday
        defaultBusinessHours.push({
          tenantId: tenant.id,
          tenantSettingsId: tenantSettings.id,
          dayOfWeek,
          isWorkingDay,
          startTime: tenantSettings.defaultStartTime,
          endTime: tenantSettings.defaultEndTime,
          lunchStart: tenantSettings.defaultLunchStart,
          lunchEnd: tenantSettings.defaultLunchEnd,
          slotDuration: tenantSettings.defaultSlotDuration,
        });
      }

      await prisma.businessHours.createMany({
        data: defaultBusinessHours
      });

      // Fetch the updated settings
      tenantSettings = await prisma.tenantSettings.findUnique({
        where: { tenantId: tenant.id },
        include: {
          businessHours: {
            orderBy: { dayOfWeek: 'asc' }
          }
        }
      });
    }

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

    // Update tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        defaultStartTime: validatedData.defaultStartTime,
        defaultEndTime: validatedData.defaultEndTime,
        defaultLunchStart: validatedData.defaultLunchStart,
        defaultLunchEnd: validatedData.defaultLunchEnd,
        defaultSlotDuration: validatedData.defaultSlotDuration,
      },
      create: {
        tenantId: tenant.id,
        defaultStartTime: validatedData.defaultStartTime,
        defaultEndTime: validatedData.defaultEndTime,
        defaultLunchStart: validatedData.defaultLunchStart,
        defaultLunchEnd: validatedData.defaultLunchEnd,
        defaultSlotDuration: validatedData.defaultSlotDuration,
      }
    });

    // Get the tenant settings to get the ID
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id }
    });

    if (!tenantSettings) {
      throw new Error('Failed to create/update tenant settings');
    }

    // Update business hours for each day (only if businessHours array is provided)
    if (validatedData.businessHours && validatedData.businessHours.length > 0) {
      for (const businessHour of validatedData.businessHours) {
        // Cast to access potential id field from passthrough
        const hourWithId = businessHour as typeof businessHour & { id?: string };

        if (hourWithId.id) {
          // Update existing record by ID (most reliable)
          await prisma.businessHours.update({
            where: { id: hourWithId.id },
            data: {
              isWorkingDay: businessHour.isWorkingDay,
              startTime: businessHour.startTime,
              endTime: businessHour.endTime,
              lunchStart: businessHour.lunchStart,
              lunchEnd: businessHour.lunchEnd,
              slotDuration: businessHour.slotDuration || validatedData.defaultSlotDuration,
            }
          });
        } else {
          // Find existing record or create new one
          const existingHour = await prisma.businessHours.findFirst({
            where: {
              tenantId: tenant.id,
              locationId: null,
              dayOfWeek: businessHour.dayOfWeek
            }
          });

          if (existingHour) {
            await prisma.businessHours.update({
              where: { id: existingHour.id },
              data: {
                isWorkingDay: businessHour.isWorkingDay,
                startTime: businessHour.startTime,
                endTime: businessHour.endTime,
                lunchStart: businessHour.lunchStart,
                lunchEnd: businessHour.lunchEnd,
                slotDuration: businessHour.slotDuration || validatedData.defaultSlotDuration,
              }
            });
          } else {
            // Create new record
            await prisma.businessHours.create({
              data: {
                tenantId: tenant.id,
                tenantSettingsId: tenantSettings.id,
                dayOfWeek: businessHour.dayOfWeek,
                isWorkingDay: businessHour.isWorkingDay,
                startTime: businessHour.startTime,
                endTime: businessHour.endTime,
                lunchStart: businessHour.lunchStart,
                lunchEnd: businessHour.lunchEnd,
                slotDuration: businessHour.slotDuration || validatedData.defaultSlotDuration,
              }
            });
          }
        }
      }
    }

    // Fetch the updated settings
    const updatedSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      include: {
        businessHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
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