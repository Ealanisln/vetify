import { prisma } from './prisma';
import { SaleFormData, SaleWithDetails, CustomerSearchResult, ProductSearchResult } from '@/types';

/**
 * Buscar clientes con sus mascotas para el POS
 */
export async function searchCustomers(
  tenantId: string, 
  query: string
): Promise<CustomerSearchResult[]> {
  if (!query || query.length < 2) return [];

  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
        {
          pets: {
            some: {
              name: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ]
    },
    include: {
      pets: {
        where: { isDeceased: false },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true
        }
      }
    },
    take: 10
  });

  return customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone || undefined,
    email: customer.email || undefined,
    pets: customer.pets
  }));
}

/**
 * Buscar productos y servicios para el POS
 */
export async function searchProducts(
  tenantId: string, 
  query: string
): Promise<ProductSearchResult[]> {
  if (!query || query.length < 2) return [];

  // Buscar productos en inventario
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      quantity: { gt: 0 },
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5
  });

  // Buscar servicios
  const services = await prisma.service.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5
  });

  const results: ProductSearchResult[] = [
    // Productos
    ...inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price ? Number(item.price) : undefined,
      quantity: Number(item.quantity),
      type: 'product' as const
    })),
    // Servicios
    ...services.map(service => ({
      id: service.id,
      name: service.name,
      category: service.category,
      price: Number(service.price),
      duration: service.duration || undefined,
      type: 'service' as const
    }))
  ];

  return results;
}

/**
 * Alias para searchProducts - buscar productos y servicios para el POS
 */
export const searchProductsAndServices = searchProducts;

/**
 * Generar número de venta único
 */
export async function generateSaleNumber(tenantId: string): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `${year}${month}${day}`;
  
  // Buscar el último número de venta del día
  const lastSale = await prisma.sale.findFirst({
    where: {
      tenantId,
      saleNumber: { startsWith: prefix }
    },
    orderBy: { saleNumber: 'desc' }
  });

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

/**
 * Crear nueva venta
 */
export async function createSale(
  tenantId: string,
  userId: string,
  saleData: SaleFormData
): Promise<SaleWithDetails> {
  const saleNumber = await generateSaleNumber(tenantId);
  
  // Calcular totales
  const subtotal = saleData.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice - (item.discount || 0)), 0
  );
  
  const tax = saleData.tax || 0;
  const discount = saleData.discount || 0;
  const total = subtotal + tax - discount;

  const sale = await prisma.$transaction(async (tx) => {
    // Crear la venta
    const newSale = await tx.sale.create({
      data: {
        tenantId,
        customerId: saleData.customerId,
        petId: saleData.petId,
        userId,
        saleNumber,
        subtotal,
        tax,
        discount,
        total,
        status: 'PENDING',
        notes: saleData.notes
      }
    });

    // Crear los items de la venta
    for (const item of saleData.items) {
      await tx.saleItem.create({
        data: {
          saleId: newSale.id,
          itemId: item.type === 'product' ? item.itemId : undefined,
          serviceId: item.type === 'service' ? item.serviceId : undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          total: item.total
        }
      });

      // Si es un producto, descontar del inventario
      if (item.type === 'product' && item.itemId) {
        await tx.inventoryItem.update({
          where: { id: item.itemId },
          data: {
            quantity: { decrement: item.quantity }
          }
        });

        // Registrar movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            itemId: item.itemId,
            type: 'SALE_OUT',
            quantity: -item.quantity,
            reason: `Venta ${saleNumber}`,
            relatedRecordId: newSale.id,
            relatedRecordType: 'SALE'
          }
        });
      }
    }

    // Si es pago en efectivo, verificar si hay caja abierta
    let cashTransactionId: string | undefined;
    if (saleData.paymentMethod === 'CASH') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const currentDrawer = await tx.cashDrawer.findFirst({
        where: {
          tenantId,
          status: 'OPEN',
          openedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      if (!currentDrawer) {
        throw new Error('No se puede procesar una venta en efectivo sin tener la caja abierta. Por favor, abra la caja primero.');
      }

      // Crear transacción de caja
      const cashTransaction = await tx.cashTransaction.create({
        data: {
          drawerId: currentDrawer.id,
          amount: saleData.amountPaid,
          type: 'SALE_CASH',
          description: `Venta ${saleNumber}`,
          relatedId: newSale.id,
          relatedType: 'SALE'
        }
      });
      cashTransactionId = cashTransaction.id;
    }

    // Crear el pago
    await tx.salePayment.create({
      data: {
        saleId: newSale.id,
        paymentMethod: saleData.paymentMethod as 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK' | 'INSURANCE' | 'OTHER',
        amount: saleData.amountPaid,
        cashTransactionId
      }
    });

    // Actualizar estado si está completamente pagado
    if (saleData.amountPaid >= total) {
      await tx.sale.update({
        where: { id: newSale.id },
        data: { status: 'COMPLETED' }
      });
    }

    return newSale;
  });

  // Obtener la venta completa con relaciones
  return getSaleById(tenantId, sale.id);
}

/**
 * Obtener venta por ID con todos los detalles
 */
export async function getSaleById(tenantId: string, saleId: string): Promise<SaleWithDetails> {
  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id: saleId, tenantId },
    include: {
      customer: true,
      pet: true,
      items: {
        include: {
          inventoryItem: true,
          service: true
        }
      },
      payments: true
    }
  });

  return sale as SaleWithDetails;
}

/**
 * Obtener ventas recientes
 */
export async function getRecentSales(
  tenantId: string,
  limit: number = 10
): Promise<SaleWithDetails[]> {
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    include: {
      customer: true,
      pet: true,
      items: {
        include: {
          inventoryItem: true,
          service: true
        }
      },
      payments: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return sales as SaleWithDetails[];
}

/**
 * Obtener estadísticas de ventas
 */
export async function getSalesStats(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [todaySales, monthSales, totalSales] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId,
        createdAt: { gte: today, lt: tomorrow },
        status: { in: ['PAID', 'COMPLETED'] }
      },
      _sum: { total: true },
      _count: true
    }),
    prisma.sale.aggregate({
      where: {
        tenantId,
        createdAt: { gte: thisMonth, lt: nextMonth },
        status: { in: ['PAID', 'COMPLETED'] }
      },
      _sum: { total: true },
      _count: true
    }),
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: { in: ['PAID', 'COMPLETED'] }
      },
      _sum: { total: true },
      _count: true
    })
  ]);

  return {
    today: {
      amount: todaySales._sum.total || 0,
      count: todaySales._count
    },
    thisMonth: {
      amount: monthSales._sum.total || 0,
      count: monthSales._count
    },
    total: {
      amount: totalSales._sum.total || 0,
      count: totalSales._count
    }
  };
} 