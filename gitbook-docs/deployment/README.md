# 🚀 Deployment & Operations

## Deployment Overview

Vetify utiliza Vercel como plataforma principal de deployment, aprovechando su integración nativa con Next.js y su red global de CDN.

### Deployment Strategy

- **Production**: `main` branch → production.vetify.pro
- **Staging**: `development` branch → development.vetify.pro  
- **Preview**: Feature branches → preview URLs
- **Database**: Supabase PostgreSQL con backups automáticos

### Environment Configuration

#### Production Environment
- **Domain**: `https://vetify.pro`
- **Database**: Production PostgreSQL (Supabase)
- **Authentication**: Kinde Production
- **Storage**: AWS S3 Production bucket
- **Analytics**: Vercel Analytics enabled

#### Staging Environment  
- **Domain**: `https://development.vetify.pro`
- **Database**: Development PostgreSQL (Supabase)
- **Authentication**: Kinde Development
- **Storage**: AWS S3 Development bucket
- **Analytics**: Limited analytics

## Deployment Process

### Automated Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main  # For production
   git push origin development  # For staging
   ```

2. **Vercel Auto-deploys**
   - Builds automatically on push
   - Runs pre-deployment checks
   - Deploys to appropriate environment

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Pre-Deployment Checklist

Use the automated checklist to ensure deployment readiness:

```bash
# Run complete deployment checklist
pnpm mvp:checklist

# Health check
pnpm health:check

# Verify Stripe integration
pnpm stripe:verify

# Test trial flow
pnpm trial:test
```

### Manual Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Stripe products synchronized
- [ ] Authentication providers configured
- [ ] DNS records updated
- [ ] SSL certificates valid
- [ ] Performance tests passed
- [ ] Security audit completed

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication (Kinde)
KINDE_CLIENT_ID="..."
KINDE_CLIENT_SECRET="..."
KINDE_ISSUER_URL="..."
KINDE_SITE_URL="..."
KINDE_POST_LOGOUT_REDIRECT_URL="..."
KINDE_POST_LOGIN_REDIRECT_URL="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."
```

### Configuration Scripts

```bash
# Show current environment
pnpm env:show

# Export to Vercel
pnpm vercel:env:prod    # For production
pnpm vercel:env:dev     # For development
```

## Performance Optimization

### Build Optimization
- **Bundle Analysis**: `pnpm analyze`
- **Image Optimization**: Next.js automatic optimization
- **Code Splitting**: Route-based automatic splitting
- **Tree Shaking**: Unused code elimination

### Runtime Optimization
- **Edge Functions**: For authentication and redirects
- **Static Generation**: For marketing pages
- **CDN Caching**: Vercel Edge Network
- **Database Connection Pooling**: Prisma connection pooling

## Monitoring & Alerting

### Built-in Monitoring
- **Vercel Analytics**: Performance and usage metrics
- **Vercel Logs**: Real-time application logs
- **Database Monitoring**: Supabase dashboard
- **Uptime Monitoring**: Vercel uptime checks

### Custom Monitoring
```typescript
// Health check endpoint
export async function GET() {
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    
    // External services health
    // ... additional checks
    
    return Response.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
```

## Backup & Recovery

### Database Backups
- **Automatic**: Daily backups via Supabase
- **Point-in-time Recovery**: Available for last 7 days
- **Manual Backup**: Export via Supabase dashboard

### Code Backups
- **Git Repository**: Primary source control
- **GitHub**: Remote repository with history
- **Local Copies**: Team member local repositories

### Disaster Recovery
1. **Database**: Restore from Supabase backup
2. **Application**: Redeploy from Git
3. **DNS**: Update records if needed
4. **SSL**: Regenerate certificates if required

## Security Considerations

### Deployment Security
- **Environment Variables**: Never commit secrets
- **HTTPS Only**: Enforce SSL/TLS
- **CORS**: Properly configured origins
- **CSP**: Content Security Policy headers

### Production Hardening
```typescript
// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous deployment
vercel rollback [deployment-url]

# Or via Vercel dashboard
# Navigate to deployments → Select previous → Promote
```

### Database Rollback
1. **Stop Application**: Prevent new writes
2. **Restore Database**: From backup point
3. **Update Application**: Deploy compatible version
4. **Verify**: Test critical functionality

## Scaling Considerations

### Automatic Scaling
- **Vercel Functions**: Auto-scale based on load
- **Database**: Connection pooling handles concurrency
- **CDN**: Global edge network scales automatically

### Manual Scaling
- **Database**: Upgrade Supabase plan
- **Storage**: Increase S3 limits
- **Functions**: Upgrade Vercel plan
- **Monitoring**: Enhanced monitoring plans
