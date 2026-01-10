/**
 * Integration tests for Settings page access control
 *
 * Tests verify that only MANAGER and ADMINISTRATOR positions can access
 * the settings page, while other positions are denied access.
 */

import {
  createTestStaff,
  createTestStaffWithPosition,
  createTestUser,
  createTestTenant,
} from '../../utils/test-utils';
import {
  canAccess,
  canAccessSettings,
  isAdminPosition,
  ADMIN_POSITIONS,
} from '@/lib/staff-permissions';
import { StaffPosition } from '@/lib/staff-positions';

describe('Settings Page Access Control', () => {
  describe('Permission verification for settings feature', () => {
    const allPositions = Object.values(StaffPosition);
    const settingsAllowedPositions = ADMIN_POSITIONS;

    it('should only allow MANAGER and ADMINISTRATOR to access settings', () => {
      settingsAllowedPositions.forEach((position) => {
        expect(canAccess(position, 'settings', 'read')).toBe(true);
        expect(canAccess(position, 'settings', 'write')).toBe(true);
        expect(canAccessSettings(position)).toBe(true);
      });
    });

    it('should deny settings access to all non-admin positions', () => {
      const nonAdminPositions = allPositions.filter(
        (pos) => !settingsAllowedPositions.includes(pos)
      );

      nonAdminPositions.forEach((position) => {
        expect(canAccess(position, 'settings', 'read')).toBe(false);
        expect(canAccess(position, 'settings', 'write')).toBe(false);
        expect(canAccessSettings(position)).toBe(false);
      });
    });

    it('should deny VETERINARIAN access to settings', () => {
      expect(canAccess(StaffPosition.VETERINARIAN, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(StaffPosition.VETERINARIAN)).toBe(false);
    });

    it('should deny RECEPTIONIST access to settings', () => {
      expect(canAccess(StaffPosition.RECEPTIONIST, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(StaffPosition.RECEPTIONIST)).toBe(false);
    });

    it('should deny ASSISTANT access to settings', () => {
      expect(canAccess(StaffPosition.ASSISTANT, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(StaffPosition.ASSISTANT)).toBe(false);
    });

    it('should deny VETERINARY_TECHNICIAN access to settings', () => {
      expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(StaffPosition.VETERINARY_TECHNICIAN)).toBe(false);
    });

    it('should deny GROOMER access to settings', () => {
      expect(canAccess(StaffPosition.GROOMER, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(StaffPosition.GROOMER)).toBe(false);
    });

    it('should deny OTHER position access to settings', () => {
      expect(canAccess(StaffPosition.OTHER, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(StaffPosition.OTHER)).toBe(false);
    });
  });

  describe('Staff position scenarios for settings access', () => {
    it('should allow manager staff to access settings', () => {
      const managerStaff = createTestStaffWithPosition('MANAGER');
      expect(canAccess(managerStaff.position, 'settings', 'read')).toBe(true);
      expect(isAdminPosition(managerStaff.position)).toBe(true);
    });

    it('should deny veterinarian staff from accessing settings', () => {
      const vetStaff = createTestStaffWithPosition('VETERINARIAN');
      expect(canAccess(vetStaff.position, 'settings', 'read')).toBe(false);
      expect(isAdminPosition(vetStaff.position)).toBe(false);
    });

    it('should deny receptionist staff from accessing settings', () => {
      const receptionistStaff = createTestStaffWithPosition('RECEPTIONIST');
      expect(canAccess(receptionistStaff.position, 'settings', 'read')).toBe(false);
      expect(isAdminPosition(receptionistStaff.position)).toBe(false);
    });

    it('should deny assistant staff from accessing settings', () => {
      const assistantStaff = createTestStaffWithPosition('ASSISTANT');
      expect(canAccess(assistantStaff.position, 'settings', 'read')).toBe(false);
      expect(isAdminPosition(assistantStaff.position)).toBe(false);
    });
  });

  describe('Edge cases for settings access', () => {
    it('should deny access when position is null', () => {
      expect(canAccess(null, 'settings', 'read')).toBe(false);
      expect(canAccessSettings(null)).toBe(false);
    });

    it('should deny access when position is undefined', () => {
      expect(canAccess(undefined, 'settings', 'read')).toBe(false);
    });

    it('should deny access for unknown position string', () => {
      expect(canAccess('UNKNOWN_POSITION', 'settings', 'read')).toBe(false);
    });

    it('should handle position as string correctly', () => {
      expect(canAccess('MANAGER', 'settings', 'read')).toBe(true);
      expect(canAccess('VETERINARIAN', 'settings', 'read')).toBe(false);
    });
  });

  describe('Admin positions constant', () => {
    it('should only contain MANAGER and ADMINISTRATOR', () => {
      expect(ADMIN_POSITIONS).toHaveLength(2);
      expect(ADMIN_POSITIONS).toContain(StaffPosition.MANAGER);
      expect(ADMIN_POSITIONS).toContain(StaffPosition.ADMINISTRATOR);
    });

    it('should be used consistently for settings access', () => {
      ADMIN_POSITIONS.forEach((position) => {
        expect(canAccessSettings(position)).toBe(true);
        expect(isAdminPosition(position)).toBe(true);
      });
    });
  });

  describe('Navigation link visibility logic', () => {
    // These tests verify the logic used in Nav.tsx to show/hide settings link

    it('should show settings link for MANAGER', () => {
      const staffPosition = 'MANAGER';
      const canShowSettingsLink = !staffPosition || ADMIN_POSITIONS.includes(staffPosition as typeof ADMIN_POSITIONS[number]);
      expect(canShowSettingsLink).toBe(true);
    });

    it('should show settings link for ADMINISTRATOR', () => {
      // Note: StaffPosition.ADMINISTRATOR has value 'Administrador' in Spanish
      const staffPosition = 'Administrador';
      const canShowSettingsLink = !staffPosition || ADMIN_POSITIONS.includes(staffPosition as typeof ADMIN_POSITIONS[number]);
      expect(canShowSettingsLink).toBe(true);
    });

    it('should hide settings link for VETERINARIAN', () => {
      const staffPosition = 'VETERINARIAN';
      const canShowSettingsLink = !staffPosition || ADMIN_POSITIONS.includes(staffPosition as typeof ADMIN_POSITIONS[number]);
      expect(canShowSettingsLink).toBe(false);
    });

    it('should hide settings link for RECEPTIONIST', () => {
      const staffPosition = 'RECEPTIONIST';
      const canShowSettingsLink = !staffPosition || ADMIN_POSITIONS.includes(staffPosition as typeof ADMIN_POSITIONS[number]);
      expect(canShowSettingsLink).toBe(false);
    });

    it('should show settings link when no staff record (tenant owner)', () => {
      // When staff is null, user is assumed to be tenant owner with admin access
      const staffPosition = null;
      const canShowSettingsLink = !staffPosition || ADMIN_POSITIONS.includes(staffPosition as typeof ADMIN_POSITIONS[number]);
      expect(canShowSettingsLink).toBe(true);
    });
  });
});
