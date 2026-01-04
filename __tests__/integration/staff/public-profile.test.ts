/**
 * Integration Tests: Staff Public Profile and Team Page
 *
 * Tests multi-tenant isolation for public staff data,
 * CRUD operations for public profile fields, and
 * getPublicTeam/hasPublicTeam functions.
 */

// Unmock Prisma for integration tests
jest.unmock('@prisma/client');

import { PrismaClient } from '@prisma/client';
import { getPublicTeam, hasPublicTeam } from '@/lib/tenant';
import { createStaff, updateStaff, getStaffById } from '@/lib/staff';

const prisma = new PrismaClient();

describe('Staff Public Profile Integration Tests', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let staff1Id: string;
  let staff2Id: string;
  let staff3Id: string;

  beforeAll(async () => {
    // Create Tenant 1 - with public team
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Clinic with Public Team',
        slug: `clinic-public-team-${Date.now()}`,
        planType: 'PROFESIONAL',
        status: 'ACTIVE',
        publicPageEnabled: true,
        isTrialPeriod: true,
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    tenant1Id = tenant1.id;

    // Create Tenant 2 - without public team
    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Clinic without Public Team',
        slug: `clinic-no-public-team-${Date.now()}`,
        planType: 'BASICO',
        status: 'ACTIVE',
        publicPageEnabled: true,
        isTrialPeriod: true,
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    tenant2Id = tenant2.id;

    // Create Staff 1 for Tenant 1 - Public profile enabled
    const staff1 = await prisma.staff.create({
      data: {
        name: 'Dr. María García',
        position: 'Veterinaria',
        email: `maria-${Date.now()}@clinic1.com`,
        tenantId: tenant1Id,
        isActive: true,
        showOnPublicPage: true,
        publicBio: 'Especialista en cirugía de pequeñas especies',
        publicPhoto: 'https://cloudinary.com/photo1.jpg',
        specialties: ['Cirugía', 'Dermatología'],
      },
    });
    staff1Id = staff1.id;

    // Create Staff 2 for Tenant 1 - Public profile DISABLED
    const staff2 = await prisma.staff.create({
      data: {
        name: 'Dr. Juan Pérez',
        position: 'Veterinario',
        email: `juan-${Date.now()}@clinic1.com`,
        tenantId: tenant1Id,
        isActive: true,
        showOnPublicPage: false, // Not visible on public page
        publicBio: 'Internal bio - should not be visible publicly',
        specialties: ['Cardiología'],
      },
    });
    staff2Id = staff2.id;

    // Create Staff 3 for Tenant 2 - Public profile enabled but different tenant
    const staff3 = await prisma.staff.create({
      data: {
        name: 'Dr. Ana López',
        position: 'Veterinaria',
        email: `ana-${Date.now()}@clinic2.com`,
        tenantId: tenant2Id,
        isActive: true,
        showOnPublicPage: true,
        publicBio: 'Tenant 2 veterinarian',
        specialties: ['Oncología'],
      },
    });
    staff3Id = staff3.id;
  });

  afterAll(async () => {
    // Cleanup in order
    const staffIds = [staff1Id, staff2Id, staff3Id].filter(Boolean);
    if (staffIds.length > 0) {
      await prisma.staff.deleteMany({
        where: { id: { in: staffIds } },
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

  describe('getPublicTeam Function', () => {
    it('should return only staff with showOnPublicPage=true', async () => {
      const publicTeam = await getPublicTeam(tenant1Id);

      expect(publicTeam).toHaveLength(1);
      expect(publicTeam[0].name).toBe('Dr. María García');
    });

    it('should not return staff with showOnPublicPage=false', async () => {
      const publicTeam = await getPublicTeam(tenant1Id);

      const hasJuan = publicTeam.some((member) => member.name === 'Dr. Juan Pérez');
      expect(hasJuan).toBe(false);
    });

    it('should return correct public profile fields', async () => {
      const publicTeam = await getPublicTeam(tenant1Id);

      expect(publicTeam[0]).toHaveProperty('id');
      expect(publicTeam[0]).toHaveProperty('name');
      expect(publicTeam[0]).toHaveProperty('position');
      expect(publicTeam[0]).toHaveProperty('publicBio');
      expect(publicTeam[0]).toHaveProperty('publicPhoto');
      expect(publicTeam[0]).toHaveProperty('specialties');
    });

    it('should not return private fields', async () => {
      const publicTeam = await getPublicTeam(tenant1Id);

      // These fields should NOT be in the response
      expect(publicTeam[0]).not.toHaveProperty('email');
      expect(publicTeam[0]).not.toHaveProperty('phone');
      expect(publicTeam[0]).not.toHaveProperty('licenseNumber');
      expect(publicTeam[0]).not.toHaveProperty('tenantId');
    });

    it('should return specialties as array', async () => {
      const publicTeam = await getPublicTeam(tenant1Id);

      expect(Array.isArray(publicTeam[0].specialties)).toBe(true);
      expect(publicTeam[0].specialties).toContain('Cirugía');
      expect(publicTeam[0].specialties).toContain('Dermatología');
    });
  });

  describe('hasPublicTeam Function', () => {
    it('should return true when tenant has public staff', async () => {
      const hasTenant1Team = await hasPublicTeam(tenant1Id);
      expect(hasTenant1Team).toBe(true);
    });

    it('should return true for tenant2 which also has public staff', async () => {
      const hasTenant2Team = await hasPublicTeam(tenant2Id);
      expect(hasTenant2Team).toBe(true);
    });

    it('should return false when tenant has no public staff', async () => {
      // Create a tenant with no public staff
      const emptyTenant = await prisma.tenant.create({
        data: {
          name: 'Empty Clinic',
          slug: `empty-clinic-${Date.now()}`,
          planType: 'BASICO',
          status: 'ACTIVE',
          publicPageEnabled: true,
          isTrialPeriod: true,
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const hasTeam = await hasPublicTeam(emptyTenant.id);
      expect(hasTeam).toBe(false);

      // Cleanup
      await prisma.tenant.delete({ where: { id: emptyTenant.id } });
    });
  });

  describe('Multi-Tenant Data Isolation', () => {
    it('should not return staff from other tenants', async () => {
      const tenant1Team = await getPublicTeam(tenant1Id);
      const tenant2Team = await getPublicTeam(tenant2Id);

      // Tenant 1 should only have María
      const tenant1Names = tenant1Team.map((m) => m.name);
      expect(tenant1Names).toContain('Dr. María García');
      expect(tenant1Names).not.toContain('Dr. Ana López');

      // Tenant 2 should only have Ana
      const tenant2Names = tenant2Team.map((m) => m.name);
      expect(tenant2Names).toContain('Dr. Ana López');
      expect(tenant2Names).not.toContain('Dr. María García');
    });

    it('should isolate staff counts by tenant', async () => {
      const tenant1Team = await getPublicTeam(tenant1Id);
      const tenant2Team = await getPublicTeam(tenant2Id);

      expect(tenant1Team.length).toBe(1);
      expect(tenant2Team.length).toBe(1);
    });
  });

  describe('Staff Public Profile CRUD', () => {
    it('should create staff with public profile fields', async () => {
      const newStaff = await createStaff(tenant1Id, {
        name: 'Dr. Nuevo Veterinario',
        position: 'Veterinario',
        publicBio: 'Nuevo miembro del equipo',
        publicPhoto: 'https://cloudinary.com/new-photo.jpg',
        specialties: ['Neurología', 'Oftalmología'],
        showOnPublicPage: true,
      });

      expect(newStaff.publicBio).toBe('Nuevo miembro del equipo');
      expect(newStaff.publicPhoto).toBe('https://cloudinary.com/new-photo.jpg');
      expect(newStaff.specialties).toContain('Neurología');
      expect(newStaff.showOnPublicPage).toBe(true);

      // Cleanup
      await prisma.staff.delete({ where: { id: newStaff.id } });
    });

    it('should update staff public profile fields', async () => {
      const updatedStaff = await updateStaff(tenant1Id, staff1Id, {
        publicBio: 'Biografía actualizada con más experiencia',
        specialties: ['Cirugía', 'Dermatología', 'Traumatología'],
      });

      expect(updatedStaff.publicBio).toBe('Biografía actualizada con más experiencia');
      expect(updatedStaff.specialties).toHaveLength(3);
      expect(updatedStaff.specialties).toContain('Traumatología');

      // Restore original values
      await updateStaff(tenant1Id, staff1Id, {
        publicBio: 'Especialista en cirugía de pequeñas especies',
        specialties: ['Cirugía', 'Dermatología'],
      });
    });

    it('should toggle showOnPublicPage visibility', async () => {
      // Disable public visibility
      await updateStaff(tenant1Id, staff1Id, {
        showOnPublicPage: false,
      });

      let publicTeam = await getPublicTeam(tenant1Id);
      expect(publicTeam.some((m) => m.id === staff1Id)).toBe(false);

      // Re-enable public visibility
      await updateStaff(tenant1Id, staff1Id, {
        showOnPublicPage: true,
      });

      publicTeam = await getPublicTeam(tenant1Id);
      expect(publicTeam.some((m) => m.id === staff1Id)).toBe(true);
    });

    it('should get staff by ID with public profile fields', async () => {
      const staff = await getStaffById(tenant1Id, staff1Id);

      expect(staff.publicBio).toBeDefined();
      expect(staff.publicPhoto).toBeDefined();
      expect(staff.specialties).toBeDefined();
      expect(staff.showOnPublicPage).toBeDefined();
    });
  });

  describe('Inactive Staff Handling', () => {
    it('should not return inactive staff even with showOnPublicPage=true', async () => {
      // Create inactive staff with public profile
      const inactiveStaff = await prisma.staff.create({
        data: {
          name: 'Dr. Inactivo',
          position: 'Ex-Veterinario',
          tenantId: tenant1Id,
          isActive: false,
          showOnPublicPage: true,
          publicBio: 'Ya no trabaja aquí',
        },
      });

      const publicTeam = await getPublicTeam(tenant1Id);
      const hasInactive = publicTeam.some((m) => m.name === 'Dr. Inactivo');
      expect(hasInactive).toBe(false);

      // Cleanup
      await prisma.staff.delete({ where: { id: inactiveStaff.id } });
    });

    it('hasPublicTeam should not count inactive staff', async () => {
      // Create tenant with only inactive public staff
      const testTenant = await prisma.tenant.create({
        data: {
          name: 'Test Clinic',
          slug: `test-inactive-${Date.now()}`,
          planType: 'BASICO',
          status: 'ACTIVE',
          publicPageEnabled: true,
          isTrialPeriod: true,
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const inactiveStaff = await prisma.staff.create({
        data: {
          name: 'Dr. Inactivo Solo',
          position: 'Veterinario',
          tenantId: testTenant.id,
          isActive: false,
          showOnPublicPage: true,
        },
      });

      const hasTeam = await hasPublicTeam(testTenant.id);
      expect(hasTeam).toBe(false);

      // Cleanup
      await prisma.staff.delete({ where: { id: inactiveStaff.id } });
      await prisma.tenant.delete({ where: { id: testTenant.id } });
    });
  });
});
