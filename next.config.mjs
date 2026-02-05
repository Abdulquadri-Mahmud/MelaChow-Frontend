/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
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
   */
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend
        source: '/api/:path*',
        destination: 'https://grub-dash-api.vercel.app/api/:path*',
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
            value: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://grub-dash-frontend-xi.vercel.app',
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
};

export default nextConfig;
