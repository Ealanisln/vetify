# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vetify is a multi-tenant SaaS platform for veterinary practice management built with Next.js 15, React 19, TypeScript, Prisma, and PostgreSQL. The application uses Kinde Auth for authentication, Stripe for payments, and supports trial/subscription-based access control.

### URLs

- **Production**: `https://www.vetify.pro` (apex `vetify.pro` redirects to `www`)
- **Vercel project**: `vetify-prod` (org `alanis-projects-98cc43e8`)
- **Local dev**: `http://localhost:3000`

> Note: `vetify.com` redirects to an unrelated company (Avetta) and `vetify.com.mx` is a parked GoDaddy page — do not use either.

## Package Manager

**ALWAYS use `pnpm` for all package operations:**
- Install: `pnpm install`
- Add dependency: `pnpm add <package>`
- Dev server: `pnpm dev`
- Build: `pnpm build`

Required versions:
- Node.js >= 20.0.0
- pnpm 9.15.9

## Common Commands

### Development
```bash
pnpm dev                      # Start dev server on localhost:3000
pnpm build                    # Production build (includes prisma generate)
pnpm start                    # Start production server
pnpm lint                     # Run ESLint
```

### Database
```bash
pnpm prisma generate          # Generate Prisma Client
pnpm prisma migrate dev       # Create and apply migrations
pnpm prisma migrate deploy    # Apply migrations (production)
pnpm prisma studio            # Open Prisma Studio
```

### Testing
```bash
pnpm test                     # Run all unit tests
pnpm test:watch               # Run tests in watch mode
pnpm test:unit                # Run unit tests only
pnpm test:integration         # Run integration tests
pnpm test:e2e                 # Run Playwright E2E tests
pnpm test:e2e:ui              # Run E2E tests with UI
pnpm test:coverage            # Run tests with coverage report
pnpm test:security            # Run security tests
pnpm test:components          # Run component tests
```

### Environment Management
```bash
pnpm env:show                 # Show current environment config
pnpm env:localhost            # Configure for localhost
pnpm env:development          # Configure for development environment
```

### Stripe & Payments
```bash
pnpm stripe:verify            # Verify Stripe setup
pnpm stripe:setup             # Setup Stripe products
pnpm pricing:sync             # Verify pricing sync
```

### Deployment
```bash
pnpm vercel-build             # Build for Vercel (includes asset copy)
pnpm build:production         # Production build with migrations
pnpm deploy:check             # Check deployment readiness
```

## Git Workflow

### Pull Request Policy

**CRITICAL: ALWAYS target the `development` branch for pull requests, NOT `main`.**

- **Base Branch**: All PRs must target `development`
- **Main Branch**: The `main` branch is protected and only receives changes via merges from `development`
- **Branch Strategy**:
  - Feature branches → `development` (via PR)
  - `development` → `main` (via PR after QA)

When creating PRs with `gh pr create`, always specify:
```bash
gh pr create --base development --title "..." --body "..."
```

Never create PRs directly to `main` unless explicitly instructed for hotfixes.

## Architecture

### Multi-Tenant Structure
- **Tenant Isolation**: Each tenant (veterinary clinic) has isolated data via `tenantId` foreign keys
- **Authentication**: Kinde Auth with server-side session management
- **Authorization**: Role-based access control (RBAC) with Staff/Role models
- **Trial System**: Built-in trial period management with feature access control

### Key Architectural Patterns

#### 1. App Router (Next.js 15)
- Server Components by default
- Client Components marked with `'use client'`
- Server Actions for mutations
- Route handlers in `/app/api/`

#### 2. Database Access
- **Prisma ORM**: Single shared client instance via `src/lib/prisma.ts`
- **Transaction Support**: Use `prisma.$transaction()` for multi-step operations
- **Multi-Tenancy**: Always filter by `tenantId` in queries
- **Soft Deletes**: Use `deletedAt` field for audit trail when needed

#### 3. Security Layers
- **Rate Limiting**: Upstash Redis-based rate limiting in middleware
- **Audit Logging**: Security event logging via `src/lib/security/audit-logger.ts` with database persistence
- **Input Sanitization**: Zod schemas in `src/lib/security/validation-schemas.ts`
- **CSRF Protection**: Token-based CSRF protection for state-changing operations
- **Security Headers**: Applied via middleware for all responses
- **Monitoring Alerts**: Automated alerts for payment failures and critical errors via `src/lib/monitoring/`

#### 4. Middleware Chain
The middleware (`src/middleware.ts`) handles:
1. Rate limiting for API routes
2. Authentication with Kinde
3. Trial/subscription access control for protected features
4. Security audit logging
5. Security headers injection

### Critical File Paths

```
src/
├── app/                        # Next.js App Router
│   ├── actions/
│   │   └── subscription.ts    # Server actions for subscription management
│   ├── api/                   # API route handlers
│   │   ├── v1/               # Versioned REST API endpoints
│   │   ├── webhooks/          # Stripe/external webhooks (public)
│   │   ├── docs/              # Swagger UI for API documentation
│   │   ├── openapi.json/      # OpenAPI 3.0 specification
│   │   ├── trial/             # Trial management endpoints
│   │   ├── version/           # Version info endpoint (public)
│   │   ├── health/            # Health check endpoint (public)
│   │   ├── cron/              # Scheduled tasks (DB keepalive)
│   │   └── admin/             # Super admin endpoints
│   ├── actualizaciones/       # Public changelog page (/actualizaciones)
│   ├── funcionalidades/       # Features page (/funcionalidades)
│   ├── dashboard/             # Main tenant dashboard (protected)
│   ├── admin/                 # Super admin interface
│   ├── layout.tsx             # Root layout with providers
│   └── providers.tsx          # Client-side providers (theme, toast)
├── components/
│   ├── ConditionalLayout.tsx  # Handles layout switching (Nav vs admin)
│   ├── ErrorBoundary.tsx      # Global error boundary
│   ├── hero-section.tsx       # Landing page hero section
│   ├── problem-section.tsx    # Landing page problem section
│   ├── solution-section.tsx   # Landing page solution section
│   ├── benefits-section.tsx   # Landing page benefits section
│   ├── audience-section.tsx   # Landing page audience section
│   ├── closing-section.tsx    # Landing page closing section
│   ├── features/
│   │   └── FeatureGate.tsx    # Subscription-based feature gating
│   ├── providers/
│   │   └── SubscriptionGuard.tsx # Guard for subscription-protected content
│   └── subscription/
│       └── NoActivePlanBanner.tsx # Warning banner for inactive plans
├── lib/
│   ├── prisma.ts              # Shared Prisma client instance
│   ├── auth.ts                # Authentication utilities
│   ├── tenant.ts              # Tenant management
│   ├── version.ts             # Version utilities and constants
│   ├── changelog-parser.ts    # Parses CHANGELOG.md for /actualizaciones
│   ├── security/              # Security utilities
│   │   ├── rate-limiter.ts    # Upstash rate limiting
│   │   ├── audit-logger.ts    # Security event logging (with DB persistence)
│   │   ├── validation-schemas.ts # Zod validation schemas
│   │   └── input-sanitization.ts # Input sanitization & security headers
│   ├── monitoring/            # Automated alerts and monitoring
│   ├── webhooks/              # Outbound webhook system (HMAC signing, retries)
│   ├── trial/                 # Trial period management
│   ├── payments/              # Stripe integration
│   └── plan-limits.ts         # Subscription plan limits
├── hooks/
│   └── useSubscriptionStatus.ts # Client-side subscription status management
├── middleware.ts              # Edge middleware (auth, rate limiting, security)
├── types/                     # TypeScript type definitions
└── AuthProvider.tsx           # Auth context wrapper
```

### Important Configuration

#### 1. CSS & Styling
- **Tailwind CSS**: Configured in `tailwind.config.ts`
- **Critical CSS**: Inlined in `src/app/layout.tsx` for Vercel deployment reliability
- **Theme**: Dark/light mode via `next-themes` with system preference detection
- **Primary Brand Color**: `#75a99c`

#### 2. Path Aliases
All imports use `@/` prefix:
```typescript
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
```

#### 3. Environment Variables
Required environment variables (see `.env.example` if present):
- `DATABASE_URL`: PostgreSQL connection string
- Kinde Auth credentials
- Stripe API keys
- Supabase credentials (for file storage)
- `UPSTASH_REDIS_*`: For rate limiting
- `SENTRY_*`: For error tracking (optional)

#### 4. Vercel Deployment
- Custom build command: `vercel-build` (includes Prisma generation and asset copying)
- TypeScript errors skipped in Vercel builds via `next.config.js`
- Sentry integration via `withSentryConfig` wrapper in `next.config.js`
- See `/deployment/` directory for Vercel-specific documentation

### Trial & Subscription System

Protected routes/features require active trial or subscription:
- Creating new pets, appointments
- Accessing inventory, reports, automations
- Access control enforced in `src/middleware.ts`
- Trial status checked via `/api/trial/check-access`
- Users without active plans redirect to `/dashboard/settings?tab=subscription`

#### Subscription Components & Hooks

**Server Actions** (`src/app/actions/subscription.ts`):
- `getSubscriptionStatus()`: Get comprehensive subscription status for current user's tenant
- `checkFeatureAccess(feature)`: Check if specific feature is accessible with current plan
- `requireActivePlan()`: Check if user requires active plan, returns redirect info if denied

**Client Components**:
- `FeatureGate`: Gate specific features based on subscription plan, shows upgrade prompt if not accessible
- `SubscriptionGuard`: Guard protected content requiring active subscription, redirects if no active plan
- `NoActivePlanBanner`: Warning banner displayed when user has no active plan

**Hooks**:
- `useSubscriptionStatus()`: Client-side hook to fetch and manage subscription status
  - Returns: `{ status, isLoading, isActive, isTrialPeriod, planName, daysRemaining, requireActivePlan, refreshStatus }`

**Usage Example**:
```tsx
import { FeatureGate } from '@/components/features/FeatureGate';

// Gate a premium feature
<FeatureGate feature="inventory">
  <InventoryManagement />
</FeatureGate>
```

### Versioning System

The application uses semantic versioning (SemVer) with version information exposed at build time.

#### Key Files
- **`src/lib/version.ts`** - Version utility library
- **`src/lib/changelog-parser.ts`** - Parses CHANGELOG.md for the updates page
- **`src/app/api/version/route.ts`** - Public API endpoint
- **`src/app/actualizaciones/page.tsx`** - Public changelog page
- **`CHANGELOG.md`** - Release notes following [Keep a Changelog](https://keepachangelog.com/) format

#### How It Works
1. Version is defined in `package.json` (`"version": "1.4.0"`)
2. At build time, `next.config.js` reads `package.json` and injects:
   - `NEXT_PUBLIC_APP_VERSION` - The version string
   - `NEXT_PUBLIC_BUILD_TIME` - ISO timestamp of the build
3. The version utility (`src/lib/version.ts`) provides helper functions

#### Available Functions
```typescript
import {
  APP_VERSION,           // "1.4.0"
  BUILD_TIME,            // "2026-02-14T..."
  getVersionString,      // () => "v1.4.0"
  parseVersion,          // () => { major: 1, minor: 4, patch: 0 }
  getVersionInfo,        // () => { version, versionString, major, minor, patch, buildTime }
  isPrerelease,          // () => false
  compareVersion         // ("1.3.0") => 1 (current is greater)
} from '@/lib/version';
```

#### Version Display
- **Footer**: Shows version subtly next to copyright (e.g., "© 2026 Vetify. v1.4.0")
- **API Endpoint**: `GET /api/version` returns JSON with full version info
- **Health Check**: `GET /api/health` includes version in response
- **Changelog Page**: `GET /actualizaciones` displays parsed CHANGELOG.md as a version timeline

#### Updating the Version
When releasing a new version:
1. Update `version` in `package.json`
2. Update `CHANGELOG.md` with release notes
3. The version will be automatically reflected in the app after rebuild

#### Version Format
Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
- **Prerelease**: Add suffix like `-beta.1`, `-rc.1`

### Testing Philosophy

- **Unit Tests**: Pure functions, utilities, validation logic
- **Integration Tests**: API routes, database operations
- **E2E Tests**: User flows with Playwright (Phase 4: admin smoke, medical records, teardown)
- **Security Tests**: Input validation, rate limiting, auth flows
- **Weekly Smoke Tests**: Automated P0/P1 business flow tests (Sundays 6AM UTC via GitHub Actions)
- Tests use environment configuration via `scripts/env-config.mjs`

## Testing & Auto-Fix Protocol

### Configuration
```yaml
auto_fix_enabled: true
max_fix_iterations: 3
verify_after_fix: true
test_command: "pnpm test"
coverage_threshold: 80
e2e_framework: "playwright"
```

### When Running Tests

**Always follow this sequence:**

1. **Execute** → Run the requested test suite
2. **Analyze** → On failure, identify root cause
3. **Categorize** → Implementation bug vs Test bug vs Environment issue
4. **Fix** → Apply minimal, focused fix
5. **Re-run** → Execute tests again
6. **Iterate** → Repeat steps 2-5 up to 3 times
7. **Report** → Summarize results and any remaining issues

### Failure Categories & Actions

| Category | Signs | Fix Action |
|----------|-------|------------|
| **Implementation Bug** | Test expects X, code returns Y | Fix source code, keep test |
| **Test Bug** | Test outdated, wrong assertion | Fix test to match correct behavior |
| **Environment Issue** | Connection errors, missing config | Fix setup, env vars, dependencies |
| **Type Error** | TypeScript compilation failure | Fix types in source or test |
| **Flaky Test** | Passes sometimes, timing issues | Add retries or fix race condition |

### Auto-Fix Rules

**✅ Automatically fix:**
- Null/undefined handling
- Type mismatches and missing types
- Import statements
- Mock data updates
- Assertion updates (when implementation is correct)
- Environment/config issues
- Missing async/await

**❌ Ask before fixing:**
- Deleting or skipping tests
- Database schema changes
- API contract changes
- Security-related code
- Payment/financial logic
- Authentication/authorization logic

### Fix Iteration Protocol

```
for iteration in 1..3:
    if tests_pass:
        run_verification(typecheck, lint, full_suite)
        report_success()
        break
    else:
        analyze_failure()
        categorize_issue()
        apply_minimal_fix()
        continue

if iteration == 3 and tests_fail:
    report_remaining_issues()
    ask_for_guidance()
```

### Post-Fix Verification Checklist

After any fix, verify:
- [ ] Target tests pass
- [ ] Full test suite passes (no regressions)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Changes are minimal and focused

### Reporting Template

```markdown
## Test Results

**Scope:** [unit/integration/e2e]
**Status:** ✅ All passing | ⚠️ Issues remaining

### Fixes Applied
1. [file] - [what was fixed]

### Remaining Issues (if any)
- [ ] [issue] - [recommended action]

### Verification
- [x] Tests pass
- [x] Types check
- [x] Lint clean
```

## TDD Bug Fix Workflow

When fixing bugs, always use Test-Driven Development:

```
1. CREATE failing test that reproduces bug
   └─ Verify test fails for the RIGHT reason

2. IMPLEMENT minimal fix
   └─ Change only what's necessary

3. VERIFY test passes
   └─ Run the specific test

4. CHECK for regressions
   └─ Run full test suite

5. ITERATE if needed
   └─ Fix any regressions (max 3 iterations)

6. REPORT results
   └─ Summary of changes and status
```

### Integration with Bug Tracking

When fixing a tracked bug (Plane, etc.):
1. Reference the issue ID in test description
2. Link to test file in issue comments
3. Update issue status after fix verified

### Database Protection

**CRITICAL**: Never reset or truncate the database without explicit user confirmation. Always:
1. Ask for confirmation before destructive operations
2. Explain what data will be lost
3. Suggest backup options
4. Check existing data first using Prisma queries

### Code Style Preferences

- **TypeScript**: Strict mode disabled for pragmatic development
- **Functional Patterns**: Prefer functional programming where appropriate
- **Error Boundaries**: Implement at component and page levels
- **Error Handling**: Try-catch blocks for async operations with proper logging
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation support

### Development Environment

- **Server**: Always runs on `http://localhost:3000`
- **DO NOT** suggest starting new servers
- **DO NOT** run `pnpm dev` unless explicitly asked
- Assume dev server is already running

### Authentication Flow

1. Kinde handles OAuth/login flow
2. Session managed server-side via `getKindeServerSession()`
3. User links to Tenant via `userId` field in Staff model
4. Tenant context determined from authenticated user's staff record
5. Middleware enforces authentication for protected routes

### Multi-Tenant Data Access Pattern

Always scope queries by tenant:
```typescript
const pets = await prisma.pet.findMany({
  where: { tenantId: user.tenantId }
})
```

### Important Notes

- **React 19**: Uses latest React 19.1.0 - ensure component patterns are compatible
- **Next.js 15**: Uses force-dynamic rendering (`export const dynamic = 'force-dynamic'`) to prevent static generation issues with Kinde Auth
- **Symlinks**: Root config files are symlinks to `/config/` directory for Next.js compatibility
- **Sentry**: Integrated but can be noisy - use `pnpm sentry:quiet` to reduce logs
- **i18n**: UI is primarily in Spanish (pet species, staff positions, public pages). Keep user-facing text in Spanish.
- **Landing Page**: Redesigned for small veterinary clinics with section-based components in `src/components/`

### Dark Mode Design Guidelines

**CRITICAL: Always use dark mode variants for borders and backgrounds.**

The project has a theme utility at `src/utils/theme-colors.ts` with predefined patterns. Use these consistently.

#### Card & Container Borders

```tsx
// ❌ NEVER do this - creates white borders in dark mode
className="border"
className="border border-gray-200"
className="border border-white"

// ✅ ALWAYS use dark mode variant
className="border border-gray-200 dark:border-gray-700"

// ✅ Or use the theme utility
import { themeColors } from '@/utils/theme-colors'
className={`border ${themeColors.border.card}`}
```

#### Standard Border Patterns

| Use Case | Light Mode | Dark Mode | Combined Class |
|----------|------------|-----------|----------------|
| Card borders | `border-gray-200` | `dark:border-gray-700` | `border border-gray-200 dark:border-gray-700` |
| Input borders | `border-gray-300` | `dark:border-gray-600` | `border border-gray-300 dark:border-gray-600` |
| Subtle borders | `border-gray-100` | `dark:border-gray-800` | `border border-gray-100 dark:border-gray-800` |
| Accent borders | `border-[#d5e3df]` | `dark:border-gray-700` | `border border-[#d5e3df] dark:border-gray-700` |

#### Background Patterns

```tsx
// ✅ Correct background patterns
className="bg-white dark:bg-gray-800"           // Cards
className="bg-gray-50 dark:bg-gray-900"         // Page backgrounds
className="bg-gray-100 dark:bg-gray-700"        // Tertiary backgrounds
```

#### Reference Files

- **Theme utility**: `src/utils/theme-colors.ts` - Pre-defined class combinations
- **Good example**: `src/components/dashboard/StatsCard.tsx` - Proper dark mode styling
- **Documentation**: See Plane issue VETIF-82 for detailed examples