/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Module alias for FixedImage wrapper
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/image': require.resolve('./components/FixedImage.tsx'),
    }

    // Suppress Supabase getSession warnings
    if (isServer) {
      const originalWarn = console.warn
      console.warn = (...args) => {
        const message = args[0]?.toString() || ''
        if (message.includes('getSession') || message.includes('onAuthStateChange') || message.includes('could be insecure')) {
          return // Suppress these warnings
        }
        originalWarn(...args)
      }
    }

    // Ignore mobile directory in file watching
    if (config.watchOptions) {
      config.watchOptions.ignored = [
        ...(Array.isArray(config.watchOptions.ignored) ? config.watchOptions.ignored : [config.watchOptions.ignored]),
        '**/mobile/**',
      ].filter(Boolean)
    } else {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/mobile/**'],
      }
    }
    
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // adjust to your trusted image hosts
      },
    ],
  },
  turbopack: {}, // ensures Next.js knows Turbopack is explicitly disabled
}

module.exports = nextConfig

