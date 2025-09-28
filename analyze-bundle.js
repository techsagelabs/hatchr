// ✅ BUNDLE ANALYZER: Run this to analyze your bundle size
// Usage: node analyze-bundle.js
// Then run: npm run build to see the analysis

const { execSync } = require('child_process')
const fs = require('fs')

// Create a temporary next.config.mjs with bundle analyzer
const nextConfig = `
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      '*.supabase.co',
      'via.placeholder.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    gzipSize: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
`

console.log('🔍 Setting up bundle analyzer...')

// Create backup of original config
if (fs.existsSync('next.config.mjs')) {
  fs.copyFileSync('next.config.mjs', 'next.config.mjs.backup')
  console.log('✅ Backed up original next.config.mjs')
}

// Write new config with analyzer
fs.writeFileSync('next.config.mjs.analyze', nextConfig)
console.log('✅ Created analyzer config')

console.log('\n📊 To analyze your bundle:')
console.log('1. npm install @next/bundle-analyzer')
console.log('2. cp next.config.mjs.analyze next.config.mjs')  
console.log('3. ANALYZE=true npm run build')
console.log('4. cp next.config.mjs.backup next.config.mjs') 
console.log('\nBundle analysis will open in your browser automatically!')

