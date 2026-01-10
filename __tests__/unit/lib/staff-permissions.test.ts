/**
 * Unit tests for staff permissions system
 */

import {
  canAccess,
  isAdminPosition,
  getPermissions,
  getAccessibleFeatures,
  canManageStaff,
  canAccessSettings,
  canViewReports,
  canManageInventory,
  canEditMedicalRecords,
  canProcessSales,
  canManageLocations,
  POSITION_PERMISSIONS,
  ADMIN_POSITIONS,
  type Feature,
  type Action,
} from '@/lib/staff-permissions';
import { StaffPosition } from '@/lib/staff-positions';

describe('Staff Permissions', () => {
  describe('POSITION_PERMISSIONS', () => {
    it('should have permissions defined for all staff positions', () => {
      Object.values(StaffPosition).forEach((position) => {
        expect(POSITION_PERMISSIONS[position]).toBeDefined();
        expect(Array.isArray(POSITION_PERMISSIONS[position])).toBe(true);
      });
    });

    it('should give MANAGER full access with wildcard', () => {
      expect(POSITION_PERMISSIONS[StaffPosition.MANAGER]).toContain('*');
    });

    it('should give VETERINARIAN appropriate medical permissions', () => {
      const vetPermissions = POSITION_PERMISSIONS[StaffPosition.VETERINARIAN];
      expect(vetPermissions).toContain('medical');
      expect(vetPermissions).toContain('appointments');
      expect(vetPermissions).toContain('customers');
      expect(vetPermissions).toContain('pets');
    });

    it('should NOT give RECEPTIONIST medical permissions', () => {
      const receptionistPermissions = POSITION_PERMISSIONS[StaffPosition.RECEPTIONIST];
      expect(receptionistPermissions).not.toContain('medical');
      expect(receptionistPermissions).not.toContain('medical:read');
      expect(receptionistPermissions).not.toContain('medical:write');
    });

    it('should give ASSISTANT read-only medical permissions', () => {
      const assistantPermissions = POSITION_PERMISSIONS[StaffPosition.ASSISTANT];
      expect(assistantPermissions).toContain('medical:read');
      expect(assistantPermissions).not.toContain('medical');
      expect(assistantPermissions).not.toContain('medical:write');
    });
  });

  describe('ADMIN_POSITIONS', () => {
    it('should include MANAGER and ADMINISTRATOR', () => {
      expect(ADMIN_POSITIONS).toContain(StaffPosition.MANAGER);
      expect(ADMIN_POSITIONS).toContain(StaffPosition.ADMINISTRATOR);
      expect(ADMIN_POSITIONS).toHaveLength(2);
    });

    it('should not include non-admin positions', () => {
      expect(ADMIN_POSITIONS).not.toContain(StaffPosition.VETERINARIAN);
      expect(ADMIN_POSITIONS).not.toContain(StaffPosition.RECEPTIONIST);
      expect(ADMIN_POSITIONS).not.toContain(StaffPosition.ASSISTANT);
    });
  });

  describe('isAdminPosition', () => {
    it('should return true for MANAGER', () => {
      expect(isAdminPosition(StaffPosition.MANAGER)).toBe(true);
      expect(isAdminPosition('MANAGER')).toBe(true);
    });

    it('should return false for non-admin positions', () => {
      expect(isAdminPosition(StaffPosition.VETERINARIAN)).toBe(false);
      expect(isAdminPosition(StaffPosition.RECEPTIONIST)).toBe(false);
      expect(isAdminPosition(StaffPosition.ASSISTANT)).toBe(false);
      expect(isAdminPosition(StaffPosition.VETERINARY_TECHNICIAN)).toBe(false);
      expect(isAdminPosition(StaffPosition.GROOMER)).toBe(false);
      expect(isAdminPosition(StaffPosition.OTHER)).toBe(false);
    });
  });

  describe('canAccess', () => {
    describe('MANAGER (full access)', () => {
      it('should have access to all features with all actions', () => {
        const features: Feature[] = [
          'dashboard', 'appointments', 'customers', 'pets',
          'medical', 'inventory', 'sales', 'reports',
          'settings', 'staff', 'testimonials', 'locations'
        ];
        const actions: Action[] = ['read', 'write', 'delete'];

        features.forEach((feature) => {
          actions.forEach((action) => {
            expect(canAccess(StaffPosition.MANAGER, feature, action)).toBe(true);
          });
        });
      });
    });

    describe('VETERINARIAN', () => {
      it('should have full access to medical records', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'medical', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'medical', 'write')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'medical', 'delete')).toBe(true);
      });

      it('should have full access to appointments', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'appointments', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'appointments', 'write')).toBe(true);
      });

      it('should have read-only access to inventory', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'inventory', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'inventory', 'write')).toBe(false);
      });

      it('should NOT have access to settings', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'settings', 'read')).toBe(false);
        expect(canAccess(StaffPosition.VETERINARIAN, 'settings', 'write')).toBe(false);
      });

      it('should have read-only access to staff list', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'staff', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'staff', 'write')).toBe(false);
      });

      it('should have read-only access to testimonials', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'testimonials', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'testimonials', 'write')).toBe(false);
        expect(canAccess(StaffPosition.VETERINARIAN, 'testimonials', 'delete')).toBe(false);
      });

      it('should have read-only access to locations', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.VETERINARIAN, 'locations', 'delete')).toBe(false);
      });
    });

    describe('RECEPTIONIST', () => {
      it('should have full access to appointments', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'appointments', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'appointments', 'write')).toBe(true);
      });

      it('should have full access to customers', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'customers', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'customers', 'write')).toBe(true);
      });

      it('should have read-only access to pets', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'pets', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'pets', 'write')).toBe(false);
      });

      it('should have full access to sales', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'sales', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'sales', 'write')).toBe(true);
      });

      it('should NOT have access to medical records', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'medical', 'read')).toBe(false);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'medical', 'write')).toBe(false);
      });

      it('should NOT have access to reports', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'reports', 'read')).toBe(false);
      });

      it('should have read-only access to testimonials', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'testimonials', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'testimonials', 'write')).toBe(false);
      });

      it('should have read-only access to locations', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'locations', 'delete')).toBe(false);
      });
    });

    describe('ASSISTANT', () => {
      it('should have read-only access to medical records', () => {
        expect(canAccess(StaffPosition.ASSISTANT, 'medical', 'read')).toBe(true);
        expect(canAccess(StaffPosition.ASSISTANT, 'medical', 'write')).toBe(false);
      });

      it('should have read-only access to appointments', () => {
        expect(canAccess(StaffPosition.ASSISTANT, 'appointments', 'read')).toBe(true);
        expect(canAccess(StaffPosition.ASSISTANT, 'appointments', 'write')).toBe(false);
      });

      it('should have full access to sales', () => {
        expect(canAccess(StaffPosition.ASSISTANT, 'sales', 'read')).toBe(true);
        expect(canAccess(StaffPosition.ASSISTANT, 'sales', 'write')).toBe(true);
      });

      it('should NOT have access to testimonials', () => {
        expect(canAccess(StaffPosition.ASSISTANT, 'testimonials', 'read')).toBe(false);
        expect(canAccess(StaffPosition.ASSISTANT, 'testimonials', 'write')).toBe(false);
      });

      it('should have read-only access to locations', () => {
        expect(canAccess(StaffPosition.ASSISTANT, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.ASSISTANT, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.ASSISTANT, 'locations', 'delete')).toBe(false);
      });
    });

    describe('VETERINARY_TECHNICIAN', () => {
      it('should have full access to medical records', () => {
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'medical', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'medical', 'write')).toBe(true);
      });

      it('should NOT have access to reports', () => {
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'reports', 'read')).toBe(false);
      });

      it('should have read-only access to testimonials', () => {
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'testimonials', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'testimonials', 'write')).toBe(false);
      });

      it('should have read-only access to locations', () => {
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'locations', 'delete')).toBe(false);
      });
    });

    describe('GROOMER', () => {
      it('should have read-only access to appointments', () => {
        expect(canAccess(StaffPosition.GROOMER, 'appointments', 'read')).toBe(true);
        expect(canAccess(StaffPosition.GROOMER, 'appointments', 'write')).toBe(false);
      });

      it('should have read-only access to pets', () => {
        expect(canAccess(StaffPosition.GROOMER, 'pets', 'read')).toBe(true);
        expect(canAccess(StaffPosition.GROOMER, 'pets', 'write')).toBe(false);
      });

      it('should NOT have access to medical records', () => {
        expect(canAccess(StaffPosition.GROOMER, 'medical', 'read')).toBe(false);
      });

      it('should NOT have access to testimonials', () => {
        expect(canAccess(StaffPosition.GROOMER, 'testimonials', 'read')).toBe(false);
        expect(canAccess(StaffPosition.GROOMER, 'testimonials', 'write')).toBe(false);
      });

      it('should NOT have access to locations', () => {
        expect(canAccess(StaffPosition.GROOMER, 'locations', 'read')).toBe(false);
        expect(canAccess(StaffPosition.GROOMER, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.GROOMER, 'locations', 'delete')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should return false for null position', () => {
        expect(canAccess(null, 'dashboard', 'read')).toBe(false);
      });

      it('should return false for undefined position', () => {
        expect(canAccess(undefined, 'dashboard', 'read')).toBe(false);
      });

      it('should return false for unknown position', () => {
        expect(canAccess('UNKNOWN_POSITION', 'dashboard', 'read')).toBe(false);
      });

      it('should default to read action if not specified', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'medical')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'medical')).toBe(false);
      });
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions for a position', () => {
      const managerPermissions = getPermissions(StaffPosition.MANAGER);
      expect(managerPermissions).toContain('*');
    });

    it('should return empty array for null position', () => {
      expect(getPermissions(null)).toEqual([]);
    });

    it('should return empty array for undefined position', () => {
      expect(getPermissions(undefined)).toEqual([]);
    });

    it('should return empty array for unknown position', () => {
      expect(getPermissions('UNKNOWN')).toEqual([]);
    });
  });

  describe('getAccessibleFeatures', () => {
    it('should return all features for MANAGER', () => {
      const features = getAccessibleFeatures(StaffPosition.MANAGER);
      expect(features).toContain('dashboard');
      expect(features).toContain('medical');
      expect(features).toContain('settings');
      expect(features).toContain('staff');
      expect(features.length).toBe(12); // All 12 features
    });

    it('should return correct features for VETERINARIAN', () => {
      const features = getAccessibleFeatures(StaffPosition.VETERINARIAN);
      expect(features).toContain('dashboard');
      expect(features).toContain('medical');
      expect(features).toContain('appointments');
      expect(features).toContain('staff'); // Has read-only access
      expect(features).not.toContain('settings');
    });

    it('should return correct features for RECEPTIONIST', () => {
      const features = getAccessibleFeatures(StaffPosition.RECEPTIONIST);
      expect(features).toContain('dashboard');
      expect(features).toContain('appointments');
      expect(features).toContain('sales');
      expect(features).not.toContain('medical');
      expect(features).not.toContain('reports');
    });

    it('should return empty array for null position', () => {
      expect(getAccessibleFeatures(null)).toEqual([]);
    });
  });

  describe('Helper functions', () => {
    describe('canManageStaff', () => {
      it('should return true for MANAGER', () => {
        expect(canManageStaff(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return false for non-admin positions', () => {
        expect(canManageStaff(StaffPosition.VETERINARIAN)).toBe(false);
        expect(canManageStaff(StaffPosition.RECEPTIONIST)).toBe(false);
      });
    });

    describe('canAccessSettings', () => {
      it('should return true for MANAGER', () => {
        expect(canAccessSettings(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return false for non-admin positions', () => {
        expect(canAccessSettings(StaffPosition.VETERINARIAN)).toBe(false);
        expect(canAccessSettings(StaffPosition.RECEPTIONIST)).toBe(false);
      });
    });

    describe('canViewReports', () => {
      it('should return true for MANAGER', () => {
        expect(canViewReports(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return true for VETERINARIAN', () => {
        expect(canViewReports(StaffPosition.VETERINARIAN)).toBe(true);
      });

      it('should return false for RECEPTIONIST', () => {
        expect(canViewReports(StaffPosition.RECEPTIONIST)).toBe(false);
      });
    });

    describe('canManageInventory', () => {
      it('should return true for MANAGER', () => {
        expect(canManageInventory(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return false for VETERINARIAN (read-only)', () => {
        expect(canManageInventory(StaffPosition.VETERINARIAN)).toBe(false);
      });
    });

    describe('canEditMedicalRecords', () => {
      it('should return true for MANAGER', () => {
        expect(canEditMedicalRecords(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return true for VETERINARIAN', () => {
        expect(canEditMedicalRecords(StaffPosition.VETERINARIAN)).toBe(true);
      });

      it('should return true for VETERINARY_TECHNICIAN', () => {
        expect(canEditMedicalRecords(StaffPosition.VETERINARY_TECHNICIAN)).toBe(true);
      });

      it('should return false for RECEPTIONIST', () => {
        expect(canEditMedicalRecords(StaffPosition.RECEPTIONIST)).toBe(false);
      });

      it('should return false for ASSISTANT', () => {
        expect(canEditMedicalRecords(StaffPosition.ASSISTANT)).toBe(false);
      });
    });

    describe('canProcessSales', () => {
      it('should return true for MANAGER', () => {
        expect(canProcessSales(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return true for RECEPTIONIST', () => {
        expect(canProcessSales(StaffPosition.RECEPTIONIST)).toBe(true);
      });

      it('should return true for ASSISTANT', () => {
        expect(canProcessSales(StaffPosition.ASSISTANT)).toBe(true);
      });

      it('should return false for VETERINARIAN (read-only sales)', () => {
        expect(canProcessSales(StaffPosition.VETERINARIAN)).toBe(false);
      });
    });

    describe('canManageLocations', () => {
      it('should return true for MANAGER', () => {
        expect(canManageLocations(StaffPosition.MANAGER)).toBe(true);
      });

      it('should return true for ADMINISTRATOR', () => {
        expect(canManageLocations(StaffPosition.ADMINISTRATOR)).toBe(true);
      });

      it('should return false for VETERINARIAN (read-only locations)', () => {
        expect(canManageLocations(StaffPosition.VETERINARIAN)).toBe(false);
      });

      it('should return false for VETERINARY_TECHNICIAN (read-only locations)', () => {
        expect(canManageLocations(StaffPosition.VETERINARY_TECHNICIAN)).toBe(false);
      });

      it('should return false for RECEPTIONIST (read-only locations)', () => {
        expect(canManageLocations(StaffPosition.RECEPTIONIST)).toBe(false);
      });

      it('should return false for ASSISTANT (read-only locations)', () => {
        expect(canManageLocations(StaffPosition.ASSISTANT)).toBe(false);
      });

      it('should return false for GROOMER (no locations access)', () => {
        expect(canManageLocations(StaffPosition.GROOMER)).toBe(false);
      });

      it('should return false for OTHER (no locations access)', () => {
        expect(canManageLocations(StaffPosition.OTHER)).toBe(false);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly model a veterinarian workflow', () => {
      const vetPosition = StaffPosition.VETERINARIAN;

      // Can view and manage patient records
      expect(canAccess(vetPosition, 'pets', 'read')).toBe(true);
      expect(canAccess(vetPosition, 'pets', 'write')).toBe(true);
      expect(canAccess(vetPosition, 'medical', 'write')).toBe(true);

      // Can view inventory for treatment planning
      expect(canAccess(vetPosition, 'inventory', 'read')).toBe(true);

      // Cannot modify inventory
      expect(canAccess(vetPosition, 'inventory', 'write')).toBe(false);

      // Can view staff list but cannot manage
      expect(canAccess(vetPosition, 'staff', 'read')).toBe(true);
      expect(canAccess(vetPosition, 'staff', 'write')).toBe(false);

      // Can view locations but cannot manage
      expect(canAccess(vetPosition, 'locations', 'read')).toBe(true);
      expect(canAccess(vetPosition, 'locations', 'write')).toBe(false);
      expect(canManageLocations(vetPosition)).toBe(false);
    });

    it('should correctly model a receptionist workflow', () => {
      const receptionistPosition = StaffPosition.RECEPTIONIST;

      // Can manage appointments and customers
      expect(canAccess(receptionistPosition, 'appointments', 'write')).toBe(true);
      expect(canAccess(receptionistPosition, 'customers', 'write')).toBe(true);

      // Can process sales
      expect(canAccess(receptionistPosition, 'sales', 'write')).toBe(true);

      // Cannot access medical records
      expect(canAccess(receptionistPosition, 'medical', 'read')).toBe(false);

      // Can view locations but cannot manage
      expect(canAccess(receptionistPosition, 'locations', 'read')).toBe(true);
      expect(canAccess(receptionistPosition, 'locations', 'write')).toBe(false);
      expect(canManageLocations(receptionistPosition)).toBe(false);
    });

    it('should correctly model an assistant workflow', () => {
      const assistantPosition = StaffPosition.ASSISTANT;

      // Can view appointments and medical info (read-only)
      expect(canAccess(assistantPosition, 'appointments', 'read')).toBe(true);
      expect(canAccess(assistantPosition, 'medical', 'read')).toBe(true);

      // Cannot modify appointments or medical records
      expect(canAccess(assistantPosition, 'appointments', 'write')).toBe(false);
      expect(canAccess(assistantPosition, 'medical', 'write')).toBe(false);

      // Can process sales
      expect(canAccess(assistantPosition, 'sales', 'write')).toBe(true);

      // Can view locations but cannot manage
      expect(canAccess(assistantPosition, 'locations', 'read')).toBe(true);
      expect(canManageLocations(assistantPosition)).toBe(false);
    });

    it('should correctly model a manager workflow', () => {
      const managerPosition = StaffPosition.MANAGER;

      // Can manage everything including locations
      expect(canAccess(managerPosition, 'locations', 'read')).toBe(true);
      expect(canAccess(managerPosition, 'locations', 'write')).toBe(true);
      expect(canAccess(managerPosition, 'locations', 'delete')).toBe(true);
      expect(canManageLocations(managerPosition)).toBe(true);
    });
  });
});
