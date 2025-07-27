## 🎯 Feature/Fix Overview

**Name**: Stripe Subscription Update Flow Fix

**Type**: Bug Fix

**Priority**: Critical

### Problem Statement

After completing a Stripe checkout successfully, the user's subscription status is not being updated in the database, causing the application to still show "Sin plan activo" (No active plan) even though the payment was processed. The webhook is receiving the events but the subscription data is not properly syncing to the tenant record.

### Success Criteria

- [ ] After successful checkout, user's subscription status is immediately reflected in the database
- [ ] Dashboard shows correct plan information without requiring page refresh
- [ ] Webhook properly updates tenant subscription status for all Stripe events
- [ ] Trial subscriptions are properly handled and reflected in UI

---

## 📋 Planning Phase

### 1. Code Structure & References

### File Structure

```tsx
// Modified Files
src/
├── app/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/
│   │   │   │   └── route.ts              // Fix redirect logic after checkout
│   │   │   └── webhook/
│   │   │       └── route.ts              // Enhance webhook processing
│   │   └── user/
│   │       └── route.ts                  // Update user query to include subscription
├── lib/
│   ├── payments/
│   │   └── stripe.ts                     // Fix handleSubscriptionChange function
├── components/
│   └── pricing/
│       └── PricingPageEnhanced.tsx       // Fix subscription status detection
└── prisma/
    └── schema.prisma                     // Verify subscription relationships
```

### Key Interfaces & Types

```tsx
// types/subscription.ts
interface SubscriptionUpdate {
  tenantId: string;
  stripeSubscriptionId: string;
  stripeProductId: string;
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date;
  isTrialPeriod: boolean;
}

interface CheckoutSessionMetadata {
  tenantId: string;
  userId: string;
  planKey: string;
  billingInterval: 'monthly' | 'annual';
}
```

### Database Schema Reference

```sql
-- Ensure tenant table has proper Stripe fields
-- stripeCustomerId
-- stripeSubscriptionId  
-- stripeProductId
-- planName
-- subscriptionStatus
-- subscriptionEndsAt
-- isTrialPeriod
```

### 2. Core Functionality Checklist

### Required Features (Do Not Modify)

- [ ] Webhook must update tenant subscription immediately upon checkout.session.completed
- [ ] Checkout redirect must wait for subscription to be created before redirecting
- [ ] User API must return complete subscription information
- [ ] Trial period (30 days) must be properly handled

### Implementation Assumptions

- Stripe webhook is properly configured and receiving events
- Database schema includes all necessary Stripe fields
- User is authenticated during checkout process

### 3. Full Stack Integration Points

### API Endpoints

```tsx
// GET /api/stripe/checkout?session_id={id} - Verify subscription before redirect
// POST /api/stripe/webhook - Process all subscription events
// GET /api/user - Return user with complete subscription data
// GET /api/subscription/current - New endpoint for real-time subscription status
```

### Server Actions (App Router)

```tsx
// lib/payments/actions.ts
async function verifySubscriptionCreated(sessionId: string): Promise<boolean>
async function syncSubscriptionStatus(tenantId: string): Promise<void>
async function getActiveSubscription(tenantId: string): Promise<Subscription | null>
```

### Client-Server Data Flow

1. User completes Stripe checkout
2. Stripe redirects to /api/stripe/checkout with session_id
3. API verifies subscription was created in Stripe
4. API waits for webhook to process (with timeout)
5. API verifies tenant record was updated
6. Redirect to dashboard with success message
7. Dashboard fetches fresh subscription data

---

## 🧪 Testing Strategy

### Unit Tests

```tsx
// Webhook Processing Tests
describe('Stripe Webhook Handler', () => {
  it('updates tenant on checkout.session.completed', async () => {})
  it('handles trial subscriptions correctly', async () => {})
  it('processes subscription updates', async () => {})
});

// Checkout Redirect Tests
describe('Checkout Success Handler', () => {
  it('waits for subscription to be created', async () => {})
  it('handles timeout gracefully', async () => {})
  it('redirects with correct parameters', async () => {})
});
```

### Integration Tests

```tsx
// End-to-End Subscription Flow
describe('Complete Subscription Flow', () => {
  it('creates subscription and updates database', async () => {})
  it('handles concurrent webhook events', async () => {})
  it('recovers from missed webhooks', async () => {})
});
```

---

## 🔒 Security Analysis

