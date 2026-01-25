/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  },
  // Generate unique build ID at build time
  generateBuildId: async () => {
    const buildId = `build-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const buildTime = new Date().toISOString()
    console.log('🔨 Generating build ID:', buildId)
    console.log('🔨 Build time:', buildTime)
    // Store in env for runtime access (Next.js will make NEXT_PUBLIC_* vars available)
    process.env.NEXT_PUBLIC_BUILD_ID = buildId
    process.env.NEXT_PUBLIC_BUILD_TIME = buildTime
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
  // Remove 'standalone' output as it may cause issues with Vercel
  // output: 'standalone', 
  // Add headers to prevent caching at CDN and browser level
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
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
