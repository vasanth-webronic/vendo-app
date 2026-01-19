# Debugging GitHub Actions Build Errors

## Common Differences: Local vs GitHub Actions

### 1. **actions/configure-pages Auto-Modification**

The `actions/configure-pages@v5` with `static_site_generator: next` **automatically modifies** `next.config.js` during build. This can cause conflicts.

**Solution**: Removed `static_site_generator: next` from workflow to prevent auto-modification.

### 2. **Repository Name Variable**

GitHub Actions uses `${{ github.event.repository.name }}` which might be:
- Empty in some contexts
- Different format than expected
- Not available in all events

**Check**: Add debug step to see actual value:
```yaml
- name: Debug repository name
  run: echo "Repository name: ${{ github.event.repository.name }}"
```

### 3. **Node Version Mismatch**

- Local: Your system Node (might be v23)
- GitHub Actions: Node 20 (as specified)

**Solution**: Ensure compatibility or match versions.

### 4. **npx --no-install Behavior**

GitHub Actions uses `npx --no-install` which:
- Doesn't install packages if not found
- May fail if Next.js isn't in node_modules

**Check**: Ensure `npm ci` completes successfully before build.

### 5. **File Permissions**

GitHub Actions runs in Linux environment with different permissions.

**Check**: Ensure scripts are executable or use explicit commands.

## Debugging Steps

### Step 1: Add Debug Output to Workflow

Add this before the build step:

```yaml
- name: Debug environment
  run: |
    echo "NEXT_PUBLIC_BASE_PATH: ${{ env.NEXT_PUBLIC_BASE_PATH }}"
    echo "Repository name: ${{ github.event.repository.name }}"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    ls -la next.config.js
```

### Step 2: Check Build Logs

Look for:
- Error messages (exact text)
- Which step failed
- Environment variable values
- File paths

### Step 3: Test Exact GitHub Actions Environment

```bash
# Use Docker to simulate GitHub Actions
docker run -it --rm -v $(pwd):/workspace -w /workspace node:20 bash

# Inside container:
npm ci
NEXT_PUBLIC_BASE_PATH="/your-repo-name" npx next build
```

## Common Error Patterns

### Error: "Cannot find module"
- **Cause**: Dependencies not installed
- **Fix**: Check `npm ci` step completed

### Error: "error must be an instance of Error"
- **Cause**: next-pwa throwing non-Error
- **Fix**: Already handled in next.config.js

### Error: "basePath is not defined"
- **Cause**: NEXT_PUBLIC_BASE_PATH not set
- **Fix**: Check environment variable in workflow

### Error: "Output directory not found"
- **Cause**: Build failed before creating `out/`
- **Fix**: Check build logs for earlier errors

## Quick Fix Checklist

- [ ] Removed `static_site_generator: next` from workflow
- [ ] Verified `NEXT_PUBLIC_BASE_PATH` is set correctly
- [ ] Checked Node version matches (20)
- [ ] Verified `npm ci` completes successfully
- [ ] Checked for TypeScript/ESLint errors
- [ ] Verified next.config.js is valid JavaScript

## Get Exact Error

Share the exact error message from GitHub Actions logs:
1. Go to Actions tab
2. Click on failed workflow
3. Click on "Build" job
4. Expand the failed step
5. Copy the error message

This will help identify the specific issue.
