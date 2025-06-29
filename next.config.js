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
  // Configure external packages for serverless environment
  serverExternalPackages: ['@kinde-oss/kinde-auth-nextjs'],
  
  // Add transpilation for problematic ESM packages
  transpilePackages: ['jose'],
  
  // Configure allowed dev origins for local development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.4:3000', // Allow access from local network IP
    'http://0.0.0.0:3000'
  ],

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
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

export default nextConfig; 