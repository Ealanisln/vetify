# Vetify - Veterinary Practice Management Platform

A comprehensive, multi-tenant SaaS platform for veterinary practices built with Next.js 15, React 19, and TypeScript. Features include appointment management, pet health records, inventory tracking, client communication via WhatsApp, and subscription-based access control.

## 🎉 Latest Release Highlights

**Recent Updates (January 2025)**:
- ✨ **Enhanced Medical Module**: Inline veterinarian creation during medical forms, improved consultation/treatment/vaccination forms
- 🎨 **Appointment Calendar**: Enhanced UI/UX with better navigation and visual improvements
- 💳 **Subscription UX**: Improved plan upgrade/downgrade experience with visual indicators and proper feature gating
- 📊 **Tiered Reports**: Basic and advanced reports split by subscription plan (VETIF-1)
- 🔧 **Onboarding Improvements**: URL slug validation for Spanish clinic names, Plan Corporativo handling
- 🐾 **Pet Data Standardization**: Standardized species/gender enum values across the application
- ⚡ **Code Quality**: Comprehensive type safety improvements and data integrity fixes
- 🔮 **Future-Ready**: n8n automation integration prepared (currently disabled, will be enabled in future release)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Configure your environment variables

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Kinde Auth
- **Payments**: Stripe (Subscriptions & Trials)
- **Storage**: Supabase
- **Rate Limiting**: Upstash Redis
- **Monitoring**: Sentry
- **Testing**: Jest, Playwright, React Testing Library

## 🛠️ Development

### Prerequisites
- Node.js >= 20.0.0
- pnpm 9.15.9
- PostgreSQL database
- Supabase account
- Stripe account (for payments)
- Kinde Auth account

### Available Commands

#### Development
```bash
pnpm dev                      # Start dev server (localhost:3000)
pnpm build                    # Production build
pnpm start                    # Start production server
pnpm lint                     # Run ESLint
```

#### Database
```bash
pnpm prisma generate          # Generate Prisma Client
pnpm prisma migrate dev       # Create and apply migrations
pnpm prisma migrate deploy    # Apply migrations (production)
pnpm prisma studio            # Open Prisma Studio GUI
```

#### Database Migration & RLS
```bash
pnpm tsx scripts/verify-migration.ts    # Verify database migration integrity
pnpm tsx scripts/test-rls-policies.ts   # Test Row Level Security policies
pnpm tsx scripts/export-dev-data.ts     # Export development data to JSON
```

#### Testing
```bash
pnpm test                     # Run all unit tests
pnpm test:watch               # Run tests in watch mode
pnpm test:unit                # Run unit tests only
pnpm test:integration         # Run integration tests
pnpm test:e2e                 # Run Playwright E2E tests
pnpm test:e2e:ui              # Run E2E tests with UI
pnpm test:coverage            # Generate coverage report
pnpm test:security            # Run security tests
pnpm test:components          # Run component tests
pnpm test:critical            # Run critical tests before deploy
```

#### Environment Management
```bash
pnpm env:show                 # Show current environment config
pnpm env:localhost            # Configure for localhost
pnpm env:development          # Configure for development
```

#### Stripe & Payments
```bash
pnpm stripe:verify            # Verify Stripe configuration
pnpm stripe:setup             # Setup Stripe products and prices
pnpm stripe:cleanup           # Clean up duplicate subscriptions
pnpm pricing:sync             # Verify pricing synchronization
pnpm trial:status             # Check subscription status
pnpm trial:fix                # Fix trial status for tenants with incorrect status
```

#### Deployment
```bash
pnpm vercel-build             # Build for Vercel
pnpm build:production         # Production build with migrations
pnpm deploy:check             # Check deployment readiness
```

## 📁 Project Structure

```
vetify/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── actions/          # Server Actions
│   │   ├── api/              # API Routes
│   │   ├── dashboard/        # Main dashboard (protected)
│   │   ├── admin/            # Super admin interface
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # UI components
│   │   ├── features/         # Feature components
│   │   └── subscription/     # Subscription components
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── security/         # Security utilities
│   │   ├── payments/         # Stripe integration
│   │   └── trial/            # Trial management
│   ├── hooks/                # React hooks
│   ├── types/                # TypeScript definitions
│   └── middleware.ts         # Edge middleware
├── config/                   # Configuration files
│   ├── jest.config.ts
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── deployment/               # Deployment configs
│   └── vercel.json
├── gitbook-docs/            # GitBook documentation
├── prisma/                  # Database schema & migrations
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── tests/                   # Test files
└── CLAUDE.md                # AI assistant instructions
```

## 🔒 Security Features

