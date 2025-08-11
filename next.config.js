/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["placeholder.svg", "images.unsplash.com"],
    unoptimized: true,
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Fix Leaflet bundling issues
  webpack: (config, { isServer }) => {
    // Handle Leaflet's server-side rendering issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Exclude Leaflet from server-side bundling
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('leaflet')
    }
    
    return config
  },
}

module.exports = nextConfig
