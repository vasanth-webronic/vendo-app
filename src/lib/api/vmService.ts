/**
 * Centralized API service for vm-service communication
 */

import { getCurrentAccessToken } from './auth';

// API Configuration from environment variables
const VM_SERVICE_URL = process.env.NEXT_PUBLIC_VM_SERVICE_URL || '';

// API Response Types
export interface Spring {
  id: string;
  vm_id: string;
  project_id: string;
  store_id: string;
  selection_number: string;
  capacity: number;
  inventory: number;
  linked_product: any | null;
  spring_status?: string;
  stripe_code: string;
  last_update?: number;
  created_at: string;
  updated_at: string;
}

export interface SpringsResponse {
  data: Spring[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface DispenseRequest {
  selection_number: number;
  spring_id?: string; // Optional: if provided, VM ID will be obtained from spring
  products?: any[];
  metadata?: Record<string, any>;
}

export interface DispenseResponse {
  success: boolean;
  message: string;
}

export interface ConnectionStatusResponse {
  connected: boolean;
  vm_id: string;
  store_id: string;
  last_seen?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Order and Payment Types
export interface OrderItem {
  spring_id: string;
  selection_number: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export interface CreateOrderRequest {
  store_id: string;
  vm_id: string;
  customer_email?: string;
  customer_phone?: string;
  items: OrderItem[];
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  order_number: string;
  project_id: string;
  store_id: string;
  vm_id: string;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: string;
  order_status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_verified: boolean;
  dispense_status: string;
  items?: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface RazorpayOrderResponse {
  success: boolean;
  message: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  order_number: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface RefundRequest {
  refund_amount: number;
  refund_reason: string;
  refund_type: 'full' | 'partial' | 'failed_dispense' | 'customer_request';
  failed_items?: Array<{
    product_name: string;
    selection_number: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    reason: string;
  }>;
}

/**
 * Get API base URL
 */
function getApiBaseUrl(): string {
  if (!VM_SERVICE_URL) {
    throw new Error('VM_SERVICE_URL is not configured');
  }
  return VM_SERVICE_URL.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Get API headers with Bearer token authentication
 * 
 * IMPORTANT: This function ensures all REST API calls include the Bearer token in the Authorization header.
 * The token is obtained first (or retrieved from cache if valid), then included in the request.
 * 
 * Token flow:
 * 1. Get access token using client_id and client_secret (from env vars or params)
 * 2. Token is stored in localStorage and automatically refreshed when expired
 * 3. Token is included in Authorization header as: "Bearer <access_token>"
 * 
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 * @returns Headers with Authorization: Bearer <token> included
 */
async function getHeaders(
  clientId?: string,
  clientSecret?: string
): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    // Get access token first (from cache if valid, or fetch new one)
    // If credentials not provided, will use env vars automatically
    const accessToken = await getCurrentAccessToken(clientId, clientSecret);
    
    if (!accessToken || accessToken.trim().length === 0) {
      throw new Error('Access token is empty or invalid');
    }
    
    // Add Bearer token to Authorization header (required by vm-service)
    // Format: "Bearer <token>" - vm-service expects exactly this format
    const bearerToken = `Bearer ${accessToken.trim()}`;
    headers['Authorization'] = bearerToken;
    
    // Log token info for debugging (without exposing full token)
    console.log('Using Bearer token:', bearerToken.substring(0, 20) + '...');
  } catch (error) {
    console.error('Failed to get access token:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Authentication failed. Please check your environment variables (NEXT_PUBLIC_VM_SERVICE_CLIENT_ID and NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET).');
  }

  return headers;
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  
  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorData: ApiError = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || errorMessage;
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error,
        message: errorData.message,
        code: errorData.code,
      });
    } catch {
      // If JSON parsing fails, use default error message
      console.error('API Error (non-JSON):', responseText);
      errorMessage = `${errorMessage}: ${responseText}`;
    }
    throw new Error(errorMessage);
  }

  // Parse successful response
  try {
    return JSON.parse(responseText) as T;
  } catch (parseError) {
    console.error('Failed to parse API response:', responseText);
    throw new Error('Invalid response format from server');
  }
}

/**
 * Get springs (products) by store ID
 * 
 * This function:
 * 1. Gets access token first (or uses cached valid token)
 * 2. Makes GET request to /api/v1/stores/{store_id}/springs
 * 3. Includes Bearer token in Authorization header
 * 
 * Project ID is automatically extracted from the access token by vm-service
 * Credentials are taken from environment variables (NEXT_PUBLIC_VM_SERVICE_CLIENT_ID and NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET)
 * 
 * @param storeId - Store ID
 * @param limit - Number of results to return
 * @param offset - Number of results to skip
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 * @returns SpringsResponse with products data
 */
export async function getSpringsByStoreId(
  storeId: string,
  limit: number = 100,
  offset: number = 0,
  clientId?: string,
  clientSecret?: string
): Promise<SpringsResponse> {
  const baseUrl = getApiBaseUrl();
  // Project ID comes from token, not URL path
  // Note: vm-service may not support limit/offset, but we include them for compatibility
  const url = `${baseUrl}/api/v1/stores/${storeId}/springs${limit > 0 ? `?limit=${limit}&offset=${offset}` : ''}`;

  console.log('Fetching springs from:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  try {
    // Log request details for debugging
    console.log('Making GET request to:', url);
    console.log('Request headers:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': headers['Authorization'] ? `${headers['Authorization'].substring(0, 20)}...` : 'missing',
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('Response status:', response.status, response.statusText);
    
    // Check for 401 specifically
    if (response.status === 401) {
      const responseText = await response.text();
      console.error('401 Unauthorized response:', responseText);
      let errorDetails: any = {};
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        // Not JSON
      }
      throw new Error(`Unauthorized (401): ${errorDetails.error || errorDetails.message || 'Invalid or expired token. Please check your credentials.'}`);
    }

    const result = await handleResponse<{ data: Spring[] }>(response);
    
    // vm-service returns {data: Spring[]}, so we normalize it to SpringsResponse
    const springsResponse: SpringsResponse = {
      data: result.data || [],
      total: result.data?.length || 0,
      limit: limit,
      offset: offset,
    };

    console.log(`Successfully fetched ${springsResponse.data.length} springs`);
    
    return springsResponse;
  } catch (error) {
    console.error('Error fetching springs:', error);
    throw error;
  }
}

/**
 * Get connection status for a VM
 * 
 * Makes GET request with Bearer token in Authorization header.
 * Project ID is automatically extracted from the access token.
 * 
 * @param storeId - Store ID
 * @param vmId - VM ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function getConnectionStatus(
  storeId: string,
  vmId: string,
  clientId?: string,
  clientSecret?: string
): Promise<ConnectionStatusResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/stores/${storeId}/vms/${vmId}/connectionStatus`;

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<ConnectionStatusResponse>(response);
}

/**
 * Send dispense command to VM
 * 
 * Makes POST request with Bearer token in Authorization header.
 * Project ID is automatically extracted from the access token.
 * 
 * @param storeId - Store ID
 * @param vmId - VM ID
 * @param request - Dispense request with selection_number and products
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function dispenseProduct(
  storeId: string,
  vmId: string,
  request: DispenseRequest,
  clientId?: string,
  clientSecret?: string
): Promise<DispenseResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/stores/${storeId}/vms/${vmId}/dispense`;

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<DispenseResponse>(response);
}

/**
 * Request spring data refresh from VM
 * 
 * Makes POST request with Bearer token in Authorization header.
 * Project ID is automatically extracted from the access token.
 * 
 * @param storeId - Store ID
 * @param vmId - VM ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function requestSpringData(
  storeId: string,
  vmId: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/stores/${storeId}/vms/${vmId}/requestSpringData`;

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  return handleResponse<{ success: boolean; message: string }>(response);
}

/**
 * Create a new order from cart items
 *
 * Makes POST request with Bearer token in Authorization header.
 * Project ID is automatically extracted from the access token.
 *
 * @param request - Order creation request with items
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function createOrder(
  request: CreateOrderRequest,
  clientId?: string,
  clientSecret?: string
): Promise<CreateOrderResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders`;

  console.log('Creating order:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const result = await handleResponse<CreateOrderResponse>(response);
  console.log('Order created successfully:', result.data.order_number);

  return result;
}

/**
 * Create Razorpay order for payment
 *
 * Makes POST request with Bearer token in Authorization header.
 * This creates the payment order in Razorpay system.
 *
 * @param orderId - Order ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function createRazorpayOrder(
  orderId: string,
  clientId?: string,
  clientSecret?: string
): Promise<RazorpayOrderResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders/${orderId}/razorpay`;

  console.log('Creating Razorpay order:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  const result = await handleResponse<RazorpayOrderResponse>(response);
  console.log('Razorpay order created:', result.razorpay_order_id);

  return result;
}

/**
 * Verify payment after user completes Razorpay checkout
 *
 * Makes POST request with Bearer token in Authorization header.
 * Verifies payment signature and updates order status.
 *
 * @param request - Payment verification request with Razorpay response
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function verifyPayment(
  request: VerifyPaymentRequest,
  clientId?: string,
  clientSecret?: string
): Promise<VerifyPaymentResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/payments/verify`;

  console.log('Verifying payment:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const result = await handleResponse<VerifyPaymentResponse>(response);
  console.log('Payment verified successfully');

  return result;
}

/**
 * Get order details by ID
 *
 * Makes GET request with Bearer token in Authorization header.
 *
 * @param orderId - Order ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function getOrder(
  orderId: string,
  clientId?: string,
  clientSecret?: string
): Promise<Order> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders/${orderId}`;

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const result = await handleResponse<{ data: Order }>(response);
  return result.data;
}

/**
 * Initiate dispense process for an order
 *
 * Makes POST request with Bearer token in Authorization header.
 * Marks order ready for dispensing.
 *
 * @param orderId - Order ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function initiateDispense(
  orderId: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders/${orderId}/dispense`;

  console.log('Initiating dispense:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  const result = await handleResponse<{ success: boolean; message: string }>(response);
  console.log('Dispense initiated');

  return result;
}

/**
 * Update dispense status for an individual order item
 *
 * Makes POST request with Bearer token in Authorization header.
 * Updates the status after attempting to dispense an item.
 *
 * @param orderId - Order ID
 * @param itemId - Order item ID
 * @param status - Dispense status ('success' or 'failed')
 * @param error - Optional error message if failed
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function updateDispenseStatus(
  orderId: string,
  itemId: string,
  status: 'success' | 'failed',
  error?: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders/${orderId}/items/${itemId}/dispense-status`;

  console.log('Updating dispense status:', url, status);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status, error }),
  });

  return handleResponse<{ success: boolean; message: string }>(response);
}

/**
 * Complete dispense process for an order
 *
 * Makes POST request with Bearer token in Authorization header.
 * Finalizes the order after all items have been dispensed.
 *
 * @param orderId - Order ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function completeDispense(
  orderId: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ success: boolean; message: string; data: Order }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders/${orderId}/dispense/complete`;

  console.log('Completing dispense:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  const result = await handleResponse<{ success: boolean; message: string; data: Order }>(response);
  console.log('Dispense completed:', result.data.order_status);

  return result;
}

/**
 * Create refund for failed items
 *
 * Makes POST request with Bearer token in Authorization header.
 * Creates a refund request for items that failed to dispense.
 *
 * @param orderId - Order ID
 * @param request - Refund request details
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function createRefund(
  orderId: string,
  request: RefundRequest,
  clientId?: string,
  clientSecret?: string
): Promise<{ success: boolean; message: string; data: any }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/orders/${orderId}/refunds`;

  console.log('Creating refund:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const result = await handleResponse<{ success: boolean; message: string; data: any }>(response);
  console.log('Refund created:', result.data.refund_number);

  return result;
}

/**
 * Process refund via payment gateway
 *
 * Makes POST request with Bearer token in Authorization header.
 * Initiates the actual refund via Razorpay.
 *
 * @param refundId - Refund ID
 * @param clientId - Optional client ID for authentication (overrides env vars if provided)
 * @param clientSecret - Optional client secret for authentication (overrides env vars if provided)
 */
export async function processRefund(
  refundId: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/refunds/${refundId}/process`;

  console.log('Processing refund:', url);

  // Get headers with Bearer token included
  const headers = await getHeaders(clientId, clientSecret);

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  const result = await handleResponse<{ success: boolean; message: string }>(response);
  console.log('Refund processed successfully');

  return result;
}
