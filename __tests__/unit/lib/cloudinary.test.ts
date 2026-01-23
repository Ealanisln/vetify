import {
  getFolderPath,
  getTransformations,
  extractPublicIdFromUrl,
  type ImageType,
} from '@/lib/cloudinary';

describe('Cloudinary Utilities', () => {
  describe('getFolderPath', () => {
    const tenantId = 'tenant-123';
    const entityId = 'entity-456';

    it('returns correct path for logo type', () => {
      const result = getFolderPath({ tenantId, imageType: 'logo' });
      expect(result).toBe('vetify/tenant-123/logo');
    });

    it('returns correct path for hero type', () => {
      const result = getFolderPath({ tenantId, imageType: 'hero' });
      expect(result).toBe('vetify/tenant-123/hero');
    });

    it('returns correct path for pet-profile type with entityId', () => {
      const result = getFolderPath({ tenantId, imageType: 'pet-profile', entityId });
      expect(result).toBe('vetify/tenant-123/pets/entity-456');
    });

    it('returns correct path for staff-profile type with entityId', () => {
      const result = getFolderPath({ tenantId, imageType: 'staff-profile', entityId });
      expect(result).toBe('vetify/tenant-123/staff/entity-456');
    });

    it('returns correct path for gallery type', () => {
      const result = getFolderPath({ tenantId, imageType: 'gallery' });
      expect(result).toBe('vetify/tenant-123/gallery');
    });

    it('returns base path for unknown type', () => {
      const result = getFolderPath({ tenantId, imageType: 'unknown' as ImageType });
      expect(result).toBe('vetify/tenant-123');
    });

    it('handles special characters in tenantId', () => {
      const result = getFolderPath({ tenantId: 'tenant-with-special_chars', imageType: 'logo' });
      expect(result).toBe('vetify/tenant-with-special_chars/logo');
    });

    it('handles pet-profile without entityId', () => {
      const result = getFolderPath({ tenantId, imageType: 'pet-profile' });
      expect(result).toBe('vetify/tenant-123/pets/undefined');
    });
  });

  describe('getTransformations', () => {
    it('returns 400x400 limit for logo type', () => {
      const result = getTransformations('logo');
      expect(result).toEqual({
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
    });

    it('returns 1920x1080 limit for hero type', () => {
      const result = getTransformations('hero');
      expect(result).toEqual({
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
    });

    it('returns 400x400 fill with auto gravity for pet-profile type', () => {
      const result = getTransformations('pet-profile');
      expect(result).toEqual({
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
    });

    it('returns 400x400 fill with face gravity for staff-profile type', () => {
      const result = getTransformations('staff-profile');
      expect(result).toEqual({
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
    });

    it('returns 1200x800 limit for gallery type', () => {
      const result = getTransformations('gallery');
      expect(result).toEqual({
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
    });

    it('returns default quality settings for unknown type', () => {
      const result = getTransformations('unknown' as ImageType);
      expect(result).toEqual({ quality: 'auto', fetch_format: 'auto' });
    });

    it('all valid image types include quality auto:good and fetch_format auto', () => {
      const validTypes: ImageType[] = ['logo', 'hero', 'pet-profile', 'staff-profile', 'gallery'];

      validTypes.forEach((type) => {
        const result = getTransformations(type);
        expect(result.transformation).toBeDefined();
        expect(result.transformation).toContainEqual({
          quality: 'auto:good',
          fetch_format: 'auto',
        });
      });
    });
  });

  describe('extractPublicIdFromUrl', () => {
    it('extracts public ID from valid Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/vetify/tenant-123/logo/image.jpg';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('vetify/tenant-123/logo/image');
    });

    it('returns null for invalid URL', () => {
      const result = extractPublicIdFromUrl('not-a-valid-url');
      expect(result).toBeNull();
    });

    it('handles URLs with .jpg extension', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.jpg';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('folder/image');
    });

    it('handles URLs with .png extension', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.png';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('folder/image');
    });

    it('handles URLs with .webp extension', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.webp';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('folder/image');
    });

    it('handles nested folder paths', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v999/vetify/tenant-abc/pets/pet-id-123/profile.jpg';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('vetify/tenant-abc/pets/pet-id-123/profile');
    });

    it('returns null for non-Cloudinary URLs', () => {
      const url = 'https://example.com/some/path/image.jpg';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBeNull();
    });

    it('returns null for URLs without version number', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/folder/image.jpg';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBeNull();
    });

    it('handles URLs with different version numbers', () => {
      const url1 = 'https://res.cloudinary.com/demo/image/upload/v1/folder/image.jpg';
      const url2 = 'https://res.cloudinary.com/demo/image/upload/v9999999999/folder/image.jpg';

      expect(extractPublicIdFromUrl(url1)).toBe('folder/image');
      expect(extractPublicIdFromUrl(url2)).toBe('folder/image');
    });

    it('returns null for empty string', () => {
      const result = extractPublicIdFromUrl('');
      expect(result).toBeNull();
    });

    it('handles URLs with uppercase extensions', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.JPG';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('folder/image');
    });

    it('handles URLs with special characters in path', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder-name_123/my-image.jpg';
      const result = extractPublicIdFromUrl(url);
      expect(result).toBe('folder-name_123/my-image');
    });
  });

  describe('Edge Cases', () => {
    it('getFolderPath handles UUID-style tenant IDs', () => {
      const result = getFolderPath({
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        imageType: 'logo',
      });
      expect(result).toBe('vetify/550e8400-e29b-41d4-a716-446655440000/logo');
    });

    it('getFolderPath handles UUID-style entity IDs', () => {
      const result = getFolderPath({
        tenantId: 'tenant-123',
        imageType: 'pet-profile',
        entityId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result).toBe('vetify/tenant-123/pets/550e8400-e29b-41d4-a716-446655440000');
    });

    it('extractPublicIdFromUrl handles URLs with query parameters (should ignore them)', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.jpg?some=param';
      const result = extractPublicIdFromUrl(url);
      // Query params should cause the regex to fail
      expect(result).toBeNull();
    });
  });
});
