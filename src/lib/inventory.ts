import { prisma } from './prisma';
import { InventoryFormData, InventoryItemWithStock } from '@/types';

/**
 * Obtener todos los productos del inventario
 */
export async function getInventoryItems(
  tenantId: string,
  page: number = 1,
  limit: number = 20,
  category?: string,
  search?: string
): Promise<{ items: InventoryItemWithStock[], total: number }> {
  const where = {
    tenantId,
    ...(category && { category: category as 'MEDICINE' | 'VACCINE' | 'DEWORMER' | 'FLEA_TICK_PREVENTION' | 'FOOD_PRESCRIPTION' | 'FOOD_REGULAR' | 'SUPPLEMENT' | 'ACCESSORY' | 'CONSUMABLE_CLINIC' | 'SURGICAL_MATERIAL' | 'LAB_SUPPLIES' | 'HYGIENE_GROOMING' | 'OTHER' }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { brand: { contains: search, mode: 'insensitive' as const } }
      ]
    })
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        _count: {
          select: {
            saleItems: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { name: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.inventoryItem.count({ where })
  ]);

  return {
    items: items as InventoryItemWithStock[],
    total
  };
}

/**
 * Obtener producto por ID
 */
export async function getInventoryItemById(
  tenantId: string,
  itemId: string
): Promise<InventoryItemWithStock | null> {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId },
    include: {
      _count: {
        select: {
          saleItems: true
        }
      },
      movements: {
        orderBy: { date: 'desc' },
        take: 10,
                 include: {
           staff: {
             select: {
               name: true
             }
           }
         }
      }
    }
  });

  return item as InventoryItemWithStock | null;
}

/**
 * Crear nuevo producto en inventario
 */
export async function createInventoryItem(
  tenantId: string,
  data: InventoryFormData
): Promise<InventoryItemWithStock> {
  const item = await prisma.$transaction(async (tx) => {
    // Crear el producto
    const newItem = await tx.inventoryItem.create({
      data: {
        tenantId,
        name: data.name,
                 category: data.category as 'MEDICINE' | 'VACCINE' | 'DEWORMER' | 'FLEA_TICK_PREVENTION' | 'FOOD_PRESCRIPTION' | 'FOOD_REGULAR' | 'SUPPLEMENT' | 'ACCESSORY' | 'CONSUMABLE_CLINIC' | 'SURGICAL_MATERIAL' | 'LAB_SUPPLIES' | 'HYGIENE_GROOMING' | 'OTHER',
        description: data.description,
        activeCompound: data.activeCompound,
        presentation: data.presentation,
        measure: data.measure,
        brand: data.brand,
        quantity: data.quantity,
        minStock: data.minStock,
        location: data.location,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        cost: data.cost,
        price: data.price,
        batchNumber: data.batchNumber,
        specialNotes: data.specialNotes,
        status: data.quantity > 0 ? 'ACTIVE' : 'INACTIVE'
      }
    });

    // Registrar movimiento inicial si hay cantidad
    if (data.quantity > 0) {
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          itemId: newItem.id,
          type: 'PURCHASE_IN',
          quantity: data.quantity,
          reason: 'Stock inicial'
        }
      });
    }

    return newItem;
  });

  return getInventoryItemById(tenantId, item.id) as Promise<InventoryItemWithStock>;
}

/**
 * Actualizar producto existente
 */
export async function updateInventoryItem(
  tenantId: string,
  itemId: string,
  data: Partial<InventoryFormData>
): Promise<InventoryItemWithStock> {
  const currentItem = await prisma.inventoryItem.findUniqueOrThrow({
    where: { id: itemId, tenantId }
  });

  const updatedItem = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id: itemId, tenantId },
      data: {
        ...(data.name && { name: data.name }),
                 ...(data.category && { category: data.category as 'MEDICINE' | 'VACCINE' | 'DEWORMER' | 'FLEA_TICK_PREVENTION' | 'FOOD_PRESCRIPTION' | 'FOOD_REGULAR' | 'SUPPLEMENT' | 'ACCESSORY' | 'CONSUMABLE_CLINIC' | 'SURGICAL_MATERIAL' | 'LAB_SUPPLIES' | 'HYGIENE_GROOMING' | 'OTHER' }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.activeCompound !== undefined && { activeCompound: data.activeCompound }),
        ...(data.presentation !== undefined && { presentation: data.presentation }),
        ...(data.measure !== undefined && { measure: data.measure }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.expirationDate && { expirationDate: new Date(data.expirationDate) }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.batchNumber !== undefined && { batchNumber: data.batchNumber }),
        ...(data.specialNotes !== undefined && { specialNotes: data.specialNotes }),
      }
    });

    // Si cambió la cantidad, registrar el movimiento
    if (data.quantity !== undefined && data.quantity !== Number(currentItem.quantity)) {
      const difference = data.quantity - Number(currentItem.quantity);
      
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: data.quantity }
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId,
          itemId: itemId,
          type: difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantity: Math.abs(difference),
          reason: 'Ajuste manual de inventario'
        }
      });
    }

    return updated;
  });

  return getInventoryItemById(tenantId, updatedItem.id) as Promise<InventoryItemWithStock>;
}

