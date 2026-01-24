/**
 * API v1 Inventory Report Endpoint
 *
 * GET /api/v1/reports/inventory - Get inventory report
 *
 * Query Parameters:
 * - locationId: Filter by location (string)
 * - category: Filter by category (string)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiAuth, buildWhereClause } from '@/lib/api/api-key-auth';
import type {
  InventoryReportResponse,
  CategoryBreakdownItem,
  InventoryItemSummaryWithQuantity,
  InventoryItemSummaryWithExpiry,
} from '../../_shared/types';

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build base where clause
    const baseWhere = buildWhereClause(apiKey, locationId, {});

    // Add category filter if provided
    const where = {
      ...baseWhere,
      ...(category && { category }),
      status: { not: 'DISCONTINUED' as const },
    };

    // Fetch all inventory items
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Calculate summary
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => {
      const qty = Number(item.quantity);
      const price = Number(item.cost || item.price || 0);
      return sum + qty * price;
    }, 0);

    // Count low stock items (quantity <= minStock)
    const lowStockItems = items.filter((item) => {
      if (!item.minStock) return false;
      return Number(item.quantity) <= Number(item.minStock);
    });

    // Count out of stock items (quantity = 0)
    const outOfStockItems = items.filter((item) => Number(item.quantity) === 0);

    // Count items expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = items.filter((item) => {
      if (!item.expirationDate) return false;
      return item.expirationDate <= thirtyDaysFromNow && item.expirationDate > new Date();
    });

    // Group by category
    const categoryMap = new Map<string, { count: number; totalValue: number }>();
    for (const item of items) {
      const cat = item.category;
      const existing = categoryMap.get(cat) || { count: 0, totalValue: 0 };
      existing.count += 1;
      existing.totalValue += Number(item.quantity) * Number(item.cost || item.price || 0);
      categoryMap.set(cat, existing);
    }

    const byCategory: CategoryBreakdownItem[] = [];
    for (const [cat, data] of categoryMap) {
      byCategory.push({
        category: cat,
        count: data.count,
        totalValue: Math.round(data.totalValue * 100) / 100,
      });
    }
    byCategory.sort((a, b) => b.count - a.count);

    // Format low stock items for response
    const lowStockItemsResponse: InventoryItemSummaryWithQuantity[] = lowStockItems
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: Number(item.quantity),
        minStock: item.minStock ? Number(item.minStock) : null,
        locationId: item.locationId,
      }));

    // Format expiring items for response
    const expiringItemsResponse: InventoryItemSummaryWithExpiry[] = expiringItems
      .sort((a, b) => {
        const dateA = a.expirationDate?.getTime() || 0;
        const dateB = b.expirationDate?.getTime() || 0;
        return dateA - dateB;
      })
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: Number(item.quantity),
        expirationDate: item.expirationDate!.toISOString(),
        locationId: item.locationId,
      }));

    const response: InventoryReportResponse = {
      summary: {
        totalItems,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        expiringSoonCount: expiringItems.length,
      },
      byCategory,
      lowStockItems: lowStockItemsResponse,
      expiringItems: expiringItemsResponse,
    };

    return NextResponse.json({ data: response });
  },
  { requiredScope: 'read:reports' }
);
