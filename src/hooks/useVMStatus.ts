/**
 * VM Status Hook
 *
 * Custom hook for monitoring vending machine connection status.
 * Provides real-time status updates and automatic reconnection handling.
 *
 * @module hooks/useVMStatus
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getConnectionStatus } from '@/lib/api/vmService';
import { VM } from '@/config/constants';
import { showVMStatusToast } from '@/lib/utils/toast';

/**
 * VM connection status types
 */
export type VMStatus = 'online' | 'offline' | 'checking' | 'error';

/**
 * VM status hook return type
 */
export interface UseVMStatusReturn {
  /** Current VM connection status */
  status: VMStatus;
  /** Whether the VM is currently online */
  isOnline: boolean;
  /** Whether a status check is in progress */
  isChecking: boolean;
  /** Last time the VM was seen online (ISO string) */
  lastSeen: string | null;
  /** Error message if status check failed */
  error: string | null;
  /** Manually trigger a status check */
  checkStatus: () => Promise<void>;
  /** Retry connection after failure */
  retryConnection: () => Promise<void>;
}

/**
 * Hook configuration options
 */
export interface UseVMStatusOptions {
  /** Store ID to check */
  storeId: string;
  /** VM ID to check */
  vmId: string;
  /** Auto-check interval in milliseconds (default: 30s, 0 to disable) */
  pollInterval?: number;
  /** Show toast notifications on status changes */
  showToasts?: boolean;
  /** Callback when status changes */
  onStatusChange?: (status: VMStatus) => void;
  /** Enable automatic status checking */
  enabled?: boolean;
}

/**
 * Custom hook for monitoring VM connection status
 *
 * Features:
 * - Automatic periodic status checks
 * - Manual status checking
 * - Connection retry logic
 * - Toast notifications for status changes
 * - Automatic cleanup on unmount
 *
 * @param options - Hook configuration options
 * @returns VM status information and control functions
 *
 * @example
 * ```tsx
 * function PaymentPage() {
 *   const { status, isOnline, checkStatus } = useVMStatus({
 *     storeId: 'store-123',
 *     vmId: 'vm-456',
 *     pollInterval: 30000,
 *     showToasts: true,
 *   });
 *
 *   if (!isOnline) {
 *     return <div>Vending machine is offline</div>;
 *   }
 *
 *   return <PaymentForm />;
 * }
 * ```
 */
export function useVMStatus({
  storeId,
  vmId,
  pollInterval = VM.STATUS_CHECK_INTERVAL,
  showToasts = true,
  onStatusChange,
  enabled = true,
}: UseVMStatusOptions): UseVMStatusReturn {
  const [status, setStatus] = useState<VMStatus>('checking');
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previousStatusRef = useRef<VMStatus>('checking');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  /**
   * Update status and trigger notifications/callbacks
   */
  const updateStatus = useCallback(
    (newStatus: VMStatus, lastSeenTime?: string, errorMessage?: string) => {
      const previousStatus = previousStatusRef.current;

      // Update state
      setStatus(newStatus);
      setLastSeen(lastSeenTime || null);
      setError(errorMessage || null);

      // Only show toast if status actually changed
      if (showToasts && newStatus !== previousStatus && newStatus !== 'checking') {
        // Don't show toast on initial load if already online
        if (!(previousStatus === 'checking' && newStatus === 'online')) {
          showVMStatusToast(newStatus === 'online' ? 'online' : 'offline');
        }
      }

      // Trigger callback if provided
      if (onStatusChange && newStatus !== previousStatus) {
        onStatusChange(newStatus);
      }

      previousStatusRef.current = newStatus;
    },
    [showToasts, onStatusChange]
  );

  /**
   * Check VM connection status
   */
  const checkStatus = useCallback(async (): Promise<void> => {
    // Prevent concurrent checks
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    updateStatus('checking');

    try {
      const response = await getConnectionStatus(storeId, vmId);

      if (response.connected) {
        updateStatus('online', response.last_seen);
      } else {
        updateStatus('offline', response.last_seen);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check VM status';
      updateStatus('error', undefined, errorMessage);

      // Log error for debugging
      console.error('[useVMStatus] Status check failed:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [storeId, vmId, updateStatus]);

  /**
   * Retry connection - manually trigger a status check
   */
  const retryConnection = useCallback(async (): Promise<void> => {
    if (showToasts) {
      showVMStatusToast('checking');
    }
    await checkStatus();
  }, [checkStatus, showToasts]);

  /**
   * Set up automatic polling
   */
  useEffect(() => {
    // Don't poll if disabled or no poll interval
    if (!enabled || pollInterval <= 0) {
      return;
    }

    // Initial check
    checkStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      checkStatus();
    }, pollInterval);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, pollInterval, checkStatus]);

  /**
   * Handle visibility change - check status when page becomes visible
   */
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkStatus]);

  return {
    status,
    isOnline: status === 'online',
    isChecking: status === 'checking',
    lastSeen,
    error,
    checkStatus,
    retryConnection,
  };
}

/**
 * Hook for one-time VM status check (no polling)
 *
 * Useful for checking status before critical operations like payment.
 *
 * @param storeId - Store ID
 * @param vmId - VM ID
 * @returns Status check function and result
 *
 * @example
 * ```tsx
 * const { checkAndWait, isOnline, isChecking } = useVMStatusCheck('store-123', 'vm-456');
 *
 * async function handlePayment() {
 *   const online = await checkAndWait();
 *   if (!online) {
 *     showError('VM is offline');
 *     return;
 *   }
 *   // Proceed with payment...
 * }
 * ```
 */
export function useVMStatusCheck(storeId: string, vmId: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check status and wait for result
   * @returns true if online, false otherwise
   */
  const checkAndWait = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await getConnectionStatus(storeId, vmId);
      setIsOnline(response.connected);
      return response.connected;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Status check failed';
      setError(errorMessage);
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [storeId, vmId]);

  return {
    checkAndWait,
    isChecking,
    isOnline,
    error,
  };
}
