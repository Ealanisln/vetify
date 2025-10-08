## 🎯 Updated Admin Sections Implementation Plan with File Routes

### Current Project Structure Overview

Your project uses:
- Next.js 14 with App Router
- TypeScript
- Prisma ORM with PostgreSQL
- Clerk for authentication
- Stripe integration
- Tailwind CSS

### Existing Admin Routes
- ✅ `/admin` - Dashboard (exists)
- ✅ `/admin/tenants` - Clinics management (exists)
- ❌ `/admin/users` - Users management (404)
- ❌ `/admin/billing` - Billing management (missing)
- ❌ `/admin/reports` - Reports (missing)
- ❌ `/admin/system` - System management (missing)
- ❌ `/admin/settings` - Settings (missing)

---

## 1. Users Management Section

### File Structure
```tsx
src/
├── app/
│   ├── admin/
│   │   └── users/
│   │       ├── page.tsx                      // Main users list page
│   │       ├── [userId]/
│   │       │   ├── page.tsx                  // User details/edit page
│   │       │   └── activity/
│   │       │       └── page.tsx              // User activity history
│   │       ├── new/
│   │       │   └── page.tsx                  // Create new user
│   │       └── roles/
│   │           └── page.tsx                  // Role management
│   └── api/
│       └── admin/
│           └── users/
│               ├── route.ts                   // List users, Create user
│               ├── [userId]/
│               │   ├── route.ts               // Get/Update/Delete user
│               │   └── activity/
│               │       └── route.ts           // User activity logs
│               └── roles/
│                   └── route.ts               // Role CRUD operations
├── components/
│   └── admin/
│       └── users/
│           ├── UsersTable.tsx                 // Paginated users table
│           ├── UserForm.tsx                   // Create/Edit user form
│           ├── UserFilters.tsx                // Search and filters
│           ├── RoleManager.tsx                // Role assignment component
│           └── UserActivityLog.tsx            // Activity display
└── lib/
    └── admin/
        ├── users.ts                           // User management functions
        └── roles.ts                           // Role/permission functions
```

### Database Models to Use
- `User` model (already exists)
- `Role` model (already exists) 
- `UserRole` model (already exists)
- Need to add: `AdminAuditLog` for tracking admin actions

---

## 2. Billing Management Section

### File Structure
```tsx
src/
├── app/
│   ├── admin/
│   │   └── billing/
│   │       ├── page.tsx                      // Billing overview
│   │       ├── subscriptions/
│   │       │   └── page.tsx                  // All subscriptions
│   │       ├── invoices/
│   │       │   └── page.tsx                  // Invoice management
│   │       ├── payments/
│   │       │   └── page.tsx                  // Payment history
│   │       └── plans/
│   │           └── page.tsx                  // Plan management
│   └── api/
│       └── admin/
│           └── billing/
│               ├── route.ts                   // Billing overview stats
│               ├── subscriptions/
│               │   └── route.ts               // Subscription CRUD
│               ├── invoices/
│               │   └── route.ts               // Invoice operations
│               └── payments/
│                   └── route.ts               // Payment history
├── components/
│   └── admin/
│       └── billing/
│           ├── BillingOverview.tsx            // Revenue dashboard
│           ├── SubscriptionsList.tsx          // Subscriptions table
│           ├── InvoiceGenerator.tsx           // Create manual invoices
│           ├── PaymentHistory.tsx             // Payment transactions
│           └── PlanManager.tsx                // Edit pricing plans
└── lib/
    └── admin/
        ├── billing.ts                         // Billing calculations
        └── stripe-admin.ts                    // Stripe admin operations
```

### Database Models to Use
- `Tenant` model (has Stripe fields)
- `Plan` model (already exists)
- `TenantSubscription` model (already exists)
- Need to add: `Invoice`, `Payment` models

---

## 3. Reports & Analytics Section

### File Structure
```tsx
src/
├── app/
│   ├── admin/
│   │   └── reports/
│   │       ├── page.tsx                      // Reports dashboard
│   │       ├── system/
│   │       │   └── page.tsx                  // System analytics
│   │       ├── clinics/
│   │       │   └── page.tsx                  // Clinic analytics
│   │       ├── financial/
│   │       │   └── page.tsx                  // Financial reports
│   │       └── custom/
│   │           └── page.tsx                  // Custom report builder
│   └── api/
│       └── admin/
│           └── reports/
│               ├── route.ts                   // Report generation
│               ├── system/
│               │   └── route.ts               // System metrics
│               ├── clinics/
│               │   └── route.ts               // Clinic analytics
│               └── financial/
│                   └── route.ts               // Financial data
├── components/
│   └── admin/
│       └── reports/
│           ├── ReportsDashboard.tsx           // Overview charts
│           ├── SystemMetrics.tsx              // System health charts
│           ├── ClinicAnalytics.tsx            // Clinic usage charts
│           ├── FinancialCharts.tsx            // Revenue charts
│           └── ReportBuilder.tsx              // Custom report UI
└── lib/
    └── admin/
        ├── analytics.ts                       // Data aggregation
        └── report-generator.ts                // Report generation logic
```

