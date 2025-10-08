
## TypeScript/Next.js/PostgreSQL Full Stack Development

### Project: Vetify - Veterinary Clinic Management System
**Tech Stack**: Next.js 15.4, TypeScript, Prisma ORM, PostgreSQL, Kinde Auth, Stripe

---

## 🎯 Feature/Fix Overview

**Name**: Trial Access Control & Banner Display Fix

**Type**: [ Bug Fix | Security | Enhancement ]

**Priority**: [ Critical ]

**Estimated Complexity**: [ Medium (3-5 days) ]

**Sprint/Milestone**: [SPRINT_HOTFIX_TRIAL]

### Problem Statement
The trial banner in `/src/components/dashboard/SubscriptionNotifications.tsx` is displaying negative days (-2 días) after trial expiration instead of proper messaging. Additionally, there's no proper server-side access control mechanism to restrict features when trial ends, allowing users to potentially continue using paid features after trial expiration.

### Success Criteria
- [ ] Trial banner correctly displays \"Trial expirado hace X días\" instead of negative days
- [ ] Access to premium features is automatically restricted when trial expires
- [ ] Server-side validation on all protected routes
- [ ] Graceful degradation with clear messaging for expired trials
- [ ] Real-time synchronization of trial status across all components
- [ ] Proper redirect flows to `/precios` page for upgrades

### Dependencies
- **Blocked by**: None (Critical fix)
- **Blocks**: User onboarding improvements, Payment integration enhancements
- **Related Components**: 
  - `/src/components/dashboard/SubscriptionNotifications.tsx`
  - `/src/components/subscription/SubscriptionGuard.tsx`
  - `/src/hooks/useSubscription.ts`
  - `/src/app/dashboard/layout.tsx`

---

## 📋 Planning Phase

### 1. Code Structure & References

#### Current File Structure (Existing)
```
src/
├── app/
│   ├── api/
│   │   ├── subscription/          # Existing subscription endpoints
│   │   └── user/subscription/     # User subscription endpoints
│   ├── dashboard/
│   │   ├── DashboardLayoutClient.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── SubscriptionNotifications.tsx  # NEEDS FIX: Banner component
│   │   └── DashboardHeader.tsx
│   └── subscription/
│       ├── SubscriptionGuard.tsx          # Access control component
│       └── SubscriptionManager.tsx
├── hooks/
│   └── useSubscription.ts                 # Subscription state hook
├── lib/
│   ├── auth.ts                           # Kinde auth utilities
│   └── prisma.ts                         # Database client
└── types/
    └── index.ts                          # TypeScript types
```

#### New/Modified Files Required
```tsx
// New files to create
src/
├── app/
│   ├── api/
│   │   └── trial/
│   │       ├── route.ts                    // NEW: Trial status API
│   │       ├── check-access/route.ts       // NEW: Access validation
│   │       └── extend/route.ts             // NEW: Admin trial extension
├── components/
│   ├── trial/
│   │   ├── TrialBanner.tsx                // NEW: Dedicated trial banner
│   │   ├── TrialExpiredModal.tsx          // NEW: Expiration modal
│   │   └── TrialCountdown.tsx             // NEW: Real-time countdown
│   └── guards/
│       └── FeatureGuard.tsx               // NEW: Feature-level guard
├── lib/
│   ├── trial/
│   │   ├── utils.ts                       // NEW: Trial calculations
│   │   ├── constants.ts                   // NEW: Trial settings
│   │   ├── validators.ts                  // NEW: Zod schemas
│   │   └── access-control.ts              // NEW: Access logic
│   └── db/
│       └── queries/
│           └── trial.ts                    // NEW: Trial queries
├── middleware.ts                          // MODIFY: Add trial checks
└── scripts/
    └── fix-negative-days.mjs              // NEW: Hotfix script
```

