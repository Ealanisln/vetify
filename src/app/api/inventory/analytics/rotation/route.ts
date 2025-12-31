import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { parsePagination } from '@/lib/security/validation-schemas';
import { checkFeatureAccess } from '@/app/actions/subscription';

interface RotationMetrics {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  totalSold: number;
  turnoverRatio: number;
  daysOfInventory: number;
  abcClassification: 'A' | 'B' | 'C' | 'DEAD';
  lastMovementDate: Date | null;
  daysSinceLastSale: number | null;
}

interface RotationAnalytics {
  items: RotationMetrics[];
  summary: {
    totalItems: number;
    fastMoving: number;
    slowMoving: number;
    deadStock: number;
    averageTurnover: number;
    averageDIOH: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(request: Request): Promise<NextResponse<RotationAnalytics | { error: string }>> {
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
    const category = searchParams.get('category') || undefined;
    const classification = searchParams.get('classification') || undefined;
    const daysBack = parseInt(searchParams.get('daysBack') || '90', 10);

    const now = new Date();
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get all inventory items with their movements
    const whereClause: Record<string, unknown> = {
      tenantId,
      status: { in: ['ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK'] },
      ...(category && { category })
    };

    const [items, totalCount] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: whereClause,
        include: {
          movements: {
            where: {
              date: { gte: startDate },
              type: { in: ['SALE_OUT', 'TRANSFER_OUT', 'EXPIRY_OUT'] }
            },
            orderBy: { date: 'desc' }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.inventoryItem.count({ where: whereClause })
    ]);

    // Calculate rotation metrics for each item
    const rotationMetrics: RotationMetrics[] = items.map(item => {
      const currentStock = Number(item.quantity);
      const totalSold = item.movements.reduce((sum, m) => sum + Number(m.quantity), 0);

      // Calculate average daily sales
      const avgDailySales = totalSold / daysBack;

      // Turnover ratio: Cost of Goods Sold / Average Inventory
      // Simplified: Total Sold / Current Stock (annualized)
      const turnoverRatio = currentStock > 0
        ? (totalSold / currentStock) * (365 / daysBack)
        : 0;

      // Days of Inventory on Hand: Current Stock / Average Daily Sales
      const daysOfInventory = avgDailySales > 0
        ? Math.round(currentStock / avgDailySales)
        : currentStock > 0 ? 999 : 0;

      // Last movement date
      const lastMovement = item.movements[0]?.date || null;
      const daysSinceLastSale = lastMovement
        ? Math.floor((now.getTime() - new Date(lastMovement).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      // ABC Classification based on movement velocity
      let abcClassification: 'A' | 'B' | 'C' | 'DEAD';
      if (totalSold === 0 && currentStock > 0) {
        abcClassification = 'DEAD';
      } else if (turnoverRatio >= 6) { // Sells 6+ times per year
        abcClassification = 'A';
      } else if (turnoverRatio >= 2) { // Sells 2-6 times per year
        abcClassification = 'B';
      } else {
        abcClassification = 'C';
      }

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock,
        totalSold,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        daysOfInventory,
        abcClassification,
        lastMovementDate: lastMovement,
        daysSinceLastSale
      };
    });

    // Filter by classification if specified
    const filteredMetrics = classification
      ? rotationMetrics.filter(m => m.abcClassification === classification)
      : rotationMetrics;

    // Calculate summary statistics
    const summary = {
      totalItems: filteredMetrics.length,
      fastMoving: filteredMetrics.filter(m => m.abcClassification === 'A').length,
      slowMoving: filteredMetrics.filter(m => m.abcClassification === 'C').length,
      deadStock: filteredMetrics.filter(m => m.abcClassification === 'DEAD').length,
      averageTurnover: filteredMetrics.length > 0
        ? Math.round(filteredMetrics.reduce((sum, m) => sum + m.turnoverRatio, 0) / filteredMetrics.length * 100) / 100
        : 0,
      averageDIOH: filteredMetrics.length > 0
        ? Math.round(filteredMetrics.reduce((sum, m) => sum + (m.daysOfInventory < 999 ? m.daysOfInventory : 0), 0) /
            filteredMetrics.filter(m => m.daysOfInventory < 999).length)
        : 0
    };

    return NextResponse.json({
      items: filteredMetrics,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error en GET /api/inventory/analytics/rotation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
