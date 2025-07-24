# 🛠️ Troubleshooting

## Common Issues

Esta sección contiene soluciones para los problemas más frecuentes que puedes encontrar al desarrollar o desplegar Vetify.

### Database Issues

#### Connection Problems
```typescript
// Error: Can't connect to database
// Solution: Check DATABASE_URL and DIRECT_URL
const connection = await prisma.$queryRaw`SELECT 1`;
```

**Soluciones:**
1. Verificar variables de entorno
2. Comprobar conectividad de red
3. Validar credenciales de Supabase
4. Reiniciar conexión de Prisma

#### Migration Errors
```bash
# Error: Migration failed
pnpm prisma migrate reset  # ⚠️ Solo en desarrollo
pnpm prisma generate      # Regenerar cliente
pnpm prisma db push       # Forzar cambios de schema
```

### Authentication Issues

#### Kinde Configuration
```typescript
// Error: Authentication callback failed
// Check these environment variables:
KINDE_CLIENT_ID
KINDE_CLIENT_SECRET  
KINDE_ISSUER_URL
KINDE_SITE_URL
KINDE_POST_LOGOUT_REDIRECT_URL
KINDE_POST_LOGIN_REDIRECT_URL
```

**Pasos de diagnóstico:**
1. Verificar configuración en Kinde dashboard
2. Comprobar URLs de callback
3. Validar variables de entorno
4. Revisar logs de autenticación

### Next.js Build Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
rm -rf .vercel

# Reinstall dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
pnpm prisma generate
```

#### TypeScript Errors
```bash
# Type check
pnpm type-check

# Common fixes
pnpm prisma generate    # Regenerate types
npm update @types/node  # Update Node types
```

### API Issues

#### CORS Errors
```typescript
// middleware.ts - Add CORS headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
  return response;
}
```

#### Rate Limiting
```typescript
// Error: Too many requests
// Implement rate limiting
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

### Deployment Issues

#### Vercel Build Errors
```bash
# Environment variables missing
# Add to Vercel dashboard or use CLI
vercel env add [name]

# Build command issues
# Check package.json scripts
"build": "prisma generate && next build"
```

#### Database Connection in Production
```typescript
// Connection pooling issues
// Check DATABASE_URL format:
// postgresql://user:pass@host:port/db?pgbouncer=true&connection_limit=1
```

### Performance Issues

#### Slow Database Queries
```typescript
// Add database indexes
// Example: Add index for frequently queried fields
model Pet {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  ownerId   String
  
  @@index([ownerId])  // Add index for foreign key
  @@index([name])     // Add index for search
}
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Optimize bundle size
pnpm analyze  # Analyze bundle
```

### Integration Issues

#### Stripe Webhook Issues
```typescript
// Verify webhook signature
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // Process event...
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }
}
```

## Debugging Tools

### Development Tools
```bash
# Database inspection
pnpm prisma studio

# API testing
curl -X GET http://localhost:3000/api/health

# Log debugging
console.log('Debug info:', { variable });
```

### Production Debugging
```typescript
// Structured logging
import { Logger } from '@/lib/logger';

const logger = new Logger('UserService');

logger.info('User created', { userId, email });
logger.error('Database error', { error: error.message });
```

### Performance Debugging
```typescript
// Performance monitoring
import { performance } from 'perf_hooks';

const start = performance.now();
// ... operation
const end = performance.now();
console.log(`Operation took ${end - start} milliseconds`);
```

## Getting Help

### Internal Resources
1. **Documentation**: Esta documentación GitBook
2. **Code Comments**: Inline documentation en el código
3. **Git History**: Revisar commits para context
4. **Tests**: Casos de test como ejemplos

### External Resources
1. **Next.js Docs**: https://nextjs.org/docs
2. **Prisma Docs**: https://www.prisma.io/docs
3. **Vercel Support**: https://vercel.com/support
4. **Kinde Docs**: https://kinde.com/docs

### Emergency Contacts
- **Technical Lead**: [Email/Slack]
- **DevOps**: [Email/Slack]  
- **Database Admin**: [Email/Slack]

## Error Reporting

### Bug Report Template
```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox]
- Node.js: [version]
- Branch: [git branch]

## Additional Context
[Screenshots, logs, etc.]
```

### Critical Issues
Para problemas críticos que afecten producción:

1. **Immediate**: Rollback si es posible
2. **Investigate**: Revisar logs y métricas
3. **Communicate**: Notificar al equipo
4. **Document**: Crear issue detallado
5. **Post-mortem**: Analizar causa raíz
