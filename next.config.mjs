/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ TARGETED FIX: Very specific remotePatterns for exact hostname match
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zjappsarpwtbdvgdrwhc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/project-assets/**',
      },
      {
        protocol: 'https',
        hostname: 'zjappsarpwtbdvgdrwhc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // ✅ OPTIMIZED: Enable compiler optimizations (swcMinify is automatic in Next.js 15)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
  },
  // ✅ OPTIMIZED: Performance headers
  async headers() {
    return [
      {
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
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300', // API caching
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Static assets cache for 1 year
          },
        ],
      },
    ]
  },
}

export default nextConfig