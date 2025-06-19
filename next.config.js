/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  typescript: {
    // Only run type checking in development
    ignoreBuildErrors: false,
  },
  // Suppress warnings for missing optional dependencies (Next.js 15+)
  serverExternalPackages: ['@kinde-oss/kinde-auth-nextjs'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'expo-secure-store': false,
      };
    }
    // Ignore warnings from Kinde packages
    config.ignoreWarnings = [
      {
        module: /node_modules\/@kinde/,
      },
      {
        message: /Can't resolve 'expo-secure-store'/,
      },
    ];
    return config;
  },
};

export default nextConfig; 