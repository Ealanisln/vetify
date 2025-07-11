# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production (includes Prisma generate)
- `pnpm start` - Start production server  
- `pnpm lint` - Run Next.js linting
- `pnpm build:production` - Full production build with Prisma migrations
- `pnpm start:production` - Start production server with NODE_ENV=production

### Database Commands
- `pnpm db:migrate:production` - Deploy Prisma migrations to production
- `pnpm db:seed:production` - Seed production database
- `prisma generate` - Generate Prisma client (included in build)
- `prisma migrate dev` - Run migrations in development
- `prisma studio` - Open Prisma Studio database browser

### Environment Configuration
- `pnpm env:localhost` - Configure for localhost development
- `pnpm env:localip` - Configure for local network IP access
- `pnpm env:safari` - Configure for Safari testing
- `pnpm env:development` - Configure for development environment
- `pnpm env:show` - Display current environment configuration
- `pnpm env:help` - Show environment configuration help

### Deployment & Production
- `pnpm mvp:checklist` - Run MVP launch checklist
- `pnpm mvp:setup` - Setup MVP production environment
- `pnpm vercel:env:dev` - Export development environment to Vercel
- `pnpm vercel:env:prod` - Export production environment to Vercel
- `pnpm health:check` - Run health check script

### Stripe Integration
- `pnpm stripe:verify` - Verify Stripe setup
- `pnpm stripe:setup` - Setup Stripe products

## Tech Stack & Architecture

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Vetify theme
- **UI Components**: Headless UI, Heroicons, Lucide React
- **State Management**: React state + custom hooks
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Calendar**: FullCalendar
- **Notifications**: Sonner (toast library)

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Kinde Auth
- **Payments**: Stripe
- **File Storage**: Supabase (images/documents)
- **Automation**: N8N integration for workflows
- **WhatsApp**: Meta WhatsApp Business API

### Key Libraries
- **Date Handling**: date-fns, date-fns-tz
- **Utilities**: clsx, tailwind-merge
- **Security**: JWT tokens, secure API routes
- **Development**: ESLint, Playwright (E2E testing)

## Project Structure

