'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { CartBar } from '@/components/layout/CartBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { mockProducts, searchProducts } from '@/lib/data/products';

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockProducts;
    }
    return searchProducts(searchQuery);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Vending Machine"
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="pb-24">
        <ProductGrid products={filteredProducts} />
      </main>
      
      <CartBar />
    </div>
  );
};

export default ProductsPage;
