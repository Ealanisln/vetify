# 🚀 Development Guide

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.17 or higher
- **pnpm**: 8.x (recommended package manager)
- **PostgreSQL**: 14+ (or use Supabase)
- **Git**: Latest version

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ealanisln/vetify.git
   cd vetify
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment configuration**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Configure for your environment
   pnpm env:localhost  # For local development
   pnpm env:development # For development server
   ```

4. **Database setup**
   ```bash
   # Run database migrations
   pnpm prisma migrate dev
   
   # Seed initial data (optional)
   pnpm db:seed:production
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

### Development Scripts

#### Environment Management
```bash
pnpm env:show          # Show current environment config
pnpm env:localhost     # Configure for localhost:3000
pnpm env:development   # Configure for development.vetify.pro
pnpm env:help          # Show all environment options
```

#### Database Operations
```bash
pnpm prisma studio     # Database GUI
pnpm prisma migrate dev # Apply migrations
pnpm prisma generate   # Generate Prisma client
pnpm db:seed:production # Seed database
```

#### Testing & Quality
```bash
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript checks
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
```

#### Production Operations
```bash
pnpm mvp:setup        # Complete production setup
pnpm mvp:checklist    # Launch readiness check
pnpm health:check     # System health verification
pnpm build:production # Production build
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (dashboard)/    # Dashboard routes (protected)
│   ├── (auth)/         # Authentication routes
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components (shadcn)
│   ├── forms/         # Form components
│   └── layout/        # Layout components
├── lib/               # Utility libraries
│   ├── auth.ts        # Authentication config
│   ├── db.ts          # Database connection
│   ├── utils.ts       # General utilities
│   └── validations/   # Zod schemas
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality
- **Prettier**: Automatic formatting
- **Naming**: camelCase for variables, PascalCase for components

### Component Patterns

```typescript
// Component structure
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ 
  // Destructured props
}) => {
  // Hooks at the top
  // Event handlers
  // Render logic
  
  return (
    // JSX
  );
};
```

### API Development

```typescript
// API route structure
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    
    // Business logic
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Database Patterns

```typescript
// Service layer pattern
export class UserService {
  static async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        clinics: true,
      },
    });
  }
}
```

## Testing Strategy

### Unit Tests
- **Framework**: Jest + Testing Library
- **Coverage**: Aim for 80%+ coverage
- **Focus**: Utils, hooks, services

### Integration Tests
- **Database**: Test with real database
- **API**: Test complete request/response cycle
- **Authentication**: Test protected routes

### E2E Tests
- **Framework**: Playwright
- **Scenarios**: Critical user journeys
- **Environments**: Staging environment

## Debugging

### Development Tools
- **React DevTools**: Component inspection
- **Prisma Studio**: Database GUI
- **Vercel Analytics**: Performance monitoring
- **Browser DevTools**: Network, performance, etc.

### Common Issues
- Check environment variables
- Verify database connection
- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma client: `pnpm prisma generate`

## Contributing

1. Create feature branch from `main`
2. Follow TypeScript best practices
3. Add tests for new features
4. Update documentation
5. Submit pull request

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```
