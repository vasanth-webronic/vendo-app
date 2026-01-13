# PWA Install Prompt Troubleshooting

## Why Install Prompt Might Not Show

The PWA install prompt requires several conditions to be met:

### ✅ Required Conditions

1. **PWA Icons** ⚠️ **MISSING - This is likely your issue**
   - Need `icon-192.png` (192x192 pixels)
   - Need `icon-512.png` (512x512 pixels)
   - Place in `/public` folder
   - **Action**: Create these icons (see `public/ICON_INSTRUCTIONS.md`)

2. **HTTPS or Localhost**
   - ✅ Works on `localhost` (development)
   - ✅ Works on `https://` (production)
   - ❌ Does NOT work on `http://` (except localhost)

3. **Service Worker Registered**
   - ✅ Automatically registered in production build
   - ❌ Disabled in development mode (`disable: process.env.NODE_ENV === 'development'`)
   - **To test**: Build and serve production version

4. **Valid Manifest**
   - ✅ `manifest.json` exists and is valid
   - ✅ Referenced in HTML head

5. **User Engagement**
   - Browser requires user interaction before showing prompt
   - User must visit site at least once
   - Some browsers require multiple visits

### 🔧 Quick Fixes

#### 1. Create PWA Icons (CRITICAL)

**Option A: Use Online Tool**
1. Go to https://realfavicongenerator.net/
2. Upload your favicon or create new icon
3. Download the generated icons
4. Rename and place:
   - `android-chrome-192x192.png` → `public/icon-192.png`
   - `android-chrome-512x512.png` → `public/icon-512.png`

**Option B: Use Design Tool**
- Create 192x192 and 512x512 PNG images
- Use your app logo/branding
- Save as `icon-192.png` and `icon-512.png` in `/public`

**Option C: Convert Existing Image**
```bash
# Using ImageMagick (if installed)
convert favicon.ico -resize 192x192 public/icon-192.png
convert favicon.ico -resize 512x512 public/icon-512.png
```

#### 2. Test in Production Mode

The service worker is **disabled in development**. To test install prompt:

```bash
# Build for production
npm run build

# Serve the built files
npx serve out

# Or use Python
cd out && python3 -m http.server 3000
```

Then visit `http://localhost:3000` (or with basePath if configured)

#### 3. Check Browser Console

Open browser DevTools → Console and check for:
- Service worker registration errors
- Manifest loading errors
- Icon loading errors (404s)

#### 4. Manual Install (Chrome/Edge)

If prompt doesn't show automatically:
- **Desktop**: Click the install icon (➕) in address bar
- **Mobile**: Menu → "Add to Home Screen" or "Install App"

#### 5. Verify Manifest

Check if manifest loads:
```
http://localhost:3000/manifest.json
```

Should return valid JSON with icons array.

### 📱 Browser-Specific Notes

**Chrome/Edge (Desktop)**
- Shows install button in address bar
- Requires HTTPS (or localhost)
- Needs valid icons

**Chrome (Android)**
- Shows banner at bottom
- Requires user to visit site multiple times
- Needs valid icons

**Safari (iOS)**
- Uses "Add to Home Screen" (manual)
- No automatic prompt
- Needs Apple touch icon

**Firefox**
- Limited PWA support
- May not show install prompt

### 🧪 Testing Checklist

- [ ] Icons exist (`icon-192.png` and `icon-512.png`)
- [ ] Running on HTTPS or localhost
- [ ] Built with `npm run build`
- [ ] Service worker file exists (`public/sw.js`)
- [ ] Manifest loads correctly (`/manifest.json`)
- [ ] No console errors
- [ ] Visited site multiple times (for some browsers)

### 🚀 After Adding Icons

1. Rebuild: `npm run build`
2. Clear browser cache
3. Visit site in incognito/private window
4. Check browser console for errors
5. Wait a few seconds for prompt to appear

### 📝 Current Status

- ✅ Service worker configured
- ✅ Manifest configured
- ✅ Install prompt component added
- ⚠️ **PNG icons missing** (create these!)
- ✅ Works in production build
- ❌ Disabled in development mode
