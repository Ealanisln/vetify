# Updated Onboarding Process Template - Vetify (Versión Final)

## 🎯 Feature/Fix Overview

**Name**: Multi-Step Onboarding with Plan Selection & Trial Management (No Stripe Trial)

**Type**: Enhancement

**Priority**: High

### Problem Statement

The current onboarding process assumes a default "PROFESIONAL" plan that may not exist in the database, causing an error: "Plan PROFESIONAL no encontrado. Ejecute la migración B2B primero." Additionally, we need to implement a true "30 days free without credit card" trial system that doesn't involve Stripe until conversion, with immediate billing start when payment method is added.

### Success Criteria

- [x] User can select from available B2B plans (PROFESIONAL, CLINICA, EMPRESA) during onboarding
- [x] Plans are properly seeded in the database before deployment
- [x] Onboarding process includes plan selection step before clinic details
- [ ] All new tenants start with a 30-day trial period **without requiring credit card**
- [ ] **No trial period in Stripe - billing starts immediately when payment method is added**
- [ ] **Clear messaging about when first charge will occur based on payment method addition date**
- [x] Smooth transition between onboarding steps with proper state management
- [ ] Trial conversion system with immediate Stripe billing upon payment method addition
- [ ] Trial notification system to encourage conversion
- [ ] Dashboard trial status indicators and upgrade prompts
- [x] **🆕 Comprehensive implementation tracker system with automated status checking**

---

## 📋 Planning Phase

### 1. Code Structure & References

### File Structure (Existing + New)

```tsx
src/
├── app/
│   ├── api/
│   │   ├── onboarding/
│   │   │   ├── route.ts                    // ✅ Exists - needs update
│   │   │   ├── check-slug/
│   │   │   │   └── route.ts                // ✅ Exists
│   │   │   └── plans/
│   │   │       └── route.ts                // ✅ EXISTS - Available plans endpoint
│   │   ├── subscription/
│   │   │   ├── upgrade/
│   │   │   │   └── route.ts                // 🆕 NEW - Trial to paid conversion (no Stripe trial)
│   │   │   ├── cancel/
│   │   │   │   └── route.ts                // 🆕 NEW - Cancel trial/subscription
│   │   │   └── status/
│   │   │       └── route.ts                // 🆕 NEW - Get subscription status
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts                // 🆕 NEW - Stripe webhooks
│   ├── onboarding/
│   │   ├── page.tsx                        // ✅ Exists
│   │   ├── OnboardingPageClient.tsx        // ✅ Exists - needs update
│   │   ├── layout.tsx                      // ✅ Exists
│   │   └── steps/                          // 🆕 NEW - Multi-step components
│   │       ├── PlanSelection.tsx     
│   │       ├── ClinicInfo.tsx       
│   │       └── Confirmation.tsx      
│   ├── subscription/
│   │   ├── upgrade/
│   │   │   └── page.tsx                    // 🆕 NEW - Payment method setup
│   │   └── manage/
│   │       └── page.tsx                    // 🆕 NEW - Subscription management
├── components/
│   ├── onboarding/
│   │   ├── OnboardingForm.tsx              // ✅ Exists - updated to multi-step
│   │   ├── PlanCard.tsx                    // 🆕 NEW
│   │   ├── OnboardingProgress.tsx          // ✅ EXISTS
│   │   ├── OnboardingImplementationTracker.tsx  // ✅ EXISTS - Comprehensive tracker
│   │   └── ImplementationProgress.tsx      // ✅ EXISTS - Progress components
│   ├── subscription/
│   │   ├── TrialBanner.tsx                 // 🆕 NEW - Dashboard trial status
│   │   ├── TrialUpgrade.tsx                // 🆕 NEW - Payment method form
│   │   ├── SubscriptionStatus.tsx          // 🆕 NEW - Current plan info
│   │   └── PaymentMethodForm.tsx           // 🆕 NEW - Stripe Elements form
│   └── dashboard/
│       └── TrialNotifications.tsx          // 🆕 NEW - Trial expiration warnings
├── lib/
│   ├── tenant.ts                           // ✅ Exists - update createTenantWithDefaults
│   ├── pricing-config.ts                   // ✅ Exists - use COMPLETE_PLANS
│   ├── stripe.ts                           // ✅ Exists - extend for trial conversion
│   ├── trial-management.ts                 // 🆕 NEW - Trial logic and notifications
│   ├── billing-utils.ts                    // 🆕 NEW - Billing date calculations
│   ├── onboarding/
│   │   └── validation.ts                   // 🆕 NEW - Shared validation schemas
│   └── analytics/
│       └── trial-metrics.ts                // 🆕 NEW - Trial conversion tracking
├── types/
│   ├── index.ts                            // ✅ Exists
│   ├── plans.ts                            // ✅ Exists
│   ├── onboarding.ts                       // ✅ EXISTS - Onboarding types
│   └── subscription.ts                     // 🆕 NEW - Trial/subscription types
├── scripts/
│   ├── create-b2b-plans.sql                // ✅ Exists - verified functional
│   ├── trial-cleanup.ts                    // 🆕 NEW - Cleanup expired trials
│   └── update-implementation-status.mjs    // ✅ EXISTS - Automated status checker
└── prisma/
    └── migrations/
        └── [new]_seed_b2b_plans.sql        // 🆕 NEW - Ensure plans exist
```

