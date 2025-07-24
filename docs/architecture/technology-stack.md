# 🛠️ Technology Stack

> **Complete overview of the technologies and tools used in the Vetify platform.**

## Frontend Technologies

### Core Framework
- **Next.js 14**: React framework with App Router for server-side rendering and static generation
- **React 18**: UI library with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript for better development experience

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Shadcn UI**: High-quality component library built on Radix UI
- **Lucide React**: Beautiful and consistent icon library
- **Framer Motion**: Animation library for smooth interactions

### State Management
- **React Context**: Built-in state management for global app state
- **React Query**: Data fetching and caching library
- **Zustand**: Lightweight state management for complex state

## Backend Technologies

### API Layer
- **Next.js API Routes**: Server-side API endpoints with built-in routing
- **Prisma ORM**: Type-safe database client and migration tool
- **Zod**: Schema validation for runtime type checking
- **tRPC**: End-to-end typesafe APIs

### Authentication & Security
- **Kinde Auth**: OAuth 2.0 authentication provider
- **NextAuth.js**: Authentication framework for Next.js
- **bcrypt**: Password hashing and verification
- **JWT**: JSON Web Tokens for session management

### Database & Storage
- **PostgreSQL**: Primary relational database (Neon)
- **Redis**: In-memory data store for caching
- **Supabase Storage**: File storage and CDN
- **Prisma Migrate**: Database schema migrations

## External Services

### Payment Processing
- **Stripe**: Payment gateway and subscription management
- **Stripe Webhooks**: Real-time payment event notifications

### Communication
- **WhatsApp Business API**: Messaging and notifications
- **N8N**: Workflow automation and integrations
- **Resend**: Email delivery service

### Infrastructure
- **Vercel**: Hosting and deployment platform
- **Neon**: Serverless PostgreSQL database
- **Cloudflare**: CDN and DNS management

## Development Tools

### Package Management
- **pnpm**: Fast, disk space efficient package manager
- **npm**: Node.js package manager (fallback)

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files

### Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing
- **MSW**: API mocking for tests

### Development Environment
- **VS Code**: Primary code editor
- **Git**: Version control
- **GitHub**: Code hosting and CI/CD
- **Docker**: Containerization for development

## Performance & Monitoring

### Analytics
- **Vercel Analytics**: Web vitals and performance monitoring
- **Google Analytics**: User behavior tracking
- **Sentry**: Error tracking and monitoring

### Optimization
- **Next.js Image**: Automatic image optimization
- **Next.js Font**: Font optimization and loading
- **React Suspense**: Code splitting and lazy loading
- **Service Workers**: Offline functionality

## Security Tools

### Code Security
- **Snyk**: Vulnerability scanning
- **GitHub Security**: Automated security scanning
- **npm audit**: Package vulnerability checks

### Infrastructure Security
- **Vercel Edge Functions**: Serverless functions with security
- **Supabase RLS**: Row-level security for database
- **CORS**: Cross-origin resource sharing protection

## Version Requirements

### Node.js
- **Minimum**: 18.17.0
- **Recommended**: 20.x LTS
- **Package Manager**: pnpm 8.x

### Database
- **PostgreSQL**: 14.0 or higher
- **Redis**: 6.0 or higher (optional)

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Architecture Decisions

### Why Next.js 14?
- **App Router**: Modern routing with server components
- **Server Components**: Better performance and SEO
- **Built-in API Routes**: Simplified backend development
- **Vercel Integration**: Seamless deployment

### Why Prisma?
- **Type Safety**: End-to-end type safety from database to frontend
- **Migrations**: Version-controlled database schema changes
- **Query Builder**: Intuitive and powerful query interface
- **Multi-database Support**: Easy switching between databases

### Why Tailwind CSS?
- **Utility-First**: Rapid UI development
- **Customizable**: Easy theme customization
- **Performance**: Small bundle size with PurgeCSS
- **Developer Experience**: Excellent IntelliSense support

### Why Kinde Auth?
- **OAuth 2.0**: Industry-standard authentication
- **Multi-tenant**: Built-in support for multiple organizations
- **Customizable**: White-label authentication
- **Security**: Enterprise-grade security features

## Migration Path

### From Previous Versions
- **Next.js 13**: Automatic migration with App Router
- **React 17**: Hooks-based components already compatible
- **TypeScript**: Gradual migration with strict mode

### Future Considerations
- **React Server Components**: Full adoption for better performance
- **Edge Runtime**: Serverless functions for global deployment
- **WebAssembly**: Performance-critical operations
- **GraphQL**: Alternative to REST APIs for complex queries

## Best Practices

### Code Organization
- **Feature-based Structure**: Organize by business features
- **Shared Components**: Reusable UI components
- **Type Definitions**: Centralized TypeScript types
- **API Layer**: Consistent API patterns

### Performance
- **Code Splitting**: Lazy load components and routes
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement proper caching strategies
- **Bundle Analysis**: Regular bundle size monitoring

### Security
- **Input Validation**: Validate all user inputs
- **Authentication**: Implement proper auth flows
- **Authorization**: Role-based access control
- **Data Encryption**: Encrypt sensitive data

### Testing
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Monitor application performance

## Troubleshooting

### Common Issues
- **TypeScript Errors**: Check type definitions and imports
- **Build Failures**: Verify Node.js version and dependencies
- **Database Connection**: Check connection strings and permissions
- **Authentication**: Verify OAuth configuration

### Performance Issues
- **Slow Loading**: Implement code splitting and lazy loading
- **Large Bundle**: Analyze and optimize bundle size
- **Database Queries**: Optimize Prisma queries and add indexes
- **API Response Time**: Implement caching and CDN

### Security Issues
- **Authentication Failures**: Check OAuth configuration
- **Data Leaks**: Verify row-level security policies
- **XSS Attacks**: Sanitize user inputs and use CSP headers
- **CSRF Attacks**: Implement proper CSRF protection

---

**Need help?** Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or [contact support](../../README.md#-support). 