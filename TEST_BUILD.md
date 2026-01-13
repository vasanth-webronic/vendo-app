# Testing GitHub Pages Build Locally

## Quick Test (Simulates GitHub Actions)

```bash
# 1. Set the same environment variable GitHub Actions uses
export NEXT_PUBLIC_BASE_PATH="/your-repo-name"

# 2. Build (same as GitHub Actions)
npm run build

# 3. Serve the static files
npx serve out

# 4. Open http://localhost:3000/your-repo-name/
```

## Step-by-Step Testing

### 1. Find Your Repository Name

Your GitHub repository name (e.g., `vendo-app` or `vamo-store-main`)

### 2. Build with Repository Path

```bash
# Replace 'your-repo-name' with your actual repository name
NEXT_PUBLIC_BASE_PATH="/your-repo-name" npm run build
```

**Expected output:**
```
ℹ️  Static export detected - PWA disabled to avoid build errors
ℹ️  PWA features (service worker, install prompt) will not be available
✓ Compiled successfully
✓ Generating static pages (18/18)
✓ Exporting (10/10)
```

### 3. Verify Build Output

```bash
# Check that 'out' directory was created
ls -la out/

# Should see:
# - index.html
# - _next/ (directory)
# - All your pages (cart/, checkout/, etc.)
```

### 4. Serve Locally

**Option A: Using serve**
```bash
npx serve out
# Visit: http://localhost:3000/your-repo-name/
```

**Option B: Using Python**
```bash
cd out
python3 -m http.server 3000
# Visit: http://localhost:3000/your-repo-name/
```

**Option C: Using Node http-server**
```bash
npx http-server out -p 3000
# Visit: http://localhost:3000/your-repo-name/
```

### 5. Test the Site

1. **Open in browser**: `http://localhost:3000/your-repo-name/`
2. **Check console**: Open DevTools → Console (should be no errors)
3. **Navigate pages**: Test all routes (cart, checkout, payment, etc.)
4. **Check assets**: Images, CSS, JS should load correctly

## Testing Without Base Path (Root Domain)

If your repo is `username.github.io` (root domain):

```bash
# Build without base path
npm run build

# Serve
npx serve out

# Visit: http://localhost:3000/
```

## Verify Build Success Checklist

- [ ] Build completes without errors
- [ ] `out/` directory is created
- [ ] `out/index.html` exists
- [ ] `out/_next/` directory exists with assets
- [ ] All pages are in `out/` (cart/, checkout/, etc.)
- [ ] Site loads in browser
- [ ] No console errors
- [ ] Navigation works
- [ ] Assets load correctly

## Common Issues

### Issue: 404 on pages

**Cause**: Base path mismatch  
**Fix**: Make sure `NEXT_PUBLIC_BASE_PATH` matches your repo name

### Issue: Assets not loading

**Cause**: Wrong base path or asset prefix  
**Fix**: Check `next.config.js` - `basePath` and `assetPrefix` should match

### Issue: Build fails

**Check**:
1. All dependencies installed: `npm ci`
2. No TypeScript errors: `npm run lint`
3. Check build output for specific errors

## Testing Before Push

```bash
# 1. Clean previous builds
rm -rf .next out

# 2. Install dependencies (fresh)
npm ci

# 3. Build with your repo name
NEXT_PUBLIC_BASE_PATH="/your-repo-name" npm run build

# 4. Test locally
npx serve out

# 5. If everything works, push to GitHub
git add .
git commit -m "Test build"
git push origin main
```

## Automated Test Script

Create `test-build.sh`:

```bash
#!/bin/bash
REPO_NAME="${1:-vamo-store-main}"
echo "Testing build for repository: $REPO_NAME"

# Clean
rm -rf .next out

# Build
NEXT_PUBLIC_BASE_PATH="/$REPO_NAME" npm run build

# Check if build succeeded
if [ -d "out" ]; then
  echo "✅ Build successful!"
  echo "📦 Output in: out/"
  echo "🚀 Test with: npx serve out"
else
  echo "❌ Build failed!"
  exit 1
fi
```

Make it executable and run:
```bash
chmod +x test-build.sh
./test-build.sh your-repo-name
```
