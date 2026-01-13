# GitHub Pages Deployment Guide

## Quick Start

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository → Settings → Pages
   - Under "Source", select **"GitHub Actions"**
   - Click Save

3. **Deploy**:
   - Push any commit to `main` or `master` branch
   - GitHub Actions will automatically build and deploy
   - Check the "Actions" tab to monitor deployment

4. **Your site will be live at**:
   ```
   https://[your-username].github.io/[repository-name]/
   ```

## Configuration

### For Repository Subdirectory (Default)

The current configuration assumes your site will be at:
```
https://username.github.io/repository-name/
```

The base path is automatically set to your repository name.

### For Root Domain (username.github.io)

If your repository is named `username.github.io` and you want the site at the root:

1. Update `next.config.js`:
   ```javascript
   const nextConfig = {
     // ... other config
     basePath: '', // Remove or set to empty string
     assetPrefix: '', // Remove or set to empty string
   };
   ```

2. Update `.github/workflows/deploy.yml`:
   ```yaml
   - name: Build with Next.js
     run: npm run build  # Remove NEXT_PUBLIC_BASE_PATH
   ```

## Troubleshooting

### Build Fails

- Check the "Actions" tab for error details
- Ensure Node.js version matches (currently set to 18)
- Verify all dependencies are in `package.json`

### Site Shows 404

- Verify GitHub Pages is enabled and using "GitHub Actions" source
- Check that the workflow completed successfully
- Wait a few minutes for DNS propagation

### Assets Not Loading

- Ensure `basePath` and `assetPrefix` match your repository name
- Check browser console for 404 errors
- Verify `.nojekyll` file exists in `public/` folder

## Manual Deployment

If you prefer to deploy manually:

```bash
# Build the project
npm run build

# The static files will be in the 'out' directory
# Copy contents of 'out' to your gh-pages branch or use GitHub Pages
```

## PWA on GitHub Pages

The PWA features will work on GitHub Pages:
- Service worker will be generated during build
- Manifest.json is configured
- Add PWA icons (`icon-192.png` and `icon-512.png`) to `/public` for full installability