### Authentication & Authorization

- [ ] Verify webhook signature from Stripe
- [ ] Ensure session_id cannot be reused
- [ ] Validate tenant ownership during updates
- [ ] Check user permissions for subscription management

### Input Validation & Sanitization

```tsx
// Validate Stripe session
const sessionSchema = z.object({
  id: z.string().startsWith('cs_'),
  status: z.enum(['complete', 'expired', 'open']),
  subscription: z.string().startsWith('sub_').nullable(),
});
```

---

## 📊 Performance Considerations

### Database Optimization

```sql
-- Index for fast tenant lookup by Stripe customer ID
CREATE INDEX idx_tenant_stripe_customer ON tenants(stripeCustomerId);

-- Index for subscription queries
CREATE INDEX idx_tenant_subscription_status ON tenants(subscriptionStatus);
```

### Caching Strategy

- [ ] Cache subscription status in Redis for 5 minutes
- [ ] Invalidate cache on webhook events
- [ ] Use optimistic UI updates in frontend

---

## 🚦 Implementation Checklist

### Pre-Development

- [ ] Verify Stripe webhook endpoint is configured correctly
- [ ] Check database has all required fields
- [ ] Test webhook signature validation
- [ ] Review existing subscription flow

### Development Phase

1. **Fix handleSubscriptionChange in stripe.ts**
   - Ensure it creates/updates subscription immediately
   - Add proper error handling and logging
   - Handle trial subscriptions correctly

2. **Enhance webhook processing**
   - Add retry logic for database updates
   - Log all subscription changes
   - Handle edge cases (deleted customers, etc.)

3. **Fix checkout redirect logic**
   - Add polling to wait for subscription creation
   - Implement timeout handling
   - Ensure proper error states

4. **Update user API response**
   - Include full subscription details
   - Add subscription status field
   - Cache response appropriately

5. **Fix PricingPageEnhanced component**
   - Properly detect subscription status
   - Handle loading states correctly
   - Show accurate plan information

### Pre-Deployment

- [ ] Test complete flow in staging
- [ ] Verify webhooks are processed correctly
- [ ] Check subscription status updates immediately
- [ ] Test trial period handling
- [ ] Verify plan limits are enforced

---

## 📝 MCP Analysis Commands

### For Local Development

```bash
# Check current webhook logs
desktop-commander: read_file ./logs/stripe-webhooks.log

# Verify database schema
desktop-commander: read_file ./prisma/schema.prisma

# Check tenant records
desktop-commander: execute_sql "SELECT id, stripeCustomerId, stripeSubscriptionId, subscriptionStatus FROM tenants WHERE stripeCustomerId IS NOT NULL"

# Review webhook implementation
desktop-commander: read_file ./src/app/api/stripe/webhook/route.ts
```

---

## 🎨 Key Implementation Details

### 1. Fix handleSubscriptionChange Function

The main issue is in the `handleSubscriptionChange` function. It needs to:
- Find tenant by stripeCustomerId correctly
- Update all subscription fields atomically
- Handle the case where webhook arrives before checkout redirect

### 2. Add Subscription Verification in Checkout Route

Before redirecting to dashboard:
- Verify subscription exists in Stripe
- Check if tenant record has been updated
- Implement polling with timeout (max 10 seconds)

### 3. Enhance Webhook Processing

- Add idempotency to prevent duplicate processing
- Log all state changes for debugging
- Handle race conditions between checkout and webhook

### 4. Update User API Response

Ensure the /api/user endpoint returns:
- Current subscription status
- Plan details
- Trial information
- Next billing date

### 5. Fix Frontend Subscription Detection

The PricingPageEnhanced component should:
- Check tenant.subscriptionStatus instead of just tenant
- Handle trial status properly
- Show loading state while checking auth

---

## 🔄 Rollback Plan

### If Issues Occur

1. Revert webhook handler to previous version
2. Manually sync affected subscriptions
3. Use Stripe dashboard to verify subscription states
4. Run reconciliation script to fix any mismatches

### Monitoring & Alerts

- [ ] Set up webhook failure alerts
- [ ] Monitor subscription creation success rate
- [ ] Track time between checkout and database update
- [ ] Alert on any subscription sync failures

This plan addresses the core issue where the subscription status is not being properly synced after a successful Stripe checkout. The main fixes needed are in the webhook handler, the checkout redirect logic, and ensuring the frontend properly reads the subscription status.