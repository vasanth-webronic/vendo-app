import { useState } from 'react';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAppStore } from '@/lib/stores/appStore';
import { AlertCircle, Package } from 'lucide-react';

// This file is kept for reference but is not used.
// The actual page is at src/app/dispensing/page.tsx
const DispensingPage = () => {
  // Navigation removed - use Next.js router in app/dispensing/page.tsx instead
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };
  const { items, getTotalItems, clearCart } = useCartStore();
  const { currentOrder, setCurrentOrder, setIsDispensing, setDispensedCount } = useAppStore();
  const [phase, setPhase] = useState<'ready' | 'dispensing' | 'complete' | 'partial'>('ready');
  const [dispensedItems, setDispensedItems] = useState(0);
  const totalItems = getTotalItems();

  const handleCollect = () => {
    setPhase('dispensing');
    setIsDispensing(true);
    
    // Simulate dispensing products one by one
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setDispensedItems(count);
      setDispensedCount(count);
      
      if (count >= totalItems) {
        clearInterval(interval);
        
        // 90% chance all products dispense successfully
        if (Math.random() > 0.1) {
          setPhase('complete');
          if (currentOrder) {
            setCurrentOrder({ ...currentOrder, dispensed: true });
          }
        } else {
          // Simulate partial dispensing failure
          setPhase('partial');
          if (currentOrder) {
            setCurrentOrder({
              ...currentOrder,
              dispensed: true,
              refundItems: [items[0]?.product ? {
                productId: items[0].product.id,
                name: items[0].product.name,
                price: items[0].product.price,
                quantity: 1,
                taxRate: items[0].product.taxRate,
              } : null].filter(Boolean) as any,
              refundAmount: items[0]?.product.price || 0,
              refundId: `REF-${Date.now()}`,
            });
          }
        }
        
        setIsDispensing(false);
      }
    }, 1000);
  };

  const handleProceed = () => {
    clearCart();
    navigate('/receipt');
  };

  const handleComplete = () => {
    clearCart();
    navigate('/receipt');
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

  // Partial failure - some products not dispensed
  if (phase === 'partial' && currentOrder?.refundItems) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-foreground text-center mb-6">
            Products Not Dispensed
          </h1>
          
          {/* Failed Items */}
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
            {currentOrder.refundItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.price} SEK x{item.quantity}
                  </p>
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
          navigate('/');
        }}
        className="w-full py-3 text-primary font-medium"
      >
        Done
      </button>
    </StatusScreen>
  );
};

export default DispensingPage;
