import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgeVerification, Order, PaymentMethod } from '../types';

interface AppState {
  // Store ID
  storeId: string | null;
  setStoreId: (id: string) => void;
  
  // Age Verification
  ageVerification: AgeVerification;
  setAgeVerification: (verification: Partial<AgeVerification>) => void;
  resetAgeVerification: () => void;
  
  // Current Order
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  
  // Payment
  selectedPaymentMethod: PaymentMethod | null;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  
  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Dispensing State
  isDispensing: boolean;
  setIsDispensing: (dispensing: boolean) => void;
  dispensedCount: number;
  setDispensedCount: (count: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Store ID
      storeId: null,
      setStoreId: (id) => set({ storeId: id }),
      
      // Age Verification
      ageVerification: { status: 'none' },
      setAgeVerification: (verification) =>
        set((state) => ({
          ageVerification: { ...state.ageVerification, ...verification },
        })),
      resetAgeVerification: () =>
        set({ ageVerification: { status: 'none' } }),
      
      // Current Order
      currentOrder: null,
      setCurrentOrder: (order) => set({ currentOrder: order }),
      
      // Payment
      selectedPaymentMethod: null,
      setSelectedPaymentMethod: (method) =>
        set({ selectedPaymentMethod: method }),
      
      // Loading State
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Dispensing State
      isDispensing: false,
      setIsDispensing: (dispensing) => set({ isDispensing: dispensing }),
      dispensedCount: 0,
      setDispensedCount: (count) => set({ dispensedCount: count }),
    }),
    {
      name: 'vm-app-storage',
      partialize: (state) => ({
        storeId: state.storeId,
        ageVerification: state.ageVerification,
      }),
    }
  )
);
