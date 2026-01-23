/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable static export for Electron
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Configure base path for production
  basePath: process.env.NODE_ENV === 'production' ? '' : undefined,
}

module.exports = nextConfig
