import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Instrumentation is now enabled by default in Next.js 15+
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  typescript: {
    // Skip TypeScript errors only on Vercel to avoid tsconfig.json issues
    ignoreBuildErrors: process.env.VERCEL ? true : false,
  },
  // Experimental features for better module resolution in Vercel
  experimental: {
    externalDir: true,
    ...(process.env.VERCEL && { typedRoutes: false })
  },
  
  // Output file tracing for better Vercel deployment
  outputFileTracingIncludes: {
    '/': ['./src/**/*']
  },
  // Configure external packages for serverless environment
  serverExternalPackages: [
    // Exclude OpenTelemetry packages from being externalized to fix warnings
    '!import-in-the-middle',
    '!require-in-the-middle',
  ],

  // Add transpilation for ESM packages that need bundling
  transpilePackages: [
    'jose', 
    '@kinde-oss/kinde-auth-nextjs',
    // Add OpenTelemetry and Sentry packages for proper bundling
    '@opentelemetry/instrumentation',
    '@sentry/nextjs',
    'import-in-the-middle',
    'require-in-the-middle',
    // Add path alias packages for transpilation
    '@/components',
    '@/lib',
    '@/utils'
  ],
  
  // Configure allowed dev origins for local development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.4:3000', // Allow access from local network IP
    'http://0.0.0.0:3000'
  ],

  // Production security headers
  async headers() {
    const headers = [];
    
    // Security headers for all routes
    headers.push({
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: process.env.NODE_ENV === 'production' 
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://m.stripe.network; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.stripe.com https://*.upstash.io https://api.whatsapp.com wss://*.upstash.io https://*.sentry.io https://*.ingest.sentry.io; frame-src https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
            : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://m.stripe.network http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob: http://localhost:*; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.stripe.com https://*.upstash.io https://api.whatsapp.com wss://*.upstash.io https://*.sentry.io https://*.ingest.sentry.io http://localhost:* ws://localhost:*; frame-src https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        },
      ],
    });

    // Specific headers for API routes
    headers.push({
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    });

    // CSS optimization headers for Vercel
    headers.push({
      source: '/_next/static/css/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Content-Type',
          value: 'text/css; charset=utf-8',
        },
      ],
    });

    return headers;
  },

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'expo-secure-store': false,
      };
    }
    
    // Disable symlinks for better Vercel compatibility
    config.resolve.symlinks = false;
    
    // Force absolute path resolution
    const srcPath = path.resolve(__dirname, './src');
    
    // Add explicit alias resolution for TypeScript paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
      '@/components': path.join(srcPath, 'components'),
      '@/lib': path.join(srcPath, 'lib'),
      '@/types': path.join(srcPath, 'types'),
      '@/utils': path.join(srcPath, 'utils'),
      '@/hooks': path.join(srcPath, 'hooks'),
    };
    
    // Ensure proper module resolution with absolute paths
    config.resolve.modules = [
      srcPath,
      path.resolve(__dirname, './node_modules'),
      'node_modules'
    ];
    
    // Preserve existing extensions (don't override them)
    config.resolve.extensions = [
      '.tsx', '.ts', '.jsx', '.js', '.json', '.mjs',
      ...config.resolve.extensions
    ];
    
    // Add debug logging in non-production
    if (dev || process.env.NODE_ENV !== 'production') {
      console.log('Webpack aliases:', config.resolve.alias);
      console.log('Webpack modules:', config.resolve.modules);
      console.log('Source path:', srcPath);
    }
    
    // Ignore warnings from instrumentation conflicts - enhanced for Next.js 15
    config.ignoreWarnings = [
      {
        module: /node_modules\/@kinde/,
      },
      {
        message: /Can't resolve 'expo-secure-store'/,
      },
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        message: /import-in-the-middle can't be external/,
      },
      {
        message: /require-in-the-middle can't be external/,
      },
      {
        module: /node_modules\/@opentelemetry/,
      },
      {
        module: /node_modules\/@sentry/,
      },
      {
        module: /node_modules\/@prisma\/instrumentation/,
      },
      {
        message: /Critical dependency.*@prisma\/instrumentation/,
      },
      {
        message: /Critical dependency.*@opentelemetry\/instrumentation/,
      },
    ];
    return config;
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
  }),
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: process.env.NODE_ENV === 'production',
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

// Export with Sentry wrapper
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
