/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  },
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig

