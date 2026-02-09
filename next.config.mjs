/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'grub-dash-api.vercel.app',
      }
    ],
  },

  /**
   * API Proxy Configuration for iOS Safari Cookie Fix
   * 
   * Problem: iOS Safari blocks third-party cookies, causing auth cookies
   * from https://grub-dash-api.vercel.app to be dropped when accessed
   * from https://grub-dash-frontend-xi.vercel.app
   * 
   * Solution: Proxy all API requests through the frontend domain using
   * Next.js rewrites. This makes cookies first-party (same domain).
   * 
   * How it works:
   * 1. Frontend makes request to: /api/user/auth/profile
   * 2. Next.js rewrites to: https://grub-dash-api.vercel.app/api/user/auth/profile
   * 3. Backend sets cookie with domain: grub-dash-frontend-xi.vercel.app
   * 4. iOS Safari accepts cookie (same domain = first-party)
   * 
   * Benefits:
   * ✅ Works on iOS Safari
   * ✅ Works on iOS PWAs
   * ✅ No CORS issues
   * ✅ No backend changes needed
   * ✅ credentials: "include" works correctly
   * 
   * Route Namespacing:
   * ✅ /api/user/*     → User endpoints
   * ✅ /api/vendors/*  → Vendor endpoints
   * ✅ /api/admin/*    → Admin endpoints
   */
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://grub-dash-api.vercel.app';

    // ✅ Only log in development (reduce console noise in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Next.js Proxy] Backend URL:', backendUrl);
      console.log('[Next.js Proxy] All /api/* requests will be proxied');
    }

    return [
      {
        // Proxy all /api/* requests to the backend
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  /**
   * Headers Configuration
   * 
   * These headers ensure proper cookie handling and security:
   * - Access-Control-Allow-Credentials: Required for cookies
   * - Access-Control-Allow-Origin: Frontend domain only
   * - Access-Control-Allow-Methods: All HTTP methods
   * - Access-Control-Allow-Headers: Common headers
   */
  async headers() {
    return [
      {
        // Apply headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },

  // ✅ FIX: Suppress source map warnings in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use faster source maps in development (reduces warnings)
      config.devtool = 'eval-cheap-source-map';
    }
    return config;
  },

  // ✅ FIX: Optimize Turbopack configuration
  experimental: {
    // Suppress Turbopack source map warnings
    turbo: {
      rules: {
        '*.js': {
          loaders: ['source-map-loader'],
          options: {
            filterSourceMappingUrl: () => false,
          },
        },
      },
    },
  },

  // ✅ Optional: Environment variable validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
  },
};

export default nextConfig;
