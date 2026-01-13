'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PaymentOption } from '@/components/payment/PaymentOption';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAppStore } from '@/lib/stores/appStore';
import { formatPrice, generateOrderId, generateReferenceNumber } from '@/lib/utils/formatters';
import { PaymentMethod } from '@/lib/types';
import { ShoppingCart } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { 
    selectedPaymentMethod, 
    setSelectedPaymentMethod,
    setCurrentOrder,
    setIsLoading 
  } = useAppStore();
  
  const total = getTotal();

  const handlePay = async () => {
    if (!selectedPaymentMethod) return;
    
    setIsLoading(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Create order
    const order = {
      id: generateOrderId(),
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
      referenceNumber: generateReferenceNumber(),
      dispensed: false,
    };
    
    setCurrentOrder(order);
    setIsLoading(false);
    
    router.push('/dispensing');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Payment" showBack showClose variant="white" />
      
      <main className="p-4 pb-32">
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
          Pay
        </button>
      </div>
    </div>
  );
}
