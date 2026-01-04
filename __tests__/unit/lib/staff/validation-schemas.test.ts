/**
 * Unit Tests for Staff Validation Schemas
 *
 * Tests createStaffSchema, updateStaffSchema including public profile fields
 */

import { createStaffSchema, updateStaffSchema, staffFiltersSchema } from '@/lib/staff';

describe('Staff Validation Schemas', () => {
  describe('createStaffSchema', () => {
    describe('Basic Fields', () => {
      it('should validate valid staff data', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          email: 'maria@clinic.com',
          phone: '+52 555 123 4567',
          licenseNumber: 'VET-12345',
          isActive: true,
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should require name with at least 2 characters', () => {
        const invalidData = {
          name: 'A',
          position: 'Veterinaria',
        };

        const result = createStaffSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('El nombre debe tener al menos 2 caracteres');
        }
      });

      it('should require position with at least 2 characters', () => {
        const invalidData = {
          name: 'Valid Name',
          position: 'V',
        };

        const result = createStaffSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('La posición debe tener al menos 2 caracteres');
        }
      });

      it('should validate email format when provided', () => {
        const invalidData = {
          name: 'Valid Name',
          position: 'Veterinaria',
          email: 'invalid-email',
        };

        const result = createStaffSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Email inválido');
        }
      });

      it('should accept valid email format', () => {
        const validData = {
          name: 'Valid Name',
          position: 'Veterinaria',
          email: 'valid@email.com',
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow optional email', () => {
        const validData = {
          name: 'Valid Name',
          position: 'Veterinaria',
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should default isActive to true', () => {
        const validData = {
          name: 'Valid Name',
          position: 'Veterinaria',
        };

        const result = createStaffSchema.parse(validData);
        expect(result.isActive).toBe(true);
      });
    });

    describe('Public Profile Fields', () => {
      it('should accept valid publicBio', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicBio: 'Especialista en cirugía de pequeñas especies con 10 años de experiencia.',
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.publicBio).toBe(validData.publicBio);
        }
      });

      it('should reject publicBio exceeding 500 characters', () => {
        const longBio = 'A'.repeat(501);
        const invalidData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicBio: longBio,
        };

        const result = createStaffSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('La biografía no puede exceder 500 caracteres');
        }
      });

      it('should accept publicBio with exactly 500 characters', () => {
        const exactBio = 'A'.repeat(500);
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicBio: exactBio,
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept valid publicPhoto URL', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicPhoto: 'https://res.cloudinary.com/demo/image/upload/staff/photo.jpg',
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid publicPhoto URL', () => {
        const invalidData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicPhoto: 'not-a-valid-url',
        };

        const result = createStaffSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept null for publicPhoto', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          publicPhoto: null,
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept empty specialties array', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          specialties: [],
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.specialties).toEqual([]);
        }
      });

      it('should accept specialties array with values', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          specialties: ['Cirugía', 'Dermatología', 'Cardiología'],
        };

        const result = createStaffSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.specialties).toEqual(['Cirugía', 'Dermatología', 'Cardiología']);
        }
      });

      it('should default specialties to empty array', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
        };

        const result = createStaffSchema.parse(validData);
        expect(result.specialties).toEqual([]);
      });

      it('should accept showOnPublicPage boolean', () => {
        const validDataTrue = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          showOnPublicPage: true,
        };

        const validDataFalse = {
          name: 'Dr. Juan Pérez',
          position: 'Veterinario',
          showOnPublicPage: false,
        };

        expect(createStaffSchema.safeParse(validDataTrue).success).toBe(true);
        expect(createStaffSchema.safeParse(validDataFalse).success).toBe(true);
      });

      it('should default showOnPublicPage to false', () => {
        const validData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
        };

        const result = createStaffSchema.parse(validData);
        expect(result.showOnPublicPage).toBe(false);
      });

      it('should validate complete public profile data', () => {
        const completeData = {
          name: 'Dr. María García',
          position: 'Veterinaria',
          email: 'maria@clinic.com',
          phone: '+52 555 123 4567',
          licenseNumber: 'VET-12345',
          isActive: true,
          publicBio: 'Especialista en cirugía con 10 años de experiencia.',
          publicPhoto: 'https://cloudinary.com/photo.jpg',
          specialties: ['Cirugía', 'Dermatología'],
          showOnPublicPage: true,
        };

        const result = createStaffSchema.safeParse(completeData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.publicBio).toBe(completeData.publicBio);
          expect(result.data.publicPhoto).toBe(completeData.publicPhoto);
          expect(result.data.specialties).toEqual(completeData.specialties);
          expect(result.data.showOnPublicPage).toBe(true);
        }
      });
    });
  });

  describe('updateStaffSchema', () => {
    it('should allow partial updates', () => {
      const partialData = {
        name: 'Updated Name',
      };

      const result = updateStaffSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow updating only public profile fields', () => {
      const publicProfileUpdate = {
        publicBio: 'Nueva biografía actualizada',
        showOnPublicPage: true,
      };

      const result = updateStaffSchema.safeParse(publicProfileUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating specialties only', () => {
      const specialtiesUpdate = {
        specialties: ['Cirugía', 'Oncología'],
      };

      const result = updateStaffSchema.safeParse(specialtiesUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating publicPhoto only', () => {
      const photoUpdate = {
        publicPhoto: 'https://cloudinary.com/new-photo.jpg',
      };

      const result = updateStaffSchema.safeParse(photoUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow setting publicPhoto to null', () => {
      const photoRemove = {
        publicPhoto: null,
      };

      const result = updateStaffSchema.safeParse(photoRemove);
      expect(result.success).toBe(true);
    });

    it('should still validate publicBio max length', () => {
      const longBioUpdate = {
        publicBio: 'A'.repeat(501),
      };

      const result = updateStaffSchema.safeParse(longBioUpdate);
      expect(result.success).toBe(false);
    });

    it('should allow empty update object', () => {
      const emptyUpdate = {};

      const result = updateStaffSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('staffFiltersSchema', () => {
    it('should accept valid filters', () => {
      const validFilters = {
        search: 'María',
        position: 'Veterinaria',
        isActive: true,
        locationId: 'location-123',
        page: 1,
        limit: 20,
      };

      const result = staffFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should default page to 1', () => {
      const filters = {};
      const result = staffFiltersSchema.parse(filters);
      expect(result.page).toBe(1);
    });

    it('should default limit to 20', () => {
      const filters = {};
      const result = staffFiltersSchema.parse(filters);
      expect(result.limit).toBe(20);
    });

    it('should reject page less than 1', () => {
      const invalidFilters = {
        page: 0,
      };

      const result = staffFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const invalidFilters = {
        limit: 101,
      };

      const result = staffFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Inference', () => {
    it('should infer correct types from createStaffSchema', () => {
      // This test ensures TypeScript types are correctly inferred
      const testData = createStaffSchema.parse({
        name: 'Test Name',
        position: 'Test Position',
        publicBio: 'Test Bio',
        specialties: ['Test Specialty'],
        showOnPublicPage: true,
      });

      // Type checks - these would fail at compile time if types were wrong
      const name: string = testData.name;
      const position: string = testData.position;
      const publicBio: string | undefined = testData.publicBio;
      const specialties: string[] = testData.specialties;
      const showOnPublicPage: boolean = testData.showOnPublicPage;

      expect(name).toBe('Test Name');
      expect(position).toBe('Test Position');
      expect(publicBio).toBe('Test Bio');
      expect(specialties).toEqual(['Test Specialty']);
      expect(showOnPublicPage).toBe(true);
    });
  });
});
