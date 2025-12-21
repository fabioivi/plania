const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Necessário para produção com Docker (standalone output)
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'), // Include monorepo root
  },
  // Habilitar hot reload no Docker (dev only)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig
