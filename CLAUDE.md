# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vetify is a comprehensive, multi-tenant SaaS platform for veterinary practice management built with Next.js 15, TypeScript, Prisma, and PostgreSQL. The platform provides appointment management, customer/pet tracking, medical records, inventory management, point-of-sale capabilities, and business analytics.

## Package Manager

**ALWAYS use `pnpm` for all package operations:**
- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add new dependency
- `pnpm dev` - Start development server (runs on localhost:3000)

## Core Development Commands

### Development & Build
```bash
pnpm dev                    # Start development server
pnpm build                  # Build for production (includes Prisma generation)
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
```

### Database
```bash
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations in development
pnpm prisma migrate deploy  # Run migrations in production
pnpm prisma studio          # Open Prisma Studio (database GUI)
```

### Testing
```bash
pnpm test                      # Run all tests
pnpm test:unit                 # Run unit tests only
pnpm test:integration          # Run integration tests
pnpm test:e2e                  # Run E2E tests with Playwright
pnpm test:e2e:ui               # Run E2E tests with UI
pnpm test:watch                # Run tests in watch mode
pnpm test:coverage             # Run tests with coverage report
pnpm test:security             # Run security-focused tests
pnpm test:components           # Run component tests
```

### Environment Management
```bash
pnpm env:localhost             # Configure for localhost
pnpm env:development           # Configure for development environment
pnpm env:show                  # Show current environment configuration
```

### Stripe Integration
```bash
pnpm stripe:verify             # Verify Stripe setup
pnpm stripe:setup              # Setup Stripe products
pnpm pricing:sync              # Verify pricing synchronization
```

## Architecture

### Multi-Tenant System
- **Tenant Isolation**: All data is scoped by `tenantId` to ensure complete isolation between clinics
- **Authentication**: Uses Kinde Auth for authentication with automatic user/tenant association
- **Authorization**: Role-based access control (RBAC) with tenant-scoped roles (admin, veterinarian, assistant)
- **Trial Management**: 30-day trials with grace periods, automatic access control, and Stripe integration for subscriptions

### Database Design (Prisma)
- **Schema Location**: `prisma/schema.prisma`
- **Multi-tenant Pattern**: Most models include `tenantId` with cascade deletion for data isolation
- **Key Models**:
  - `Tenant`: Clinic/practice entity with subscription and trial tracking
  - `User`: Authenticated users with optional tenant association
  - `Customer`: Pet owners (distinct from User - can exist without accounts)
  - `Pet`: Animals belonging to customers
  - `Appointment`: Scheduled visits with status tracking
  - `MedicalHistory`/`TreatmentRecord`: Complete medical record system
  - `InventoryItem`: Products, medicines, vaccines with movement tracking
  - `Sale`: Point-of-sale transactions with payment processing
  - `Staff`: Clinic employees (veterinarians, assistants)

### Authentication Flow
1. Kinde handles OAuth/authentication
2. `src/lib/auth.ts` provides core auth utilities:
   - `getAuthenticatedUser()`: Get current user or create if first login
   - `requireAuth()`: Enforce auth + tenant (redirects to onboarding if no tenant)
   - `checkUserNeedsOnboarding()`: Determine if onboarding is needed
3. `src/lib/db/queries/users.ts`: Concurrent-safe user creation/lookup
4. Onboarding flow creates tenant with trial subscription

### API Design Patterns
- **Location**: All API routes in `src/app/api/`
- **Structure**: RESTful design with proper HTTP status codes
- **Validation**: Zod schemas for request validation
- **Security**:
  - Rate limiting with Upstash Redis (`src/lib/security/rate-limiter.ts`)
  - Input sanitization (`src/lib/security/input-sanitization.ts`)
  - CSRF protection (`src/lib/security/csrf-protection.ts`)
  - Audit logging (`src/lib/security/audit-logger.ts`)
- **Error Handling**: Consistent JSON responses with `{ success: boolean, data/error: ... }`
- **Tenant Scoping**: Always filter queries by `tenant.id` from `requireAuth()`

Example API pattern:
```typescript
export async function GET(request: Request) {
  try {
    const { tenant } = await requireAuth();
    const data = await prisma.model.findMany({
      where: { tenantId: tenant.id }
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    );
  }
}
```

### Frontend Architecture
- **Framework**: Next.js 15 (App Router)
- **UI Components**: `src/components/` - Reusable React components
- **Client Components**: Use `"use client"` for interactivity
- **Server Components**: Default for data fetching
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: React hooks + server state via Next.js
- **Form Handling**: React Hook Form with Zod validation

### Key Library Functions
- `src/lib/auth.ts`: Authentication and authorization
- `src/lib/tenant.ts`: Tenant creation, slug generation, subscription management
- `src/lib/prisma.ts`: Singleton Prisma client
- `src/lib/customers.ts`: Customer management
- `src/lib/pets.ts`: Pet management
- `src/lib/medical.ts`: Medical records
- `src/lib/inventory.ts`: Inventory tracking
- `src/lib/sales.ts`: Point-of-sale operations
- `src/lib/staff.ts`: Staff management
- `src/lib/payments/stripe.ts`: Stripe integration

### Path Aliases
The project uses `@/` as an alias for `src/`:
```typescript
import { Component } from '@/components/Component'
import { requireAuth } from '@/lib/auth'
import { UserType } from '@/types'
```

## Important Development Guidelines

### Database Protection
**NEVER reset the database or perform destructive operations without explicit user confirmation**. Always ask before:
- DROP TABLE
- TRUNCATE
- DELETE operations affecting multiple records
- Schema resets
- Migrations that may cause data loss

### TypeScript Configuration
- Strict mode is **disabled** (`"strict": false` in tsconfig.json)
- Type checking is skipped on Vercel builds to avoid deployment issues
- Use explicit types where beneficial but not required everywhere

### Testing Strategy
- Unit tests: `__tests__/unit/` - Test individual functions/components
- Integration tests: `__tests__/integration/` - Test API routes and workflows
- E2E tests: `__tests__/e2e/` - Test complete user flows with Playwright
- Always include tests for new features
- Run specific test suites for faster feedback during development

### Security Considerations
- All API routes should use `requireAuth()` to ensure authentication
- Always validate and sanitize user input with Zod schemas
- Use prepared statements (Prisma) to prevent SQL injection
- Rate limit sensitive endpoints (login, payments, etc.)
- Never expose sensitive data in error messages
- Implement CSRF protection for state-changing operations

### Vercel Deployment
- Build command: `pnpm vercel-build` (includes asset copying script)
- TypeScript errors are ignored on Vercel builds
- CSS is inlined for production to avoid loading issues
- Post-build script copies public assets: `scripts/copy-assets.mjs`
- Environment variables managed via `scripts/vercel-env-export.mjs`

### Sentry Integration
- Instrumentation enabled in `src/instrumentation.ts`
- Error tracking and performance monitoring configured
- Use `pnpm sentry:quiet|normal|verbose|debug` to control logging levels
- `pnpm sentry:status` to check configuration

### External Integrations
- **Stripe**: Payment processing and subscription management
- **Kinde**: Authentication provider
- **Upstash Redis**: Rate limiting and caching
- **N8N**: Workflow automation (WhatsApp, email reminders)
- **Supabase**: PostgreSQL database hosting

## Common Workflows

### Adding a New Feature
1. Create/update Prisma schema if database changes needed
2. Run `pnpm prisma migrate dev --name feature_name`
3. Create API routes in `src/app/api/`
4. Add validation schemas using Zod
5. Implement UI components in `src/components/`
6. Create page components in `src/app/`
7. Add tests in appropriate `__tests__/` directory
8. Update types in `src/types/` if needed

### Creating a New API Endpoint
1. Create route file in `src/app/api/path/route.ts`
2. Import `requireAuth` from `@/lib/auth`
3. Define Zod validation schema
4. Implement GET/POST/PUT/DELETE handlers
5. Always scope queries by `tenantId`
6. Return consistent JSON structure: `{ success, data/error }`
7. Handle errors with appropriate status codes
8. Add integration tests

### Working with Forms
1. Use React Hook Form for form state management
2. Define Zod schema for validation
3. Use `@hookform/resolvers/zod` to integrate validation
4. Handle submission with API calls
5. Show loading states and error messages
6. Use `sonner` for toast notifications

### Debugging Tips
- Check Sentry for production errors
- Use `pnpm env:show` to verify environment configuration
- Run `pnpm health:check` to verify service health
- Use Prisma Studio to inspect database: `pnpm prisma studio`
- Check trial status: `pnpm trial:status`
- Verify Stripe setup: `pnpm stripe:verify`

## Code Style Preferences

- Use TypeScript for all new code
- Prefer functional components over class components
- Use async/await over promises
- Implement proper error boundaries
- Follow established file structure and naming conventions
- Use descriptive variable and function names
- Always consider scalability and maintainability
- Prefer server components when possible for better performance
- Use `"use client"` only when client-side interactivity is required

## Notes

- The application runs on port 3000 locally - do not start additional servers
- Configuration files are in `/config/` but symlinked to root for Next.js compatibility
- Always use `pnpm` - never `npm` or `yarn`
- Check `.cursor/rules/` for additional development patterns and guidelines
- Super admins are users with `@vetify.pro`, `@vetify.com`, or `@alanis.dev` emails
- Trial period is 30 days with automatic grace period handling
- Customer entities are separate from User entities - customers can book appointments without accounts