### Key Interfaces & Types

```tsx
// types/onboarding.ts
import type { PricingPlan } from '@/lib/pricing-config';

export interface OnboardingState {
  currentStep: 'plan' | 'clinic' | 'confirmation';
  selectedPlan?: {
    key: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
    billingInterval: 'monthly' | 'yearly';
  };
  clinicInfo?: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
  isSubmitting: boolean;
}

export interface OnboardingRequest {
  planKey: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
  billingInterval: 'monthly' | 'yearly';
  clinicInfo: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
}

export type OnboardingError =
  | { type: 'PLAN_NOT_FOUND'; planKey: string }
  | { type: 'SLUG_TAKEN'; slug: string }
  | { type: 'VALIDATION'; field: string; message: string }
  | { type: 'TENANT_CREATION_FAILED'; error: string };
```

```tsx
// types/subscription.ts
export interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  trialEndsAt: Date;
  canUpgrade: boolean;
  requiresPaymentMethod: boolean;
  hasStripeCustomer: boolean;
}

export interface SubscriptionUpgradeRequest {
  tenantId: string;
  paymentMethodId: string;
}

export interface TrialConversionData {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'ACTIVE';
  immediateCharge: true;
  nextBillingDate: Date;
  billingStartedAt: Date;
}
```

### Database Schema Updates

```sql
-- Add trial-specific fields to Tenant model
-- Already exists in schema.prisma but verify these fields:

model Tenant {
  id                  String               @id @default(uuid())
  name                String
  slug                String               @unique
  status              TenantStatus         @default(ACTIVE)
  planType            String               @default("PROFESIONAL")
  
  -- TRIAL MANAGEMENT FIELDS
  isTrialPeriod       Boolean              @default(true)   -- Track trial status
  trialEndsAt         DateTime?                             -- Trial expiration (app-controlled)
  trialConvertedAt    DateTime?                             -- When user added payment method
  billingStartedAt    DateTime?                             -- When Stripe billing began
  
  -- STRIPE INTEGRATION (only set after payment method addition)
  stripeCustomerId    String?              @unique          -- Only after payment method
  
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  
  subscription        TenantSubscription?
  // ... other relations
}

model TenantSubscription {
  id                    String               @id @default(uuid())
  tenantId              String               @unique
  planId                String
  
  -- SUBSCRIPTION STATUS
  status                SubscriptionStatus   @default(TRIALING)  -- TRIALING, ACTIVE, PAST_DUE, CANCELED
  billingInterval       BillingInterval      @default(monthly)
  
  -- STRIPE INTEGRATION (only set after payment method addition)
  stripeSubscriptionId  String?              @unique             -- Only after payment method
  stripePriceId         String?                                  -- Stripe price ID
  
  -- PERIODS
  currentPeriodStart    DateTime             @default(now())
  currentPeriodEnd      DateTime                                 -- App trial end OR Stripe billing period end
  
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt
  
  tenant                Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan                  Plan                 @relation(fields: [planId], references: [id])
}

-- Add new enum values if needed
enum SubscriptionStatus {
  TRIALING              -- During free trial (no Stripe subscription)
  ACTIVE                -- Paid and current (has Stripe subscription)
  PAST_DUE              -- Payment failed
  CANCELED              -- Subscription canceled
  INCOMPLETE            -- Stripe subscription incomplete
}
```

