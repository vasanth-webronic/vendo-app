# Vamo Store - Quick Start Guide

## 🚀 Get Started in 5 Minutes

---

## Current Issue: Store Not Found

You're seeing this error:
```
Store verification failed: Store ec238cb2-1737-4afb-af3c-29d97a8b7d41 not found
Status: 403
```

**This means:** The store ID in your Vamo Store app doesn't match any store in your VM Service database.

---

## ✅ Fix It Now

### Option 1: Automated Setup (Recommended)

```bash
cd vamo-store-main
node scripts/setup-store.js
```

This script will:
1. Ask for your VM Service credentials
2. Help you enter the correct Store ID and VM ID
3. Automatically update your configuration files
4. Guide you through testing

### Option 2: Manual Setup

#### Step 1: Find Your Store ID

Query your VM Service database:

```sql
-- PostgreSQL
SELECT id, name, project_id
FROM stores
WHERE project_id = '06d426c1-dcd3-4435-884c-549d474d65c6';
```

Or use the API:

```bash
# Get authentication token
curl -X POST http://localhost:8080/api/v1/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"your_id","client_secret":"your_secret"}'

# List stores (endpoint may vary)
curl http://localhost:8080/api/v1/projects/06d426c1-dcd3-4435-884c-549d474d65c6/stores \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 2: Update Vamo Store Configuration

Edit [`src/lib/stores/appStore.ts`](src/lib/stores/appStore.ts):

```typescript
const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      storeId: 'YOUR-ACTUAL-STORE-ID', // ← Change this to your real store ID
      // ... rest of store
    }),
    // ...
  )
);
```

#### Step 3: Update Product Data

Edit [`src/lib/data/products.ts`](src/lib/data/products.ts):

```typescript
export const mockProducts: Product[] = [
  {
    id: 'spring-001',
    name: 'Coca Cola',
    storeId: 'YOUR-ACTUAL-STORE-ID',  // ← Change this
    vmId: 'YOUR-ACTUAL-VM-ID',        // ← Change this
    // ... rest of product
  },
  // ... more products
];
```

#### Step 4: Clear Cache and Restart

```bash
# Clear browser localStorage
# Open browser console (F12) and run:
localStorage.clear()

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

---

## 🧪 Test Everything Works

### 1. Check VM Status Monitoring

1. Navigate to: http://localhost:3000/payment
2. You should see a status indicator:
   - 🟢 **Green** = "Vending Machine Online" ✅
   - 🔴 **Red** = "Vending Machine Offline" ❌

### 2. Test Payment Flow

1. Add items to cart
2. Go to checkout
3. Select payment method
4. Click "Pay with Razorpay"
5. You should see these toasts:
   - "Preparing your order..."
   - "Checking Product Availability"
   - "Creating Order"
   - "Opening Payment Gateway"

### 3. Test Error Handling

**Test 1: Empty Cart**
1. Clear cart
2. Try to checkout
3. Should see: "Cart is Empty - Please add items before checkout"

**Test 2: VM Offline**
1. Stop VM service
2. Try to pay
3. Should see: "Machine Unavailable - The vending machine is currently offline"

**Test 3: Payment Cancelled**
1. Start payment
2. Close Razorpay modal
3. Should see: "Payment Cancelled - Your items are still in the cart"

---

## 📋 Verification Checklist

Run through this checklist to ensure everything is set up correctly:

- [ ] VM Service is running on http://localhost:8080
- [ ] Vamo Store is running on http://localhost:3000
- [ ] `.env` file exists with all required variables
- [ ] Store ID matches a real store in database
- [ ] VM ID matches a real VM in database
- [ ] VM status shows "Online" on payment page
- [ ] Toast messages appear when testing
- [ ] No TypeScript errors in console
- [ ] No 403 errors in Network tab

---

## 🆘 Still Having Issues?

### Check These Common Problems:

**Problem: TypeScript errors about missing modules**

```bash
# Solution: Clear cache and restart
rm -rf .next node_modules/.cache
npm run dev
```

**Problem: Toast messages not showing**

```typescript
// Check src/app/providers.tsx contains:
import { Toaster as Sonner } from '@/components/ui/sonner';

<Sonner /> {/* Must be present */}
```

**Problem: VM Status always "Checking"**

```typescript
// Check console for errors:
// Open DevTools (F12) and look for red errors
// Check Network tab for failed API calls
```

**Problem: Environment validation fails**

```bash
# Copy example file:
cp .env.example .env

# Then edit .env with your values
nano .env  # or use your text editor
```

### Get Detailed Help:

1. **Troubleshooting Guide:** See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
2. **Implementation Guide:** See [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)
3. **Changes Summary:** See [`CHANGES_SUMMARY.md`](CHANGES_SUMMARY.md)

---

## 🎯 What's New in This Version

### For End Users:
- ✅ See vending machine status before payment
- ✅ Clear, friendly error messages
- ✅ Step-by-step payment progress
- ✅ Better error recovery

### For Developers:
- ✅ Centralized configuration
- ✅ Multi-language support ready
- ✅ Type-safe environment variables
- ✅ Reusable toast utilities
- ✅ VM status monitoring hook
- ✅ Comprehensive documentation

---

## 📚 Next Steps After Setup

Once everything works:

1. **Remove Old Toast System**
   ```bash
   rm src/components/ui/toast.tsx
   rm src/components/ui/toaster.tsx
   rm src/hooks/use-toast.ts
   ```

2. **Add Error Boundaries**
   ```typescript
   // Wrap your app or pages:
   <ErrorBoundary>
     <YourPage />
   </ErrorBoundary>
   ```

3. **Integrate Translations**
   - Update components to use translation keys
   - Add language switcher
   - See `IMPLEMENTATION_GUIDE.md` for details

4. **Refactor Stores**
   - Split `appStore` into feature slices
   - Add memoized selectors
   - See guide for recommended structure

---

## 🔧 Configuration Reference

### Environment Variables (.env)

```bash
# VM Service
NEXT_PUBLIC_VM_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_VM_SERVICE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET=your_client_secret_here

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### Store Configuration

```typescript
// src/lib/stores/appStore.ts
storeId: 'ec238cb2-1737-4afb-af3c-29d97a8b7d41'  // Your store UUID
```

### VM Status Polling

```typescript
// src/config/constants.ts
export const VM = {
  STATUS_CHECK_INTERVAL: 30000,  // Check every 30 seconds
  CONNECTION_TIMEOUT: 10000,     // 10 second timeout
  // ...
};
```

---

## 💡 Pro Tips

1. **Check Browser Console Regularly**
   - Press F12 to open DevTools
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Use Meaningful Test Data**
   - Use real product names and prices
   - Test with various quantities
   - Try edge cases (empty cart, large orders)

3. **Keep Logs Visible**
   - VM Service logs show backend issues
   - Browser console shows frontend issues
   - Network tab shows API communication

4. **Test Offline Scenarios**
   - Stop VM service to test offline handling
   - Check error messages are user-friendly
   - Verify retry mechanisms work

---

## 📞 Need More Help?

- **Troubleshooting:** [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
- **Full Guide:** [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)
- **What Changed:** [`CHANGES_SUMMARY.md`](CHANGES_SUMMARY.md)

---

**Ready to go? Start with the automated setup:**

```bash
cd vamo-store-main
node scripts/setup-store.js
```

Good luck! 🚀
