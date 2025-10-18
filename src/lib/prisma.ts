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
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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