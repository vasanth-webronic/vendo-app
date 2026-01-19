# Vamo Store - Troubleshooting Guide

## Common Issues and Solutions

---

## 🔴 Issue: Store Not Found (403 Error)

### Error Message:
```
Store verification failed for project=xxx, store_id=yyy: Store yyy not found
Status: 403 | GET /api/v1/stores/{store_id}/vms/{vm_id}/connectionStatus
```

### Root Cause:
The store ID configured in the Vamo Store frontend doesn't exist in the VM Service database, or the project doesn't have access to it.

### Solution:

#### Option 1: Find the Correct Store ID

1. **Query your VM Service database** to find valid store IDs:

```sql
-- Find all stores in your project
SELECT id, name, project_id
FROM stores
WHERE project_id = '06d426c1-dcd3-4435-884c-549d474d65c6';
```

2. **Update the store ID in Vamo Store:**

```typescript
// In your Vamo Store app, update the store ID
// Method 1: Via localStorage (temporary)
localStorage.setItem('vamo-store-id', 'YOUR-ACTUAL-STORE-ID');

// Method 2: Via Zustand store (recommended)
// Update src/lib/stores/appStore.ts
const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      storeId: 'YOUR-ACTUAL-STORE-ID', // ← Update this
      // ... rest of store
    }),
    {
      name: 'vamo-app-state',
      // ...
    }
  )
);
```

#### Option 2: Create the Missing Store

1. **Create a store in VM Service** using the API:

```bash
curl -X POST "http://localhost:8080/api/v1/projects/06d426c1-dcd3-4435-884c-549d474d65c6/stores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "ec238cb2-1737-4afb-af3c-29d97a8b7d41",
    "name": "Main Store",
    "address": "123 Main St",
    "city": "Stockholm",
    "country": "Sweden"
  }'
```

2. **Then create the VM** for this store:

```bash
curl -X POST "http://localhost:8080/api/v1/projects/06d426c1-dcd3-4435-884c-549d474d65c6/stores/ec238cb2-1737-4afb-af3c-29d97a8b7d41/vms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vm_id": "c3f768b7-0e9e-4e70-a3cc-9fc9a34ae561",
    "name": "VM-001",
    "model": "SmartVend 3000",
    "max_capacity": 50
  }'
```

#### Option 3: Add Debug Logging

Add this to help identify the issue:

```typescript
// src/app/payment/page.tsx
useEffect(() => {
  console.log('🔍 Debug Info:');
  console.log('Store ID:', storeId);
  console.log('VM ID:', vmId);
  console.log('First Product:', firstProduct);
  console.log('Items:', items);
}, [storeId, vmId, firstProduct, items]);
```

---

## 🟡 Issue: Environment Variables Not Validated

### Error Message:
```
Environment variable validation failed:
  - NEXT_PUBLIC_VM_SERVICE_URL: Required
```

### Solution:

1. **Copy the example environment file:**
```bash
cd vamo-store-main
cp .env.example .env
```

2. **Fill in all required values:**
```bash
# .env
NEXT_PUBLIC_VM_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_VM_SERVICE_CLIENT_ID=your_client_id
NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

3. **Restart the development server:**
```bash
npm run dev
```

---

## 🟡 Issue: Toast Messages Not Showing

### Symptoms:
- Toast functions called but nothing appears on screen
- No error in console

### Solutions:

**Check 1: Sonner Component in Providers**

Ensure `<Sonner />` is included in your app providers:

```typescript
// src/app/providers.tsx
import { Toaster as Sonner } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sonner /> {/* ← Must be present */}
      {children}
    </>
  );
}
```

**Check 2: Remove Duplicate Toast Systems**

If you still have the old Radix Toast system:

```bash
# Remove these files:
rm src/components/ui/toast.tsx
rm src/components/ui/toaster.tsx
rm src/hooks/use-toast.ts
```

And remove from providers:
```typescript
// Remove this line if present:
<Toaster /> {/* Old Radix Toast - REMOVE */}
```

**Check 3: Import from Correct Location**

```typescript
// ✅ Correct
import { showError } from '@/lib/utils/toast';

// ❌ Wrong
import { toast } from 'sonner';  // Don't use directly
```

---

## 🟡 Issue: VM Status Always Shows "Checking"

### Symptoms:
- VM status never changes from "checking"
- Status stays in loading state

### Solutions:

**Check 1: Verify Store and VM IDs**

```typescript
console.log('Store ID:', storeId);  // Should not be empty
console.log('VM ID:', vmId);        // Should not be empty
```

**Check 2: Check VM Service is Running**

```bash
# Test VM service endpoint
curl http://localhost:8080/api/v1/stores/YOUR_STORE_ID/vms/YOUR_VM_ID/connection
```

**Check 3: Check Network Tab**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `connectionStatus` requests
4. Check for errors (401, 403, 404, 500)

**Check 4: Check Hook is Enabled**

```typescript
const { status } = useVMStatus({
  storeId: storeId || '',
  vmId: vmId || '',
  enabled: !!storeId && !!vmId,  // ← Must be true
});
```

---

## 🟡 Issue: TypeScript Errors After Update

### Error Messages:
```
Cannot find module '@/config/env'
Cannot find module '@/config/constants'
```

### Solutions:

**Solution 1: Clear Next.js Cache**

```bash
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

**Solution 2: Restart TypeScript Server**

In VSCode:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

**Solution 3: Check tsconfig.json**

Ensure paths are configured:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🟡 Issue: Payment Fails Immediately

### Symptoms:
- "Payment Failed" toast shows immediately
- No Razorpay modal opens

### Solutions:

**Check 1: Razorpay Script Loaded**

Ensure Razorpay script is loaded in your HTML:

```typescript
// src/app/layout.tsx or page.tsx
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
```

**Check 2: Razorpay Key Configured**

```bash
# Check .env file
grep RAZORPAY .env
```

**Check 3: Check Browser Console**

Look for errors like:
- `Razorpay is not defined`
- `Invalid key`
- Network errors

---

## 🔴 Issue: "Cannot read property 'product' of undefined"

### Error:
```
TypeError: Cannot read property 'product' of undefined
at PaymentPage
```

### Cause:
Cart is empty or items array is empty.

### Solution:

Add this check at the top of your component:

```typescript
export default function PaymentPage() {
  const { items } = useCartStore();

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  // Show loading while checking
  if (items.length === 0) {
    return <div>Loading...</div>;
  }

  // Rest of component...
}
```

---

## 🟡 Issue: Translations Not Showing

### Symptoms:
- All text still in English
- Translation keys showing instead of text

### Cause:
Translations not yet integrated into components.

### Solution:

This is expected! The translation infrastructure is in place, but components haven't been updated yet. To integrate:

```typescript
// Add to component
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('common');

  return <button>{t('continue')}</button>;
}
```

See `IMPLEMENTATION_GUIDE.md` for full i18n integration guide.

---

## 🟢 Issue: How to Test VM Status Monitoring

### Testing Steps:

**Test 1: Online Status**

1. Ensure VM service is running
2. Navigate to payment page
3. Should see green "Vending Machine Online" indicator

**Test 2: Offline Status**

1. Stop VM service: `Ctrl+C` in terminal
2. Wait 30 seconds (or refresh page)
3. Should see red "Vending Machine Offline" indicator
4. Click "Retry Connection" button
5. Restart VM service
6. Should change back to online

**Test 3: Status During Payment**

1. Start payment with VM offline
2. Should see error: "The vending machine is currently offline"
3. Payment blocked
4. Bring VM online
5. Try payment again
6. Should proceed normally

---

## 🟢 How to Debug Toast Messages

### Enable Detailed Logging:

```typescript
// src/lib/utils/toast.ts

// Add at top of each function:
export function showError(message: string, options?: ToastOptions): void {
  console.log('🔴 Toast Error:', message, options);  // ← Add this
  sonnerToast.error(message, {
    // ...
  });
}
```

### Check Toast Configuration:

```typescript
import { TOAST } from '@/config/constants';

console.log('Toast Config:', {
  defaultDuration: TOAST.DEFAULT_DURATION,
  maxToasts: TOAST.MAX_TOASTS,
  position: TOAST.POSITION,
});
```

---

## 🟢 Verify All Systems Working

Run this checklist:

```typescript
// Add to any page component temporarily:
useEffect(() => {
  console.log('=== VAMO STORE DIAGNOSTICS ===');

  // 1. Environment
  try {
    console.log('✅ Environment validated');
    console.log('VM Service URL:', env.NEXT_PUBLIC_VM_SERVICE_URL);
  } catch (err) {
    console.error('❌ Environment validation failed:', err);
  }

  // 2. Constants
  try {
    console.log('✅ Constants loaded');
    console.log('Currency:', CURRENCY.DEFAULT);
    console.log('Toast Duration:', TOAST.DEFAULT_DURATION);
  } catch (err) {
    console.error('❌ Constants failed:', err);
  }

  // 3. Toast
  try {
    showInfo('System Check', { description: 'Testing toast system' });
    console.log('✅ Toast system working');
  } catch (err) {
    console.error('❌ Toast system failed:', err);
  }

  // 4. Store
  console.log('Store ID:', storeId);
  console.log('VM ID:', vmId);

  console.log('=== END DIAGNOSTICS ===');
}, []);
```

---

## Getting Help

If your issue isn't listed here:

1. **Check Browser Console** - Most errors will show here
2. **Check Network Tab** - See if API calls are failing
3. **Check Server Logs** - VM service logs show backend errors
4. **Review Implementation Guide** - See `IMPLEMENTATION_GUIDE.md`
5. **Check File Paths** - Ensure all imports use `@/` prefix correctly

### Useful Debug Commands:

```bash
# Check if VM service is running
curl http://localhost:8080/health

# Check if Vamo Store is running
curl http://localhost:3000

# View all environment variables
cat .env

# Check TypeScript compilation
npx tsc --noEmit

# Clear all caches
rm -rf .next node_modules/.cache
npm run dev
```

---

**Last Updated:** 2026-01-19
