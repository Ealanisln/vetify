/**
 * Staff Permission System
 *
 * Role-based access control based on Staff.position
 * Controls what features each staff member can access
 */

import { StaffPosition, type StaffPositionType } from './staff-positions';

// =============================================================================
// FEATURE DEFINITIONS
// =============================================================================

export type Feature =
  | 'dashboard'
  | 'appointments'
  | 'customers'
  | 'pets'
  | 'medical'
  | 'inventory'
  | 'sales'
  | 'reports'
  | 'settings'
  | 'staff'
  | 'testimonials'
  | 'locations';

export type Action = 'read' | 'write' | 'delete';

// =============================================================================
// PERMISSION MAPPINGS BY POSITION
// =============================================================================

/**
 * Permission definitions for each staff position
 *
 * Format: 'feature' = full access (read/write/delete)
 *         'feature:read' = read only
 *         'feature:write' = read and write
 *         '*' = full access to everything
 */
export const POSITION_PERMISSIONS: Record<StaffPositionType, string[]> = {
  // Manager/Admin - Full access to everything
  [StaffPosition.MANAGER]: ['*'],

  // Administrator - Full access to everything (same as Manager)
  [StaffPosition.ADMINISTRATOR]: ['*'],

  // Veterinarian - Medical focus, read-only for admin features
  [StaffPosition.VETERINARIAN]: [
    'dashboard',
    'appointments',
    'customers',
    'pets',
    'medical',
    'inventory:read',
    'sales:read',
    'reports',
    'staff:read',
    'testimonials:read',
    'locations:read',
  ],

  // Veterinary Technician - Similar to veterinarian
  [StaffPosition.VETERINARY_TECHNICIAN]: [
    'dashboard',
    'appointments',
    'customers',
    'pets',
    'medical',
    'inventory:read',
    'sales:read',
    'staff:read',
    'testimonials:read',
    'locations:read',
  ],

  // Assistant - Support role, read medical, can do sales
  [StaffPosition.ASSISTANT]: [
    'dashboard',
    'appointments:read',
    'customers:read',
    'pets:read',
    'medical:read',
    'inventory:read',
    'sales',
    'staff:read',
    'locations:read',
  ],

  // Receptionist - Front desk, appointments and sales
  [StaffPosition.RECEPTIONIST]: [
    'dashboard',
    'appointments',
    'customers',
    'pets:read',
    'sales',
    'staff:read',
    'testimonials:read',
    'locations:read',
  ],

  // Groomer - Limited access
  [StaffPosition.GROOMER]: [
    'dashboard',
    'appointments:read',
    'pets:read',
  ],

  // Other - Minimal access
  [StaffPosition.OTHER]: [
    'dashboard',
    'appointments:read',
    'customers:read',
  ],
};

// =============================================================================
// ADMIN POSITIONS
// =============================================================================

/**
 * Positions that have admin/management privileges
 */
export const ADMIN_POSITIONS: StaffPositionType[] = [
  StaffPosition.MANAGER,
  StaffPosition.ADMINISTRATOR,
];

/**
 * Check if a position has admin privileges
 */
export function isAdminPosition(position: StaffPositionType | string): boolean {
  return ADMIN_POSITIONS.includes(position as StaffPositionType);
}

// =============================================================================
// PERMISSION CHECK FUNCTIONS
// =============================================================================

/**
 * Check if a position can access a feature with a specific action
 *
 * @param position - Staff position (VETERINARIAN, MANAGER, etc.)
 * @param feature - Feature to check (appointments, medical, etc.)
 * @param action - Action type (read, write, delete)
 * @returns boolean - true if access is allowed
 *
 * @example
 * canAccess('VETERINARIAN', 'medical', 'write') // true
 * canAccess('RECEPTIONIST', 'medical', 'read') // false
 * canAccess('MANAGER', 'settings', 'write') // true
 */
export function canAccess(
  position: StaffPositionType | string | null | undefined,
  feature: Feature,
  action: Action = 'read'
): boolean {
  // No position = no access
  if (!position) return false;

  const permissions = POSITION_PERMISSIONS[position as StaffPositionType];

  // Unknown position = no access
  if (!permissions) return false;

  // Full access
  if (permissions.includes('*')) return true;

  // Full feature access (read/write/delete)
  if (permissions.includes(feature)) return true;

  // Check specific action permissions
  // 'feature:write' includes read
  // 'feature:read' only allows read
  if (action === 'read') {
    return (
      permissions.includes(`${feature}:read`) ||
      permissions.includes(`${feature}:write`)
    );
  }

  if (action === 'write') {
    return permissions.includes(`${feature}:write`);
  }

  if (action === 'delete') {
    // Delete requires full feature access
    return permissions.includes(feature);
  }

  return false;
}

/**
 * Get all permissions for a position
 */
export function getPermissions(
  position: StaffPositionType | string | null | undefined
): string[] {
  if (!position) return [];
  return POSITION_PERMISSIONS[position as StaffPositionType] || [];
}

/**
 * Get all features a position can access (with any action)
 */
export function getAccessibleFeatures(
  position: StaffPositionType | string | null | undefined
): Feature[] {
  if (!position) return [];

  const permissions = POSITION_PERMISSIONS[position as StaffPositionType];
  if (!permissions) return [];

  // Full access
  if (permissions.includes('*')) {
    return [
      'dashboard',
      'appointments',
      'customers',
      'pets',
      'medical',
      'inventory',
      'sales',
      'reports',
      'settings',
      'staff',
      'testimonials',
      'locations',
    ];
  }

  // Extract unique features from permissions
  const features = new Set<Feature>();
  permissions.forEach((perm) => {
    const feature = perm.split(':')[0] as Feature;
    features.add(feature);
  });

  return Array.from(features);
}

// =============================================================================
// HELPER FUNCTIONS FOR COMMON CHECKS
// =============================================================================

/**
 * Check if position can manage staff
 */
export function canManageStaff(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'staff', 'write');
}

/**
 * Check if position can access settings
 */
export function canAccessSettings(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'settings', 'read');
}

/**
 * Check if position can view reports
 */
export function canViewReports(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'reports', 'read');
}

/**
 * Check if position can manage inventory
 */
export function canManageInventory(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'inventory', 'write');
}

/**
 * Check if position can create/edit medical records
 */
export function canEditMedicalRecords(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'medical', 'write');
}

/**
 * Check if position can process sales
 */
export function canProcessSales(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'sales', 'write');
}

/**
 * Check if position can manage locations (create/edit/delete)
 */
export function canManageLocations(position: StaffPositionType | string | null): boolean {
  return canAccess(position, 'locations', 'write');
}

// =============================================================================
// NAVIGATION FILTERING
// =============================================================================

export interface NavItem {
  name: string;
  href: string;
  feature: Feature;
  icon?: React.ComponentType;
}

/**
 * Filter navigation items based on staff position
 */
export function filterNavByPermissions(
  navItems: NavItem[],
  position: StaffPositionType | string | null | undefined
): NavItem[] {
  if (!position) return [];

  return navItems.filter((item) => canAccess(position, item.feature, 'read'));
}
