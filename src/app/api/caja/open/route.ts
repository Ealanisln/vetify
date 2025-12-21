import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { checkCashRegisterLimit, checkShiftManagementAccess } from '../../../../lib/plan-limits';
import { z } from 'zod';

const openDrawerSchema = z.object({
  tenantId: z.string(),
  locationId: z.string().optional(),
  initialAmount: z.number().min(0),
  staffId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const { user, tenant } = await requireAuth();
    const body = await request.json();

    const { tenantId, locationId, initialAmount, staffId } = openDrawerSchema.parse(body);

    // Verificar que el tenant coincida
    if (tenantId !== tenant.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar límite de cajas según el plan
    const limitCheck = await checkCashRegisterLimit(tenantId);
    if (!limitCheck.canAdd) {
      return NextResponse.json(
        {
          error: 'Has alcanzado el límite de cajas de tu plan',
          limit: limitCheck.limit,
          current: limitCheck.current,
          upgradeRequired: true
        },
        { status: 402 }
      );
    }

    // Validar el cajero seleccionado si se proporcionó
    let validatedStaffId: string | null = null;
    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, tenantId, isActive: true }
      });
      if (!staff) {
        return NextResponse.json(
          { error: 'El cajero seleccionado no existe o no está activo' },
          { status: 400 }
        );
      }
      validatedStaffId = staffId;
    }

    // Crear nueva caja (openedById siempre es el usuario autenticado)
    const drawer = await prisma.cashDrawer.create({
      data: {
        tenantId,
        ...(locationId && { locationId }),
        openedById: user.id, // Siempre el usuario que hizo clic
        initialAmount,
        status: 'OPEN',
        openedAt: new Date()
      },
      include: {
        openedBy: {
          select: { name: true }
        },
        location: {
          select: { id: true, name: true }
        }
      }
    });

    // Si se seleccionó un cajero y el tenant tiene acceso a turnos, crear turno automáticamente
    let shift = null;
    if (validatedStaffId) {
      const hasShiftAccess = await checkShiftManagementAccess(tenantId);
      if (hasShiftAccess) {
        // Verificar que el cajero no tenga ya un turno activo
        const existingShift = await prisma.cashShift.findFirst({
          where: { cashierId: validatedStaffId, tenantId, status: 'ACTIVE' }
        });

        if (!existingShift) {
          shift = await prisma.cashShift.create({
            data: {
              tenantId,
              drawerId: drawer.id,
              cashierId: validatedStaffId,
              startingBalance: initialAmount,
              status: 'ACTIVE'
            },
            include: {
              cashier: { select: { id: true, name: true, position: true } }
            }
          });
        }
      }
    }

    return NextResponse.json({ ...drawer, shift }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/caja/open:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 