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

      // Step 1: Verify order is paid before dispensing (security check)
      console.log('Verifying order payment status before dispensing...');
      const backendOrderCheck = await getOrder(currentOrder.id);

      if (!backendOrderCheck.payment_verified) {
        setError('Payment not verified. Cannot dispense products. Please contact support.');
        setIsDispensing(false);
        setPhase('ready');
        return;
      }

      if (backendOrderCheck.order_status !== 'paid') {
        setError(`Order is not in paid status (current: ${backendOrderCheck.order_status}). Cannot dispense.`);
        setIsDispensing(false);
        setPhase('ready');
        return;
      }

      console.log('Payment verified. Proceeding with dispense...');

      // Step 2: Initiate dispense process in backend
      console.log('Initiating dispense for order:', currentOrder.id);
      await initiateDispense(currentOrder.id);

      // Step 3: Get the order details to get item IDs
      const backendOrder: BackendOrder = await getOrder(currentOrder.id);
      const backendOrderItems = backendOrder.items || [];

      console.log('=== DEBUG: Order Details ===');
      console.log('Backend order response:', JSON.stringify(backendOrder, null, 2));
      console.log('Backend order items:', backendOrderItems);
      console.log('Backend order items length:', backendOrderItems.length);
      console.log('Cart items:', items);
      console.log('Cart items length:', items.length);
      console.log('Current order items:', currentOrder.items);
      console.log('=== END DEBUG ===');

      // Validate we have backend order items
      if (!backendOrderItems || backendOrderItems.length === 0) {
        setError('No order items found in backend. Cannot proceed with dispense.');
        setIsDispensing(false);
        setPhase('ready');
        return;
      }

      // Create a map of frontend items by productId for quick lookup
      const frontendItemMap = new Map<string, any>();
      (currentOrder.items || []).forEach((item: any) => {
        const key = item.productId || item.springId || item.id;
        if (key) {
          // Store array of items with same productId (in case of duplicates)
          if (!frontendItemMap.has(key)) {
            frontendItemMap.set(key, []);
          }
          frontendItemMap.get(key)!.push(item);
        }
      });

      // Step 4: Dispense each backend order item (source of truth)
      // This ensures we process ALL items, even if same product appears multiple times
      for (const backendOrderItem of backendOrderItems) {
        const orderItemId = backendOrderItem.id;
        
        if (!orderItemId) {
          console.error('Backend order item missing ID:', backendOrderItem);
          failedProducts.push({
            productId: backendOrderItem.spring_id,
            name: backendOrderItem.product_name || 'Unknown',
            price: backendOrderItem.unit_price || 0,
            quantity: backendOrderItem.quantity || 0,
            taxRate: backendOrderItem.tax_rate || 0,
            reason: 'Backend order item missing ID',
          });
          await updateDispenseStatus(currentOrder.id, orderItemId, 'failed', 'Backend order item missing ID');
          continue;
        }

        // Find matching frontend item(s) for this backend item
        const springId = backendOrderItem.spring_id;
        const frontendItems = frontendItemMap.get(springId) || frontendItemMap.get(orderItemId) || [];
        
        // Use first matching frontend item, or fallback to backend item data
        const frontendItem = frontendItems.length > 0 ? frontendItems.shift() : null;
        // Find product info from backend item, frontend item, or cart items
        const product = {
          // Start with backend item data (most reliable)
          id: springId,
          productId: springId,
          springId: springId,
          name: backendOrderItem.product_name,
          price: backendOrderItem.unit_price,
          quantity: backendOrderItem.quantity,
          taxRate: backendOrderItem.tax_rate,
          selectionNumber: backendOrderItem.selection_number,
          // Merge with frontend item data if available
          ...(frontendItem || {}),
          // Merge with cart item product data if available
          ...(items.find((ci) => ci.product.id === springId)?.product || {}),
        };
        console.log('Processing order item:', {
          orderItemId,
          springId,
          productName: product.name,
          quantity: backendOrderItem.quantity,
        });

        // Validate product has required fields for dispense
        if (!product.selectionNumber || !product.vmId || !product.storeId) {
          console.error('Product missing required fields:', product);
          failedProducts.push({
            productId: springId,
            name: product.name || backendOrderItem.product_name,
            price: product.price || backendOrderItem.unit_price,
            quantity: backendOrderItem.quantity,
            taxRate: product.taxRate || backendOrderItem.tax_rate,
            reason: 'Missing required product information',
          });
          // Update backend status using order item ID
          await updateDispenseStatus(currentOrder.id, orderItemId, 'failed', 'Missing required product information');
          continue;
        }

        // Use storeId from store (Zustand) - it's the source of truth
        const productStoreId = storeId || product.storeId;
        const vmId = product.vmId;

        // Dispense each quantity unit for this order item
        // backendOrderItem.quantity is the correct quantity to dispense
        for (let i = 0; i < backendOrderItem.quantity; i++) {
          try {
            console.log(`Dispensing product: ${product.name} (selection: ${product.selectionNumber}, vm: ${vmId}, store: ${productStoreId})`);

            const response = await dispenseProduct(
              productStoreId,
              vmId,
              {
                selection_number: product.selectionNumber,
                spring_id: springId,
                products: [{
                  id: springId,
                  name: product.name || backendOrderItem.product_name,
                  price: product.price || backendOrderItem.unit_price,
                }],
                metadata: {
                  orderId: currentOrder?.id,
                  itemId: orderItemId,
                  timestamp: new Date().toISOString(),
                },
              }
            );

            if (response.success) {
              successCount++;
              setDispensedItems(successCount);
              setDispensedCount(successCount);

              // Update backend status for success using order item ID
              await updateDispenseStatus(currentOrder.id, orderItemId, 'success');
            } else {
              const errorMsg = response.message || 'Dispense failed';
              console.error('Dispense failed for product:', product.name, errorMsg);

              failedProducts.push({
                productId: springId,
                name: product.name || backendOrderItem.product_name,
                price: product.price || backendOrderItem.unit_price,
                quantity: 1,
                taxRate: product.taxRate || backendOrderItem.tax_rate,
                reason: errorMsg,
              });

              failedItemsForRefund.push({
                product_name: product.name || backendOrderItem.product_name,
                selection_number: product.selectionNumber?.toString() || backendOrderItem.selection_number,
                quantity: 1,
                unit_price: product.price || backendOrderItem.unit_price,
                total_price: product.price || backendOrderItem.unit_price,
                reason: errorMsg,
              });

              // Update backend status for failure using order item ID
              await updateDispenseStatus(currentOrder.id, orderItemId, 'failed', errorMsg);
            }
          } catch (dispenseError) {
            const errorMsg = dispenseError instanceof Error ? dispenseError.message : 'Unknown error';
            console.error('Error dispensing product:', product.name, dispenseError);

            failedProducts.push({
              productId: springId,
              name: product.name || backendOrderItem.product_name,
              price: product.price || backendOrderItem.unit_price,
              quantity: 1,
              taxRate: product.taxRate || backendOrderItem.tax_rate,
              reason: errorMsg,
            });

            failedItemsForRefund.push({
              product_name: product.name || backendOrderItem.product_name,
              selection_number: product.selectionNumber?.toString() || backendOrderItem.selection_number,
              quantity: 1,
              unit_price: product.price || backendOrderItem.unit_price,
              total_price: product.price || backendOrderItem.unit_price,
              reason: errorMsg,
            });

            // Update backend status for failure using order item ID
            try {
              await updateDispenseStatus(currentOrder.id, orderItemId, 'failed', errorMsg);
            } catch (statusError) {
              console.error('Failed to update dispense status:', statusError);
            }
          }
        }
      }

      // Step 5: Complete dispense process
      console.log('Completing dispense process...');
      const completeResult = await completeDispense(currentOrder.id);
      console.log('Dispense completed:', completeResult);
      if(completeResult.data.order_status != "failed"){
            clearCart();
      }

      
      // Step 6: Handle refunds for failed items
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
    const progress = totalItems > 0 ? Math.round((dispensedItems / totalItems) * 100) : 0;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        {/* Spinner */}
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Dispensing Products
        </h1>

        {/* Progress Count */}
        <p className="text-4xl font-bold text-primary mb-4">
          {dispensedItems} / {totalItems}
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-md h-3 bg-secondary rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress Percentage */}
        <p className="text-lg text-muted-foreground mb-8">
          {progress}% Complete
        </p>

        {/* Warning */}
        <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-2xl max-w-md">
          <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
          <p className="text-sm text-foreground">
            Please do not go back or close the app while products are dispensing
          </p>
        </div>
      </div>
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Purchase Complete!
        </h1>

        {/* Products Dispensed Count */}
        <div className="my-6">
          <p className="text-muted-foreground mb-2">Products Dispensed</p>
          <p className="text-5xl font-bold text-green-600">
            {dispensedItems}
          </p>
        </div>

        <p className="text-muted-foreground mb-8">
          Thank you for shopping with us!
        </p>

        {/* Product List Summary */}
        {items.length > 0 && (
          <div className="w-full max-w-md bg-card rounded-2xl p-4 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Dispensed Products
            </h3>
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                <span className="text-foreground">{item.product.name}</span>
                <span className="text-primary font-medium">x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="p-4 space-y-3 safe-bottom">
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
      </div>
    </div>
  );
}
