import { withSentryConfig } from '@sentry/nextjs';

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
  // Configure external packages for serverless environment
  serverExternalPackages: [
    // Exclude OpenTelemetry packages from being externalized to fix warnings
    '!import-in-the-middle',
    '!require-in-the-middle',
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'expo-secure-store': false,
      };
    }

    // Ignore warnings from Kinde packages and OpenTelemetry/Sentry
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
    ];
    return config;
  },

  // Add transpilation for ESM packages that need bundling
  transpilePackages: [
    'jose',
    '@kinde-oss/kinde-auth-nextjs',
    // Add OpenTelemetry and Sentry packages for proper bundling
    '@opentelemetry/instrumentation',
    '@sentry/nextjs',
    'import-in-the-middle',
    'require-in-the-middle',
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

    return headers;
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