### 2. Core Functionality Checklist

### Required Features

**Onboarding (No Stripe Integration)**
- [x] Step 1: Display B2B plans (PROFESIONAL, CLINICA, EMPRESA) with pricing
- [x] Step 2: Allow monthly/yearly billing selection
- [x] Step 3: Collect clinic information after plan selection
- [x] Step 4: Show confirmation with trial period information
- [x] Create tenant with 30-day trial (no Stripe customer/subscription)
- [x] Handle existing tenant redirect gracefully

**Trial Management**
- [ ] Dashboard trial status banner with days remaining
- [ ] Email notifications at 7, 3, and 1 day before expiration
- [ ] **Trial conversion flow with immediate Stripe billing (no trial period)**
- [ ] **Clear messaging about billing start date**
- [ ] Trial extension capabilities for customer success

**Subscription Management**
- [ ] **Immediate payment method collection and billing**
- [ ] Plan upgrade/downgrade during trial or after conversion
- [ ] Subscription cancellation with trial continuation
- [ ] Billing history and invoice access

### Implementation Flow

1. **Database Setup**: Run `scripts/create-b2b-plans.sql` to seed plans
2. **Trial Onboarding**: No-card signup with plan selection
3. **Trial Notifications**: Automated reminder system
4. **Payment Collection**: Stripe integration with immediate billing start
5. **Subscription Management**: Full billing lifecycle

---

## 🛠️ Implementation Details

### 1. Updated Tenant Creation (No Stripe)

```tsx
// lib/tenant.ts - UPDATE createTenantWithDefaults
export async function createTenantWithDefaults(data: {
  name: string;
  slug: string;
  userId: string;
  planKey: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
  billingInterval: 'monthly' | 'yearly';
  phone?: string;
  address?: string;
}) {
  // Get the selected plan
  const plan = await prisma.plan.findFirst({
    where: { key: data.planKey, isActive: true }
  });

  if (!plan) {
    throw new Error(`Plan ${data.planKey} not found. Please run the B2B migration first.`);
  }

  const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return await prisma.$transaction(async (tx) => {
    // Create tenant with trial status (NO STRIPE)
    const tenant = await tx.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        planType: data.planKey,
        status: 'ACTIVE',
        isTrialPeriod: true,
        trialEndsAt: trialEndDate,
        stripeCustomerId: null, // ❌ NO Stripe customer during trial
        billingStartedAt: null, // ❌ No billing yet
      }
    });

    // Create trial subscription (NO STRIPE)
    await tx.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: 'TRIALING', // ❌ NO Stripe subscription during trial
        billingInterval: data.billingInterval,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndDate,
        stripeSubscriptionId: null,
        stripePriceId: null,
      }
    });

    // Create default admin user, roles, etc. (existing logic)
    // ... rest of the function remains the same
    
    return tenant;
  });
}
```

### 2. Billing Utilities

```tsx
// lib/billing-utils.ts - NEW
export function getNextBillingDate(
  interval: 'monthly' | 'yearly',
  fromDate: Date = new Date()
): Date {
  const nextBilling = new Date(fromDate);
  
  if (interval === 'yearly') {
    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  } else {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  }
  
  return nextBilling;
}

export function formatBillingDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getBillingMessage(
  interval: 'monthly' | 'yearly',
  nextBillingDate: Date
): string {
  const formattedDate = formatBillingDate(nextBillingDate);
  const period = interval === 'yearly' ? 'anual' : 'mensual';
  
  return `Tu primer cobro ${period} será el ${formattedDate}`;
}
```

### 3. Trial Management System

