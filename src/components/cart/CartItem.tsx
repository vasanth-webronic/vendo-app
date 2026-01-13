import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/lib/types';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatPrice } from '@/lib/utils/formatters';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCartStore();
  const { product, quantity } = item;

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm animate-fade-in">
      {/* Product Image */}
      <div className="w-16 h-20 flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {product.name}
        </h3>
        <p className="text-price font-medium">
          {formatPrice(product.price)}
        </p>
      </div>
      
      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrement}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary"
          disabled={quantity <= 1}
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <span className="w-6 text-center font-semibold">
          {quantity}
        </span>
        
        <button
          onClick={handleIncrement}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Delete Button */}
      <button
        onClick={() => removeItem(product.id)}
        className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
};
