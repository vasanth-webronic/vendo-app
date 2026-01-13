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
let pwaConfig = nextConfig;
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
    // Add error handling for next-pwa
    buildExcludes: [/middleware-manifest\.json$/],
    // Remove fallbacks for static export - they cause issues
  });
  pwaConfig = withPWA(nextConfig);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn('⚠️  PWA configuration failed, continuing without PWA:', errorMessage);
  // Continue without PWA if configuration fails
}

module.exports = pwaConfig;
