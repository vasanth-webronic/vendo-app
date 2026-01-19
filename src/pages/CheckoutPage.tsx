"use client";
// This file is kept for reference but is not used.
// The actual page is at src/app/checkout/page.tsx
import { Header } from '@/components/layout/Header';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAppStore } from '@/lib/stores/appStore';
import { formatPrice } from '@/lib/utils/formatters';
import { AlertTriangle } from 'lucide-react';

const CheckoutPage = () => {
  // Navigation removed - use Next.js router in app/checkout/page.tsx instead
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };
  const { items, getTotal, hasAgeRestrictedItems } = useCartStore();
  const { ageVerification } = useAppStore();
  const total = getTotal();
  
  const needsAgeVerification = hasAgeRestrictedItems() && ageVerification.status !== 'approved';

  const handleProceed = () => {
    if (needsAgeVerification) {
      navigate('/age-verification');
    } else {
      navigate('/payment');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Checkout" showBack showClose variant="white" />
      
      <main className="p-4 pb-32">
        {/* Order Summary */}
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Order Summary</h2>
          </div>
          
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-16 object-contain"
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-foreground">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-secondary/50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-price">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Age Verification Warning */}
        {needsAgeVerification && (
          <div className="mt-4 p-4 bg-warning/10 rounded-2xl flex gap-3 animate-fade-in">
            <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Your cart contains age-restricted products.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Age verification is required before you can complete the purchase.
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background safe-bottom">
        <button
          onClick={handleProceed}
          className="vm-btn-primary"
        >
          {needsAgeVerification ? 'Verify Age' : `Pay - ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
