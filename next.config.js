/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  },
  // Force rebuild - disable caching
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random()}`
  },
}

module.exports = nextConfig

