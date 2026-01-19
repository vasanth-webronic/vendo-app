# Fix GitHub Actions Build Errors

## Your Repository: `vendo-app`

## Most Likely Issues

### 1. **actions/configure-pages Auto-Modification** ⚠️

The `actions/configure-pages@v5` action **automatically modifies** `next.config.js` when `static_site_generator: next` is set. This conflicts with our manual configuration.

**✅ Fixed**: Removed `static_site_generator: next` from workflow

### 2. **Repository Name Variable**

GitHub Actions uses `${{ github.event.repository.name }}` which should be `vendo-app`, but might be:
- Empty in some contexts
- Different format

**✅ Fixed**: Added debug step to show actual value

### 3. **Environment Variable Not Set**

If `NEXT_PUBLIC_BASE_PATH` is empty, basePath will be empty string, causing routing issues.

**✅ Fixed**: Explicitly set in workflow

## Updated Workflow Changes

1. ✅ Removed `static_site_generator: next` (prevents auto-modification)
2. ✅ Added debug step (shows repository name and environment)
3. ✅ Added build verification step (checks output exists)
4. ✅ Better error handling

## How to Debug

### Step 1: Check GitHub Actions Logs

1. Go to: `https://github.com/your-username/vendo-app/actions`
2. Click on the failed workflow
3. Click on **Build** job
4. Look for **"Debug environment"** step output

**What to look for:**
```
Repository name: vendo-app
NEXT_PUBLIC_BASE_PATH will be: /vendo-app
Node version: v20.x.x
```

### Step 2: Check Build Step Output

Look for:
- ✅ `ℹ️  Static export detected - PWA disabled` (expected)
- ✅ `✓ Compiled successfully`
- ❌ Any error messages

### Step 3: Common Error Patterns

**Error: "Cannot read property..."**
- **Cause**: next-pwa trying to access undefined
- **Fix**: Already handled (PWA disabled for static export)

**Error: "basePath is required"**
- **Cause**: NEXT_PUBLIC_BASE_PATH not set
- **Fix**: Check debug output, verify repository name

**Error: "Output directory not found"**
- **Cause**: Build failed before creating `out/`
- **Fix**: Check earlier steps for errors

## Test Locally with Exact Repository Name

```bash
# Test with your actual repository name
NEXT_PUBLIC_BASE_PATH="/vendo-app" npm ci
NEXT_PUBLIC_BASE_PATH="/vendo-app" npx next build

# Should see:
# ℹ️  Static export detected - PWA disabled
# ✓ Compiled successfully
# ✓ Exporting (10/10)
```

## If Build Still Fails

### Share This Information:

1. **Exact error message** from GitHub Actions
2. **Which step failed** (Install, Build, Upload?)
3. **Debug output** from "Debug environment" step
4. **Full build log** (last 50 lines)

### Quick Checks:

- [ ] `package-lock.json` is committed
- [ ] `next.config.js` is valid JavaScript
- [ ] No TypeScript errors: `npm run lint`
- [ ] Local build works: `NEXT_PUBLIC_BASE_PATH="/vendo-app" npm run build`

## Alternative: Use Simpler Workflow

If issues persist, we can use a simpler workflow without `actions/configure-pages`:

```yaml
- name: Build
  env:
    NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}
  run: npm ci && npm run build
```

This avoids any auto-modification of config files.
