

"use client";
import { Suspense } from 'react';
import ProductsPage from '@/pages/ProductsPage';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ProductsPage />
    </Suspense>
  );
}
