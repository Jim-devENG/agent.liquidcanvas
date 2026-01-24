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
}

module.exports = nextConfig

