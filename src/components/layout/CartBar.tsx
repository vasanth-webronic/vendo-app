import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatPrice } from '@/lib/utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

export const CartBar = () => {
  const router = useRouter();
  const { items, getTotal, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const total = getTotal();

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="vm-cart-bar"
      >
        <button
          onClick={() => router.push('/cart')}
          className="w-full flex items-center justify-between bg-secondary rounded-full px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          <span className="text-lg font-bold text-foreground">
            {formatPrice(total)}
          </span>
          
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
