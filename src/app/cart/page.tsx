'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CartItem } from '@/components/cart/CartItem';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatPrice } from '@/lib/utils/formatters';
import { ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Cart" showBack variant="white" />
        
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Add some products to get started
          </p>
          <button
            onClick={() => router.push('/')}
            className="vm-btn-primary max-w-xs"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Cart" showBack showClose variant="white" />
      
      <main className="p-4 pb-32">
        {/* Cart Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 p-4 bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">{formatPrice(total)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-price">{formatPrice(total)}</span>
          </div>
        </div>
      </main>
      
      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background safe-bottom">
        <button
          onClick={() => router.push('/checkout')}
          className="vm-btn-primary"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
