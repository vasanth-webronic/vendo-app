#!/bin/bash

# Test script for GitHub Pages build
# Usage: ./test-build.sh [repository-name]

REPO_NAME="${1:-vamo-store-main}"
echo "🧪 Testing GitHub Pages build for repository: $REPO_NAME"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Build with repository path
echo "🔨 Building with NEXT_PUBLIC_BASE_PATH=/$REPO_NAME..."
NEXT_PUBLIC_BASE_PATH="/$REPO_NAME" npm run build

# Check if build succeeded
if [ -d "out" ]; then
  echo ""
  echo "✅ Build successful!"
  echo ""
  echo "📦 Build output:"
  ls -la out/ | head -10
  echo ""
  echo "🚀 To test locally, run:"
  echo "   npx serve out"
  echo ""
  echo "🌐 Then visit:"
  echo "   http://localhost:3000/$REPO_NAME/"
  echo ""
else
  echo ""
  echo "❌ Build failed! Check errors above."
  exit 1
fi
