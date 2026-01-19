# Troubleshooting GitHub Actions Build Errors

## Your Repository Name
Based on git remote: **`vendo-app`**

## Common Issues & Fixes

### Issue 1: `actions/configure-pages` Auto-Modification

**Problem**: `actions/configure-pages@v5` with `static_site_generator: next` automatically modifies `next.config.js`, causing conflicts.

**Fix**: ✅ Already removed `static_site_generator: next` from workflow

### Issue 2: Repository Name Not Available

**Problem**: `${{ github.event.repository.name }}` might be empty or incorrect.

**Check**: The debug step will show the actual value.

**Fix**: If empty, use `${{ github.repository }}` and extract name:
```yaml
- name: Build with Next.js
  env:
    NEXT_PUBLIC_BASE_PATH: /${{ github.repository }}
  run: npx next build
```

### Issue 3: Node Version Mismatch

**Problem**: Local Node might be different version than GitHub Actions (Node 20).

**Fix**: Test with Node 20 locally:
```bash
nvm use 20
npm ci
NEXT_PUBLIC_BASE_PATH="/vendo-app" npx next build
```

### Issue 4: Missing Dependencies

**Problem**: `npm ci` might fail or skip packages.

**Check**: Look for errors in "Install dependencies" step.

**Fix**: Ensure `package-lock.json` is committed and up to date.

### Issue 5: File Permissions

**Problem**: Scripts might not be executable in GitHub Actions.

**Fix**: Use explicit commands instead of scripts, or ensure scripts are executable.

## Debugging Steps

### Step 1: Check GitHub Actions Logs

1. Go to your repository → **Actions** tab
2. Click on the failed workflow
3. Click on the **Build** job
4. Expand each step to see:
   - Environment variables
   - Command output
   - Error messages

### Step 2: Look for These Errors

**"error must be an instance of Error"**
- ✅ Fixed: PWA disabled for static export

**"Cannot find module"**
- Check: Dependencies installed correctly
- Fix: Ensure `npm ci` completes

**"basePath is not defined"**
- Check: `NEXT_PUBLIC_BASE_PATH` value in debug step
- Fix: Verify repository name is correct

**"Output directory not found"**
- Check: Build step completed
- Fix: Check for earlier errors

### Step 3: Compare Local vs GitHub Actions

| Aspect | Local | GitHub Actions |
|--------|-------|----------------|
| Node Version | Your system | Node 20 |
| Package Manager | npm/yarn | Detected automatically |
| Environment | Your machine | Ubuntu Linux |
| Cache | May have cache | Fresh or cached |
| File Permissions | Your user | Runner user |

## Quick Fixes

### Fix 1: Ensure Repository Name is Correct

The workflow uses: `${{ github.event.repository.name }}`

If this is empty, the build will use empty basePath. Check the debug output.

### Fix 2: Test Exact GitHub Actions Environment

```bash
# Use Docker to simulate exact environment
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  node:20 bash

# Inside container:
npm ci
NEXT_PUBLIC_BASE_PATH="/vendo-app" npx next build
```

### Fix 3: Add More Debugging

The workflow now includes a debug step that shows:
- Repository name
- Environment variables
- Node/NPM versions
- File existence

Check this output in GitHub Actions logs.

## What to Share for Help

If build still fails, share:

1. **Exact error message** from GitHub Actions logs
2. **Which step failed** (Install, Build, Upload, etc.)
3. **Debug output** from "Debug environment" step
4. **Repository name** (should be `vendo-app`)

## Expected Successful Build Output

```
✅ Install dependencies: Success
✅ Debug environment: Shows repository name
✅ Build with Next.js: 
   ℹ️  Static export detected - PWA disabled
   ✓ Compiled successfully
   ✓ Generating static pages (18/18)
   ✓ Exporting (10/10)
✅ Verify build output: Shows file count
✅ Upload artifact: Success
```

## Next Steps

1. **Push the updated workflow** (with debug steps)
2. **Check GitHub Actions logs** for debug output
3. **Compare** debug output with local test
4. **Fix** any differences found
