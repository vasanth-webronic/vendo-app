# Vamo Store - Implementation Guide

## Overview

This document provides a comprehensive guide for the restructured Vamo Store project. The codebase has been refactored to follow SOLID principles, implement scalable architecture, and support future features like multi-language support and user authentication.

## Table of Contents

1. [What's New](#whats-new)
2. [Project Structure](#project-structure)
3. [Configuration System](#configuration-system)
4. [Internationalization (i18n)](#internationalization-i18n)
5. [Toast Notification System](#toast-notification-system)
6. [VM Status Monitoring](#vm-status-monitoring)
7. [Payment Flow with Status Checks](#payment-flow-with-status-checks)
8. [Next Steps](#next-steps)
9. [Migration Guide](#migration-guide)

---

## What's New

### ✅ Completed Improvements

1. **Centralized Configuration**
   - Environment variable validation with Zod
   - Type-safe constants for all magic numbers and strings
   - Single source of truth for app configuration

2. **Internationalization (i18n) Support**
   - Support for English, Swedish, and Hindi
   - Translation files for all UI text
   - Easy to add more languages

3. **User-Friendly Error Messages**
   - Toast notifications instead of technical errors
   - Contextual error messages
   - Proper error handling throughout

4. **VM Status Monitoring**
   - Real-time VM connection monitoring
   - Automatic status checks every 30 seconds
   - Visual status indicators
   - Pre-payment validation

5. **Improved Payment Flow**
   - VM status checks before payment
   - User-friendly toast messages at each step
   - Better error recovery
   - Payment progress tracking

---

## Project Structure

### New File Organization

```
vamo-store-main/
├── src/
│   ├── app/                          # Next.js App Router pages
│   ├── components/
│   │   ├── cart/
│   │   ├── layout/
│   │   ├── payment/
│   │   ├── product/
│   │   └── ui/
│   ├── config/                       # ✨ NEW: Centralized configuration
│   │   ├── constants.ts              # App-wide constants
│   │   └── env.ts                    # Environment variable validation
│   ├── hooks/
│   │   └── useVMStatus.ts            # ✨ NEW: VM status monitoring hook
│   ├── i18n/                         # ✨ NEW: Internationalization
│   │   ├── locales/
│   │   │   ├── en.json               # English translations
│   │   │   ├── sv.json               # Swedish translations
│   │   │   └── hi.json               # Hindi translations
│   │   └── request.ts                # i18n configuration
│   ├── lib/
│   │   ├── api/
│   │   ├── stores/                   # Zustand stores
│   │   ├── utils/
│   │   │   ├── toast.ts              # ✨ NEW: Toast utilities
│   │   │   └── formatters.ts
│   │   └── types.ts
│   └── pages/
├── .env.example
└── IMPLEMENTATION_GUIDE.md           # ✨ This file
```

---

## Configuration System

### Environment Variables (`src/config/env.ts`)

All environment variables are now validated at startup using Zod. This ensures that configuration errors are caught early.

**Usage:**

```typescript
import { env } from '@/config/env';

// Type-safe access to environment variables
const apiUrl = env.NEXT_PUBLIC_VM_SERVICE_URL;
const razorpayKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
```

**Benefits:**
- Type safety for environment variables
- Runtime validation
- Clear error messages for missing/invalid configuration
- No more `process.env.VARIABLE || 'fallback'` scattered everywhere

### Constants (`src/config/constants.ts`)

All magic numbers, strings, and configuration values are centralized.

**Key Constants:**

```typescript
// Currency configuration
import { CURRENCY } from '@/config/constants';
console.log(CURRENCY.DEFAULT); // 'SEK'

// API endpoints
import { API } from '@/config/constants';
const url = API.ENDPOINTS.ORDERS;

// Toast configuration
import { TOAST } from '@/config/constants';
const duration = TOAST.SUCCESS_DURATION; // 3000ms

// VM configuration
import { VM } from '@/config/constants';
const pollInterval = VM.STATUS_CHECK_INTERVAL; // 30000ms

// Payment configuration
import { PAYMENT } from '@/config/constants';
const razorpayColor = PAYMENT.RAZORPAY.THEME_COLOR;

// Error codes
import { ERROR_CODES } from '@/config/constants';
showErrorByCode(ERROR_CODES.VM_OFFLINE);
```

**Benefits:**
- No magic numbers in code
- Easy to update configuration
- Centralized documentation
- Type-safe constants

---

## Internationalization (i18n)

### Current Implementation

The project now has infrastructure for multi-language support using `next-intl`.

**Translation Files:**

- `src/i18n/locales/en.json` - English (default)
- `src/i18n/locales/sv.json` - Swedish
- `src/i18n/locales/hi.json` - Hindi

**Translation Structure:**

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "payment": {
    "title": "Payment",
    "selectMethod": "Select Payment Method",
    "pay": "Pay {amount}"
  },
  "errors": {
    "VM_OFFLINE": "The vending machine is currently offline...",
    "PAYMENT_FAILED": "Payment failed. Please try again..."
  },
  "toast": {
    "paymentSuccess": "Payment successful!",
    "connectionFailed": "The vending machine is currently unavailable"
  }
}
```

### How to Use Translations (Future)

Once fully integrated with components:

```typescript
import { useTranslations } from 'next-intl';

function PaymentPage() {
  const t = useTranslations('payment');

  return (
    <h1>{t('title')}</h1>
    <button>{t('pay', { amount: formatPrice(total) })}</button>
  );
}
```

### Adding a New Language

1. Create a new file: `src/i18n/locales/{locale}.json`
2. Copy structure from `en.json`
3. Translate all strings
4. Add locale to `APP_METADATA.SUPPORTED_LOCALES` in `constants.ts`

---

## Toast Notification System

### Centralized Toast Utilities (`src/lib/utils/toast.ts`)

We now use **Sonner** exclusively (Radix Toast should be removed).

**Available Functions:**

```typescript
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  updateToast,
  dismissToast,
  showErrorByCode,
  showVMStatusToast,
  showPaymentStatusToast,
  showDispensingStatusToast,
} from '@/lib/utils/toast';
```

**Basic Usage:**

```typescript
// Success message
showSuccess('Item added to cart', {
  description: 'Coca Cola - 500ml',
  duration: 3000
});

// Error message
showError('Payment failed', {
  description: 'Please try again or use a different payment method',
  duration: 7000
});

// Warning
showWarning('Machine Connection Issue', {
  description: 'Please wait before proceeding'
});

// Info
showInfo('Checking connection', {
  description: 'Verifying vending machine status...'
});
```

**Loading Toasts:**

```typescript
// Show loading toast
const toastId = showLoading('Processing payment...', {
  description: 'Please wait'
});

// Later, update it to success
updateToast(toastId, 'success', 'Payment successful!', {
  description: 'Proceeding to dispense items'
});

// Or dismiss it
dismissToast(toastId);
```

**Pre-defined Error Messages:**

```typescript
import { ERROR_CODES } from '@/config/constants';
import { showErrorByCode } from '@/lib/utils/toast';

// Show user-friendly message for known error codes
showErrorByCode('VM_OFFLINE');
// Displays: "Machine Unavailable - The vending machine is currently offline..."

showErrorByCode('PAYMENT_FAILED');
// Displays: "Payment Failed - Your payment could not be processed..."
```

**Specialized Toasts:**

```typescript
// VM status toasts
showVMStatusToast('online');   // ✓ Machine Ready
showVMStatusToast('offline');  // ✗ Machine Offline
showVMStatusToast('checking'); // Checking Connection...

// Payment status toasts
showPaymentStatusToast('processing', { amount: '₹250.00' });
showPaymentStatusToast('success', { amount: '₹250.00' });
showPaymentStatusToast('failed', { error: 'Card declined' });

// Dispensing status toasts
showDispensingStatusToast('started', 3);  // Dispensing 3 items...
showDispensingStatusToast('complete', 3); // Items Ready! Collect your 3 items
showDispensingStatusToast('failed', 3);   // Failed to dispense 3 items
```

---

## VM Status Monitoring

### useVMStatus Hook (`src/hooks/useVMStatus.ts`)

Custom hook for real-time VM connection monitoring.

**Basic Usage:**

```typescript
import { useVMStatus } from '@/hooks/useVMStatus';

function PaymentPage() {
  const {
    status,        // 'online' | 'offline' | 'checking' | 'error'
    isOnline,      // boolean
    isChecking,    // boolean
    lastSeen,      // ISO string | null
    checkStatus,   // () => Promise<void>
    retryConnection, // () => Promise<void>
  } = useVMStatus({
    storeId: 'store-123',
    vmId: 'vm-456',
    pollInterval: 30000,     // Check every 30 seconds
    showToasts: true,        // Show toast on status changes
    enabled: true,           // Enable monitoring
    onStatusChange: (status) => {
      console.log('VM status changed:', status);
    }
  });

  if (!isOnline) {
    return <div>Machine offline</div>;
  }

  return <div>Ready to accept payments</div>;
}
```

**One-Time Status Check:**

```typescript
import { useVMStatusCheck } from '@/hooks/useVMStatus';

function CheckoutButton() {
  const { checkAndWait, isChecking } = useVMStatusCheck('store-123', 'vm-456');

  const handleCheckout = async () => {
    const online = await checkAndWait();

    if (!online) {
      alert('Machine is offline');
      return;
    }

    // Proceed with checkout
  };

  return (
    <button onClick={handleCheckout} disabled={isChecking}>
      {isChecking ? 'Checking...' : 'Checkout'}
    </button>
  );
}
```

**Features:**
- Automatic periodic status checks
- Manual status checking on demand
- Configurable polling interval
- Toast notifications
- Status change callbacks
- Visibility-aware (checks when page becomes visible)
- Automatic cleanup

---

## Payment Flow with Status Checks

### Updated Payment Page (`src/app/payment/page.tsx`)

The payment page now includes:

1. **VM Status Monitoring**
   - Visual indicator showing machine online/offline
   - Automatic checks every 30 seconds
   - Retry connection button

2. **Pre-Payment Validation**
   - Check cart is not empty
   - Verify store and VM IDs exist
   - Check VM connection status
   - Validate product availability

3. **User-Friendly Messages**
   - Loading toasts during payment process
   - Success messages on completion
   - Clear error messages on failure
   - Payment cancelled notification

4. **Error Handling**
   - Network errors
   - VM offline errors
   - Payment failures
   - Verification failures

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Pay"                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Validate Prerequisites                               │
│    ✓ Payment method selected?                           │
│    ✓ Cart not empty?                                    │
│    ✓ Store ID and VM ID exist?                          │
│    ✓ VM status is online?                               │
└─────────────────────┬───────────────────────────────────┘
                      │ All checks pass
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Show Loading Toast: "Preparing your order..."       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Update Toast: "Checking Product Availability"       │
│    Call validatePrePayment()                            │
│    • Check VM connected?                                │
│    • Check products in stock?                           │
│    • Check springs operational?                         │
└─────────────────────┬───────────────────────────────────┘
                      │ Validation passes
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Update Toast: "Creating Order"                      │
│    Call createOrder()                                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Update Toast: "Opening Payment Gateway"             │
│    Create Razorpay order                                │
│    Open Razorpay checkout modal                         │
└─────────────────────┬───────────────────────────────────┘
                      │ User completes payment
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Show Toast: "Verifying Payment"                     │
│    Call verifyPayment()                                 │
└─────────────────────┬───────────────────────────────────┘
                      │ Verification successful
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Show Success Toast: "Payment Successful!"           │
│    Save order to Zustand                                │
│    Navigate to /dispensing                              │
└─────────────────────────────────────────────────────────┘
```

### Error Handling at Each Step

| Error Scenario | User Message | Action |
|---------------|--------------|---------|
| No payment method | "No Payment Method Selected" | Show warning toast |
| Cart empty | "Cart is Empty" | Show error toast, prevent proceed |
| Store ID missing | "Configuration Error" | Show error toast |
| VM ID missing | "Configuration Error" | Show error toast |
| VM offline | "Machine Unavailable" | Show error toast, allow retry |
| VM connection error | "Connection Lost" | Show error toast |
| Validation failed | "Cannot Process Order" | Show detailed errors |
| Products unavailable | "Product Unavailable" | Show validation errors |
| Payment cancelled | "Payment Cancelled" | Show warning toast |
| Payment failed | "Payment Failed" | Show error with description |
| Verification failed | "Payment Verification Failed" | Show error, contact support |

---

## Next Steps

### Immediate Actions Required

1. **Remove Radix Toast System**
   ```bash
   # Files to remove/update:
   - src/components/ui/toast.tsx
   - src/components/ui/toaster.tsx
   - src/hooks/use-toast.ts
   - Update src/app/providers.tsx to remove <Toaster />
   ```

2. **Add Error Boundaries**
   - Create `src/components/ErrorBoundary.tsx`
   - Wrap app in error boundary
   - Add specific error boundaries for critical sections

3. **Implement i18n in Components**
   - Update all components to use translation keys
   - Add language switcher component
   - Implement locale detection and switching

### Phase 2: Store Refactoring

4. **Refactor Zustand Stores**
   ```
   Current:
   - src/lib/stores/appStore.ts (monolithic)
   - src/lib/stores/cartStore.ts

   Proposed:
   - src/lib/stores/cart/cartStore.ts
   - src/lib/stores/payment/paymentStore.ts
   - src/lib/stores/order/orderStore.ts
   - src/lib/stores/ui/uiStore.ts
   - src/lib/stores/user/userStore.ts (future)
   - src/lib/stores/language/languageStore.ts (future)
   ```

5. **Add Memoized Selectors**
   ```typescript
   // Instead of:
   const items = useCartStore(state => state.items);

   // Create selectors:
   const useCartItems = () => useCartStore(useCallback(state => state.items, []));
   ```

### Phase 3: Architecture Improvements

6. **Feature-Based Structure**
   ```
   src/
   ├── features/
   │   ├── products/
   │   │   ├── components/
   │   │   ├── hooks/
   │   │   ├── api/
   │   │   └── types/
   │   ├── cart/
   │   ├── payment/
   │   ├── dispensing/
   │   └── age-verification/
   ├── shared/
   │   ├── components/
   │   ├── hooks/
   │   └── utils/
   └── app/              # Only Next.js routes
   ```

7. **Add Testing Infrastructure**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom jest
   ```

8. **Security: Move Secrets to Backend**
   - Create API routes for VM service calls
   - Remove `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET` from frontend
   - Implement server-side authentication

### Phase 4: User Authentication

9. **User Authentication System**
   - Choose auth provider (NextAuth.js, Clerk, etc.)
   - Add user store
   - Implement login/logout
   - Protected routes
   - User profile

10. **Loyalty/Rewards Program**
    - Points system
    - Discount codes
    - Purchase history

---

## Migration Guide

### For Developers: How to Adopt New Systems

#### 1. Using Constants Instead of Magic Numbers

**Before:**
```typescript
setTimeout(() => {
  // do something
}, 5000);

const currency = 'SEK';
```

**After:**
```typescript
import { TOAST, CURRENCY } from '@/config/constants';

setTimeout(() => {
  // do something
}, TOAST.DEFAULT_DURATION);

const currency = CURRENCY.DEFAULT;
```

#### 2. Using Validated Environment Variables

**Before:**
```typescript
const apiKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
```

**After:**
```typescript
import { env } from '@/config/env';

const apiKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID; // Type-safe, validated
```

#### 3. Using Toast Utilities

**Before:**
```typescript
// Inline error display
{error && <div className="error">{error}</div>}
```

**After:**
```typescript
import { showError } from '@/lib/utils/toast';

// In your handler
try {
  // ...
} catch (err) {
  showError('Operation Failed', {
    description: err.message,
    duration: 7000
  });
}
```

#### 4. Using VM Status Hook

**Before:**
```typescript
// Manual status checking
const [vmOnline, setVmOnline] = useState(false);

useEffect(() => {
  const checkStatus = async () => {
    const result = await fetch(`/api/vm/status`);
    setVmOnline(result.connected);
  };

  const interval = setInterval(checkStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

**After:**
```typescript
import { useVMStatus } from '@/hooks/useVMStatus';

const { isOnline, status } = useVMStatus({
  storeId,
  vmId,
  pollInterval: 30000,
  showToasts: true
});
```

---

## Code Style Guidelines

### 1. File Headers

Add descriptive headers to all new files:

```typescript
/**
 * Component Name
 *
 * Brief description of what this component does.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 *
 * @module path/to/file
 */
```

### 2. Function Comments

```typescript
/**
 * Brief description of the function
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 *
 * @example
 * ```typescript
 * const result = myFunction('value');
 * ```
 */
export function myFunction(paramName: string): ReturnType {
  // Implementation
}
```

### 3. Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase (`const myVariable`)
- **Constants**: UPPER_SNAKE_CASE (`const MAX_RETRIES`)
- **Components**: PascalCase (`function MyComponent()`)
- **Hooks**: camelCase with `use` prefix (`function useMyHook()`)
- **Types**: PascalCase (`type MyType`, `interface MyInterface`)

### 4. SOLID Principles

**Single Responsibility:** Each module does one thing well
```typescript
// ❌ Bad: Component handles data fetching, state, and UI
// ✅ Good: Separate hook for data, component for UI
```

**Open/Closed:** Open for extension, closed for modification
```typescript
// ✅ Use configuration objects, not hardcoded values
```

**Liskov Substitution:** Subtypes must be substitutable
```typescript
// ✅ Consistent interfaces for similar components
```

**Interface Segregation:** Don't depend on unused interfaces
```typescript
// ✅ Create specific prop types, not giant "all props" interfaces
```

**Dependency Inversion:** Depend on abstractions
```typescript
// ✅ Use hooks and utilities, not direct API calls in components
```

---

## Troubleshooting

### Common Issues

**1. Environment Variable Not Found**

```
Error: Environment variable validation failed:
  - NEXT_PUBLIC_VM_SERVICE_URL: Required
```

**Solution:** Check your `.env` file and ensure all required variables are set.

**2. Toast Not Showing**

**Solution:** Ensure `<Sonner />` is in your providers:
```typescript
// src/app/providers.tsx
import { Toaster as Sonner } from '@/components/ui/sonner';

export function Providers({ children }) {
  return (
    <>
      <Sonner />
      {children}
    </>
  );
}
```

**3. VM Status Always "Checking"**

**Solution:** Verify store ID and VM ID are valid:
```typescript
console.log('Store ID:', storeId);
console.log('VM ID:', vmId);
```

**4. TypeScript Errors After Updates**

**Solution:** Rebuild the project:
```bash
rm -rf .next
npm run dev
```

---

## Performance Considerations

### 1. VM Status Polling

Current implementation polls every 30 seconds. For production, consider:

- **WebSocket connection** for real-time updates
- **Exponential backoff** for offline VMs
- **Conditional polling** (only when page is visible)

### 2. Translation Bundle Size

- Currently loads all translations at once
- Future: Lazy load translations per language
- Use dynamic imports for non-default languages

### 3. Toast Limits

- Maximum 3 toasts shown simultaneously (configured in `TOAST.MAX_TOASTS`)
- Older toasts automatically dismissed
- Avoid showing too many toasts rapidly

---

## Security Notes

### Current Security Concerns

⚠️ **CLIENT_SECRET in Frontend**
- `NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET` is exposed in frontend
- **Action Required:** Move to backend API route
- Create Next.js API route proxy for VM service calls

### Recommendations

1. **Move authentication to backend**
   ```typescript
   // pages/api/vm/[...path].ts
   export default async function handler(req, res) {
     const token = await getServerSideToken();
     const response = await fetch(vmServiceUrl, {
       headers: { Authorization: `Bearer ${token}` }
     });
     return res.json(await response.json());
   }
   ```

2. **Implement rate limiting**
   - Use middleware to limit API calls
   - Prevent abuse of payment endpoints

3. **Validate all inputs**
   - Use Zod schemas for request validation
   - Sanitize user inputs

---

## Conclusion

The Vamo Store project now has a solid foundation for scaling:

✅ Centralized configuration
✅ Multi-language support infrastructure
✅ User-friendly error handling
✅ Real-time VM monitoring
✅ Improved payment flow
✅ Type-safe environment variables
✅ Comprehensive documentation

**Next priorities:**
1. Remove duplicate toast system
2. Add error boundaries
3. Implement translations in all components
4. Refactor stores into slices
5. Move secrets to backend

For questions or issues, please refer to the relevant sections in this guide or check the inline code documentation.

---

**Last Updated:** 2026-01-19
**Version:** 1.0.0
**Contributors:** Claude Code
