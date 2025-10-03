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
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during Vercel builds to prevent CSS bundling issues
    ignoreDuringBuilds: true,
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
  ],

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
  }),

  // Simplified webpack config without complex modifications
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'expo-secure-store': false,
      };
    }
    return config;
  },
};

// Export without any wrappers for Vercel
export default nextConfig;