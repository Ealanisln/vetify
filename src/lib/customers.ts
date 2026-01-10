import { prisma } from './prisma';
import { z } from 'zod';
import { serializeCustomer, serializeCustomers } from './serializers';
import type { PaginationParams, SortParams } from './pagination';

// Allowed sort fields for customers (whitelist for security)
export const CUSTOMERS_ALLOWED_SORT_FIELDS = ['name', 'email', 'createdAt'] as const;
export type CustomersSortField = typeof CUSTOMERS_ALLOWED_SORT_FIELDS[number];

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  preferredContactMethod: z.enum(['phone', 'email', 'whatsapp']).default('phone'),
  notes: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export async function createCustomer(
  tenantId: string,
  data: CreateCustomerInput
) {
  // Check for duplicate customer by email (if provided)
  if (data.email) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: data.email,
        isActive: true,
      },
      include: {
        location: {
          select: { name: true }
        }
      }
    });

    if (existingCustomer) {
      const locationInfo = existingCustomer.location?.name
        ? ` en la ubicación "${existingCustomer.location.name}"`
        : ' (sin ubicación asignada)';
      throw new Error(`Ya existe un cliente "${existingCustomer.name}" con el email ${data.email}${locationInfo}. Puedes verlo cambiando a "Todas las ubicaciones".`);
    }
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone,
      address: data.address,
      preferredContactMethod: data.preferredContactMethod,
      notes: data.notes,
      tenantId,
    },
  });

  return serializeCustomer(customer);
}

export async function getCustomersByTenant(
  tenantId: string,
  locationId?: string,
  pagination?: PaginationParams,
  sort?: SortParams
) {
  const where = {
    tenantId,
    isActive: true,
    // Include customers with the specified location OR customers without any location assigned
    ...(locationId && {
      OR: [
        { locationId },
        { locationId: null }
      ]
    }),
  };

  // Build orderBy - default to createdAt desc
  const orderBy = sort?.sortBy
    ? { [sort.sortBy]: sort.sortOrder || 'desc' }
    : { createdAt: 'desc' as const };

  const include = {
    pets: {
      select: {
        id: true,
        name: true,
        species: true,
      }
    },
    _count: {
      select: {
        pets: true,
        appointments: true,
      }
    }
  };

  // If pagination is provided, return paginated results with total count
  if (pagination) {
    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      })
    ]);

    return { customers: serializeCustomers(customers), total };
  }

  // Without pagination, return all customers (backwards compatible)
  const customers = await prisma.customer.findMany({
    where,
    include,
    orderBy
  });

  return serializeCustomers(customers);
}

// Alias for getCustomersByTenant
export const getCustomers = getCustomersByTenant;

export async function getCustomerById(customerId: string, tenantId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: {
      pets: {
        include: {
          appointments: {
            orderBy: { dateTime: 'desc' },
            take: 5
          },
          medicalHistories: {
            orderBy: { visitDate: 'desc' },
            take: 5
          }
        }
      },
      appointments: {
        include: {
          pet: true,
          staff: true
        },
        orderBy: { dateTime: 'desc' },
        take: 10
      },
      sales: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!customer) {
    return null;
  }

  return serializeCustomer(customer);
}

export async function updateCustomer(
  customerId: string,
  tenantId: string,
  data: Partial<CreateCustomerInput>
) {
  const customer = await prisma.customer.update({
    where: { id: customerId, tenantId },
    data: {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone,
      address: data.address,
      preferredContactMethod: data.preferredContactMethod,
      notes: data.notes,
    },
  });

  return serializeCustomer(customer);
}

export async function deleteCustomer(customerId: string, tenantId: string) {
  // Soft delete - mark as inactive
  const customer = await prisma.customer.update({
    where: { id: customerId, tenantId },
    data: { isActive: false },
  });

  return serializeCustomer(customer);
}

export async function searchCustomers(tenantId: string, query: string, locationId?: string) {
  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      isActive: true,
      // Include customers with the specified location OR customers without any location assigned
      ...(locationId && {
        OR: [
          { locationId },
          { locationId: null }
        ]
      }),
      // Search query filters
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ]
        }
      ],
    },
    include: {
      pets: {
        select: {
          id: true,
          name: true,
          species: true,
        }
      }
    },
    orderBy: { name: 'asc' },
    take: 20
  });

  return serializeCustomers(customers);
} 