```tsx
// lib/trial-management.ts - NEW
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function checkTrialStatus(tenantId: string): Promise<TrialStatus> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true }
  });

  if (!tenant || !tenant.isTrialPeriod || !tenant.trialEndsAt) {
    return {
      isInTrial: false,
      daysRemaining: 0,
      trialEndsAt: new Date(),
      canUpgrade: false,
      requiresPaymentMethod: false,
      hasStripeCustomer: !!tenant?.stripeCustomerId
    };
  }

  const now = new Date();
  const daysRemaining = Math.ceil(
    (tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    isInTrial: true,
    daysRemaining: Math.max(0, daysRemaining),
    trialEndsAt: tenant.trialEndsAt,
    canUpgrade: daysRemaining > 0,
    requiresPaymentMethod: !tenant.stripeCustomerId,
    hasStripeCustomer: !!tenant.stripeCustomerId
  };
}

export async function sendTrialNotifications() {
  // Find trials expiring in 7, 3, and 1 days
  const warningDays = [7, 3, 1];
  
  for (const days of warningDays) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const expiring = await prisma.tenant.findMany({
      where: {
        isTrialPeriod: true,
        trialEndsAt: {
          gte: targetDate,
          lte: endDate
        },
        stripeCustomerId: null // Only notify those without payment method
      },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    for (const tenant of expiring) {
      await sendTrialExpirationWarning({
        tenant,
        daysRemaining: days,
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/upgrade`
      });
    }
  }
}

