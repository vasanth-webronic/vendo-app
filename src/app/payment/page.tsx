/**
 * Payment Page Component
 *
 * Handles payment method selection and payment processing.
 * Includes VM status checking and user-friendly error messages.
 *
 * Features:
 * - VM connection status monitoring
 * - Pre-payment validation
 * - Multiple payment methods (Razorpay, Swish, Card)
 * - User-friendly toast notifications
 * - Error handling and recovery
 *
 * @module app/payment/page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PaymentOption } from '@/components/payment/PaymentOption';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAppStore } from '@/lib/stores/appStore';
import { formatPrice } from '@/lib/utils/formatters';
import { PaymentMethod } from '@/lib/types';
import { ShoppingCart, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  validatePrePayment,
  type CreateOrderRequest,
  type OrderItem,
} from '@/lib/api/vmService';
import { useVMStatus } from '@/hooks/useVMStatus';
import {
  showError,
  showSuccess,
  showWarning,
  showPaymentStatusToast,
  showErrorByCode,
  showLoading,
  updateToast,
} from '@/lib/utils/toast';
import { env } from '@/config/env';
import { PAYMENT } from '@/config/constants';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const {
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    setCurrentOrder,
    setIsLoading,
    storeId: storeIdFromStore,
  } = useAppStore();

  const [error, setError] = useState<string | null>(null);

  const total = getTotal();

  // Get store ID and VM ID from first product
  const firstProduct = items[0]?.product;
  const storeId = firstProduct?.storeId || storeIdFromStore;
  const vmId = firstProduct?.vmId;

  // Monitor VM connection status
  const {
    status: vmStatus,
    isOnline: vmIsOnline,
    lastSeen,
    retryConnection,
  } = useVMStatus({
    storeId: storeId || '',
    vmId: vmId || '',
    pollInterval: 30000, // Check every 30 seconds
    showToasts: false, // We'll handle toasts manually
    enabled: !!storeId && !!vmId, // Only enable if we have valid IDs
  });

  // Show warning if VM goes offline
  useEffect(() => {
    if (vmStatus === 'offline') {
      showWarning('Machine Connection Issue', {
        description: 'The vending machine connection is unstable. Please wait before proceeding.',
        duration: 7000,
      });
    }
  }, [vmStatus]);

  const handlePay = async () => {
    if (!selectedPaymentMethod) {
      showWarning('No Payment Method Selected', {
        description: 'Please select a payment method to continue.',
      });
      return;
    }

    // Track loading toast
    let loadingToastId: string | number | null = null;

    try {
      setIsLoading(true);
      setError(null);

      // Validate we have required data
      if (items.length === 0) {
        showErrorByCode('CART_EMPTY');
        setIsLoading(false);
        return;
      }

      if (!storeId) {
        showError('Configuration Error', {
          description: 'Store information is missing. Please reload the page.',
        });
        setIsLoading(false);
        return;
      }

      if (!vmId) {
        showError('Configuration Error', {
          description: 'Vending machine information is missing. Please reload the page.',
        });
        setIsLoading(false);
        return;
      }

      // Check VM connection status before proceeding
      if (vmStatus === 'offline') {
        showErrorByCode('VM_OFFLINE');
        setError('The vending machine is currently offline. Please try again later.');
        setIsLoading(false);
        return;
      }

      if (vmStatus === 'error') {
        showErrorByCode('VM_DISCONNECTED');
        setError('Cannot verify machine connection. Please try again.');
        setIsLoading(false);
        return;
      }

      // Show loading toast
      loadingToastId = showLoading('Preparing your order...', {
        description: 'Validating products and machine status',
      });

      console.log('Creating order for store:', storeId, 'VM:', vmId);

      // Prepare order items
      const orderItems: OrderItem[] = items.map((item) => ({
        spring_id: item.product.id,
        selection_number: item.product.selectionNumber?.toString() || '0',
        quantity: item.quantity,
        unit_price: item.product.price,
        tax_rate: item.product.taxRate,
      }));

      const createOrderRequest: CreateOrderRequest = {
        store_id: storeId,
        vm_id: vmId,
        items: orderItems,
        metadata: {
          payment_method: selectedPaymentMethod,
        },
      };

      // Step 1: Validate order before payment
      console.log('Validating order before payment...');

      // Update loading toast
      if (loadingToastId) {
        updateToast(loadingToastId, 'info', 'Checking Product Availability', {
          description: 'Verifying all products are in stock...',
        });
      }

      const validationResult = await validatePrePayment(createOrderRequest);

      console.log('Validated report:', validationResult);

      if (!validationResult.data.valid) {
        // Dismiss loading toast
        if (loadingToastId) updateToast(loadingToastId, 'error', 'Validation Failed');

        // Show validation errors to user
        const errorMessage = validationResult.data.message || 'Order validation failed';
        const detailedErrors = validationResult.data.errors?.join(', ') || errorMessage;

        showError('Cannot Process Order', {
          description: detailedErrors,
          duration: 8000,
        });

        setError(detailedErrors);
        setIsLoading(false);
        return;
      }

      // Check VM connection status specifically
      if (!validationResult.data.vm_connected) {
        if (loadingToastId) updateToast(loadingToastId, 'error', 'Machine Offline');

        showErrorByCode('VM_OFFLINE');
        setError('The vending machine is currently offline. Please try again later.');
        setIsLoading(false);
        return;
      }

      console.log('Order validation passed. Proceeding to create order...');

      // Update loading toast for payment processing
      if (loadingToastId) {
        updateToast(loadingToastId, 'info', 'Creating Order', {
          description: 'Setting up your payment...',
        });
      }

      // Step 2: Create order in backend
      const orderResponse = await createOrder(createOrderRequest);
      console.log('Order created:', orderResponse.data);

      // Handle different payment methods
      if (selectedPaymentMethod === 'razorpay') {
        // Step 3: Create Razorpay order
        if (loadingToastId) {
          updateToast(loadingToastId, 'info', 'Opening Payment Gateway', {
            description: 'Redirecting to Razorpay...',
          });
        }

        const razorpayOrderResponse = await createRazorpayOrder(orderResponse.data.id);
        console.log('Razorpay order created:', razorpayOrderResponse);

        // Dismiss loading toast before opening Razorpay
        if (loadingToastId) {
          updateToast(loadingToastId, 'success', 'Ready for Payment', {
            duration: 2000,
          });
        }

        // Step 4: Get Razorpay key from validated environment
        const razorpayKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
          showError('Configuration Error', {
            description: 'Payment gateway is not properly configured.',
          });
          throw new Error('Razorpay key not configured');
        }

        // Step 5: Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: razorpayOrderResponse.amount, // Amount in paise
        currency: razorpayOrderResponse.currency,
        name: 'Vamo Store',
        description: `Order ${razorpayOrderResponse.order_number}`,
        order_id: razorpayOrderResponse.razorpay_order_id,
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...', response);

            // Show verifying toast
            const verifyToastId = showLoading('Verifying Payment', {
              description: 'Please wait while we confirm your payment...',
            });

            // Step 6: Verify payment
            const verifyResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log('Payment verified:', verifyResponse);

            // Update toast to success
            updateToast(verifyToastId, 'success', 'Payment Successful!', {
              description: 'Preparing to dispense your items...',
              duration: 3000,
            });

            // Store order data for dispensing page
            setCurrentOrder({
              id: verifyResponse.data.id,
              items: items.map((item) => ({
                productId: item.product.id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                taxRate: item.product.taxRate,
                depositAmount: item.product.depositAmount,
              })),
              totalAmount: total,
              paymentMethod: selectedPaymentMethod,
              paymentDate: new Date(),
              referenceNumber: verifyResponse.data.razorpay_payment_id || '',
              dispensed: false,
            });

            // Clear cart
            // clearCart();

            // Navigate to dispensing page
            setIsLoading(false);
            router.push('/dispensing');
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            setIsLoading(false);

            // Show error toast
            showErrorByCode('PAYMENT_VERIFICATION_FAILED');
            setError(err.message || 'Payment verification failed. Please contact support with your payment details.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: PAYMENT.RAZORPAY.THEME_COLOR,
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled by user');
            showWarning('Payment Cancelled', {
              description: 'You cancelled the payment. Your items are still in the cart.',
            });
            setIsLoading(false);
          },
        },
      };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error);
          setIsLoading(false);

          // Show user-friendly error message
          showError('Payment Failed', {
            description: response.error.description || 'Your payment could not be processed. Please try again.',
            duration: 7000,
          });
          setError(response.error.description || 'Payment failed. Please try again with a different method.');
        });
        razorpay.open();
      } else if (selectedPaymentMethod === 'swish' || selectedPaymentMethod === 'card') {
        // For Swish and Card, show not implemented message
        if (loadingToastId) {
          updateToast(loadingToastId, 'error', 'Not Available', {
            description: `${selectedPaymentMethod === 'swish' ? 'Swish' : 'Card'} payment is coming soon!`,
          });
        } else {
          showWarning('Payment Method Not Available', {
            description: `${selectedPaymentMethod === 'swish' ? 'Swish' : 'Card'} payment will be available soon. Please try Razorpay.`,
            duration: 5000,
          });
        }

        setError(`${selectedPaymentMethod === 'swish' ? 'Swish' : 'Card'} payment is not yet available. Please use Razorpay.`);
        setIsLoading(false);

        // Note: Uncomment below when these payment methods are integrated
        /*
        setCurrentOrder({
          id: orderResponse.data.id,
          items: items.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            taxRate: item.product.taxRate,
            depositAmount: item.product.depositAmount,
          })),
          totalAmount: total,
          paymentMethod: selectedPaymentMethod,
          paymentDate: new Date(),
          referenceNumber: `ORDER-${orderResponse.data.order_number}`,
          dispensed: false,
        });

        clearCart();
        setIsLoading(false);
        router.push('/dispensing');
        */
      } else {
        throw new Error(`Payment method ${selectedPaymentMethod} is not supported`);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setIsLoading(false);

      // Show error toast if not already shown
      const errorMessage = err.message || 'An unexpected error occurred';
      if (!errorMessage.includes('not yet available') && !errorMessage.includes('not supported')) {
        showError('Payment Error', {
          description: errorMessage,
          duration: 7000,
        });
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Payment" showBack showClose variant="white" />

      <main className="p-4 pb-32">
        {/* VM Status Indicator */}
        {vmStatus !== 'checking' && (
          <div
            className={`rounded-xl p-3 mb-4 flex items-center gap-3 ${
              vmStatus === 'online'
                ? 'bg-green-50 border border-green-200 hidden'
                : vmStatus === 'offline'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            {vmStatus === 'online' ? (
              <Wifi className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  vmStatus === 'online' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {vmStatus === 'online'
                  ? 'Vending Machine Online'
                  : vmStatus === 'offline'
                  ? 'Vending Machine Offline'
                  : 'Connection Error'}
              </p>
              {vmStatus === 'offline' && (
                <button
                  onClick={retryConnection}
                  className="text-xs text-red-600 underline mt-1"
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Total Amount Card */}
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-price">{formatPrice(total)}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="mb-6">
          <h2 className="text-center text-muted-foreground mb-4">
            Select a Payment Method
          </h2>
          
          <div className="space-y-3">
            <PaymentOption
              method="swish"
              selected={selectedPaymentMethod === 'swish'}
              onSelect={setSelectedPaymentMethod}
            />
            <PaymentOption
              method="card"
              selected={selectedPaymentMethod === 'card'}
              onSelect={setSelectedPaymentMethod}
            />
            <PaymentOption
              method="razorpay"
              selected={selectedPaymentMethod === 'razorpay'}
              onSelect={setSelectedPaymentMethod}
            />
          </div>
        </div>
      </main>
      
      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background safe-bottom">
        <button
          onClick={handlePay}
          disabled={!selectedPaymentMethod}
          className="vm-btn-primary"
        >
          {selectedPaymentMethod === 'razorpay' && 'Pay with Razorpay'}
          {selectedPaymentMethod === 'swish' && 'Pay with Swish'}
          {selectedPaymentMethod === 'card' && 'Pay with Card'}
          {!selectedPaymentMethod && 'Select Payment Method'}
        </button>
      </div>
    </div>
  );
}
