# Testing GitHub Actions Workflow Locally

This guide shows how to test the exact same build process that GitHub Actions uses.

## Method 1: Using Test Script (Recommended)

The `test-workflow.sh` script simulates the exact steps from `.github/workflows/nextjs.yml`:

```bash
# Test with your repository name
./test-workflow.sh your-repo-name

# Or use default (vamo-store-main)
./test-workflow.sh
```

**What it does:**
1. ✅ Detects package manager (npm/yarn)
2. ✅ Checks Node.js version
3. ✅ Installs dependencies (`npm ci`)
4. ✅ Builds with `NEXT_PUBLIC_BASE_PATH` (same as GitHub Actions)
5. ✅ Verifies build output

## Method 2: Using `act` (Run GitHub Actions Locally)

If you have `act` installed, you can run the workflow directly:

### Install act

**macOS:**
```bash
brew install act
```

**Linux:**
```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Run the workflow

```bash
# Run the build job
act push -j build

# Or run with specific event
act workflow_dispatch -j build
```

**Note**: `act` requires Docker and may have limitations. The test script is simpler.

## Method 3: Manual Steps (Exact Workflow Match)

Follow these steps exactly as GitHub Actions does:

```bash
# 1. Detect package manager (from workflow)
if [ -f "yarn.lock" ]; then
  MANAGER="yarn"
  COMMAND="install"
  RUNNER="yarn"
else
  MANAGER="npm"
  COMMAND="ci"
  RUNNER="npx --no-install"
fi

# 2. Install dependencies
$MANAGER $COMMAND

# 3. Build with Next.js (exact same env var as GitHub Actions)
NEXT_PUBLIC_BASE_PATH="/your-repo-name" $RUNNER next build

# 4. Verify output
ls -la out/
```

## Quick Test Commands

### Using npm script:
```bash
npm run test:workflow
```

### Direct script:
```bash
./test-workflow.sh your-repo-name
```

### Manual test:
```bash
NEXT_PUBLIC_BASE_PATH="/your-repo-name" npm ci && NEXT_PUBLIC_BASE_PATH="/your-repo-name" npx next build
```

## Expected Output

When testing, you should see:

```
🚀 Testing GitHub Actions Workflow Locally
==========================================

📦 Repository: your-repo-name

✅ Step 1: Checkout (already in repository)

🔍 Step 2: Detecting package manager...
   Detected: npm

✅ Step 3: Setup Node.js
   Using: v20.x.x

✅ Step 4: Setup Pages (configure-pages action simulated)

ℹ️  Step 5: Restore cache (skipped for local test)

📥 Step 6: Installing dependencies...
   ✅ Dependencies installed

🔨 Step 7: Building with Next.js...
   Environment: NEXT_PUBLIC_BASE_PATH=/your-repo-name

ℹ️  Static export detected - PWA disabled to avoid build errors
✓ Compiled successfully
✓ Generating static pages (18/18)
✓ Exporting (10/10)

✅ Step 8: Verifying build output...
   ✅ Build output directory 'out' exists

📊 Build Summary:
   - Pages generated: 18
   - Total size: 2.5M

🎉 Build successful!

🚀 To test the build:
   npx serve out

🌐 Then visit:
   http://localhost:3000/your-repo-name/
```

## Testing the Built Site

After successful build:

```bash
# Serve the static files
npx serve out

# Or use Python
cd out && python3 -m http.server 3000
```

Then visit: `http://localhost:3000/your-repo-name/`

## Troubleshooting

### Script not executable
```bash
chmod +x test-workflow.sh
```

### Build fails
- Check Node.js version (should be 18+)
- Run `npm ci` to ensure clean install
- Check for TypeScript errors: `npm run lint`

### Wrong repository name
Make sure you use the exact GitHub repository name:
- Check: `git remote get-url origin`
- Extract the repo name from the URL

## Comparison: Local vs GitHub Actions

| Step | Local Test | GitHub Actions |
|------|------------|----------------|
| Checkout | Already in repo | `actions/checkout@v4` |
| Detect PM | Script logic | Workflow step |
| Setup Node | System Node | `actions/setup-node@v4` |
| Install | `npm ci` | `npm ci` |
| Build | `NEXT_PUBLIC_BASE_PATH=...` | `NEXT_PUBLIC_BASE_PATH=...` |
| Output | `out/` directory | `out/` directory |

The build process is **identical** - if it works locally, it will work in GitHub Actions!
