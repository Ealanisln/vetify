import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { parsePagination } from '@/lib/security/validation-schemas';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { MovementType } from '@prisma/client';

interface MovementRecord {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  date: Date;
  staffName: string | null;
  notes: string | null;
  relatedRecordType: string | null;
}

interface MovementReport {
  movements: MovementRecord[];
  summary: {
    totalMovements: number;
    totalIn: number;
    totalOut: number;
    netChange: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE_IN: 'Compra',
  SALE_OUT: 'Venta',
  RETURN_IN: 'Devolución',
  ADJUSTMENT_IN: 'Ajuste (+)',
  ADJUSTMENT_OUT: 'Ajuste (-)',
  TRANSFER_IN: 'Transferencia (+)',
  TRANSFER_OUT: 'Transferencia (-)',
  EXPIRY_OUT: 'Vencimiento'
};

export async function GET(request: Request): Promise<NextResponse<MovementReport | { error: string }>> {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check feature access
    const hasAccess = await checkFeatureAccess('advancedInventory');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Esta función requiere el Plan Profesional' },
        { status: 403 }
      );
    }

    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });

    if (!userWithTenant?.tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const tenantId = userWithTenant.tenant.id;
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    // Parse filters
    const itemId = searchParams.get('itemId') || undefined;
    const type = searchParams.get('type') as MovementType | undefined;
    const category = searchParams.get('category') || undefined;
    const staffId = searchParams.get('staffId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: Record<string, unknown> = {
      item: { tenantId }
    };

    if (itemId) {
      whereClause.itemId = itemId;
    }

    if (type && Object.values(MovementType).includes(type)) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.item = {
        ...whereClause.item as object,
        category
      };
    }

    if (staffId) {
      whereClause.staffId = staffId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        (whereClause.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Fetch movements with pagination
    const [movements, totalCount] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where: whereClause,
        include: {
          item: {
            select: { id: true, name: true, category: true }
          },
          staff: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inventoryMovement.count({ where: whereClause })
    ]);

    // Calculate summary
    const allMovements = await prisma.inventoryMovement.findMany({
      where: whereClause,
      select: { type: true, quantity: true }
    });

    const inTypes: MovementType[] = ['PURCHASE_IN', 'RETURN_IN', 'ADJUSTMENT_IN', 'TRANSFER_IN'];
    const outTypes: MovementType[] = ['SALE_OUT', 'ADJUSTMENT_OUT', 'TRANSFER_OUT', 'EXPIRY_OUT'];

    const totalIn = allMovements
      .filter(m => inTypes.includes(m.type))
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    const totalOut = allMovements
      .filter(m => outTypes.includes(m.type))
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    // Format response
    const formattedMovements: MovementRecord[] = movements.map(m => ({
      id: m.id,
      itemId: m.itemId,
      itemName: m.item.name,
      type: m.type,
      quantity: Number(m.quantity),
      date: m.date,
      staffName: m.staff
        ? `${m.staff.firstName} ${m.staff.lastName}`
        : null,
      notes: m.notes,
      relatedRecordType: m.relatedRecordType
    }));

    return NextResponse.json({
      movements: formattedMovements,
      summary: {
        totalMovements: totalCount,
        totalIn,
        totalOut,
        netChange: totalIn - totalOut
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error en GET /api/inventory/movements:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Export movement type labels for use in components
export { MOVEMENT_TYPE_LABELS };
