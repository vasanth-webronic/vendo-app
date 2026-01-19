# Test PWA Install Prompt - Quick Guide

## ✅ Icons Created!

The PWA icons (`icon-192.png` and `icon-512.png`) have been created.

## 🧪 How to Test Install Prompt

### Step 1: Build for Production

**⚠️ IMPORTANT**: Service worker is **disabled in development mode**. You MUST test with production build!

```bash
npm run build
```

### Step 2: Serve the Production Build

```bash
# Option 1: Using serve
npx serve out

# Option 2: Using Python
cd out && python3 -m http.server 3000

# Option 3: Using Node http-server
npx http-server out -p 3000
```

### Step 3: Open in Browser

1. Open `http://localhost:3000` in Chrome/Edge
2. Open DevTools (F12) → Console tab
3. Look for debug info (yellow box at bottom in dev mode)
4. Wait a few seconds for the install prompt

### Step 4: Check Debug Info

The debug component will show:
- ✓ Service Worker supported
- ✓ Manifest link found
- ✓ icon-192.png exists
- ✓ icon-512.png exists
- ✓ beforeinstallprompt event received (when ready)

If you see ✗ (red X), that's the issue!

## 🔍 Troubleshooting

### If prompt still doesn't show:

1. **Check Browser Console**
   - Open DevTools → Console
   - Look for errors (red text)
   - Check if service worker registered

2. **Check Service Worker**
   - DevTools → Application → Service Workers
   - Should see `sw.js` registered
   - Status should be "activated"

3. **Check Manifest**
   - DevTools → Application → Manifest
   - Should show valid manifest
   - Icons should be listed

4. **Clear Cache**
   ```bash
   # In browser DevTools:
   # Application → Clear storage → Clear site data
   ```

5. **Try Incognito/Private Window**
   - Sometimes cache prevents prompt
   - Incognito = fresh start

6. **Check Browser Support**
   - ✅ Chrome/Edge (Desktop & Android) - Full support
   - ✅ Safari (iOS) - Manual "Add to Home Screen"
   - ⚠️ Firefox - Limited support

## 📱 Manual Install (If Prompt Doesn't Show)

### Chrome/Edge Desktop:
- Look for install icon (➕) in address bar
- Click it to install

### Chrome Android:
- Menu (3 dots) → "Install app" or "Add to Home Screen"

### Safari iOS:
- Share button → "Add to Home Screen"

## 🐛 Debug Component

In development mode, you'll see a yellow debug box showing:
- Service worker status
- Manifest status  
- Icon availability
- Why prompt might not be showing

## ✅ Success Indicators

When everything works:
1. Install prompt appears automatically (or install button in address bar)
2. Debug shows all ✓ checkmarks
3. Service worker is active
4. Manifest loads correctly
5. Icons are accessible

## 🚀 After Successful Test

Once install prompt works locally:
1. Push to GitHub
2. Deploy to GitHub Pages
3. Test on production URL (HTTPS)
4. Install prompt should work there too!
