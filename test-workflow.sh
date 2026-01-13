#!/bin/bash

# Test script that mimics GitHub Actions workflow
# Simulates the exact build process from .github/workflows/nextjs.yml

set -e  # Exit on error

echo "🚀 Testing GitHub Actions Workflow Locally"
echo "=========================================="
echo ""

# Get repository name (default to vamo-store-main)
REPO_NAME="${1:-vamo-store-main}"
echo "📦 Repository: $REPO_NAME"
echo ""

# Step 1: Checkout (simulated - we're already in the repo)
echo "✅ Step 1: Checkout (already in repository)"
echo ""

# Step 2: Detect package manager (from workflow)
echo "🔍 Step 2: Detecting package manager..."
if [ -f "yarn.lock" ]; then
  MANAGER="yarn"
  COMMAND="install"
  RUNNER="yarn"
elif [ -f "package.json" ]; then
  MANAGER="npm"
  COMMAND="ci"
  RUNNER="npx --no-install"
else
  echo "❌ Error: Unable to determine package manager"
  exit 1
fi
echo "   Detected: $MANAGER"
echo ""

# Step 3: Setup Node (simulated - using system Node)
echo "✅ Step 3: Setup Node.js"
NODE_VERSION=$(node --version)
echo "   Using: $NODE_VERSION"
echo ""

# Step 4: Setup Pages (simulated)
echo "✅ Step 4: Setup Pages (configure-pages action simulated)"
echo "   This would configure basePath automatically"
echo ""

# Step 5: Restore cache (simulated - skip for local test)
echo "ℹ️  Step 5: Restore cache (skipped for local test)"
echo ""

# Step 6: Install dependencies
echo "📥 Step 6: Installing dependencies..."
$MANAGER $COMMAND
if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to install dependencies"
  exit 1
fi
echo "   ✅ Dependencies installed"
echo ""

# Step 7: Build with Next.js (exact same as GitHub Actions)
echo "🔨 Step 7: Building with Next.js..."
echo "   Environment: NEXT_PUBLIC_BASE_PATH=/$REPO_NAME"
echo ""

NEXT_PUBLIC_BASE_PATH="/$REPO_NAME" $RUNNER next build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed!"
  exit 1
fi

# Step 8: Verify build output
echo ""
echo "✅ Step 8: Verifying build output..."
if [ -d "out" ]; then
  echo "   ✅ Build output directory 'out' exists"
  echo ""
  echo "📊 Build Summary:"
  echo "   - Pages generated: $(find out -name '*.html' | wc -l | tr -d ' ')"
  echo "   - Total size: $(du -sh out | cut -f1)"
  echo ""
  echo "🎉 Build successful!"
  echo ""
  echo "🚀 To test the build:"
  echo "   npx serve out"
  echo ""
  echo "🌐 Then visit:"
  echo "   http://localhost:3000/$REPO_NAME/"
  echo ""
else
  echo "   ❌ Build output directory 'out' not found!"
  exit 1
fi
