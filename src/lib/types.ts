// Product Types
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isAgeRestricted: boolean;
  taxRate: number; // percentage
  depositAmount?: number; // pant
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Order Types
export type PaymentMethod = 'swish' | 'card';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate: number;
  depositAmount?: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  referenceNumber: string;
  dispensed: boolean;
  refundItems?: OrderItem[];
  refundAmount?: number;
  refundId?: string;
}

// Age Verification Types
export type AgeVerificationStatus = 
  | 'none' 
  | 'pending' 
  | 'verifying' 
  | 'approved' 
  | 'rejected' 
  | 'failed' 
  | 'expired';

export interface AgeVerification {
  status: AgeVerificationStatus;
  idType?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
}

// Store Types
export interface VendingMachine {
  id: string;
  name: string;
  location: string;
}

// Receipt Tax Breakdown
export interface TaxBreakdown {
  taxRate: number;
  taxAmount: number;
  excludingTax: number;
  includingTax: number;
}
