import { Minus, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatPrice } from '@/lib/utils/formatters';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { items, addItem, updateQuantity } = useCartStore();
  
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleIncrement = () => {
    if (quantity === 0) {
      addItem(product);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <div className="vm-product-card relative animate-fade-in">
      {/* Age Restriction Badge */}
      {product.isAgeRestricted && (
        <span className="vm-age-badge">18+</span>
      )}
      
      {/* Product Image */}
      <div className="flex justify-center mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-24 h-32 object-contain"
          loading="lazy"
        />
      </div>
      
      {/* Product Info */}
      <h3 className="text-center font-semibold text-foreground mb-1">
        {product.name}
      </h3>
      <p className="text-center text-price font-medium mb-4">
        {formatPrice(product.price)}
      </p>
      
      {/* Quantity Controls */}
      <div className="vm-qty-control justify-center">
        <button
          onClick={handleDecrement}
          className="vm-qty-btn"
          disabled={quantity === 0}
        >
          <Minus className="w-5 h-5" />
        </button>
        
        <span className="w-8 text-center font-semibold text-foreground">
          {quantity}
        </span>
        
        <button
          onClick={handleIncrement}
          className="vm-qty-btn"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
