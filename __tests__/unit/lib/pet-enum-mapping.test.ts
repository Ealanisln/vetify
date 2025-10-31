/**
 * Unit tests for pet enum mapping utilities
 */

import { mapSpeciesToEnglish, mapGenderToEnglish, VALID_SPECIES, VALID_GENDERS } from '@/lib/utils/pet-enum-mapping';

describe('Pet Enum Mapping', () => {
  // Mock console.error to test error logging
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('mapSpeciesToEnglish', () => {
    describe('Valid Spanish species values', () => {
      it('should map "Perro" to "dog"', () => {
        expect(mapSpeciesToEnglish('Perro')).toBe('dog');
      });

      it('should map "Gato" to "cat"', () => {
        expect(mapSpeciesToEnglish('Gato')).toBe('cat');
      });

      it('should map "Ave" to "bird"', () => {
        expect(mapSpeciesToEnglish('Ave')).toBe('bird');
      });

      it('should map "Conejo" to "rabbit"', () => {
        expect(mapSpeciesToEnglish('Conejo')).toBe('rabbit');
      });

      it('should map "Reptil" to "other"', () => {
        expect(mapSpeciesToEnglish('Reptil')).toBe('other');
      });

      it('should map "Otro" to "other"', () => {
        expect(mapSpeciesToEnglish('Otro')).toBe('other');
      });
    });

    describe('Invalid species values', () => {
      it('should default to "other" for unknown species', () => {
        expect(mapSpeciesToEnglish('InvalidSpecies')).toBe('other');
      });

      it('should log error for unknown species', () => {
        mapSpeciesToEnglish('InvalidSpecies');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[Translation Error] Invalid species value: "InvalidSpecies". Defaulting to "other".'
        );
      });

      it('should handle empty string gracefully', () => {
        expect(mapSpeciesToEnglish('')).toBe('other');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it('should handle case-sensitive input (lowercase)', () => {
        expect(mapSpeciesToEnglish('perro')).toBe('other');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it('should handle numbers as invalid input', () => {
        expect(mapSpeciesToEnglish('123')).toBe('other');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('mapGenderToEnglish', () => {
    describe('Valid Spanish gender values', () => {
      it('should map "Macho" to "male"', () => {
        expect(mapGenderToEnglish('Macho')).toBe('male');
      });

      it('should map "Hembra" to "female"', () => {
        expect(mapGenderToEnglish('Hembra')).toBe('female');
      });
    });

    describe('Invalid gender values', () => {
      it('should default to "male" for unknown gender', () => {
        expect(mapGenderToEnglish('InvalidGender')).toBe('male');
      });

      it('should log error for unknown gender', () => {
        mapGenderToEnglish('InvalidGender');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[Translation Error] Invalid gender value: "InvalidGender". Defaulting to "male".'
        );
      });

      it('should handle empty string gracefully', () => {
        expect(mapGenderToEnglish('')).toBe('male');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it('should handle case-sensitive input (lowercase)', () => {
        expect(mapGenderToEnglish('macho')).toBe('male');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it('should handle English values as invalid (since UI should use Spanish)', () => {
        expect(mapGenderToEnglish('male')).toBe('male');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Constants', () => {
    it('should export valid species array', () => {
      expect(VALID_SPECIES).toEqual(['dog', 'cat', 'bird', 'rabbit', 'other']);
    });

    it('should export valid genders array', () => {
      expect(VALID_GENDERS).toEqual(['male', 'female']);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle consecutive calls without side effects', () => {
      expect(mapSpeciesToEnglish('Perro')).toBe('dog');
      expect(mapSpeciesToEnglish('Gato')).toBe('cat');
      expect(mapSpeciesToEnglish('Perro')).toBe('dog');
    });

    it('should maintain separate error logging for species and gender', () => {
      mapSpeciesToEnglish('Invalid');
      mapGenderToEnglish('Invalid');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(
        1,
        '[Translation Error] Invalid species value: "Invalid". Defaulting to "other".'
      );
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(
        2,
        '[Translation Error] Invalid gender value: "Invalid". Defaulting to "male".'
      );
    });
  });
});
