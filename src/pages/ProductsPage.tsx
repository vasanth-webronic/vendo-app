'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CartBar } from '@/components/layout/CartBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getSpringsByStoreId } from '@/lib/api/vmService';
import { mapSpringsToProducts, filterAvailableSprings } from '@/lib/api/productMapper';
import { storeCredentials, getAccessToken } from '@/lib/api/auth';
import { useAppStore } from '@/lib/stores/appStore';
import { Product } from '@/lib/types';
import { AlertCircle } from 'lucide-react';

const ProductsPage = () => {
  const searchParams = useSearchParams();
  const { storeId: storeIdFromStore, setStoreId } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawSpringsCount, setRawSpringsCount] = useState<number>(0);

  // Extract URL parameters (store_id from URL takes precedence, then use store/Zustand)
  const storeIdFromUrl = searchParams.get('store_id') || '';
  const clientId = searchParams.get('client_id') || undefined; // Optional override
  const clientSecret = searchParams.get('client_secret') || undefined; // Optional override
  
  // Use store_id from URL if provided, otherwise use from store (Zustand/Redux)
  // This allows navigation back without requiring URL params
  const storeId = storeIdFromUrl || storeIdFromStore || '';

  useEffect(() => {
    // Validate required parameters
    if (!storeId) {
      setError('Store ID is required. Please provide store_id in URL parameters or ensure it is set in the app.');
      setLoading(false);
      return;
    }

    // Store credentials if provided via URL (optional override)
    if (clientId && clientSecret) {
      storeCredentials(clientId, clientSecret);
    }
    
    // If store_id came from URL and differs from store, update the store
    // This ensures the store always has the latest store_id
    if (storeIdFromUrl && storeIdFromUrl !== storeIdFromStore) {
      console.log('Updating store ID in Zustand:', storeIdFromUrl);
      setStoreId(storeIdFromUrl);
    } else if (storeIdFromStore && !storeIdFromUrl) {
      // If we're using store_id from store (back button scenario), log it
      console.log('Using store ID from Zustand store:', storeIdFromStore);
    }

    // Fetch springs from vm-service
    // Step 1: Get access token first, then make API calls
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // STEP 1: Get access token first using credentials from env vars or URL params
        // This ensures we have a valid token before making any REST API calls
        try {
          const token = await getAccessToken(clientId, clientSecret);
          if (!token || token.trim().length === 0) {
            throw new Error('Failed to obtain access token: token is empty');
          }
          console.log('Access token obtained successfully, length:', token.length);
        } catch (tokenError) {
          console.error('Failed to get access token:', tokenError);
          // Clear any invalid tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('vm-service-token');
          }
          // Re-throw with the original error message which now includes detailed info
          throw tokenError;
        }
        
        // STEP 2: Now make the API call with the token (token is automatically included in headers)
        console.log('Fetching springs for store:', storeId);
        const response = await getSpringsByStoreId(
          storeId,
          100,
          0,
          clientId, // Optional: if not provided, will use env vars
          clientSecret // Optional: if not provided, will use env vars
        );

        const totalSprings = response.data?.length || 0;
        setRawSpringsCount(totalSprings);
        
        console.log('Springs response:', {
          totalSprings,
          springs: response.data,
        });

        if (totalSprings === 0) {
          console.warn('No springs found for store:', storeId);
          setProducts([]);
          setError('No products available for this store. Please check if the store has any springs configured.');
          return;
        }

        // Filter available springs and map to products
        const availableSprings = filterAvailableSprings(response.data || []);
        console.log('Available springs (after filtering):', availableSprings.length);
        
        const mappedProducts = mapSpringsToProducts(availableSprings);
        console.log('Mapped products:', mappedProducts.length);
        
        if (mappedProducts.length === 0 && totalSprings > 0) {
          console.warn('No products mapped. Possible reasons:');
          console.warn('- Springs missing linked_product');
          console.warn('- Springs have inventory = 0');
          console.warn('- Springs have broken/maintenance status');
          console.warn('Raw springs data:', response.data);
          setError(`Found ${totalSprings} spring(s) but none are available for purchase. Springs may need linked products or have no inventory.`);
        } else {
          setError(null); // Clear any previous errors
        }
        
        setProducts(mappedProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products from vending machine. Please check your environment variables (NEXT_PUBLIC_VM_SERVICE_CLIENT_ID and NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET).');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeId, storeIdFromUrl, storeIdFromStore, clientId, clientSecret, setStoreId]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.category && p.category.toLowerCase().includes(lowerQuery))
    );
  }, [products, searchQuery]);

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Vending Machine" showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            {rawSpringsCount > 0 ? 'No Products Available' : 'Error'}
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          {rawSpringsCount > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-left max-w-md">
              <p className="font-semibold mb-2">Found {rawSpringsCount} spring(s) but none are available because:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Springs may not have linked products</li>
                <li>Springs may have zero inventory</li>
                <li>Springs may be in broken/maintenance status</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Vending Machine"
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="pb-24">
        <ProductGrid products={filteredProducts} loading={loading} />
      </main>
      
      <CartBar />
    </div>
  );
};

export default ProductsPage;
