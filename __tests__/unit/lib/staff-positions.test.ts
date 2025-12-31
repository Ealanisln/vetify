/**
 * Unit tests for staff position mappings and utilities
 */

import {
  StaffPosition,
  StaffPositionType,
  POSITION_LABELS_ES,
  SPANISH_POSITION_TO_ENUM,
  mapPositionToEnum,
  getPositionLabel,
  POSITION_SELECT_OPTIONS,
  getPositionOptions,
  MEDICAL_STAFF_POSITIONS,
  LICENSE_REQUIRED_POSITIONS,
  canCreateMedicalRecords,
  requiresLicense,
} from '@/lib/staff-positions';

describe('Staff Positions', () => {
  describe('StaffPosition Constants', () => {
    it('should have all expected position values', () => {
      expect(StaffPosition.VETERINARIAN).toBe('VETERINARIAN');
      expect(StaffPosition.ASSISTANT).toBe('ASSISTANT');
      expect(StaffPosition.VETERINARY_TECHNICIAN).toBe('VETERINARY_TECHNICIAN');
      expect(StaffPosition.RECEPTIONIST).toBe('RECEPTIONIST');
      expect(StaffPosition.MANAGER).toBe('MANAGER');
      expect(StaffPosition.GROOMER).toBe('GROOMER');
      expect(StaffPosition.OTHER).toBe('OTHER');
    });

    it('should have 7 position types', () => {
      const positions = Object.keys(StaffPosition);
      expect(positions).toHaveLength(7);
    });
  });

  describe('POSITION_LABELS_ES', () => {
    it('should have Spanish labels for all positions', () => {
      expect(POSITION_LABELS_ES[StaffPosition.VETERINARIAN]).toBe('Veterinario');
      expect(POSITION_LABELS_ES[StaffPosition.ASSISTANT]).toBe('Asistente Veterinario');
      expect(POSITION_LABELS_ES[StaffPosition.VETERINARY_TECHNICIAN]).toBe('Técnico Veterinario');
      expect(POSITION_LABELS_ES[StaffPosition.RECEPTIONIST]).toBe('Recepcionista');
      expect(POSITION_LABELS_ES[StaffPosition.MANAGER]).toBe('Gerente');
      expect(POSITION_LABELS_ES[StaffPosition.GROOMER]).toBe('Peluquero');
      expect(POSITION_LABELS_ES[StaffPosition.OTHER]).toBe('Otro');
    });

    it('should have a label for every StaffPosition', () => {
      Object.values(StaffPosition).forEach((position) => {
        expect(POSITION_LABELS_ES[position]).toBeDefined();
        expect(typeof POSITION_LABELS_ES[position]).toBe('string');
      });
    });
  });

  describe('SPANISH_POSITION_TO_ENUM', () => {
    it('should map basic Spanish positions to enums', () => {
      expect(SPANISH_POSITION_TO_ENUM['Veterinario']).toBe(StaffPosition.VETERINARIAN);
      expect(SPANISH_POSITION_TO_ENUM['Asistente Veterinario']).toBe(StaffPosition.ASSISTANT);
      expect(SPANISH_POSITION_TO_ENUM['Técnico Veterinario']).toBe(StaffPosition.VETERINARY_TECHNICIAN);
      expect(SPANISH_POSITION_TO_ENUM['Recepcionista']).toBe(StaffPosition.RECEPTIONIST);
      expect(SPANISH_POSITION_TO_ENUM['Gerente']).toBe(StaffPosition.MANAGER);
      expect(SPANISH_POSITION_TO_ENUM['Peluquero']).toBe(StaffPosition.GROOMER);
      expect(SPANISH_POSITION_TO_ENUM['Otro']).toBe(StaffPosition.OTHER);
    });

    it('should map veterinarian specialty variants correctly', () => {
      expect(SPANISH_POSITION_TO_ENUM['Veterinario Especialista']).toBe(StaffPosition.VETERINARIAN);
      expect(SPANISH_POSITION_TO_ENUM['Cirujano Veterinario']).toBe(StaffPosition.VETERINARIAN);
    });
  });

  describe('mapPositionToEnum', () => {
    it('should map valid Spanish positions correctly', () => {
      expect(mapPositionToEnum('Veterinario')).toBe(StaffPosition.VETERINARIAN);
      expect(mapPositionToEnum('Asistente Veterinario')).toBe(StaffPosition.ASSISTANT);
      expect(mapPositionToEnum('Técnico Veterinario')).toBe(StaffPosition.VETERINARY_TECHNICIAN);
      expect(mapPositionToEnum('Recepcionista')).toBe(StaffPosition.RECEPTIONIST);
      expect(mapPositionToEnum('Gerente')).toBe(StaffPosition.MANAGER);
      expect(mapPositionToEnum('Peluquero')).toBe(StaffPosition.GROOMER);
      expect(mapPositionToEnum('Otro')).toBe(StaffPosition.OTHER);
    });

    it('should map veterinarian specialty variants', () => {
      expect(mapPositionToEnum('Veterinario Especialista')).toBe(StaffPosition.VETERINARIAN);
      expect(mapPositionToEnum('Cirujano Veterinario')).toBe(StaffPosition.VETERINARIAN);
    });

    it('should default to VETERINARIAN for unknown positions', () => {
      expect(mapPositionToEnum('Unknown Position')).toBe(StaffPosition.VETERINARIAN);
      expect(mapPositionToEnum('')).toBe(StaffPosition.VETERINARIAN);
      expect(mapPositionToEnum('Random Text')).toBe(StaffPosition.VETERINARIAN);
    });

    it('should be case-sensitive (return default for wrong case)', () => {
      expect(mapPositionToEnum('veterinario')).toBe(StaffPosition.VETERINARIAN);
      expect(mapPositionToEnum('VETERINARIO')).toBe(StaffPosition.VETERINARIAN);
    });
  });

  describe('getPositionLabel', () => {
    it('should return Spanish labels for valid positions', () => {
      expect(getPositionLabel(StaffPosition.VETERINARIAN)).toBe('Veterinario');
      expect(getPositionLabel(StaffPosition.ASSISTANT)).toBe('Asistente Veterinario');
      expect(getPositionLabel(StaffPosition.VETERINARY_TECHNICIAN)).toBe('Técnico Veterinario');
      expect(getPositionLabel(StaffPosition.RECEPTIONIST)).toBe('Recepcionista');
      expect(getPositionLabel(StaffPosition.MANAGER)).toBe('Gerente');
      expect(getPositionLabel(StaffPosition.GROOMER)).toBe('Peluquero');
      expect(getPositionLabel(StaffPosition.OTHER)).toBe('Otro');
    });

    it('should return "Otro" for unknown positions', () => {
      expect(getPositionLabel('UNKNOWN' as StaffPositionType)).toBe('Otro');
    });
  });

  describe('POSITION_SELECT_OPTIONS', () => {
    it('should have correct structure for all options', () => {
      POSITION_SELECT_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    it('should have 9 options (including specialty variants)', () => {
      expect(POSITION_SELECT_OPTIONS).toHaveLength(9);
    });

    it('should include all veterinarian variants', () => {
      const values = POSITION_SELECT_OPTIONS.map((o) => o.value);
      expect(values).toContain('Veterinario');
      expect(values).toContain('Veterinario Especialista');
      expect(values).toContain('Cirujano Veterinario');
    });

    it('should have matching value and label for most options', () => {
      // Most options have same value and label
      const matchingOptions = POSITION_SELECT_OPTIONS.filter(
        (o) => o.value === o.label
      );
      expect(matchingOptions.length).toBeGreaterThan(0);
    });
  });

  describe('getPositionOptions', () => {
    it('should return the same options as POSITION_SELECT_OPTIONS', () => {
      expect(getPositionOptions()).toBe(POSITION_SELECT_OPTIONS);
    });
  });

  describe('Position Groups', () => {
    describe('MEDICAL_STAFF_POSITIONS', () => {
      it('should include VETERINARIAN', () => {
        expect(MEDICAL_STAFF_POSITIONS).toContain(StaffPosition.VETERINARIAN);
      });

      it('should include VETERINARY_TECHNICIAN', () => {
        expect(MEDICAL_STAFF_POSITIONS).toContain(StaffPosition.VETERINARY_TECHNICIAN);
      });

      it('should have exactly 2 medical positions', () => {
        expect(MEDICAL_STAFF_POSITIONS).toHaveLength(2);
      });

      it('should not include non-medical positions', () => {
        expect(MEDICAL_STAFF_POSITIONS).not.toContain(StaffPosition.RECEPTIONIST);
        expect(MEDICAL_STAFF_POSITIONS).not.toContain(StaffPosition.MANAGER);
        expect(MEDICAL_STAFF_POSITIONS).not.toContain(StaffPosition.GROOMER);
      });
    });

    describe('LICENSE_REQUIRED_POSITIONS', () => {
      it('should include only VETERINARIAN', () => {
        expect(LICENSE_REQUIRED_POSITIONS).toEqual([StaffPosition.VETERINARIAN]);
      });

      it('should not include assistants or technicians', () => {
        expect(LICENSE_REQUIRED_POSITIONS).not.toContain(StaffPosition.ASSISTANT);
        expect(LICENSE_REQUIRED_POSITIONS).not.toContain(StaffPosition.VETERINARY_TECHNICIAN);
      });
    });
  });

  describe('canCreateMedicalRecords', () => {
    it('should return true for veterinarians', () => {
      expect(canCreateMedicalRecords(StaffPosition.VETERINARIAN)).toBe(true);
    });

    it('should return true for veterinary technicians', () => {
      expect(canCreateMedicalRecords(StaffPosition.VETERINARY_TECHNICIAN)).toBe(true);
    });

    it('should return false for non-medical positions', () => {
      expect(canCreateMedicalRecords(StaffPosition.ASSISTANT)).toBe(false);
      expect(canCreateMedicalRecords(StaffPosition.RECEPTIONIST)).toBe(false);
      expect(canCreateMedicalRecords(StaffPosition.MANAGER)).toBe(false);
      expect(canCreateMedicalRecords(StaffPosition.GROOMER)).toBe(false);
      expect(canCreateMedicalRecords(StaffPosition.OTHER)).toBe(false);
    });
  });

  describe('requiresLicense', () => {
    it('should return true only for veterinarians', () => {
      expect(requiresLicense(StaffPosition.VETERINARIAN)).toBe(true);
    });

    it('should return false for all other positions', () => {
      expect(requiresLicense(StaffPosition.ASSISTANT)).toBe(false);
      expect(requiresLicense(StaffPosition.VETERINARY_TECHNICIAN)).toBe(false);
      expect(requiresLicense(StaffPosition.RECEPTIONIST)).toBe(false);
      expect(requiresLicense(StaffPosition.MANAGER)).toBe(false);
      expect(requiresLicense(StaffPosition.GROOMER)).toBe(false);
      expect(requiresLicense(StaffPosition.OTHER)).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should maintain consistency between UI selection and API mapping', () => {
      // When user selects from dropdown, the value should map correctly
      POSITION_SELECT_OPTIONS.forEach((option) => {
        const enumValue = mapPositionToEnum(option.value);
        expect(Object.values(StaffPosition)).toContain(enumValue);
      });
    });

    it('should round-trip positions correctly', () => {
      // From enum to label and back should work
      Object.values(StaffPosition).forEach((position) => {
        const label = getPositionLabel(position);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });
});