#### Key Interfaces & Types (Enhanced for Vetify)
```tsx
// types/trial.ts (NEW)
import { z } from 'zod';
import type { Tenant, SubscriptionStatus, PlanType } from '@prisma/client';

// Extend existing Tenant type
export interface TenantWithTrialInfo extends Tenant {
  daysRemaining: number;
  isExpired: boolean;
  isInGracePeriod: boolean;
  trialMessage: string;
  restrictedFeatures: string[];
}

// Trial status calculation result
export interface TrialStatus {
  status: 'active' | 'ending_soon' | 'expired' | 'grace_period' | 'converted';
  daysRemaining: number;
  displayMessage: string;
  bannerType: 'success' | 'warning' | 'danger' | 'info';
  showUpgradePrompt: boolean;
  blockedFeatures: FeatureAccess[];
}

// Feature access control
export interface FeatureAccess {
  feature: 'pets' | 'appointments' | 'inventory' | 'reports' | 'automations';
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
}

// Access check for middleware
export const TrialAccessSchema = z.object({
  tenantId: z.string().uuid(),
  feature: z.enum(['pets', 'appointments', 'inventory', 'reports', 'automations']).optional(),
  action: z.enum(['view', 'create', 'update', 'delete']).optional()
});

export type TrialAccessCheck = z.infer<typeof TrialAccessSchema>;

// Result type for trial operations
export type TrialResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; redirectTo?: string };
```

#### Database Schema Updates
```sql
-- migrations/[timestamp]_fix_trial_tracking.sql

-- Add missing trial tracking columns
ALTER TABLE \"Tenant\" 
ADD COLUMN IF NOT EXISTS \"trialExtendedAt\" TIMESTAMP,
ADD COLUMN IF NOT EXISTS \"trialExtendedBy\" TEXT,
ADD COLUMN IF NOT EXISTS \"gracePeriodEnds\" TIMESTAMP,
ADD COLUMN IF NOT EXISTS \"lastTrialCheck\" TIMESTAMP;

-- Create trial access log table
CREATE TABLE IF NOT EXISTS \"TrialAccessLog\" (
  \"id\" TEXT NOT NULL DEFAULT gen_random_uuid(),
  \"tenantId\" TEXT NOT NULL,
  \"userId\" TEXT NOT NULL,
  \"feature\" TEXT NOT NULL,
  \"action\" TEXT NOT NULL,
  \"allowed\" BOOLEAN NOT NULL,
  \"denialReason\" TEXT,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT \"TrialAccessLog_pkey\" PRIMARY KEY (\"id\"),
  CONSTRAINT \"TrialAccessLog_tenantId_fkey\" FOREIGN KEY (\"tenantId\") 
    REFERENCES \"Tenant\"(\"id\") ON DELETE CASCADE,
  CONSTRAINT \"TrialAccessLog_userId_fkey\" FOREIGN KEY (\"userId\") 
    REFERENCES \"User\"(\"id\") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS \"TrialAccessLog_tenantId_idx\" ON \"TrialAccessLog\"(\"tenantId\");
CREATE INDEX IF NOT EXISTS \"TrialAccessLog_userId_idx\" ON \"TrialAccessLog\"(\"userId\");
CREATE INDEX IF NOT EXISTS \"Tenant_trialEndsAt_idx\" ON \"Tenant\"(\"trialEndsAt\") 
  WHERE \"isTrialPeriod\" = true;

-- Function to auto-expire trials (optional, for cron job)
CREATE OR REPLACE FUNCTION expire_old_trials()
RETURNS void AS $$
BEGIN
  UPDATE \"Tenant\"
  SET \"subscriptionStatus\" = 'INACTIVE'::\"SubscriptionStatus\"
  WHERE \"isTrialPeriod\" = true
    AND \"trialEndsAt\" < NOW()
    AND \"subscriptionStatus\" = 'TRIALING'::\"SubscriptionStatus\"
    AND (\"gracePeriodEnds\" IS NULL OR \"gracePeriodEnds\" < NOW());
END;
$$ LANGUAGE plpgsql;
```

### 2. Implementation Details

#### PHASE 1: Fix Banner Display (Day 1 - HOTFIX)

**File: `/src/components/dashboard/SubscriptionNotifications.tsx`**
```tsx
// FIX: Update getDaysRemaining function
const getDaysRemaining = () => {
  if (!tenant.trialEndsAt && !subscriptionEndsAt) return null;
  const endDate = tenant.isTrialPeriod ? tenant.trialEndsAt : subscriptionEndsAt;
  if (!endDate) return null;
  
  const days = differenceInDays(new Date(endDate), new Date());
  return days; // Keep negative values for expired trials
};

// FIX: Update getNotificationConfig for negative days
const getNotificationConfig = () => {
  // Check for expired trial with negative days
  if (isInTrial && daysRemaining !== null && daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return {
      type: 'trial-expired' as const,
      icon: CalendarX,
      title: `⚠️ Trial expirado hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`,
      description: 'Tu período de prueba ha terminado. Suscríbete ahora para continuar usando todas las funciones.',
      bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
      textColor: 'text-red-800 dark:text-red-400',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Suscribirse Ahora',
      link: '/precios'
    };
  }
  // ... rest of existing logic
};
```

