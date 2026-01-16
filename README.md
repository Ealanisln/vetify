# Vetify - Veterinary Practice Management Platform

A comprehensive, multi-tenant SaaS platform for veterinary practices built with Next.js 15, React 19, and TypeScript. Features include appointment management, pet health records, inventory tracking, client communication via WhatsApp, and subscription-based access control.

## 🎉 Latest Release Highlights

**Recent Updates (January 2026 - v1.2.0)**:
- 📝 **SEO-Optimized Blog System**: Full-featured blog with Storyblok CMS integration
  - Dynamic article pages with Table of Contents, FAQ sections, and related posts
  - Category, author, and tag filtering with SEO-optimized URLs
  - Rich text rendering with callout boxes, code blocks, and media support
  - Comprehensive test coverage: 234 unit/integration tests + 80+ E2E tests
- 📱 **PWA Install Prompt**: Native app-like installation experience
  - Platform-specific prompts for iOS (step-by-step) and Android/Chrome (native dialog)
  - Smart timing with 3-second delay and 7-day dismissal persistence
  - `usePWAInstall` hook for installation state management
- 👥 **Staff Permissions System (RBAC)**: Granular role-based access control
  - `PermissionGate` component and `useStaffPermissions` hook
  - Read-only modes for non-administrative roles
  - Permissions for: locations, services, inventory, sales, testimonials
- 📧 **Staff Invitation System**: Secure email-based team onboarding
  - Token-based invitation validation and acceptance
  - Professional email templates for notifications
- 📊 **Updates Page** (`/actualizaciones`): Public changelog with version timeline
- 🐛 **Bug Report System**: Floating button with screenshot capture support
- 📈 **Landing Page Analytics**: Anonymous conversion tracking with metrics dashboard

**Previous Updates (v1.1.0 - v1.0.0)**:
- 🏢 **Multi-Location Support**: Complete multi-clinic feature set for Corporativo plan
- 📧 **Email System**: Professional transactional emails with Resend
- ✨ **Public Pages**: Services, team, and testimonials pages for clinic websites
- 🎨 **Theme Selector**: Light, dark, and system preference modes
- 💳 **Subscription System**: Trial periods, feature gating, and Stripe integration

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

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.9 | React framework with App Router, Server Components, Server Actions |
| **React** | 19.1.0 | UI library with latest concurrent features |
| **TypeScript** | 5.x | Type-safe development |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first CSS framework |
| **Framer Motion** | Animations and transitions |
| **Headless UI** | Accessible UI components |
| **Heroicons / Lucide** | Icon libraries |
| **React Hook Form + Zod** | Form handling and validation |
| **FullCalendar** | Appointment calendar component |
| **Recharts** | Data visualization charts |
| **next-themes** | Dark/light mode support |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **Prisma ORM** | Database client and migrations |
| **Supabase** | Database hosting, file storage, Row Level Security |

### Authentication & Security
| Technology | Purpose |
|------------|---------|
| **Kinde Auth** | OAuth, session management, multi-tenant auth |
| **Upstash Redis** | Rate limiting and caching |
| **Zod** | Input validation and sanitization |
| **CSRF Protection** | Token-based state protection |

### Payments & Email
| Technology | Purpose |
|------------|---------|
| **Stripe** | Subscriptions, trials, payment processing |
| **Resend** | Transactional emails (confirmations, invitations) |
| **React Email** | Email template components |

### Content & Media
| Technology | Purpose |
|------------|---------|
| **Storyblok CMS** | Headless CMS for blog content |
| **Cloudinary** | Image optimization and storage |
| **jsPDF** | PDF generation for reports |
| **ExcelJS** | Excel export functionality |
| **QRCode.react** | QR code generation |

### PWA & Performance
| Technology | Purpose |
|------------|---------|
| **next-pwa** | Progressive Web App support |
| **SWR** | Data fetching with caching |
| **@vercel/og** | Open Graph image generation |

### Testing
| Technology | Purpose |
|------------|---------|
| **Jest** | Unit and integration testing |
| **React Testing Library** | Component testing |
| **Playwright** | End-to-end testing |
| **MSW** | API mocking |

### Monitoring & DevOps
| Technology | Purpose |
|------------|---------|
| **Sentry** | Error tracking and performance monitoring |
| **Husky** | Git hooks for code quality |
| **lint-staged** | Pre-commit linting |
| **ESLint** | Code linting |

## 🛠️ Development

### Prerequisites
- Node.js >= 20.0.0
- pnpm 9.15.9
- PostgreSQL database
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)
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

The project includes comprehensive test coverage across all layers:

### Test Suites
| Type | Description | Command |
|------|-------------|---------|
| **Unit Tests** | Components, utilities, validation, business logic | `pnpm test:unit` |
| **Integration Tests** | API routes, database operations, server actions | `pnpm test:integration` |
| **E2E Tests** | User flows, navigation, responsive design | `pnpm test:e2e` |
| **Security Tests** | Input validation, rate limiting, auth flows | `pnpm test:security` |
| **Component Tests** | UI components in isolation | `pnpm test:components` |

### Coverage Highlights
- **Blog Feature**: 234 unit/integration tests + 80+ E2E test cases
  - Component tests: TableOfContents, RichTextRenderer, RelatedPosts, FAQSection
  - Page tests: Article, listing, category, author, tag pages
  - E2E tests: Navigation, SEO, responsive design, filtering
- **Dashboard**: Appointments, customers, inventory, pets, sales, settings
- **Subscription**: Feature gates, plan flows, upgrade/downgrade paths
- **Public Pages**: Landing analytics, team page, testimonials

### Running Tests
```bash
pnpm test                 # Run all unit tests
pnpm test:coverage        # Generate coverage report
pnpm test:e2e             # Run Playwright E2E tests
pnpm test:e2e:ui          # Run E2E with interactive UI
pnpm test:critical        # Run critical tests before deploy
pnpm test:all             # Run unit + integration + E2E
```

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
