'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAppStore } from '@/lib/stores/appStore';
import {
  dispenseProduct,
  initiateDispense,
  updateDispenseStatus,
  completeDispense,
  createRefund,
  processRefund,
  getOrder,
  type Order as BackendOrder,
} from '@/lib/api/vmService';
import { AlertCircle, Package } from 'lucide-react';

export default function DispensingPage() {
  const router = useRouter();
  const { items, getTotalItems, clearCart } = useCartStore();
  const { 
    storeId, 
    currentOrder, 
    setCurrentOrder, 
    setIsDispensing, 
    setDispensedCount 
  } = useAppStore();
  const [phase, setPhase] = useState<'ready' | 'dispensing' | 'complete' | 'partial'>('ready');
  const [dispensedItems, setDispensedItems] = useState(0);
  const [failedItems, setFailedItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const totalItems = getTotalItems();

  const handleCollect = async () => {
    // Validate store ID
    if (!storeId) {
      setError('Store ID is missing. Please go back and try again.');
      return;
    }

    // Validate we have an order ID
    if (!currentOrder?.id) {
      setError('Order information missing. Please go back and try the payment again.');
      return;
    }

    setPhase('dispensing');
    setIsDispensing(true);
    setError(null);
    setFailedItems([]);

    try {
      const failedProducts: any[] = [];
      const failedItemsForRefund: any[] = [];
      let successCount = 0;

      // Step 1: Initiate dispense process in backend
      console.log('Initiating dispense for order:', currentOrder.id);
      await initiateDispense(currentOrder.id);

      // Step 2: Get the order details to get item IDs
      const backendOrder: BackendOrder = await getOrder(currentOrder.id);
      const orderItems = backendOrder.items || [];

      console.log('Order items from backend:', orderItems);

      // Step 3: Dispense each product one by one
      for (const cartItem of items) {
        const product = cartItem.product;

        // Find matching order item from backend
        const orderItem = orderItems.find((item: any) => item.spring_id === product.id);
        if (!orderItem) {
          console.error('Order item not found in backend for product:', product.id);
          failedProducts.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            taxRate: product.taxRate,
            reason: 'Order item not found',
          });
          continue;
        }

        // Validate product has required fields for dispense
        if (!product.selectionNumber || !product.vmId || !product.storeId) {
          console.error('Product missing required fields:', product);
          failedProducts.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            taxRate: product.taxRate,
            reason: 'Missing required product information',
          });
          // Update backend status
          await updateDispenseStatus(currentOrder.id, orderItem.id, 'failed', 'Missing required product information');
          continue;
        }

        // Use storeId from store (Zustand) - it's the source of truth
        const productStoreId = storeId || product.storeId;
        const vmId = product.vmId;

        // Dispense each quantity
        for (let i = 0; i < cartItem.quantity; i++) {
          try {
            console.log(`Dispensing product: ${product.name} (selection: ${product.selectionNumber}, vm: ${vmId}, store: ${productStoreId})`);

            const response = await dispenseProduct(
              productStoreId,
              vmId,
              {
                selection_number: product.selectionNumber,
                spring_id: product.id,
                products: [{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                }],
                metadata: {
                  orderId: currentOrder?.id,
                  itemId: orderItem.id,
                  timestamp: new Date().toISOString(),
                },
              }
            );

            if (response.success) {
              successCount++;
              setDispensedItems(successCount);
              setDispensedCount(successCount);

              // Update backend status for success
              await updateDispenseStatus(currentOrder.id, orderItem.id, 'success');
            } else {
              const errorMsg = response.message || 'Dispense failed';
              console.error('Dispense failed for product:', product.name, errorMsg);

              failedProducts.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                taxRate: product.taxRate,
                reason: errorMsg,
              });

              failedItemsForRefund.push({
                product_name: product.name,
                selection_number: product.selectionNumber.toString(),
                quantity: 1,
                unit_price: product.price,
                total_price: product.price,
                reason: errorMsg,
              });

              // Update backend status for failure
              await updateDispenseStatus(currentOrder.id, orderItem.id, 'failed', errorMsg);
            }
          } catch (dispenseError) {
            const errorMsg = dispenseError instanceof Error ? dispenseError.message : 'Unknown error';
            console.error('Error dispensing product:', product.name, dispenseError);

            failedProducts.push({
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              taxRate: product.taxRate,
              reason: errorMsg,
            });

            failedItemsForRefund.push({
              product_name: product.name,
              selection_number: product.selectionNumber.toString(),
              quantity: 1,
              unit_price: product.price,
              total_price: product.price,
              reason: errorMsg,
            });

            // Update backend status for failure
            try {
              await updateDispenseStatus(currentOrder.id, orderItem.id, 'failed', errorMsg);
            } catch (statusError) {
              console.error('Failed to update dispense status:', statusError);
            }
          }
        }
      }

      // Step 4: Complete dispense process
      console.log('Completing dispense process...');
      const completeResult = await completeDispense(currentOrder.id);
      console.log('Dispense completed:', completeResult);

      // Step 5: Handle refunds for failed items
      if (failedItemsForRefund.length > 0) {
        const refundAmount = failedItemsForRefund.reduce(
          (sum, item) => sum + item.total_price,
          0
        );

        console.log('Creating refund for failed items:', failedItemsForRefund);

        try {
          const refundResult = await createRefund(currentOrder.id, {
            refund_amount: refundAmount,
            refund_reason: 'Product dispense failed',
            refund_type: 'failed_dispense',
            failed_items: failedItemsForRefund,
          });

          console.log('Refund created:', refundResult);

          // Process the refund via Razorpay
          const processResult = await processRefund(refundResult.data.id);
          console.log('Refund processed:', processResult);

          // Store refund info in order
          if (currentOrder) {
            setCurrentOrder({
              ...currentOrder,
              dispensed: true,
              refundItems: failedProducts,
              refundAmount,
              refundId: refundResult.data.refund_number,
            });
          }
        } catch (refundError) {
          console.error('Failed to process refund:', refundError);
          // Continue anyway - refund can be processed manually
        }
      }

      setIsDispensing(false);

      // Check results
      if (failedProducts.length === 0) {
        // All products dispensed successfully
        setPhase('complete');
        if (currentOrder) {
          setCurrentOrder({ ...currentOrder, dispensed: true });
        }
      } else if (successCount > 0) {
        // Partial success
        setPhase('partial');
        setFailedItems(failedProducts);
        const refundAmount = failedProducts.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        if (currentOrder) {
          setCurrentOrder({
            ...currentOrder,
            dispensed: true,
            refundItems: failedProducts,
            refundAmount,
            refundId: `REF-${Date.now()}`,
          });
        }
      } else {
        // All failed
        setError('Failed to dispense products. Please contact support.');
        setPhase('ready');
      }
    } catch (error) {
      console.error('Dispense error:', error);
      setError(error instanceof Error ? error.message : 'Failed to dispense products');
      setIsDispensing(false);
      setPhase('ready');
    }
  };

  const handleProceed = () => {
    clearCart();
    router.push('/receipt');
  };

  const handleComplete = () => {
    clearCart();
    router.push('/receipt');
  };

  // Ready to collect
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your have Purchased
          </h1>
          <p className="text-3xl font-bold text-price mb-2">
            {totalItems} Products
          </p>
          <p className="text-muted-foreground mb-8">
            from the vending machine!
          </p>
          
          {/* Vending Machine Illustration */}
          <div className="relative w-64 h-80 bg-gradient-to-b from-secondary to-muted rounded-2xl mb-8 flex items-center justify-center">
            <Package className="w-20 h-20 text-primary" />
          </div>
        </div>
        
        {/* Warning & Button */}
        <div className="p-4 bg-secondary/50 rounded-t-3xl safe-bottom">
          <div className="flex items-center gap-3 mb-4 p-4 bg-warning/10 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground">
              Make sure you are in front of the Vending Machine before you Collect your Products
            </p>
          </div>
          
          <button onClick={handleCollect} className="vm-btn-primary">
            Collect Products
          </button>
        </div>
      </div>
    );
  }

  // Dispensing
  if (phase === 'dispensing') {
    return (
      <StatusScreen
        showSpinner
        title={`Dispensing... ${dispensedItems}/${totalItems}`}
        description="Please do not go back or close the app while the Products are dispensing"
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="vm-btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Partial failure - some products not dispensed
  if (phase === 'partial' && (currentOrder?.refundItems || failedItems.length > 0)) {
    const refundItems = currentOrder?.refundItems || failedItems;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-foreground text-center mb-6">
            Products Not Dispensed
          </h1>
          
          {/* Failed Items */}
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
            {refundItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between mb-3 last:mb-0">
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.price} SEK x{item.quantity}
                  </p>
                  {item.reason && (
                    <p className="text-xs text-destructive mt-1">{item.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-muted-foreground text-center text-sm mb-6">
            The Amount paid for the undispensed products will be refunded within 5-7 business days.
          </p>
          
          {/* Refund Amount */}
          <div className="bg-card rounded-2xl p-6 shadow-sm text-center">
            <p className="text-muted-foreground mb-2">Total Refund Amount</p>
            <p className="text-3xl font-bold text-price mb-4">
              {currentOrder.refundAmount} kr
            </p>
            <p className="text-xs text-muted-foreground">
              Refund ID: {currentOrder.refundId}
            </p>
          </div>
        </div>
        
        <div className="p-4 safe-bottom">
          <button onClick={handleProceed} className="vm-btn-primary">
            Proceed
          </button>
        </div>
      </div>
    );
  }

  // Complete success
  return (
    <StatusScreen
      icon={Package}
      iconColor="success"
      title="Purchase Complete!"
      description="Thank you for shopping with us!"
    >
      <button onClick={handleComplete} className="vm-btn-primary">
        View Receipt
      </button>
      <button
        onClick={() => {
          clearCart();
          router.push('/');
        }}
        className="w-full py-3 text-primary font-medium"
      >
        Done
      </button>
    </StatusScreen>
  );
}
