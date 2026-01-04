/**
 * Unit Tests for Public Team Functions
 *
 * Tests getPublicTeam and hasPublicTeam functions in tenant.ts
 */

// Mock Prisma before importing tenant functions
jest.mock('@/lib/prisma', () => ({
  prisma: {
    staff: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import type { PublicStaffMember } from '@/lib/tenant';

// Import the functions dynamically to work with mocks
const mockStaffFindMany = prisma.staff.findMany as jest.MockedFunction<typeof prisma.staff.findMany>;
const mockStaffCount = prisma.staff.count as jest.MockedFunction<typeof prisma.staff.count>;

describe('Public Team Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTeam', () => {
    // We need to import the function after mocks are set up
    let getPublicTeam: (tenantId: string) => Promise<PublicStaffMember[]>;

    beforeAll(async () => {
      const tenant = await import('@/lib/tenant');
      getPublicTeam = tenant.getPublicTeam;
    });

    it('should return only staff with showOnPublicPage=true and isActive=true', async () => {
      const mockStaff = [
        {
          id: 'staff-1',
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicBio: 'Especialista en pequeñas especies',
          publicPhoto: 'https://cloudinary.com/photo1.jpg',
          specialties: ['Cirugía', 'Dermatología'],
        },
        {
          id: 'staff-2',
          name: 'Dr. Juan Pérez',
          position: 'Veterinario',
          publicBio: null,
          publicPhoto: null,
          specialties: ['Cardiología'],
        },
      ];

      mockStaffFindMany.mockResolvedValue(mockStaff as unknown as Awaited<ReturnType<typeof prisma.staff.findMany>>);

      const result = await getPublicTeam('tenant-123');

      expect(mockStaffFindMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-123',
          isActive: true,
          showOnPublicPage: true,
        },
        select: {
          id: true,
          name: true,
          position: true,
          publicBio: true,
          publicPhoto: true,
          specialties: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Dr. María García');
      expect(result[1].name).toBe('Dr. Juan Pérez');
    });

    it('should return empty array when no public staff exists', async () => {
      mockStaffFindMany.mockResolvedValue([]);

      const result = await getPublicTeam('tenant-no-public-staff');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should return staff sorted by name', async () => {
      const mockStaff = [
        { id: 'staff-1', name: 'Ana López', position: 'Asistente', publicBio: null, publicPhoto: null, specialties: [] },
        { id: 'staff-2', name: 'Beatriz Ruiz', position: 'Veterinaria', publicBio: null, publicPhoto: null, specialties: [] },
        { id: 'staff-3', name: 'Carlos Sánchez', position: 'Veterinario', publicBio: null, publicPhoto: null, specialties: [] },
      ];

      mockStaffFindMany.mockResolvedValue(mockStaff as unknown as Awaited<ReturnType<typeof prisma.staff.findMany>>);

      const result = await getPublicTeam('tenant-123');

      expect(mockStaffFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
      expect(result).toHaveLength(3);
    });

    it('should only select public-safe fields', async () => {
      mockStaffFindMany.mockResolvedValue([]);

      await getPublicTeam('tenant-123');

      expect(mockStaffFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            name: true,
            position: true,
            publicBio: true,
            publicPhoto: true,
            specialties: true,
          },
        })
      );

      // Verify private fields are NOT selected
      const callArgs = mockStaffFindMany.mock.calls[0][0];
      expect(callArgs?.select).not.toHaveProperty('email');
      expect(callArgs?.select).not.toHaveProperty('phone');
      expect(callArgs?.select).not.toHaveProperty('licenseNumber');
      expect(callArgs?.select).not.toHaveProperty('salary');
    });

    it('should handle staff with specialties array', async () => {
      const mockStaff = [
        {
          id: 'staff-1',
          name: 'Dr. Test',
          position: 'Veterinario',
          publicBio: 'Bio',
          publicPhoto: 'photo.jpg',
          specialties: ['Cirugía', 'Dermatología', 'Cardiología'],
        },
      ];

      mockStaffFindMany.mockResolvedValue(mockStaff as unknown as Awaited<ReturnType<typeof prisma.staff.findMany>>);

      const result = await getPublicTeam('tenant-123');

      expect(result[0].specialties).toEqual(['Cirugía', 'Dermatología', 'Cardiología']);
      expect(result[0].specialties).toHaveLength(3);
    });

    it('should handle staff with empty specialties array', async () => {
      const mockStaff = [
        {
          id: 'staff-1',
          name: 'Dr. Test',
          position: 'Veterinario',
          publicBio: null,
          publicPhoto: null,
          specialties: [],
        },
      ];

      mockStaffFindMany.mockResolvedValue(mockStaff as unknown as Awaited<ReturnType<typeof prisma.staff.findMany>>);

      const result = await getPublicTeam('tenant-123');

      expect(result[0].specialties).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockStaffFindMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(getPublicTeam('tenant-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('hasPublicTeam', () => {
    let hasPublicTeam: (tenantId: string) => Promise<boolean>;

    beforeAll(async () => {
      const tenant = await import('@/lib/tenant');
      hasPublicTeam = tenant.hasPublicTeam;
    });

    it('should return true when tenant has public staff', async () => {
      mockStaffCount.mockResolvedValue(3);

      const result = await hasPublicTeam('tenant-with-team');

      expect(mockStaffCount).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-with-team',
          isActive: true,
          showOnPublicPage: true,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when tenant has no public staff', async () => {
      mockStaffCount.mockResolvedValue(0);

      const result = await hasPublicTeam('tenant-no-team');

      expect(result).toBe(false);
    });

    it('should return true when tenant has exactly one public staff', async () => {
      mockStaffCount.mockResolvedValue(1);

      const result = await hasPublicTeam('tenant-one-staff');

      expect(result).toBe(true);
    });

    it('should use count query for efficiency', async () => {
      mockStaffCount.mockResolvedValue(5);

      await hasPublicTeam('tenant-123');

      // Should use count() not findMany()
      expect(mockStaffCount).toHaveBeenCalled();
      expect(mockStaffFindMany).not.toHaveBeenCalled();
    });

    it('should filter by isActive and showOnPublicPage', async () => {
      mockStaffCount.mockResolvedValue(0);

      await hasPublicTeam('tenant-123');

      expect(mockStaffCount).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-123',
          isActive: true,
          showOnPublicPage: true,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockStaffCount.mockRejectedValue(new Error('Database error'));

      await expect(hasPublicTeam('tenant-123')).rejects.toThrow('Database error');
    });
  });

  describe('PublicStaffMember Type', () => {
    it('should have correct interface structure', () => {
      // This tests that the type exists and matches expected shape
      const mockMember: PublicStaffMember = {
        id: 'test-id',
        name: 'Test Name',
        position: 'Test Position',
        publicBio: 'Test Bio',
        publicPhoto: 'https://example.com/photo.jpg',
        specialties: ['Specialty 1', 'Specialty 2'],
      };

      expect(mockMember.id).toBe('test-id');
      expect(mockMember.name).toBe('Test Name');
      expect(mockMember.position).toBe('Test Position');
      expect(mockMember.publicBio).toBe('Test Bio');
      expect(mockMember.publicPhoto).toBe('https://example.com/photo.jpg');
      expect(mockMember.specialties).toEqual(['Specialty 1', 'Specialty 2']);
    });

    it('should allow null values for optional fields', () => {
      const mockMember: PublicStaffMember = {
        id: 'test-id',
        name: 'Test Name',
        position: 'Test Position',
        publicBio: null,
        publicPhoto: null,
        specialties: [],
      };

      expect(mockMember.publicBio).toBeNull();
      expect(mockMember.publicPhoto).toBeNull();
      expect(mockMember.specialties).toEqual([]);
    });
  });
});
