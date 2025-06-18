import { prisma } from './prisma';
import { z } from 'zod';
import { serializeCustomer, serializeCustomers } from './serializers';

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

export async function getCustomersByTenant(tenantId: string) {
  const customers = await prisma.customer.findMany({
    where: { tenantId, isActive: true },
    include: {
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
    },
    orderBy: { createdAt: 'desc' }
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

export async function searchCustomers(tenantId: string, query: string) {
  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ]
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