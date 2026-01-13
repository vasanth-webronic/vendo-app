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
});

// Get repository name from environment or default to empty (root)
const repositoryName = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // Enable static export for GitHub Pages
  basePath: repositoryName, // Set base path if deploying to subdirectory
  assetPrefix: repositoryName, // Set asset prefix for static assets
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // GitHub Pages works better with trailing slashes
};

module.exports = withPWA(nextConfig);