- **Rate Limiting**: Upstash Redis-based rate limiting on API routes
- **CSRF Protection**: Token-based protection for state-changing operations
- **Security Headers**: Comprehensive security headers via middleware
- **Input Validation**: Zod schemas for all inputs
- **Audit Logging**: Security event logging
- **Multi-tenant Isolation**: Strict tenant data separation
- **Row Level Security (RLS)**: PostgreSQL RLS policies enforce tenant isolation at the database level
  - Automatic tenant context setting via middleware
  - Comprehensive test suite with 10+ isolation tests
  - See `/docs/RLS_CONFIGURATION.md` for setup guide

## 💳 Subscription System

- **Trial Period**: 30-day free trial for all plans
- **Plans**: Básico ($599/mo), Profesional ($1,199/mo), Corporativo ($5,000/mo)
- **Features**: Subscription-based feature gating
- **Access Control**: Middleware-enforced subscription requirements
- **Duplicate Prevention**: Automatic cancellation of duplicate subscriptions
- **Components**:
  - `FeatureGate`: Gate premium features
  - `SubscriptionGuard`: Protect subscription-only content
  - `useSubscriptionStatus()`: Client-side subscription hook
  - `SubscriptionManager`: Manage subscription and billing portal access
  - `EarlyAdopterBanner`: Marketing banner for launch discount
- **Utilities**:
  - `trial:fix`: Fix trial status for tenants with incorrect subscription state
  - `stripe:cleanup`: Remove duplicate subscriptions (keeps most recent)

## 🧪 Testing

The project includes comprehensive test coverage:
- **Unit Tests**: Utilities, validation, business logic
- **Integration Tests**: API routes, database operations
- **E2E Tests**: User flows with Playwright
- **Security Tests**: Input validation, rate limiting, auth flows

Run `pnpm test:coverage` for detailed coverage reports.

## 🚀 Deployment

### Vercel (Recommended)

1. Configure environment variables (see `.env.example`)
2. Connect your GitHub repository to Vercel
3. Vercel will automatically use the `vercel-build` command
4. Refer to `/deployment/` for detailed instructions

### Environment Variables

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- Kinde Auth credentials (`KINDE_*`)
- Stripe API keys (`STRIPE_*`)
- Supabase credentials (`NEXT_PUBLIC_SUPABASE_*`)
- Upstash Redis (`UPSTASH_REDIS_*`)
- Optional: Sentry DSN for error tracking

See `/deployment/VERCEL_SETUP_INSTRUCTIONS.md` for complete setup guide.

### 🔍 Troubleshooting: Database Connection

If you encounter `FATAL: Tenant or user not found` errors in Vercel:

#### ✅ Correct Supabase Connection String Format

The connection string format **varies by project** - always use the exact format from your Supabase dashboard.

**Get your connection strings from:**
1. Go to: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF/settings/database`
2. Click on "Connection string" → "Connection pooling"
3. Select "Transaction pooler" mode
4. Copy the exact connection string shown

**Key requirements:**
- **Pooler host varies**: May be `aws-0-us-east-1` or `aws-1-us-east-1` (check dashboard)
- **Critical parameters**: Must include `prepared_statements=false&statement_cache_size=0`
- **Username format**: Use `postgres.PROJECT_REF` as shown in dashboard
- **Database password**: Use the database password, NOT service role JWT

**Example (format varies per project):**
```bash
# DATABASE_URL (Transaction pooler - Port 6543)
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&prepared_statements=false&statement_cache_size=0

# DIRECT_URL (Direct connection - Port 5432)
postgresql://postgres.PROJECT_REF:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

**Why these parameters matter:**
- `prepared_statements=false`: Required for pgbouncer transaction mode
- `statement_cache_size=0`: Prevents Prisma statement caching issues
- `pgbouncer=true`: Enables connection pooling for serverless

**Pro tip:** Always copy the connection string from your Supabase dashboard rather than constructing it manually - the pooler host and format can vary between projects.

## 📚 Documentation

- **Main Guide**: `CLAUDE.md` - Comprehensive development guide
- **Deployment**: `/deployment/` - Vercel deployment instructions
- **GitBook Docs**: `/gitbook-docs/` - Detailed feature documentation
- **Configuration**: `/config/README.md` - Configuration file documentation
- **Database & Security**:
  - `/docs/RLS_CONFIGURATION.md` - Row Level Security setup guide
  - `/docs/RLS_SETUP_COMPLETE.md` - RLS implementation summary
  - `/docs/migration/MIGRATION_GUIDE.md` - Database migration guide

## 🔧 Configuration

**Important**: Root configuration files (`next.config.js`, `tailwind.config.ts`, etc.) are symlinks to `/config/` directory for Next.js compatibility. Edit files in `/config/` when making changes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run `pnpm test:critical` to ensure tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

---

**For AI Assistants**: Please refer to `CLAUDE.md` for detailed development instructions and architectural guidelines.