### Database Models to Use
- `TenantUsageStats` model (already exists)
- `AdminAuditLog` model
- Aggregate data from existing models

---

## 4. System Management Section

### File Structure
```tsx
src/
├── app/
│   ├── admin/
│   │   └── system/
│   │       ├── page.tsx                      // System overview
│   │       ├── health/
│   │       │   └── page.tsx                  // System health monitor
│   │       ├── config/
│   │       │   └── page.tsx                  // Configuration management
│   │       ├── logs/
│   │       │   └── page.tsx                  // System logs viewer
│   │       └── maintenance/
│   │           └── page.tsx                  // Maintenance tools
│   └── api/
│       └── admin/
│           └── system/
│               ├── route.ts                   // System stats
│               ├── health/
│               │   └── route.ts               // Health checks
│               ├── config/
│               │   └── route.ts               // Config management
│               └── logs/
│                   └── route.ts               // Log retrieval
├── components/
│   └── admin/
│       └── system/
│           ├── SystemOverview.tsx             // System dashboard
│           ├── HealthMonitor.tsx              // Real-time monitoring
│           ├── ConfigManager.tsx              // Settings editor
│           ├── LogViewer.tsx                  // Log display
│           └── MaintenanceTools.tsx           // Admin tools
└── lib/
    └── admin/
        ├── system-health.ts                   // Health check functions
        └── system-config.ts                   // Config management
```

---

## 5. Settings Section

### File Structure
```tsx
src/
├── app/
│   ├── admin/
│   │   └── settings/
│   │       ├── page.tsx                      // Settings overview
│   │       ├── general/
│   │       │   └── page.tsx                  // General settings
│   │       ├── branding/
│   │       │   └── page.tsx                  // Branding settings
│   │       ├── email/
│   │       │   └── page.tsx                  // Email configuration
│   │       └── security/
│   │           └── page.tsx                  // Security settings
│   └── api/
│       └── admin/
│           └── settings/
│               ├── route.ts                   // Get/Update settings
│               ├── branding/
│               │   └── route.ts               // Branding updates
│               └── email/
│                   └── route.ts               // Email config
├── components/
│   └── admin/
│       └── settings/
│           ├── SettingsTabs.tsx               // Settings navigation
│           ├── GeneralSettings.tsx            // General form
│           ├── BrandingSettings.tsx           // Brand customization
│           ├── EmailSettings.tsx              // Email templates
│           └── SecuritySettings.tsx           // Security options
└── lib/
    └── admin/
        └── settings.ts                        // Settings management
```

---

## Common Components & Utilities

### Shared Admin Components
```tsx
src/components/admin/shared/
├── AdminDataTable.tsx                         // Reusable data table
├── AdminSearchBar.tsx                         // Search component
├── AdminFilters.tsx                           // Filter dropdowns
├── AdminBreadcrumbs.tsx                       // Navigation breadcrumbs
├── AdminStatsCard.tsx                         // Metric display cards
├── AdminEmptyState.tsx                        // Empty state component
├── AdminLoadingState.tsx                      // Loading skeleton
└── AdminErrorState.tsx                        // Error display
```

### Shared Admin Hooks
```tsx
src/hooks/admin/
├── useAdminAuth.ts                            // Admin auth check
├── useAdminPagination.ts                      // Pagination logic
├── useAdminSearch.ts                          // Search debouncing
├── useAdminFilters.ts                         // Filter state
└── useAdminWebSocket.ts                       // Real-time updates
```

### Shared Admin Libraries
```tsx
src/lib/admin/
├── permissions.ts                             // Permission checking
├── audit-log.ts                               // Audit logging
├── export.ts                                  // Data export utilities
└── notifications.ts                           // Admin notifications
```

---

## Implementation Notes

1. **Authentication**: Your app uses Clerk, and you have a `requireSuperAdmin` function that checks for super admin role or email domain.

2. **Database**: You're using Prisma with PostgreSQL. Most models already exist, but you'll need to add:
   - `AdminAuditLog` for tracking admin actions
   - `Invoice` and `Payment` models for billing
   - Additional fields for system configuration

3. **API Structure**: Follow your existing pattern with route handlers in `app/api/admin/[feature]/route.ts`

4. **Component Pattern**: Use your existing patterns from the tenants section as a reference

5. **Styling**: Continue using Tailwind CSS with your dark mode support

6. **State Management**: Use React Query/SWR for data fetching as seen in your existing code

This structure aligns with your current codebase patterns and maintains consistency across all admin sections.