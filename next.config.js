// Get repository name from environment or default to empty (root)
const repositoryName = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for GitHub Pages
  basePath: repositoryName, // Set base path if deploying to subdirectory
  assetPrefix: repositoryName, // Set asset prefix for static assets
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // GitHub Pages works better with trailing slashes
};

// Wrap PWA configuration in try-catch to handle errors gracefully
// Note: next-pwa has compatibility issues with Next.js 15 static export
// For GitHub Pages (static export), we'll skip PWA to avoid build errors
let pwaConfig = nextConfig;

// Check if we're doing static export
const isStaticExport = nextConfig.output === 'export' || process.env.NEXT_PUBLIC_BASE_PATH;

if (isStaticExport) {
  // Skip PWA for static export builds (GitHub Pages)
  // next-pwa v5.6.0 throws non-Error instances with Next.js 15 static export
  console.log('ℹ️  Static export detected - PWA disabled to avoid build errors');
  console.log('ℹ️  PWA features (service worker, install prompt) will not be available');
  // Use base config without PWA
  pwaConfig = nextConfig;
} else {
  // Full PWA configuration for non-static builds (Vercel, etc.)
  try {
    const withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'offlineCache',
            expiration: {
              maxEntries: 200,
            },
          },
        },
      ],
      buildExcludes: [/middleware-manifest\.json$/],
    });
    
    pwaConfig = withPWA(nextConfig);
  } catch (error) {
    // Ensure error is always an Error instance
    const errorMessage = error instanceof Error 
      ? error.message 
      : error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : String(error);
    
    console.warn('⚠️  PWA configuration failed, continuing without PWA:', errorMessage);
    // Continue without PWA if configuration fails
    pwaConfig = nextConfig;
  }
}

module.exports = pwaConfig;