**File: `/src/lib/trial/utils.ts` (NEW)**
```tsx
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Tenant } from '@prisma/client';
import type { TrialStatus } from '@/types/trial';

export function calculateTrialStatus(tenant: Tenant): TrialStatus {
  if (!tenant.isTrialPeriod || !tenant.trialEndsAt) {
    return {
      status: 'converted',
      daysRemaining: 0,
      displayMessage: '',
      bannerType: 'info',
      showUpgradePrompt: false,
      blockedFeatures: []
    };
  }

  const now = new Date();
  const trialEnd = new Date(tenant.trialEndsAt);
  const daysRemaining = differenceInDays(trialEnd, now);

  // Expired trial
  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return {
      status: 'expired',
      daysRemaining,
      displayMessage: `Trial expirado hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`,
      bannerType: 'danger',
      showUpgradePrompt: true,
      blockedFeatures: getBlockedFeaturesForExpired()
    };
  }

  // Last day
  if (daysRemaining === 0) {
    return {
      status: 'ending_soon',
      daysRemaining,
      displayMessage: '¡Último día de prueba!',
      bannerType: 'warning',
      showUpgradePrompt: true,
      blockedFeatures: []
    };
  }

  // Ending soon (3 days or less)
  if (daysRemaining <= 3) {
    return {
      status: 'ending_soon',
      daysRemaining,
      displayMessage: `Trial terminando en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
      bannerType: 'warning',
      showUpgradePrompt: true,
      blockedFeatures: []
    };
  }

  // Active trial
  return {
    status: 'active',
    daysRemaining,
    displayMessage: `${daysRemaining} días restantes de prueba`,
    bannerType: 'success',
    showUpgradePrompt: false,
    blockedFeatures: []
  };
}

function getBlockedFeaturesForExpired(): FeatureAccess[] {
  return [
    { feature: 'pets', allowed: false, reason: 'Trial expirado', limit: 0 },
    { feature: 'appointments', allowed: false, reason: 'Trial expirado', limit: 0 },
    { feature: 'inventory', allowed: false, reason: 'Trial expirado' },
    { feature: 'reports', allowed: false, reason: 'Trial expirado' },
    { feature: 'automations', allowed: false, reason: 'Trial expirado' }
  ];
}

export function getTrialMessage(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return `Tu período de prueba expiró hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`;
  }
  
  if (daysRemaining === 0) {
    return '¡Hoy es el último día de tu prueba gratuita!';
  }
  
  if (daysRemaining === 1) {
    return 'Tu prueba gratuita termina mañana';
  }
  
  if (daysRemaining <= 3) {
    return `Tu prueba gratuita termina en ${daysRemaining} días`;
  }
  
  return `Tienes ${daysRemaining} días restantes en tu prueba gratuita`;
}
```

#### PHASE 2: Server-Side Access Control (Day 2-3)

**File: `/src/middleware.ts` (MODIFY)**
```tsx
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from '@kinde-oss/kinde-auth-nextjs/server';

// Protected routes that require active subscription
const PROTECTED_ROUTES = {
  '/dashboard/pets/new': 'pets',
  '/dashboard/appointments/new': 'appointments',
  '/dashboard/inventory': 'inventory',
  '/dashboard/reports': 'reports',
  '/dashboard/settings/automations': 'automations'
};

// Routes that are always accessible
const PUBLIC_ROUTES = [
  '/dashboard',
  '/dashboard/settings',
  '/precios',
  '/api/subscription'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check protected routes
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route => 
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    try {
      // Get user token
      const token = await getToken(request);
      if (!token) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      // Check trial status via API
      const response = await fetch(new URL('/api/trial/check-access', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feature: PROTECTED_ROUTES[protectedRoute],
          action: 'create'
        })
      });

      const result = await response.json();

      if (!result.allowed) {
        // Redirect to pricing page with message
        const url = new URL('/precios', request.url);
        url.searchParams.set('reason', 'trial_expired');
        url.searchParams.set('feature', PROTECTED_ROUTES[protectedRoute]);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Trial check failed:', error);
      // Allow access on error to prevent blocking
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ]
};
```

**File: `/src/app/api/trial/check-access/route.ts` (NEW)**
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { prisma } from '@/lib/prisma';
import { calculateTrialStatus } from '@/lib/trial/utils';
import { TrialAccessSchema } from '@/types/trial';

export async function POST(request: NextRequest) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { allowed: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json(
        { allowed: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = TrialAccessSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { allowed: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Get user's tenant with subscription info
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!dbUser?.tenant) {
      return NextResponse.json(
        { allowed: false, error: 'No tenant found' },
        { status: 404 }
      );
    }

    const tenant = dbUser.tenant;

    // If has active paid subscription, allow all
    if (tenant.subscriptionStatus === 'ACTIVE' && !tenant.isTrialPeriod) {
      await logAccess(tenant.id, user.id, validation.data, true);
      return NextResponse.json({ allowed: true });
    }

    // Calculate trial status
    const trialStatus = calculateTrialStatus(tenant);

    // Check if feature is blocked
    const blockedFeature = trialStatus.blockedFeatures.find(
      f => f.feature === validation.data.feature
    );

    const allowed = !blockedFeature || blockedFeature.allowed;

    // Log access attempt
    await logAccess(
      tenant.id, 
      user.id, 
      validation.data, 
      allowed,
      blockedFeature?.reason
    );

    // Update last trial check
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { lastTrialCheck: new Date() }
    });

    return NextResponse.json({
      allowed,
      trialStatus,
      reason: blockedFeature?.reason,
      redirectTo: allowed ? undefined : '/precios'
    });

  } catch (error) {
    console.error('Trial access check error:', error);
    return NextResponse.json(
      { allowed: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function logAccess(
  tenantId: string,
  userId: string,
  access: any,
  allowed: boolean,
  denialReason?: string
) {
  try {
    await prisma.trialAccessLog.create({
      data: {
        tenantId,
        userId,
        feature: access.feature || 'general',
        action: access.action || 'view',
        allowed,
        denialReason
      }
    });
  } catch (error) {
    console.error('Failed to log access:', error);
  }
}
```

#### PHASE 3: Enhanced UI Components (Day 4-5)

**File: `/src/components/trial/TrialBanner.tsx` (NEW)**
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CalendarX, 
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import type { Tenant } from '@prisma/client';
import { calculateTrialStatus } from '@/lib/trial/utils';
import { useRouter } from 'next/navigation';

interface TrialBannerProps {
  tenant: Tenant;
  compact?: boolean;
}

export function TrialBanner({ tenant, compact = false }: TrialBannerProps) {
  const router = useRouter();
  const [trialStatus, setTrialStatus] = useState(() => calculateTrialStatus(tenant));
  
  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTrialStatus(calculateTrialStatus(tenant));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [tenant]);

  if (!tenant.isTrialPeriod || trialStatus.status === 'converted') {
    return null;
  }

  const getBannerConfig = () => {
    switch (trialStatus.status) {
      case 'expired':
        return {
          icon: CalendarX,
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-300',
          textColor: 'text-red-800 dark:text-red-400',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'ending_soon':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300',
          textColor: 'text-orange-800 dark:text-orange-400',
          iconColor: 'text-orange-600',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'active':
        return {
          icon: Clock,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
          textColor: 'text-blue-800 dark:text-blue-400',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-300',
          textColor: 'text-green-800 dark:text-green-400',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`px-4 py-2 ${config.bgColor} border rounded-lg flex items-center justify-between`}>
        <div className=\"flex items-center gap-2\">
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {trialStatus.displayMessage}
          </span>
        </div>
        {trialStatus.showUpgradePrompt && (
          <Button
            size=\"sm\"
            variant=\"ghost\"
            className={config.textColor}
            onClick={() => router.push('/precios')}
          >
            Actualizar
            <ArrowRight className=\"h-3 w-3 ml-1\" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`${config.bgColor} border-2 p-6`}>
      <div className=\"flex items-start gap-4\">
        <div className=\"flex-shrink-0\">
          <div className={`p-3 rounded-full bg-white/80 ${config.iconColor}`}>
            <Icon className=\"h-6 w-6\" />
          </div>
        </div>
        
        <div className=\"flex-1 min-w-0\">
          <h3 className={`text-lg font-bold ${config.textColor} mb-1`}>
            {trialStatus.displayMessage}
          </h3>
          
          {trialStatus.status === 'expired' ? (
            <p className={`text-sm ${config.textColor} opacity-90 mb-4`}>
              Tu período de prueba ha terminado. Actualiza ahora para continuar usando todas las funciones de Vetify.
            </p>
          ) : (
            <p className={`text-sm ${config.textColor} opacity-90 mb-4`}>
              {trialStatus.status === 'ending_soon' 
                ? 'No pierdas acceso a todas las funciones. Actualiza antes de que termine tu prueba.'
                : 'Disfruta de acceso completo a todas las funciones durante tu período de prueba.'}
            </p>
          )}
          
          <div className=\"flex items-center gap-3\">
            {trialStatus.showUpgradePrompt && (
              <Button
                onClick={() => router.push('/precios')}
                className={`${config.buttonColor} text-white`}
                size=\"sm\"
              >
                Ver Planes y Precios
                <ArrowRight className=\"h-4 w-4 ml-2\" />
              </Button>
            )}
            
            {trialStatus.status === 'active' && (
              <Badge variant=\"outline\" className=\"text-xs\">
                Quedan {trialStatus.daysRemaining} días
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 🧪 Testing Strategy

### Testing Files Structure
```
__tests__/
├── unit/
│   ├── trial/
│   │   ├── utils.test.ts           # Trial calculation tests
│   │   ├── access-control.test.ts  # Access control logic
│   │   └── banner.test.tsx         # Banner component tests
│   └── subscription/
│       └── notifications.test.tsx   # Fix validation tests
├── integration/
│   ├── api/
│   │   └── trial.test.ts           # API endpoint tests
│   └── middleware/
│       └── trial-access.test.ts    # Middleware tests
└── e2e/
    └── trial-flow.spec.ts          # End-to-end trial flow
```

### Critical Test Scenarios
```tsx
// __tests__/unit/trial/utils.test.ts
import { calculateTrialStatus } from '@/lib/trial/utils';

describe('Trial Status Calculations', () => {
  it('should handle negative days correctly', () => {
    const tenant = {
      isTrialPeriod: true,
      trialEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    };
    
    const status = calculateTrialStatus(tenant);
    
    expect(status.status).toBe('expired');
    expect(status.daysRemaining).toBe(-2);
    expect(status.displayMessage).toBe('Trial expirado hace 2 días');
    expect(status.bannerType).toBe('danger');
  });

  it('should handle last day correctly', () => {
    const tenant = {
      isTrialPeriod: true,
      trialEndsAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
    };
    
    const status = calculateTrialStatus(tenant);
    
    expect(status.status).toBe('ending_soon');
    expect(status.daysRemaining).toBe(0);
    expect(status.displayMessage).toBe('¡Último día de prueba!');
  });
});
```

### Performance Testing
```tsx
// __tests__/unit/performance/trial-access.test.ts
describe('Trial Access Performance', () => {
  it('should cache trial status checks', async () => {
    // Test that repeated checks use cache
    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      await checkTrialAccess(tenantId, 'pets');
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should be fast due to caching
  });
});
```

---

## 🔒 Security Analysis

### Security Checklist
- [ ] **Server-side validation**: All trial checks happen server-side via middleware
- [ ] **Token validation**: Kinde auth tokens verified on each request
- [ ] **Audit logging**: All access attempts logged to TrialAccessLog table
- [ ] **Rate limiting**: Implement via Upstash Redis (already in package.json)
- [ ] **Cache security**: Use tenant-specific cache keys
- [ ] **SQL injection**: Using Prisma ORM with parameterized queries
- [ ] **CSRF protection**: Next.js built-in CSRF protection

### Access Control Matrix for Vetify
```
Feature              | Trial Active | Trial Expired | Grace Period | Paid Plan
---------------------|-------------|---------------|--------------|----------
Dashboard View       | ✅          | ✅            | ✅           | ✅
View Pets           | ✅          | ✅ (read-only) | ✅           | ✅
Add New Pet         | ✅ (limit 10)| ❌            | ⚠️ (warning) | ✅
Schedule Appointment | ✅          | ❌            | ⚠️           | ✅
Access Inventory    | ✅          | ❌            | ❌           | ✅
View Reports        | ✅          | ❌            | ❌           | ✅
WhatsApp Automation | ❌          | ❌            | ❌           | ✅
```

---

## 📊 Performance & Monitoring

### Caching Strategy with Upstash Redis
```tsx
// lib/trial/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedTrialStatus(tenantId: string) {
  const key = `trial:status:${tenantId}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached as string);
  }
}