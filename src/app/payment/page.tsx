'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PaymentOption } from '@/components/payment/PaymentOption';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAppStore } from '@/lib/stores/appStore';
import { formatPrice } from '@/lib/utils/formatters';
import { PaymentMethod } from '@/lib/types';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  validatePrePayment,
  type CreateOrderRequest,
  type OrderItem,
} from '@/lib/api/vmService';

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

  const handlePay = async () => {
    if (!selectedPaymentMethod) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validate we have required data
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Get store ID and VM ID from first product (all products should be from same store/VM)
      const firstProduct = items[0].product;
      const storeId = firstProduct.storeId || storeIdFromStore;
      const vmId = firstProduct.vmId;

      if (!storeId) {
        throw new Error('Store ID not found. Please go back to products page.');
      }

      if (!vmId) {
        throw new Error('VM ID not found. Products may not be properly loaded from VM service.');
      }

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
      const validationResult = await validatePrePayment(createOrderRequest);



      console.log('Validated report:',validationResult);

      if (!validationResult.data.valid) {
        // Show validation errors to user
        const errorMessage = validationResult.data.message || 'Order validation failed';
        const detailedErrors = validationResult.data.errors?.join(', ') || errorMessage;

        setError(detailedErrors);
        setIsLoading(false);
        return;
      }

      // Check VM connection status specifically
      if (!validationResult.data.vm_connected) {
        setError('Vending machine is not connected. Please try again later.');
        setIsLoading(false);
        return;
      }

      console.log('Order validation passed. Proceeding to create order...');

      // Step 2: Create order in backend
      const orderResponse = await createOrder(createOrderRequest);
      console.log('Order created:', orderResponse.data);

      // Handle different payment methods
      if (selectedPaymentMethod === 'razorpay') {
        // Step 3: Create Razorpay order
        const razorpayOrderResponse = await createRazorpayOrder(orderResponse.data.id);
        console.log('Razorpay order created:', razorpayOrderResponse);

        // Step 4: Get Razorpay key from environment
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
          throw new Error('Razorpay key not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to environment variables.');
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

            // Step 6: Verify payment
            const verifyResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log('Payment verified:', verifyResponse);

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
            setError(err.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#4A90D9',
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled by user');
            setIsLoading(false);
          },
        },
      };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error);
          setIsLoading(false);
          setError(response.error.description || 'Payment failed. Please try again.');
        });
        razorpay.open();
      } else if (selectedPaymentMethod === 'swish' || selectedPaymentMethod === 'card') {
        // For Swish and Card, mark order as paid and proceed to dispensing
        // Note: These payment methods may need separate integration
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

        // Clear cart
        clearCart();

        // Navigate to dispensing page
        setIsLoading(false);
        router.push('/dispensing');
      } else {
        throw new Error(`Payment method ${selectedPaymentMethod} is not yet implemented`);
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setIsLoading(false);
      setError(err.message || 'Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Payment" showBack showClose variant="white" />

      <main className="p-4 pb-32">
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
