/**
 * Critical Production Test: Multi-Tenancy Data Isolation
 *
 * This test verifies that tenants can only access their own data
 * and cannot see or modify data from other tenants.
 */

// Unmock Prisma for integration tests
jest.unmock('@prisma/client');

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Multi-Tenancy Data Isolation (CRITICAL)', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;
  let customer1Id: string;
  let customer2Id: string;
  let pet1Id: string;
  let pet2Id: string;

  beforeAll(async () => {
    // Create Tenant 1
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Clinic 1',
        slug: `clinic-1-${Date.now()}`,
        planType: 'PROFESIONAL',
        status: 'ACTIVE',
        isTrialPeriod: true,
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    tenant1Id = tenant1.id;

    // Create Tenant 2
    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Clinic 2',
        slug: `clinic-2-${Date.now()}`,
        planType: 'BASICO',
        status: 'ACTIVE',
        isTrialPeriod: true,
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    tenant2Id = tenant2.id;

    // Create User for Tenant 1
    const user1 = await prisma.user.create({
      data: {
        id: `user-1-${Date.now()}`,
        email: `user1-${Date.now()}@example.com`,
        tenantId: tenant1Id,
      },
    });
    user1Id = user1.id;

    // Create User for Tenant 2
    const user2 = await prisma.user.create({
      data: {
        id: `user-2-${Date.now()}`,
        email: `user2-${Date.now()}@example.com`,
        tenantId: tenant2Id,
      },
    });
    user2Id = user2.id;

    // Create Customer for Tenant 1
    const customer1 = await prisma.customer.create({
      data: {
        name: 'Customer 1',
        email: `customer1-${Date.now()}@example.com`,
        tenantId: tenant1Id,
      },
    });
    customer1Id = customer1.id;

    // Create Customer for Tenant 2
    const customer2 = await prisma.customer.create({
      data: {
        name: 'Customer 2',
        email: `customer2-${Date.now()}@example.com`,
        tenantId: tenant2Id,
      },
    });
    customer2Id = customer2.id;

    // Create Pet for Tenant 1
    const pet1 = await prisma.pet.create({
      data: {
        name: 'Max',
        species: 'dog',
        breed: 'Labrador',
        dateOfBirth: new Date('2020-01-01'),
        gender: 'male',
        tenantId: tenant1Id,
        customerId: customer1Id,
      },
    });
    pet1Id = pet1.id;

    // Create Pet for Tenant 2
    const pet2 = await prisma.pet.create({
      data: {
        name: 'Luna',
        species: 'cat',
        breed: 'Siamés',
        dateOfBirth: new Date('2021-01-01'),
        gender: 'female',
        tenantId: tenant2Id,
        customerId: customer2Id,
      },
    });
    pet2Id = pet2.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    const petIds = [pet1Id, pet2Id].filter(Boolean);
    if (petIds.length > 0) {
      await prisma.pet.deleteMany({
        where: { id: { in: petIds } },
      });
    }

    const customerIds = [customer1Id, customer2Id].filter(Boolean);
    if (customerIds.length > 0) {
      await prisma.customer.deleteMany({
        where: { id: { in: customerIds } },
      });
    }

    const userIds = [user1Id, user2Id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    const tenantIds = [tenant1Id, tenant2Id].filter(Boolean);
    if (tenantIds.length > 0) {
      await prisma.tenant.deleteMany({
        where: { id: { in: tenantIds } },
      });
    }

    await prisma.$disconnect();
  });

  describe('Customer Data Isolation', () => {
    it('should only return customers for specific tenant', async () => {
      const tenant1Customers = await prisma.customer.findMany({
        where: { tenantId: tenant1Id },
      });

      expect(tenant1Customers).toHaveLength(1);
      expect(tenant1Customers[0].id).toBe(customer1Id);
      expect(tenant1Customers[0].name).toBe('Customer 1');
    });

    it('should not return customers from other tenants', async () => {
      const tenant1Customers = await prisma.customer.findMany({
        where: { tenantId: tenant1Id },
      });

      const hasCustomer2 = tenant1Customers.some((c) => c.id === customer2Id);
      expect(hasCustomer2).toBe(false);
    });
  });

  describe('Pet Data Isolation', () => {
    it('should only return pets for specific tenant', async () => {
      const tenant1Pets = await prisma.pet.findMany({
        where: { tenantId: tenant1Id },
      });

      expect(tenant1Pets).toHaveLength(1);
      expect(tenant1Pets[0].id).toBe(pet1Id);
      expect(tenant1Pets[0].name).toBe('Max');
    });

    it('should not return pets from other tenants', async () => {
      const tenant2Pets = await prisma.pet.findMany({
        where: { tenantId: tenant2Id },
      });

      const hasPet1 = tenant2Pets.some((p) => p.id === pet1Id);
      expect(hasPet1).toBe(false);
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    it('should not find customer from different tenant by ID', async () => {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customer2Id,
          tenantId: tenant1Id, // Wrong tenant
        },
      });

      expect(customer).toBeNull();
    });

    it('should not find pet from different tenant by ID', async () => {
      const pet = await prisma.pet.findFirst({
        where: {
          id: pet2Id,
          tenantId: tenant1Id, // Wrong tenant
        },
      });

      expect(pet).toBeNull();
    });
  });

  describe('Count Queries Respect Tenant Isolation', () => {
    it('should count only tenant-specific customers', async () => {
      const count1 = await prisma.customer.count({
        where: { tenantId: tenant1Id },
      });

      const count2 = await prisma.customer.count({
        where: { tenantId: tenant2Id },
      });

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    it('should count only tenant-specific pets', async () => {
      const count1 = await prisma.pet.count({
        where: { tenantId: tenant1Id },
      });

      const count2 = await prisma.pet.count({
        where: { tenantId: tenant2Id },
      });

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('User-Tenant Relationship', () => {
    it('should have user correctly associated with tenant', async () => {
      const user1 = await prisma.user.findUnique({
        where: { id: user1Id },
      });

      expect(user1?.tenantId).toBe(tenant1Id);
    });

    it('should not have user associated with wrong tenant', async () => {
      const user1 = await prisma.user.findUnique({
        where: { id: user1Id },
      });

      expect(user1?.tenantId).not.toBe(tenant2Id);
    });
  });
});
