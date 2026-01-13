# GitHub Pages Deployment Guide

## Quick Start

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Actions Permissions** (if needed):
   - Go to your repository → Settings → Actions → General
   - Under "Workflow permissions", select **"Read and write permissions"**
   - Check "Allow GitHub Actions to create and approve pull requests" (optional)
   - Click Save

3. **Enable GitHub Pages** (Optional - workflow will try to enable automatically):
   - Go to your repository → Settings → Pages
   - Under "Source", select **"GitHub Actions"**
   - Click Save
   - **Note**: The workflow includes `enablement: true` which will attempt to enable Pages automatically

4. **Deploy**:
   - Push any commit to `main` or `master` branch
   - GitHub Actions will automatically build and deploy
   - Check the "Actions" tab to monitor deployment

5. **Your site will be live at**:
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

### "Get Pages site failed" Error

If you see this error:
1. **Check Actions Permissions**:
   - Repository → Settings → Actions → General
   - Ensure "Read and write permissions" is selected
   - Save changes

2. **Manually Enable Pages**:
   - Repository → Settings → Pages
   - Source: Select "GitHub Actions"
   - Save

3. **Re-run the workflow**:
   - Go to Actions tab
   - Click "Re-run all jobs" on the failed workflow

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