/**
 * Eliminar producto (soft delete)
 */
export async function deleteInventoryItem(
  tenantId: string,
  itemId: string
): Promise<void> {
  await prisma.inventoryItem.update({
    where: { id: itemId, tenantId },
    data: { 
      status: 'DISCONTINUED',
      updatedAt: new Date()
    }
  });
}

/**
 * Obtener productos con stock bajo
 */
export async function getLowStockItems(tenantId: string): Promise<InventoryItemWithStock[]> {
  const items = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      AND: [
        { minStock: { not: null } },
        {
          quantity: {
            lte: prisma.inventoryItem.fields.minStock
          }
        }
      ]
    },
    include: {
      _count: {
        select: {
          saleItems: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return items as InventoryItemWithStock[];
}

/**
 * Obtener estadísticas del inventario
 */
export async function getInventoryStats(tenantId: string) {
  const [totalItems, activeItems, lowStockItems, outOfStockItems, expiringSoon] = await Promise.all([
    // Total de productos
    prisma.inventoryItem.count({
      where: { tenantId }
    }),
    
    // Productos activos
    prisma.inventoryItem.count({
      where: { tenantId, status: 'ACTIVE' }
    }),
    
    // Stock bajo
    prisma.inventoryItem.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        AND: [
          { minStock: { not: null } },
          {
            quantity: {
              lte: prisma.inventoryItem.fields.minStock
            }
          }
        ]
      }
    }),
    
    // Sin stock
    prisma.inventoryItem.count({
      where: {
        tenantId,
        quantity: 0,
        status: 'ACTIVE'
      }
    }),
    
    // Productos que expiran pronto (próximos 30 días)
    prisma.inventoryItem.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        expirationDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        }
      }
    })
  ]);

  return {
    totalItems,
    activeItems,
    lowStockItems,
    outOfStockItems,
    expiringSoon
  };
}

/**
 * Buscar productos para autocompletado
 */
export async function searchInventoryItems(
  tenantId: string,
  query: string,
  limit: number = 10
): Promise<InventoryItemWithStock[]> {
  if (!query || query.length < 2) return [];

  const items = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      _count: {
        select: {
          saleItems: true
        }
      }
    },
    orderBy: { name: 'asc' },
    take: limit
  });

  return items as InventoryItemWithStock[];
}

/**
 * Obtener categorías de inventario disponibles
 */
export function getInventoryCategories() {
  return [
    { value: 'MEDICINE', label: 'Medicina' },
    { value: 'VACCINE', label: 'Vacuna' },
    { value: 'DEWORMER', label: 'Desparasitante' },
    { value: 'FLEA_TICK_PREVENTION', label: 'Anti-pulgas/garrapatas' },
    { value: 'FOOD_PRESCRIPTION', label: 'Alimento medicado' },
    { value: 'FOOD_REGULAR', label: 'Alimento regular' },
    { value: 'SUPPLEMENT', label: 'Suplemento' },
    { value: 'ACCESSORY', label: 'Accesorio' },
    { value: 'CONSUMABLE_CLINIC', label: 'Material clínico' },
    { value: 'SURGICAL_MATERIAL', label: 'Material quirúrgico' },
    { value: 'LAB_SUPPLIES', label: 'Material laboratorio' },
    { value: 'HYGIENE_GROOMING', label: 'Higiene/estética' },
    { value: 'OTHER', label: 'Otro' }
  ];
} 