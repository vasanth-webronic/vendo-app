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

// Check if we're doing static export (ensure boolean)
const isStaticExport = Boolean(nextConfig.output === 'export' || process.env.NEXT_PUBLIC_BASE_PATH);

if (isStaticExport) {
  // Skip PWA for static export builds (GitHub Pages)
  console.log('ℹ️  Static export detected - PWA disabled to avoid build errors');
  console.log('ℹ️  PWA features (service worker, install prompt) will not be available');
  pwaConfig = nextConfig;
} else {
  // Full PWA configuration for non-static builds (Vercel, etc.)
  try {
    // Defensive require and validation of exported value
    const pwaModule = require('next-pwa');
    if (typeof pwaModule !== 'function') {
      throw new Error('next-pwa did not export a function');
    }

    const withPWA = pwaModule({
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

    // Guard in case withPWA is not a function
    if (typeof withPWA !== 'function') {
      throw new Error('next-pwa initialization did not return a function');
    }

    pwaConfig = withPWA(nextConfig);
  } catch (rawError) {
    // Safely convert any thrown value to string without throwing again
    let errorMessage;
    try {
      if (rawError && typeof rawError === 'object') {
        if ('message' in rawError && rawError.message != null) {
          errorMessage = String(rawError.message);
        } else {
          // Try JSON stringify as a fallback
          try {
            errorMessage = JSON.stringify(rawError);
          } catch {
            errorMessage = String(rawError);
          }
        }
      } else {
        errorMessage = String(rawError);
      }
    } catch (e) {
      // Ultimate fallback
      errorMessage = String(e);
    }

    console.warn('⚠️  PWA configuration failed, continuing without PWA:', errorMessage);
    // Continue without PWA if configuration fails
    pwaConfig = nextConfig;
  }
}

module.exports = pwaConfig;