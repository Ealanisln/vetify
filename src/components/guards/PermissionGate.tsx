'use client';

import { ReactNode } from 'react';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import type { Feature, Action } from '@/lib/staff-permissions';

interface PermissionGateProps {
  /**
   * The feature to check access for
   */
  feature: Feature;

  /**
   * The action type (defaults to 'read')
   */
  action?: Action;

  /**
   * Content to render if user has permission
   */
  children: ReactNode;

  /**
   * Content to render if user doesn't have permission
   * If not provided, nothing is rendered
   */
  fallback?: ReactNode;

  /**
   * Content to render while loading permissions
   * If not provided, nothing is rendered
   */
  loading?: ReactNode;
}

/**
 * Guard component that conditionally renders content based on user permissions
 *
 * @example
 * ```tsx
 * // Only show if user can write medical records
 * <PermissionGate feature="medical" action="write">
 *   <MedicalRecordForm />
 * </PermissionGate>
 *
 * // Show fallback for users without permission
 * <PermissionGate
 *   feature="settings"
 *   action="read"
 *   fallback={<p>No tienes acceso a configuración</p>}
 * >
 *   <SettingsPanel />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  feature,
  action = 'read',
  children,
  fallback = null,
  loading = null,
}: PermissionGateProps) {
  const { canAccess, isLoading } = useStaffPermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!canAccess(feature, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Access Denied component - can be used as fallback
 */
export function AccessDenied({
  message = 'No tienes permiso para ver esta sección',
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          Acceso Restringido
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * Higher-order component version of PermissionGate
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: Feature,
  action: Action = 'read',
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    const { canAccess, isLoading } = useStaffPermissions();

    if (isLoading) {
      return null;
    }

    if (!canAccess(feature, action)) {
      return FallbackComponent ? <FallbackComponent /> : <AccessDenied />;
    }

    return <WrappedComponent {...props} />;
  };
}

export default PermissionGate;
