// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get the appropriate DATABASE_URL based on environment
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';

  // In development, optimize connection pool settings for hot reload
  if (process.env.NODE_ENV === 'development') {
    let url = baseUrl;

    // Remove existing connection_limit if present
    url = url.replace(/[&?]connection_limit=\d+/, '');

    // Ensure we have pool_timeout for development (prevents timeouts during hot reload)
    if (!url.includes('pool_timeout=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}pool_timeout=30`;
    }

    // Add appropriate connection limit for development (only if using pgbouncer)
    if (url.includes('pgbouncer=true')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}connection_limit=10`;
    }

    return url;
  }

  // In production, use the configured limit (usually 1 for serverless)
  return baseUrl;
}

// Optimized Prisma client for serverless environments (Vercel)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Enhanced logging for development: includes query logging for debugging
  // Production: only log errors to minimize performance impact
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

// Prevent hot reload issues in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

/**
 * Set the tenant ID for Row Level Security (RLS) policies
 * This must be called before any database queries to ensure proper multi-tenant isolation
 *
 * @param tenantId - The tenant ID to set for the current session
 */
export async function setRLSTenantId(tenantId: string): Promise<void> {
  try {
    await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true);`;
  } catch (error) {
    console.error('Failed to set RLS tenant ID:', error);
    throw error;
  }
}

/**
 * Clear the tenant ID from the current session
 * Should be called after completing database operations
 */
export async function clearRLSTenantId(): Promise<void> {
  try {
    await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', true);`;
  } catch (error) {
    console.error('Failed to clear RLS tenant ID:', error);
    // Don't throw - clearing is not critical
  }
}