import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/super-admin';
import { updatePayoutStatus, bulkUpdatePayoutStatus } from '@/lib/referrals/queries';
import { z } from 'zod';

const updatePayoutSchema = z.object({
  status: z.enum(['APPROVED', 'PAID', 'VOID']),
  notes: z.string().optional(),
  // For bulk operations
  conversionIds: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const validationResult = updatePayoutSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos invalidos',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, notes, conversionIds } = validationResult.data;

    // Bulk update if conversionIds provided and id is "bulk"
    if (id === 'bulk' && conversionIds && conversionIds.length > 0) {
      await bulkUpdatePayoutStatus(conversionIds, status, user.id, notes);
      return NextResponse.json({
        success: true,
        message: `${conversionIds.length} conversiones actualizadas a ${status}`,
      });
    }

    // Single update
    const conversion = await updatePayoutStatus(id, status, user.id, notes);
    return NextResponse.json({
      success: true,
      data: conversion,
      message: `Pago actualizado a ${status}`,
    });
  } catch (error) {
    console.error('Error updating payout status:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el estado de pago' },
      { status: 500 }
    );
  }
}
