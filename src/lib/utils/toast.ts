/**
 * Toast Notification Utilities
 *
 * Centralized toast notification system using Sonner.
 * Provides type-safe, user-friendly toast messages with i18n support.
 *
 * @module lib/utils/toast
 */

import { toast as sonnerToast } from 'sonner';
import { TOAST, ERROR_CODES, type ErrorCode } from '@/config/constants';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Toast configuration options
 */
export interface ToastOptions {
  /** Duration in milliseconds (overrides default) */
  duration?: number;
  /** Custom description text */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Cancel button configuration */
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

/**
 * Show a success toast notification
 *
 * @param message - Main message to display
 * @param options - Additional toast options
 *
 * @example
 * showSuccess('Item added to cart', {
 *   description: 'Coca Cola - 500ml',
 *   duration: 3000
 * });
 */
export function showSuccess(message: string, options?: ToastOptions): void {
  sonnerToast.success(message, {
    duration: options?.duration ?? TOAST.SUCCESS_DURATION,
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Show an error toast notification
 *
 * Automatically displays user-friendly error messages based on error codes.
 * Falls back to generic error message if code is unknown.
 *
 * @param message - Main error message to display
 * @param options - Additional toast options
 *
 * @example
 * showError('Payment failed', {
 *   description: 'Please try again or use a different payment method',
 *   duration: 7000
 * });
 */
export function showError(message: string, options?: ToastOptions): void {
  sonnerToast.error(message, {
    duration: options?.duration ?? TOAST.ERROR_DURATION,
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Show a warning toast notification
 *
 * @param message - Main warning message to display
 * @param options - Additional toast options
 *
 * @example
 * showWarning('Some items may be out of stock', {
 *   description: 'Please review your cart'
 * });
 */
export function showWarning(message: string, options?: ToastOptions): void {
  sonnerToast.warning(message, {
    duration: options?.duration ?? TOAST.WARNING_DURATION,
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Show an info toast notification
 *
 * @param message - Main info message to display
 * @param options - Additional toast options
 *
 * @example
 * showInfo('Vending machine is online', {
 *   description: 'You can now proceed with your purchase'
 * });
 */
export function showInfo(message: string, options?: ToastOptions): void {
  sonnerToast.info(message, {
    duration: options?.duration ?? TOAST.DEFAULT_DURATION,
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Show a loading toast notification
 *
 * Returns a toast ID that can be used to dismiss or update the toast later.
 *
 * @param message - Main loading message to display
 * @param options - Additional toast options
 * @returns Toast ID for updating/dismissing
 *
 * @example
 * const loadingToast = showLoading('Processing payment...');
 * // Later...
 * dismissToast(loadingToast);
 */
export function showLoading(
  message: string,
  options?: Omit<ToastOptions, 'duration'>
): string | number {
  return sonnerToast.loading(message, {
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Dismiss a specific toast by ID
 *
 * @param toastId - ID of the toast to dismiss
 *
 * @example
 * const toastId = showLoading('Processing...');
 * dismissToast(toastId);
 */
export function dismissToast(toastId: string | number): void {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all active toasts
 *
 * @example
 * dismissAllToasts();
 */
export function dismissAllToasts(): void {
  sonnerToast.dismiss();
}

/**
 * Update an existing toast
 *
 * Useful for converting loading toasts to success/error toasts.
 *
 * @param toastId - ID of the toast to update
 * @param type - New toast type
 * @param message - New message
 * @param options - Additional toast options
 *
 * @example
 * const toastId = showLoading('Processing payment...');
 * // Later...
 * updateToast(toastId, 'success', 'Payment successful!');
 */
export function updateToast(
  toastId: string | number,
  type: Exclude<ToastType, 'loading'>,
  message: string,
  options?: ToastOptions
): void {
  const toastFn = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
  }[type];

  toastFn(message, {
    id: toastId,
    duration: options?.duration ?? TOAST.DEFAULT_DURATION,
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Show error toast with predefined error code
 *
 * Maps error codes to user-friendly messages (will be i18n in future).
 *
 * @param errorCode - Error code from ERROR_CODES constant
 * @param customMessage - Optional custom message to override default
 *
 * @example
 * showErrorByCode('VM_OFFLINE');
 * // Shows: "The vending machine is currently offline. Please try again later."
 */
export function showErrorByCode(
  errorCode: ErrorCode,
  customMessage?: string
): void {
  // Error messages mapping (will be replaced with i18n)
  const errorMessages: Record<ErrorCode, { title: string; description?: string }> = {
    NETWORK_ERROR: {
      title: 'Connection Problem',
      description: 'Unable to connect. Please check your internet connection.',
    },
    VM_OFFLINE: {
      title: 'Machine Unavailable',
      description: 'The vending machine is currently offline. Please try again later.',
    },
    VM_DISCONNECTED: {
      title: 'Connection Lost',
      description: 'Lost connection to the vending machine. Reconnecting...',
    },
    PAYMENT_FAILED: {
      title: 'Payment Failed',
      description: 'Your payment could not be processed. Please try again.',
    },
    PAYMENT_VERIFICATION_FAILED: {
      title: 'Payment Verification Failed',
      description: 'We could not verify your payment. Please contact support.',
    },
    DISPENSE_FAILED: {
      title: 'Dispensing Failed',
      description: 'Failed to dispense items. Please contact support.',
    },
    PRODUCT_UNAVAILABLE: {
      title: 'Product Unavailable',
      description: 'Some products are no longer available.',
    },
    CART_EMPTY: {
      title: 'Cart is Empty',
      description: 'Please add items before proceeding.',
    },
    AGE_VERIFICATION_REQUIRED: {
      title: 'Age Verification Required',
      description: 'Some items require age verification.',
    },
    INVALID_ORDER: {
      title: 'Invalid Order',
      description: 'There was a problem with your order. Please try again.',
    },
    SESSION_EXPIRED: {
      title: 'Session Expired',
      description: 'Your session has expired. Please start over.',
    },
  };

  const errorInfo = errorMessages[errorCode] || {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
  };

  showError(customMessage || errorInfo.title, {
    description: errorInfo.description,
  });
}

/**
 * Show VM status toast notifications
 *
 * Provides user-friendly messages for VM connection status changes.
 *
 * @param status - 'online' | 'offline' | 'checking'
 *
 * @example
 * showVMStatusToast('online');
 * // Shows: "✓ Vending machine is online and ready"
 */
export function showVMStatusToast(
  status: 'online' | 'offline' | 'checking' | 'reconnecting'
): void {
  switch (status) {
    case 'online':
      showSuccess('Machine Ready', {
        description: 'The vending machine is online and ready for orders.',
        duration: 3000,
      });
      break;

    case 'offline':
      showError('Machine Offline', {
        description: 'The vending machine is currently unavailable. Please try again later.',
      });
      break;

    case 'checking':
      showInfo('Checking Connection', {
        description: 'Verifying vending machine status...',
        duration: 2000,
      });
      break;

    case 'reconnecting':
      showWarning('Reconnecting', {
        description: 'Trying to reconnect to the vending machine...',
      });
      break;
  }
}

/**
 * Show payment status toast notifications
 *
 * @param status - 'processing' | 'success' | 'failed'
 * @param details - Optional additional details
 *
 * @example
 * showPaymentStatusToast('success', { amount: '₹250.00' });
 */
export function showPaymentStatusToast(
  status: 'processing' | 'success' | 'failed' | 'verifying',
  details?: { amount?: string; method?: string; error?: string }
): void {
  switch (status) {
    case 'processing':
      showLoading('Processing Payment', {
        description: details?.amount ? `Amount: ${details.amount}` : undefined,
      });
      break;

    case 'verifying':
      showLoading('Verifying Payment', {
        description: 'Please wait while we confirm your payment...',
      });
      break;

    case 'success':
      showSuccess('Payment Successful!', {
        description: details?.amount
          ? `${details.amount} paid successfully`
          : 'Your payment was processed successfully',
        duration: 5000,
      });
      break;

    case 'failed':
      showError('Payment Failed', {
        description:
          details?.error || 'Your payment could not be processed. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => {
            // This will be handled by the component
          },
        },
      });
      break;
  }
}

/**
 * Show dispensing status toast notifications
 *
 * @param status - 'started' | 'complete' | 'failed'
 * @param itemCount - Number of items being dispensed
 *
 * @example
 * showDispensingStatusToast('complete', 3);
 * // Shows: "Items Ready! Please collect your 3 items from the machine."
 */
export function showDispensingStatusToast(
  status: 'started' | 'complete' | 'failed',
  itemCount?: number
): void {
  const itemText = itemCount
    ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
    : 'items';

  switch (status) {
    case 'started':
      showInfo('Dispensing Items', {
        description: `Please wait while we prepare your ${itemText}...`,
      });
      break;

    case 'complete':
      showSuccess('Items Ready!', {
        description: `Please collect your ${itemText} from the machine.`,
        duration: 10000,
      });
      break;

    case 'failed':
      showError('Dispensing Failed', {
        description: `Failed to dispense ${itemText}. Please contact support.`,
        duration: 10000,
      });
      break;
  }
}
