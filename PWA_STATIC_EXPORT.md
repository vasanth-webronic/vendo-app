# PWA and Static Export Compatibility

## ⚠️ Important Note

**PWA is disabled for static export builds (GitHub Pages)** due to compatibility issues between `next-pwa` v5.6.0 and Next.js 15's static export feature.

## Why PWA is Disabled

When building for GitHub Pages with `output: 'export'`, the `next-pwa` plugin throws errors that are not Error instances, causing the build to fail with:
```
TypeError: error must be an instance of Error
```

## Current Behavior

- ✅ **Static Export Builds** (GitHub Pages): PWA disabled, build succeeds
- ✅ **Non-Static Builds** (Vercel, etc.): PWA enabled, full PWA features

## Options for PWA on GitHub Pages

If you need PWA features on GitHub Pages, consider:

### Option 1: Deploy to Vercel (Recommended)
- Full Next.js support including PWA
- Automatic deployments
- Better performance
- Free tier available

### Option 2: Manual Service Worker
- Create a custom service worker
- Register it manually in your app
- More control, more work

### Option 3: Wait for next-pwa Update
- Check for next-pwa updates that support Next.js 15 static export
- Update when available

## Current Status

- ✅ Build works on GitHub Pages
- ✅ All features work except PWA (service worker, install prompt)
- ✅ Can still install manually via browser menu
- ✅ Manifest.json is still included (for manual install)

## Testing

The build will show:
```
ℹ️  Static export detected - PWA disabled to avoid build errors
ℹ️  PWA features (service worker, install prompt) will not be available
```

This is expected and the build will complete successfully.
