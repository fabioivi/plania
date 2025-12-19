/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Necessário para produção com Docker (standalone output)
  output: 'standalone',
  // Habilitar hot reload no Docker (dev only)
  if(!isServer && process.env.WATCHPACK_POLLING === 'true') {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
  }
return config
}

module.exports = nextConfig