### Core Directories
- `src/app/` - Next.js 15 App Router pages and API routes
- `src/components/` - Reusable UI components organized by feature
- `src/lib/` - Utility functions, configurations, and business logic
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/utils/` - Authentication and utility functions
- `prisma/` - Database schema and migrations

### Component Organization
Components are organized by feature areas:
- `appointments/` - Calendar, scheduling, appointment management
- `customers/` - Customer profiles, management, duplicates resolution
- `dashboard/` - Main dashboard components and stats
- `inventory/` - Product management, stock tracking
- `medical/` - Medical records, consultations, treatments
- `pricing/` - Subscription plans and pricing display
- `subscription/` - Plan management, limits, guards
- `admin/` - Multi-tenant admin interface

### API Route Structure
- `api/appointments/` - Appointment CRUD operations
- `api/customers/` - Customer management including duplicate detection
- `api/inventory/` - Inventory management
- `api/medical/` - Medical records and treatments
- `api/subscription/` - Subscription and plan management
- `api/stripe/` - Stripe webhook and checkout handling
- `api/whatsapp/` - WhatsApp integration endpoints

## Multi-Tenant Architecture

### Tenant System
- **Primary Model**: `Tenant` with unique slug for subdomain/path routing
- **Plan Types**: BASIC, STANDARD, PREMIUM, ENTERPRISE (enum in schema)
- **Subscription Integration**: Stripe subscriptions with usage tracking
- **Data Isolation**: All models include `tenantId` for proper isolation

### Key Models
- `Tenant` - Main tenant configuration with Stripe integration
- `User` - Users belong to tenants, managed by Kinde Auth
- `Customer` - Tenant-specific customer records with duplicate detection
- `Pet` - Belongs to customers, core entity for veterinary records
- `Appointment` - Scheduling with customer and pet relationships
- `MedicalHistory` - Medical records linked to pets and staff
- `InventoryItem` - Tenant-specific inventory management
- `Sale` - Financial transactions with customer linkage

### Plan Limits System
- **Configuration**: `src/lib/plan-limits.ts` defines limits per plan
- **Enforcement**: `PlanGuard` component and `useSubscription` hook
- **Tracking**: `TenantUsageStats` model tracks usage metrics
- **Upgrade Prompts**: `UpgradePrompt` component for limit exceeded scenarios

## Authentication & Authorization

### Kinde Auth Integration
- **Setup**: Configured in `src/lib/auth.ts`
- **Middleware**: `src/middleware.ts` handles route protection
- **User Sync**: `src/utils/auth/syncUser.ts` syncs Kinde users with database
- **Role System**: Database roles with `UserRole` relationships

### Protected Routes
- `/dashboard/*` - Requires authentication and tenant membership
- `/admin/*` - Requires admin privileges
- `/api/*` - Most API routes require authentication
- Public routes: `/`, `/precios`, `/funcionalidades`, `/[clinicSlug]`

## Subscription & Billing

### Stripe Integration
- **Configuration**: `src/lib/payments/stripe.ts`
- **Webhook Handling**: `src/app/api/stripe/webhook/route.ts`
- **Checkout**: `src/app/api/stripe/checkout/route.ts`
- **Plan Detection**: `src/components/subscription/PlanDetector.tsx`
- **Current Plans**: Check `src/lib/pricing-config.ts` for active plans

### Subscription Management
- **Current Status**: `src/app/api/subscription/current/route.ts`
- **Plan Limits**: Enforced throughout the application
- **Usage Tracking**: Automatic tracking of users, pets, appointments
- **Trial Periods**: Configurable trial periods per plan

## N8N Automation Integration

### Workflow Automation
- **Base URL**: Configured via `N8N_WEBHOOK_URL` environment variable
- **API Integration**: `src/lib/n8n.ts` handles workflow triggers
- **Webhook Endpoints**: `src/app/api/webhooks/n8n/` for receiving automation responses
- **Logging**: `AutomationLog` model tracks all automation executions

### Available Workflows
- **Pet Welcome**: Triggered on new pet registration
- **Appointment Reminders**: Automated via treatment schedules
- **WhatsApp Integration**: Automated messaging workflows

## WhatsApp Business Integration

### Meta WhatsApp API
- **Configuration**: Environment variables for phone number ID and access token
- **Token Management**: `src/app/api/whatsapp/` endpoints for token handling
- **Webhook**: `src/app/api/webhooks/whatsapp/route.ts` for receiving messages
- **Integration**: `src/lib/whatsapp.ts` for API interactions

## Testing & Quality

### Testing Setup
- **E2E Testing**: Playwright configured for end-to-end testing
- **Type Checking**: TypeScript strict mode enabled
- **Linting**: ESLint with Next.js configuration
- **Build Validation**: TypeScript compilation in CI/CD

### Development Guidelines
- **Database**: Always run `prisma generate` after schema changes
- **Environment**: Use appropriate env commands for different testing scenarios
- **API Routes**: Follow consistent error handling patterns
- **Components**: Use TypeScript interfaces for all props
- **Styling**: Follow Vetify color palette defined in Tailwind config

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `KINDE_CLIENT_ID`, `KINDE_CLIENT_SECRET` - Authentication
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Payments
- `N8N_WEBHOOK_URL`, `N8N_API_KEY` - Automation
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp integration
- `NEXT_PUBLIC_SUPABASE_URL` - File storage

### Local Development
- Copy `.env.example` to `.env.local`
- Configure database connection
- Set up Kinde auth application
- Configure Stripe test keys
- Use `pnpm env:localhost` for local development

## Package Manager
- **Required**: pnpm (specified in package.json)
- **Version**: 10.7.1+ recommended
- **Lock File**: pnpm-lock.yaml should be committed

## Common Development Patterns

### API Route Structure
```typescript
// Standard API route pattern
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    // Tenant validation
    // Business logic
    // Return response
  } catch (error) {
    return NextResponse.json({ error: "Error message" }, { status: 500 });
  }
}
```

### Component Pattern
```typescript
// Component with proper typing
interface ComponentProps {
  tenantId: string;
  // Other props
}

export function Component({ tenantId, ...props }: ComponentProps) {
  // Component logic
}
```

### Database Queries
```typescript
// Always include tenantId in queries
const items = await prisma.inventoryItem.findMany({
  where: {
    tenantId: tenantId,
    // Other conditions
  },
});
```

## Important Notes

- Always validate tenant access in API routes
- Use proper error boundaries for components
- Follow the established naming conventions
- Implement proper loading states for async operations
- Test subscription limits and plan restrictions
- Validate all user inputs with Zod schemas
- Use proper TypeScript types throughout
- Follow security best practices for sensitive data