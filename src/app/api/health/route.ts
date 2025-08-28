import { NextRequest } from 'next/server';
import { createSecureResponse } from '@/lib/security/input-sanitization';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

/**
 * Health check endpoint for monitoring system status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health indicators
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      checks: {
        database: { status: 'unknown', responseTime: 0 },
        redis: { status: 'unknown', responseTime: 0 },
        memory: { status: 'unknown', usage: 0 },
      },
    };

    // Database health check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
      };
      health.status = 'degraded';
      
      Sentry.captureException(error, {
        tags: { component: 'health_check', check: 'database' },
      });
    }

    // Redis health check (for rate limiting)
    const redisStart = Date.now();
    try {
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
        
        if (response.ok) {
          health.checks.redis = {
            status: 'healthy',
            responseTime: Date.now() - redisStart,
          };
        } else {
          throw new Error(`Redis ping failed: ${response.status}`);
        }
      } else {
        health.checks.redis = {
          status: 'not_configured',
          responseTime: 0,
        };
      }
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStart,
      };
      health.status = 'degraded';
      
      Sentry.captureException(error, {
        tags: { component: 'health_check', check: 'redis' },
      });
    }

    // Memory health check
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memoryLimitMB = 512; // Typical Vercel limit
      
      health.checks.memory = {
        status: memoryUsageMB > memoryLimitMB * 0.9 ? 'warning' : 'healthy',
        usage: memoryUsageMB,
      };
      
      if (memoryUsageMB > memoryLimitMB * 0.95) {
        health.status = 'degraded';
        
        Sentry.withScope((scope) => {
          scope.setLevel('warning');
          scope.setTag('component', 'health_check');
          scope.setTag('check', 'memory');
          scope.setExtra('memoryUsageMB', memoryUsageMB);
          scope.setExtra('memoryLimitMB', memoryLimitMB);
          Sentry.captureMessage('High memory usage detected');
        });
      }
    }

    // Overall health status
    const responseTime = Date.now() - startTime;
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 207 : 503;

    // Log performance metrics
    if (responseTime > 5000) {
      Sentry.withScope((scope) => {
        scope.setLevel('warning');
        scope.setTag('component', 'health_check');
        scope.setExtra('responseTime', responseTime);
        Sentry.captureMessage('Slow health check response');
      });
    }

    return createSecureResponse(
      {
        ...health,
        responseTime,
      },
      statusCode,
      {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    );

  } catch (error) {
    console.error('Health check failed:', error);
    
    Sentry.captureException(error, {
      tags: { component: 'health_check', severity: 'critical' },
    });

    return createSecureResponse(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Health check failed',
        responseTime: Date.now() - startTime,
      },
      503
    );
  }
}

/**
 * Detailed health check endpoint (requires authentication)
 */
export async function POST(request: NextRequest) {
  // This could be used for authenticated detailed health checks
  // For now, redirect to the basic health check
  return GET(request);
}
