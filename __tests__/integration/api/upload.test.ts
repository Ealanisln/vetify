/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestPet, createTestStaff } from '../../utils/test-utils';

// Mock the auth module
const mockRequireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: () => mockRequireAuth(),
}));

// Mock Cloudinary
const mockUploadImage = jest.fn();
const mockDeleteImage = jest.fn();
const mockExtractPublicIdFromUrl = jest.fn();
jest.mock('@/lib/cloudinary', () => ({
  uploadImage: (...args: any[]) => mockUploadImage(...args),
  deleteImage: (...args: any[]) => mockDeleteImage(...args),
  extractPublicIdFromUrl: (...args: any[]) => mockExtractPublicIdFromUrl(...args),
}));

// Import after mocks are set up
import { POST, DELETE } from '@/app/api/upload/route';

describe('Upload API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data with valid UUIDs (Zod schema requires UUID for entityId)
    mockTenant = createTestTenant({ id: '550e8400-e29b-41d4-a716-446655440000' });
    mockPet = createTestPet({
      id: '660e8400-e29b-41d4-a716-446655440001',
      tenantId: mockTenant.id,
      profileImage: null,
    });
    mockStaff = createTestStaff({
      id: '770e8400-e29b-41d4-a716-446655440002',
      tenantId: mockTenant.id,
      publicPhoto: null,
    });

    // Default auth mock
    mockRequireAuth.mockResolvedValue({ tenant: mockTenant, user: { id: 'user-1' } });

    // Default Cloudinary mocks
    mockUploadImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v123/vetify/550e8400-e29b-41d4-a716-446655440000/pets/660e8400-e29b-41d4-a716-446655440001/image.jpg',
      publicId: 'vetify/550e8400-e29b-41d4-a716-446655440000/pets/660e8400-e29b-41d4-a716-446655440001/image',
    });
    mockDeleteImage.mockResolvedValue(undefined);
    mockExtractPublicIdFromUrl.mockReturnValue('vetify/550e8400-e29b-41d4-a716-446655440000/pets/660e8400-e29b-41d4-a716-446655440001/old-image');
  });

  describe('POST /api/upload', () => {
    it('should successfully upload pet profile image', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.update.mockResolvedValue({ ...mockPet, profileImage: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' } as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBeDefined();
      expect(data.message).toBe('Imagen subida exitosamente');
      expect(mockUploadImage).toHaveBeenCalled();
    });

    it('should update Pet.profileImage in database after upload', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.update.mockResolvedValue({ ...mockPet, profileImage: 'https://new-image.jpg' } as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      await POST(request as any);

      expect(prismaMock.pet.update).toHaveBeenCalledWith({
        where: { id: mockPet.id, tenantId: mockTenant.id },
        data: { profileImage: expect.any(String) },
      });
    });

    it('should reject if pet belongs to different tenant', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(null); // Pet not found for this tenant

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', '880e8400-e29b-41d4-a716-446655440003'); // Valid UUID for other tenant's pet

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Mascota no encontrada');
    });

    it('should reject file exceeding 5MB limit', async () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join(''); // 6MB
      const formData = new FormData();
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('5MB');
    });

    it('should reject invalid file types', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('no permitido');
    });

    it('should accept JPEG files', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.update.mockResolvedValue(mockPet as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);
    });

    it('should accept PNG files', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.update.mockResolvedValue(mockPet as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);
    });

    it('should accept WebP files', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.update.mockResolvedValue(mockPet as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);
    });

    it('should reject request without file', async () => {
      const formData = new FormData();
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('archivo');
    });

    it('should reject request with invalid imageType', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'invalid-type');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(500);
    });

    it('should delete old image when uploading replacement', async () => {
      const existingPet = {
        ...mockPet,
        profileImage: 'https://res.cloudinary.com/demo/image/upload/v123/old-image.jpg',
      };
      prismaMock.pet.findFirst.mockResolvedValue(existingPet as any);
      prismaMock.pet.findUnique.mockResolvedValue(existingPet as any);
      prismaMock.pet.update.mockResolvedValue({ ...existingPet, profileImage: 'https://new.jpg' } as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      await POST(request as any);

      expect(mockDeleteImage).toHaveBeenCalled();
    });

    it('should upload staff profile image', async () => {
      prismaMock.staff.findFirst.mockResolvedValue(mockStaff as any);
      prismaMock.staff.update.mockResolvedValue({ ...mockStaff, publicPhoto: 'https://new.jpg' } as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'staff-profile');
      formData.append('entityId', mockStaff.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);
    });

    it('should upload logo without entityId', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({ ...mockTenant, logo: null } as any);
      prismaMock.tenant.update.mockResolvedValue({ ...mockTenant, logo: 'https://new.jpg' } as any);

      const formData = new FormData();
      const file = new File(['test'], 'logo.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'logo');

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/upload', () => {
    it('should successfully delete pet profile image', async () => {
      const petWithImage = {
        ...mockPet,
        profileImage: 'https://res.cloudinary.com/demo/image/upload/v123/image.jpg',
      };
      prismaMock.pet.findFirst.mockResolvedValue(petWithImage as any);
      prismaMock.pet.findUnique.mockResolvedValue(petWithImage as any);
      prismaMock.pet.update.mockResolvedValue({ ...petWithImage, profileImage: null } as any);

      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('imageType', 'pet-profile');
      url.searchParams.set('entityId', mockPet.id);

      const request = new Request(url.toString(), { method: 'DELETE' });

      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Imagen eliminada exitosamente');
      expect(mockDeleteImage).toHaveBeenCalled();
    });

    it('should clear Pet.profileImage field in database', async () => {
      const petWithImage = {
        ...mockPet,
        profileImage: 'https://res.cloudinary.com/demo/image/upload/v123/image.jpg',
      };
      prismaMock.pet.findFirst.mockResolvedValue(petWithImage as any);
      prismaMock.pet.findUnique.mockResolvedValue(petWithImage as any);
      prismaMock.pet.update.mockResolvedValue({ ...petWithImage, profileImage: null } as any);

      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('imageType', 'pet-profile');
      url.searchParams.set('entityId', mockPet.id);

      const request = new Request(url.toString(), { method: 'DELETE' });

      await DELETE(request as any);

      expect(prismaMock.pet.update).toHaveBeenCalledWith({
        where: { id: mockPet.id },
        data: { profileImage: null },
      });
    });

    it('should validate pet ownership before deletion', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(null); // Pet not found for this tenant

      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('imageType', 'pet-profile');
      url.searchParams.set('entityId', '880e8400-e29b-41d4-a716-446655440003'); // Valid UUID for other tenant's pet

      const request = new Request(url.toString(), { method: 'DELETE' });

      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Mascota no encontrada');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('imageType', 'pet-profile');
      url.searchParams.set('entityId', mockPet.id);

      const request = new Request(url.toString(), { method: 'DELETE' });

      const response = await DELETE(request as any);
      expect(response.status).toBe(500);
    });

    it('should return error for missing imageType', async () => {
      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('entityId', mockPet.id);

      const request = new Request(url.toString(), { method: 'DELETE' });

      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('requerido');
    });

    it('should handle deletion when no image exists', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.findUnique.mockResolvedValue({ ...mockPet, profileImage: null } as any);
      prismaMock.pet.update.mockResolvedValue({ ...mockPet, profileImage: null } as any);

      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('imageType', 'pet-profile');
      url.searchParams.set('entityId', mockPet.id);

      const request = new Request(url.toString(), { method: 'DELETE' });

      const response = await DELETE(request as any);

      expect(response.status).toBe(200);
      expect(mockDeleteImage).not.toHaveBeenCalled();
    });

    it('should delete logo image', async () => {
      const tenantWithLogo = {
        ...mockTenant,
        logo: 'https://res.cloudinary.com/demo/image/upload/v123/logo.jpg',
      };
      prismaMock.tenant.findUnique.mockResolvedValue(tenantWithLogo as any);
      prismaMock.tenant.update.mockResolvedValue({ ...tenantWithLogo, logo: null } as any);

      const url = new URL('http://localhost:3000/api/upload');
      url.searchParams.set('imageType', 'logo');

      const request = new Request(url.toString(), { method: 'DELETE' });

      const response = await DELETE(request as any);
      expect(response.status).toBe(200);
    });
  });

  describe('Tenant Isolation', () => {
    it('should only allow access to pets within tenant', async () => {
      // Simulate pet belonging to a different tenant
      prismaMock.pet.findFirst.mockResolvedValue(null);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', '990e8400-e29b-41d4-a716-446655440004'); // Valid UUID

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(404);
    });

    it('should scope uploads to correct tenant folder', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      prismaMock.pet.update.mockResolvedValue(mockPet as any);

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      await POST(request as any);

      expect(mockUploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          tenantId: mockTenant.id,
          imageType: 'pet-profile',
          entityId: mockPet.id,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Cloudinary upload errors gracefully', async () => {
      prismaMock.pet.findFirst.mockResolvedValue(mockPet as any);
      mockUploadImage.mockRejectedValue(new Error('Cloudinary error'));

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(500);
    });

    it('should continue upload even if old image deletion fails', async () => {
      const existingPet = {
        ...mockPet,
        profileImage: 'https://res.cloudinary.com/demo/image/upload/v123/old.jpg',
      };
      prismaMock.pet.findFirst.mockResolvedValue(existingPet as any);
      prismaMock.pet.findUnique.mockResolvedValue(existingPet as any);
      prismaMock.pet.update.mockResolvedValue({ ...existingPet, profileImage: 'https://new.jpg' } as any);
      mockDeleteImage.mockRejectedValue(new Error('Delete failed'));

      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('imageType', 'pet-profile');
      formData.append('entityId', mockPet.id);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      // Upload should still succeed even if old image deletion fails
      expect(response.status).toBe(200);
    });
  });
});
