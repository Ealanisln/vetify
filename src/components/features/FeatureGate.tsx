'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { checkFeatureAccess } from '@/app/actions/subscription';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  upgradeMessage?: string;
}

/**
 * Component to gate specific features based on subscription plan
 * Shows upgrade prompt if feature is not accessible
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  upgradeMessage
}: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAccess(feature).then(setHasAccess);
  }, [feature]);

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No access - show fallback or default upgrade message
  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <Lock className="w-8 h-8 text-gray-400" />
          <div className="text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Función Premium</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {upgradeMessage || 'Requiere plan profesional o superior'}
            </p>
          </div>
          <Link
            href="/precios"
            className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Ver Planes
          </Link>
        </div>
      )
    );
  }

  // Has access - show content
  return <>{children}</>;
}
