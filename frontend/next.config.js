/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  },
  // Force clean build - disable cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Disable ESLint during build to prevent config errors from blocking deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build (we'll catch them in dev)
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch real errors
  },
}

module.exports = nextConfig

