
import { Suspense } from 'react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SalesReportsClient from './SalesReportsClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getSalesData(tenantId: string) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  // Ventas del día
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Ventas de la semana
  const weekStart = new Date(startOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // Ventas del mes
  const monthStart = new Date(startOfMonth);
  monthStart.setHours(0, 0, 0, 0);

  const [todaySales, weekSales, monthSales, recentSales, topServices, topProducts] = await Promise.all([
    // Ventas del día
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // Ventas de la semana
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: weekStart }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // Ventas del mes
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: monthStart }
      },
      _sum: { total: true },
      _count: { id: true }
    }),

    // Ventas recientes
    prisma.sale.findMany({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'PAID'] }
      },
      include: {
        customer: { select: { name: true } },
        items: {
          include: {
            service: { select: { name: true } },
            inventoryItem: { select: { name: true } }
          }
        },
        payments: { select: { paymentMethod: true, amount: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),

    // Servicios más vendidos
    prisma.saleItem.groupBy({
      by: ['serviceId'],
      where: {
        serviceId: { not: null },
        sale: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: monthStart }
        }
      },
      _sum: { quantity: true, total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10
    }),

    // Productos más vendidos
    prisma.saleItem.groupBy({
      by: ['itemId'],
      where: {
        itemId: { not: null },
        sale: {
          tenantId,
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: monthStart }
        }
      },
      _sum: { quantity: true, total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10
    })
  ]);

  // Obtener nombres de servicios
  const serviceIds = topServices.map(s => s.serviceId).filter(Boolean) as string[];
  const services = serviceIds.length > 0 ? await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true }
  }) : [];

  // Obtener nombres de productos
  const productIds = topProducts.map(p => p.itemId).filter(Boolean) as string[];
  const products = productIds.length > 0 ? await prisma.inventoryItem.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true }
  }) : [];

  // Ventas por día de los últimos 30 días
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);
  
  const dailySales = await prisma.sale.groupBy({
    by: ['createdAt'],
    where: {
      tenantId,
      status: { in: ['COMPLETED', 'PAID'] },
      createdAt: { gte: last30Days }
    },
    _sum: { total: true },
    _count: { id: true }
  });

  // Agrupar por día
  const salesByDay = dailySales.reduce((acc, sale) => {
    const date = sale.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, total: 0, count: 0 };
    }
    acc[date].total += Number(sale._sum.total || 0);
    acc[date].count += sale._count.id;
    return acc;
  }, {} as Record<string, { date: string; total: number; count: number }>);

  return {
    todaySales: {
      total: Number(todaySales._sum.total || 0),
      count: todaySales._count.id
    },
    weekSales: {
      total: Number(weekSales._sum.total || 0),
      count: weekSales._count.id
    },
    monthSales: {
      total: Number(monthSales._sum.total || 0),
      count: monthSales._count.id
    },
    recentSales: recentSales.map(sale => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      customerName: sale.customer.name,
      total: Number(sale.total),
      itemCount: sale.items.length,
      paymentMethod: sale.payments[0]?.paymentMethod || 'CASH',
      createdAt: sale.createdAt,
      items: sale.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        total: Number(item.total)
      }))
    })),
    topServices: topServices.map(item => {
      const service = services.find(s => s.id === item.serviceId);
      return {
        name: service?.name || 'Servicio desconocido',
        quantity: Number(item._sum.quantity || 0),
        total: Number(item._sum.total || 0),
        count: item._count.id
      };
    }),
    topProducts: topProducts.map(item => {
      const product = products.find(p => p.id === item.itemId);
      return {
        name: product?.name || 'Producto desconocido',
        quantity: Number(item._sum.quantity || 0),
        total: Number(item._sum.total || 0),
        count: item._count.id
      };
    }),
    dailySales: Object.values(salesByDay).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  };
}

export default async function ReportsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    redirect('/sign-in');
  }

  const userWithTenant = await prisma.user.findUnique({
    where: { id: user.id },
    include: { tenant: true }
  });

  if (!userWithTenant?.tenant) {
    redirect('/onboarding');
  }

  const salesData = await getSalesData(userWithTenant.tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reportes de Ventas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análisis detallado del rendimiento de ventas de tu clínica
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando reportes...</span>
        </div>
      }>
        <SalesReportsClient salesData={salesData} />
      </Suspense>
    </div>
  );
} 