async function sendTrialExpirationWarning({ tenant, daysRemaining, upgradeUrl }: any) {
  const subject = daysRemaining === 1 
    ? `¡Tu trial de Vetify expira mañana! 🚨`
    : `Tu trial de Vetify expira en ${daysRemaining} días`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #75a99c;">Hola ${tenant.name}! 👋</h2>
      
      <p>Tu trial del plan <strong>${tenant.subscription.plan.name}</strong> expira en 
      <strong>${daysRemaining} día${daysRemaining > 1 ? 's' : ''}</strong>.</p>
      
      <p>Para continuar usando Vetify sin interrupciones:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${upgradeUrl}" 
           style="background: #75a99c; color: white; padding: 15px 30px; 
                  text-decoration: none; border-radius: 8px; font-weight: bold;">
          Agregar Forma de Pago
        </a>
      </div>
      
      <p style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #75a99c;">
        <strong>💳 Tu billing empezará cuando agregues tu tarjeta</strong><br>
        <small>No se realizará ningún cargo hasta que termine tu trial gratuito.</small>
      </p>
      
      <p><small>Si no agregas una forma de pago, tu cuenta será pausada después del trial.</small></p>
    </div>
  `;

  await sendEmail({
    to: tenant.ownerEmail,
    subject,
    html
  });
}

export async function expireTrials() {
  const expired = await prisma.tenant.findMany({
    where: {
      isTrialPeriod: true,
      trialEndsAt: {
        lt: new Date()
      },
      stripeCustomerId: null // No payment method added
    }
  });

  for (const tenant of expired) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        status: 'SUSPENDED', // Pause account
        isTrialPeriod: false
      }
    });

    await prisma.tenantSubscription.update({
      where: { tenantId: tenant.id },
      data: {
        status: 'CANCELED'
      }
    });
  }

  return expired.length;
}
```

### 4. Trial Conversion API (No Stripe Trial)

```tsx
// app/api/subscription/upgrade/route.ts - NEW
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { COMPLETE_PLANS } from '@/lib/pricing-config';
import { getNextBillingDate } from '@/lib/billing-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, paymentMethodId } = await request.json();

    // Get tenant with subscription
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    if (!tenant?.isTrialPeriod) {
      return NextResponse.json(
        { error: 'Tenant is not in trial period' }, 
        { status: 400 }
      );
    }

    if (tenant.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Payment method already added' }, 
        { status: 400 }
      );
    }

    const subscription = tenant.subscription!;
    const plan = subscription.plan;

    // Create Stripe customer (first time)
    const stripeCustomer = await stripe.customers.create({
      email: session.user.email,
      name: tenant.name,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        tenantId: tenant.id,
        planKey: plan.key,
      }
    });

    // Get Stripe price ID based on plan and billing interval
    const planConfig = COMPLETE_PLANS[plan.key as keyof typeof COMPLETE_PLANS];
    const stripePriceId = subscription.billingInterval === 'yearly' 
      ? planConfig.stripePriceIds.yearly 
      : planConfig.stripePriceIds.monthly;

    const now = new Date();
    const nextBillingDate = getNextBillingDate(subscription.billingInterval, now);

    // Create Stripe subscription WITHOUT trial - billing starts immediately
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: stripePriceId }],
      // ❌ NO TRIAL PERIOD - billing starts now
      metadata: {
        tenantId: tenant.id,
        planKey: plan.key,
        originalTrialEnd: tenant.trialEndsAt!.toISOString(),
        billingStarted: now.toISOString(),
      }
    });

    // Update tenant and subscription in database
    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          stripeCustomerId: stripeCustomer.id,
          trialConvertedAt: now,
          billingStartedAt: now,
          // Keep isTrialPeriod true until original trial end date
        }
      });

      await tx.tenantSubscription.update({
        where: { tenantId },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId,
          status: 'ACTIVE', // ✅ Already paying
          currentPeriodStart: now,
          currentPeriodEnd: nextBillingDate,
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully',
      billing: {
        immediateStart: true,
        nextBillingDate,
        billingStartedAt: now,
        message: getBillingMessage(subscription.billingInterval, nextBillingDate)
      }
    });

  } catch (error) {
    console.error('Trial upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}

function getBillingMessage(interval: 'monthly' | 'yearly', nextDate: Date): string {
  const period = interval === 'yearly' ? 'anual' : 'mensual';
  return `Tu próximo cobro ${period} será el ${nextDate.toLocaleDateString('es-ES')}`;
}
```

### 5. Updated Trial Dashboard Components

```tsx
// components/subscription/TrialBanner.tsx - NEW
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TrialStatus } from '@/types/subscription';

interface TrialBannerProps {
  tenantId: string;
}

export function TrialBanner({ tenantId }: TrialBannerProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);

  useEffect(() => {
    fetch('/api/subscription/status')
      .then(res => res.json())
      .then(setTrialStatus);
  }, []);

  if (!trialStatus?.isInTrial) return null;

  const isUrgent = trialStatus.daysRemaining <= 3;
  const hasPaymentMethod = trialStatus.hasStripeCustomer;

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      isUrgent 
        ? 'bg-red-50 border border-red-200 dark:bg-red-900/20' 
        : 'bg-gradient-to-r from-[#75a99c] to-[#5b9788] text-white'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${isUrgent ? 'text-red-800 dark:text-red-200' : ''}`}>
            {isUrgent ? '🚨 ' : ''}
            Trial {hasPaymentMethod ? 'con billing activo' : 'gratuito'} - {trialStatus.daysRemaining} días restantes
          </h3>
          <p className={`text-sm ${isUrgent ? 'text-red-600 dark:text-red-300' : 'opacity-90'}`}>
            {hasPaymentMethod 
              ? 'Ya tienes billing configurado - el trial continúa hasta su fecha límite'
              : 'Agrega tu forma de pago para continuar sin interrupciones'
            }
          </p>
        </div>
        
        {!hasPaymentMethod && (
          <Link 
            href="/subscription/upgrade"
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isUrgent
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white text-[#75a99c] hover:bg-gray-50'
            }`}
          >
            {isUrgent ? 'Agregar Ahora' : 'Agregar Tarjeta'}
          </Link>
        )}
      </div>
    </div>
  );
}
```

```tsx
// components/subscription/TrialUpgrade.tsx - NEW
"use client";

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { getNextBillingDate, formatBillingDate } from '@/lib/billing-utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradeFormProps {
  tenant: any;
  trialStatus: TrialStatus;
}

function UpgradeForm({ tenant, trialStatus }: UpgradeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextBillingDate = getNextBillingDate(tenant.subscription.billingInterval);
  const billingMessage = formatBillingDate(nextBillingDate);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    
    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement!,
      });

      if (pmError) {
        setError(pmError.message || 'Error processing card');
        setIsLoading(false);
        return;
      }

      // Send to backend for subscription creation
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upgrade');
      }

      // Success - redirect to dashboard
      router.push('/dashboard?upgraded=true');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Continúa con {tenant.subscription.plan.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tu trial continúa hasta el {formatBillingDate(trialStatus.trialEndsAt)}
        </p>
      </div>

      {/* Billing Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-blue-600 dark:text-blue-400 text-lg mr-3">💳</span>
          <div className="text-sm">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Tu billing empezará hoy
            </h4>
            <p className="text-blue-700 dark:text-blue-300">
              Próximo cobro: {billingMessage}
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-1">
              Puedes seguir usando todas las funciones durante tu trial
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }} />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full py-3 px-4 bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Procesando...' : 'Configurar Billing'}
        </button>
        
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🔒 Información segura con cifrado SSL</p>
          <p>El billing comienza hoy - próximo cobro el {billingMessage}</p>
          <p>Puedes cancelar en cualquier momento</p>
        </div>
      </form>
    </div>
  );
}

export function TrialUpgrade({ tenant, trialStatus }: { tenant: any; trialStatus: TrialStatus }) {
  return (
    <Elements stripe={stripePromise}>
      <UpgradeForm tenant={tenant} trialStatus={trialStatus} />
    </Elements>
  );
}
```

### 6. Updated Onboarding Confirmation

```tsx
// app/onboarding/steps/Confirmation.tsx - NEW
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingState } from '@/types/onboarding';

interface ConfirmationProps {
  plan: OnboardingState['selectedPlan'];
  clinicInfo: OnboardingState['clinicInfo'];
  onBack: () => void;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export function Confirmation({ plan, clinicInfo, onBack, isSubmitting }: ConfirmationProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: plan!.key,
          billingInterval: plan!.billingInterval,
          clinicName: clinicInfo!.clinicName,
          slug: clinicInfo!.slug,
          phone: clinicInfo!.phone,
          address: clinicInfo!.address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Success - redirect to dashboard
      router.push(`/dashboard?welcome=true&trial=true`);

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          ¡Todo listo! 🎉
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Confirma los detalles de tu clínica
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Plan Seleccionado</h3>
          <p className="text-[#75a99c] font-medium">
            {plan!.key} - {plan!.billingInterval === 'yearly' ? 'Anual' : 'Mensual'}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Clínica</h3>
          <p>{clinicInfo!.clinicName}</p>
          <p className="text-sm text-gray-500">vetify.com/{clinicInfo!.slug}</p>
        </div>

        <div className="bg-[#75a99c]/10 border border-[#75a99c]/20 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎁</span>
            <div>
              <h4 className="font-semibold text-[#75a99c]">30 días completamente gratis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sin tarjeta de crédito • El billing empezará solo cuando agregues tu tarjeta
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
        >
          Atrás
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Creando cuenta...' : 'Crear mi clínica'}
        </button>
      </div>
    </div>
  );
}
```

### 7. Subscription Status API

```tsx
// app/api/subscription/status/route.ts - NEW
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCurrentTenant } from '@/lib/auth';
import { checkTrialStatus } from '@/lib/trial-management';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    const trialStatus = await checkTrialStatus(tenant.id);
    
    return NextResponse.json(trialStatus);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
```

### 8. Multi-Step Onboarding Form

```tsx
// components/onboarding/OnboardingForm.tsx - REFACTOR
"use client";

import { useState } from 'react';
import { PlanSelection } from '@/app/onboarding/steps/PlanSelection';
import { ClinicInfo } from '@/app/onboarding/steps/ClinicInfo';
import { Confirmation } from '@/app/onboarding/steps/Confirmation';
import { OnboardingProgress } from './OnboardingProgress';
import type { OnboardingState } from '@/types/onboarding';

export function OnboardingForm({ user }: { user: any }) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'plan',
    isSubmitting: false
  });

  const handlePlanSelect = (plan: OnboardingState['selectedPlan']) => {
    setState(prev => ({
      ...prev,
      selectedPlan: plan,
      currentStep: 'clinic'
    }));
  };

  const handleClinicInfo = (info: OnboardingState['clinicInfo']) => {
    setState(prev => ({
      ...prev,
      clinicInfo: info,
      currentStep: 'confirmation'
    }));
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep === 'confirmation' ? 'clinic' : 'plan'
    }));
  };

  return (
    <div className="space-y-6">
      <OnboardingProgress currentStep={state.currentStep} />
      
      {state.currentStep === 'plan' && (
        <PlanSelection 
          onNext={handlePlanSelect}
          initialSelection={state.selectedPlan}
        />
      )}
      
      {state.currentStep === 'clinic' && (
        <ClinicInfo
          user={user}
          onNext={handleClinicInfo}
          onBack={handleBack}
          initialData={state.clinicInfo}
        />
      )}
      
      {state.currentStep === 'confirmation' && (
        <Confirmation
          plan={state.selectedPlan!}
          clinicInfo={state.clinicInfo!}
          onBack={handleBack}
          isSubmitting={state.isSubmitting}
          onSubmit={async () => {
            setState(prev => ({ ...prev, isSubmitting: true }));
            // Submit logic is handled inside Confirmation component
          }}
        />
      )}
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```tsx
// Trial management tests
describe('Trial Management (No Stripe Trial)', () => {
  it('creates trial without Stripe integration', async () => {})
  it('calculates trial days remaining correctly', async () => {})
  it('starts immediate billing when payment method added', async () => {})
  it('sends notifications only to users without payment method', async () => {})
  it('expires trials without payment method', async () => {})
});

// Conversion tests
describe('Trial Conversion (Immediate Billing)', () => {
  it('creates Stripe customer and subscription without trial', async () => {})
  it('calculates next billing date correctly', async () => {})
  it('updates database with billing start date', async () => {})
  it('handles payment method failures gracefully', async () => {})
});

// API endpoint tests
describe('API: Subscription Management', () => {
  it('prevents double upgrade attempts', async () => {})
  it('validates payment method before processing', async () => {})
  it('starts billing immediately upon upgrade', async () => {})
});
```

---

## 🚦 Implementation Checklist

### Phase 1: Database & Core Setup

- [x] Run `scripts/create-b2b-plans.sql` to seed plans
- [x] Add trial and billing fields to Tenant/TenantSubscription models
- [x] Update Prisma migrations for trial support
- [ ] Create trial management and billing utilities
- [ ] Test plan queries and trial calculations

### Phase 2: Trial Onboarding (No Stripe)

- [ ] Update `createTenantWithDefaults` to skip Stripe completely
- [x] Create multi-step onboarding components
- [x] Implement plan selection UI with billing clarifications
- [x] Add progress indicator and confirmation with billing messaging
- [ ] Test complete onboarding flow without payment

### Phase 3: Trial Management System

- [ ] Create trial status checking API
- [ ] Implement dashboard trial banner with billing status
- [ ] Build notification system for users without payment method
- [ ] Create automated cleanup script
- [ ] Test notification timing and billing messaging

### Phase 4: Immediate Billing Conversion System

- [ ] Build payment method collection UI with billing start messaging
- [ ] Create Stripe integration for immediate billing (no trial)
- [ ] Implement subscription upgrade API with billing date calculation
- [ ] Add subscription management pages
- [ ] Test immediate billing start and next billing date calculation

### Phase 5: Monitoring & Analytics

- [ ] Add trial conversion tracking with billing metrics
- [ ] Create trial metrics dashboard
- [ ] Set up automated trial management cron jobs
- [ ] Monitor trial-to-paid conversion rates and billing success
- [ ] Implement customer success alerts for billing issues

### Phase 6: Deployment & Testing

- [ ] Deploy trial management system
- [ ] Run plan seeding in production
- [ ] Test end-to-end trial flow with immediate billing
- [ ] Monitor for errors, conversion rates, and billing issues
- [ ] Optimize based on user behavior and billing patterns

---

## 🔑 Key Decisions

1. **Trial Period**: All plans get 30 days free (per pricing-config.ts)
2. **Default Plan**: PROFESIONAL is the entry-level B2B plan
3. **No Free Plan**: B2B model doesn't include a free tier
4. **Billing Interval**: Users choose monthly/yearly during onboarding
5. **🆕 Stripe Trial**: NO trial period in Stripe - billing starts when payment method is added**
6. **🆕 First Charge**: Calculated from payment method addition date, not original trial start**
7. **🆕 Trial Continuation**: App trial continues until original end date even after billing starts**
8. **🆕 Clear Communication**: Users understand exactly when billing begins**

---

## 📊 Success Metrics

### Trial Metrics to Track

```tsx
// lib/analytics/trial-metrics.ts - UPDATE
export async function getTrialMetrics(dateRange?: { start: Date; end: Date }) {
  const [
    totalSignups,
    activeTrials,
    expiredTrials,
    convertedTrials,
    immediateConverters,
    lastDayConverters
  ] = await Promise.all([
    prisma.tenant.count({ 
      where: { 
        createdAt: dateRange ? { gte: dateRange.start, lte: dateRange.end } : undefined 
      } 
    }),
    prisma.tenant.count({ 
      where: { 
        isTrialPeriod: true, 
        trialEndsAt: { gt: new Date() } 
      } 
    }),
    prisma.tenant.count({ 
      where: { 
        isTrialPeriod: false, 
        trialConvertedAt: null,
        status: 'SUSPENDED'
      } 
    }),
    prisma.tenant.count({ 
      where: { 
        trialConvertedAt: { not: null }
      } 
    }),
    // Users who converted within 3 days
    prisma.tenant.count({
      where: {
        trialConvertedAt: { not: null },
        trialConvertedAt: {
          gte: dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    // Users who converted in last 3 days of trial
    // ... more metrics
  ]);

  const conversionRate = totalSignups > 0 ? (convertedTrials / totalSignups) * 100 : 0;
  const earlyConversionRate = totalSignups > 0 ? (immediateConverters / totalSignups) * 100 : 0;

  return {
    totalSignups,
    activeTrials,
    expiredTrials,
    convertedTrials,
    conversionRate,
    earlyConversionRate,
    avgTrialLength: 30,
    billingHealthScore: calculateBillingHealth(),
    // ... more metrics
  };
}

async function calculateBillingHealth() {
  // Calculate success rate of immediate billing starts
  // Track failed payment methods
  // Monitor subscription health
}
```

### Key KPIs

- **Trial Signup Rate**: Users completing onboarding
- **Trial-to-Paid Conversion**: % users who add payment method
- **Early Conversion Rate**: % users who add payment within first 3 days
- **Time to Conversion**: Days from signup to payment method
- **Payment Method Success Rate**: % successful card additions and immediate billing
- **Billing Health**: % successful first charges after payment method addition

---

## 🎯 **ESTADO ACTUAL DE IMPLEMENTACIÓN** (Actualizado)

### ✅ **COMPLETADO** (64.3% - 9/14 elementos verificados)

**✅ Infraestructura Base:**
- Base onboarding API funcional
- Plans API endpoint operativo
- Pricing configuration completa
- Stripe integration base
- Database schema con campos de trial

**✅ Sistema de Tracking:**
- Dashboard completo de implementación (`/admin/implementation`)
- Status checker automatizado (`pnpm implementation:check`)
- Todo system integrado con progreso
- Documentación completa del tracker

**✅ Onboarding Multi-Step:**
- Componentes de progreso (`OnboardingProgress.tsx`)
- Types de onboarding definidos (`types/onboarding.ts`)
- Estructura multi-step preparada
- State management entre pasos

### 🚨 **PENDIENTE CRÍTICO**

**🔥 CRITICAL BLOCKER:**
- Subscription upgrade API (`src/app/api/subscription/upgrade/route.ts`)

**⚠️ HIGH PRIORITY:**
- Trial management utilities (`src/lib/trial-management.ts`, `src/lib/billing-utils.ts`)
- Trial status API (`src/app/api/subscription/status/route.ts`)
- Trial banner component (`src/components/subscription/TrialBanner.tsx`)
- Trial upgrade UI (`src/components/subscription/TrialUpgrade.tsx`)

### 📊 **PRÓXIMOS PASOS INMEDIATOS:**

1. **Crear utilidades de trial** (sin dependencias)
2. **Implementar trial status API** 
3. **Construir subscription upgrade API** (BLOCKER)
4. **Desarrollar componentes de UI trial**

### 🛠️ **Herramientas de Tracking Disponibles:**

```bash
# Verificar estado actual
pnpm implementation:check

# Ver dashboard visual
pnpm dev → http://localhost:3000/admin/implementation

# Sistema de todos integrado con progreso real-time
```

Este plan actualizado refleja exactamente el enfoque que elegimos: **no trial en Stripe, billing inmediato cuando se agrega la tarjeta**, con un **sistema completo de tracking implementado** para monitorear el progreso. ¿Te parece completo y consistente?