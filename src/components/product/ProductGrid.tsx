import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export const ProductGrid = ({ products, loading = false }: ProductGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="vm-product-card animate-pulse"
          >
            <div className="w-24 h-32 bg-muted rounded-lg mx-auto mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-4" />
            <div className="h-10 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground text-center">
          No products found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 pb-32">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
