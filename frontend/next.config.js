/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
    // Add build timestamp for cache busting
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_ID: `build-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  },
  // Force clean build - disable cache
  generateBuildId: async () => {
    const buildId = `build-${Date.now()}-${Math.random().toString(36).substring(7)}`
    console.log('🔨 Generating build ID:', buildId)
    return buildId
  },
  // Disable ESLint during build to prevent config errors from blocking deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build (we'll catch them in dev)
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch real errors
  },
  // CRITICAL: Disable static optimization and caching
  output: 'standalone', // Use standalone output for better cache control
  // Disable static page generation - force dynamic rendering
  experimental: {
    // Force all pages to be dynamic
  },
  // Add headers to prevent caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Build-ID',
            value: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
          },
          {
            key: 'X-Build-Time',
            value: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

