/**
 * API v1 Sales Report Endpoint
 *
 * GET /api/v1/reports/sales - Get sales report
 *
 * Query Parameters:
 * - locationId: Filter by location (string)
 * - start_date: Start date for report period (ISO string, required)
 * - end_date: End date for report period (ISO string, required)
 * - groupBy: Group results by 'day', 'week', 'month', or 'category' (default: 'day')
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiAuth, apiError, buildWhereClause } from '@/lib/api/api-key-auth';
import type { SalesReportResponse, SalesBreakdownItem } from '../../_shared/types';

export const GET = withApiAuth(
  async (request, { apiKey, locationId }) => {
    const { searchParams } = new URL(request.url);

    // Parse required date range
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    if (!startDateStr || !endDateStr) {
      return apiError(
        'start_date and end_date are required',
        'VALIDATION_ERROR',
        400
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return apiError('Invalid date format', 'VALIDATION_ERROR', 400);
    }

    if (startDate > endDate) {
      return apiError('start_date must be before end_date', 'VALIDATION_ERROR', 400);
    }

    const groupBy = searchParams.get('groupBy') || 'day';
    if (!['day', 'week', 'month', 'category'].includes(groupBy)) {
      return apiError(
        'groupBy must be one of: day, week, month, category',
        'VALIDATION_ERROR',
        400
      );
    }

    // Build base where clause
    const baseWhere = buildWhereClause(apiKey, locationId, {});

    // Fetch completed sales in the period
    const sales = await prisma.sale.findMany({
      where: {
        ...baseWhere,
        status: { in: ['PAID', 'COMPLETED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: { category: true },
            },
            service: {
              select: { category: true },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate summary
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group sales based on groupBy parameter
    const breakdown: SalesBreakdownItem[] = [];

    if (groupBy === 'category') {
      // Group by item/service category
      const categoryMap = new Map<string, { count: number; revenue: number }>();

      for (const sale of sales) {
        for (const item of sale.items) {
          const category =
            item.inventoryItem?.category || item.service?.category || 'OTHER';
          const existing = categoryMap.get(category) || { count: 0, revenue: 0 };
          existing.count += 1;
          existing.revenue += Number(item.total);
          categoryMap.set(category, existing);
        }
      }

      for (const [category, data] of categoryMap) {
        breakdown.push({
          category,
          count: data.count,
          revenue: Math.round(data.revenue * 100) / 100,
        });
      }
    } else {
      // Group by time period
      const periodMap = new Map<
        string,
        { count: number; revenue: number; locationId?: string; locationName?: string }
      >();

      for (const sale of sales) {
        let periodKey: string;
        const saleDate = new Date(sale.createdAt);

        if (groupBy === 'day') {
          periodKey = saleDate.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          // Get ISO week number
          const startOfYear = new Date(saleDate.getFullYear(), 0, 1);
          const days = Math.floor(
            (saleDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
          );
          const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          periodKey = `${saleDate.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
        } else {
          // month
          periodKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        }

        // If filtering by location, include location info
        const mapKey = locationId ? periodKey : `${periodKey}|${sale.locationId || 'none'}`;
        const existing = periodMap.get(mapKey) || {
          count: 0,
          revenue: 0,
          locationId: sale.locationId || undefined,
          locationName: sale.location?.name || undefined,
        };
        existing.count += 1;
        existing.revenue += Number(sale.total);
        periodMap.set(mapKey, existing);
      }

      for (const [key, data] of periodMap) {
        const datePart = key.split('|')[0];
        breakdown.push({
          date: datePart,
          locationId: data.locationId,
          locationName: data.locationName,
          count: data.count,
          revenue: Math.round(data.revenue * 100) / 100,
        });
      }

      // Sort by date
      breakdown.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }

    const response: SalesReportResponse = {
      summary: {
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      },
      breakdown,
    };

    return NextResponse.json({ data: response });
  },
  { requiredScope: 'read:reports' }
);
