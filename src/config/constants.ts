/**
 * Application Constants
 *
 * Centralized configuration for application-wide constants.
 * This file should be the single source of truth for all magic numbers,
 * strings, and configuration values used throughout the application.
 *
 * @module config/constants
 */

/**
 * Application metadata and branding
 */
export const APP_METADATA = {
  NAME: 'Vamo Store',
  DESCRIPTION: 'Smart vending machine store',
  VERSION: '1.0.0',
  DEFAULT_LOCALE: 'en',
  SUPPORTED_LOCALES: ['en', 'sv', 'hi'] as const, // English, Swedish, Hindi
} as const;

/**
 * Currency configuration
 */
export const CURRENCY = {
  DEFAULT: 'SEK', // Swedish Krona
  SYMBOL: 'kr',
  SUPPORTED_CURRENCIES: ['SEK', 'USD', 'EUR', 'INR'] as const,
} as const;

/**
 * Toast notification configuration
 */
export const TOAST = {
  /** Default duration for toast messages (in milliseconds) */
  DEFAULT_DURATION: 5000,

  /** Duration for success messages */
  SUCCESS_DURATION: 3000,

  /** Duration for error messages */
  ERROR_DURATION: 7000,

  /** Duration for warning messages */
  WARNING_DURATION: 5000,

  /** Maximum number of toasts to show simultaneously */
  MAX_TOASTS: 3,

  /** Position of toast notifications */
  POSITION: 'bottom-right' as const,
} as const;

/**
 * API configuration
 */
export const API = {
  /** Request timeout in milliseconds */
  TIMEOUT: 30000, // 30 seconds

  /** Number of retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,

  /** Delay between retry attempts (in milliseconds) */
  RETRY_DELAY: 1000,

  /** Endpoints for VM Service API */
  ENDPOINTS: {
    TOKEN: '/api/v1/token',
    ORDERS: '/api/v1/orders',
    VALIDATE_ORDER: '/api/v1/orders/validate',
    VERIFY_PAYMENT: '/api/v1/payments/verify',
    DISPENSE: (orderId: string) => `/api/v1/orders/${orderId}/dispense`,
    RAZORPAY_ORDER: (orderId: string) => `/api/v1/orders/${orderId}/razorpay`,
    SPRINGS: (storeId: string) => `/api/v1/stores/${storeId}/springs`,
    CONNECTION_STATUS: (storeId: string, vmId: string) =>
      `/api/v1/stores/${storeId}/vms/${vmId}/connection`,
    ORDER_BY_ID: (orderId: string) => `/api/v1/orders/${orderId}`,
  },
} as const;

/**
 * Shopping cart configuration
 */
export const CART = {
  /** Maximum number of items allowed in cart */
  MAX_ITEMS: 50,

  /** Maximum quantity per product */
  MAX_QUANTITY_PER_PRODUCT: 10,

  /** Minimum cart value for checkout (in smallest currency unit) */
  MIN_CHECKOUT_VALUE: 0,

  /** LocalStorage key for cart persistence */
  STORAGE_KEY: 'vamo-cart',
} as const;

/**
 * Age verification configuration
 */
export const AGE_VERIFICATION = {
  /** Minimum age required for restricted products */
  MINIMUM_AGE: 18,

  /** Session validity duration (in milliseconds) */
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours

  /** LocalStorage key for verification status */
  STORAGE_KEY: 'age-verified',
} as const;

/**
 * VM (Vending Machine) configuration
 */
export const VM = {
  /** Interval for checking VM connection status (in milliseconds) */
  STATUS_CHECK_INTERVAL: 30000, // 30 seconds

  /** Timeout for VM connection check (in milliseconds) */
  CONNECTION_TIMEOUT: 10000, // 10 seconds

  /** Maximum time to wait for dispensing (in milliseconds) */
  DISPENSE_TIMEOUT: 60000, // 60 seconds

  /** Interval for polling dispense status (in milliseconds) */
  DISPENSE_POLL_INTERVAL: 2000, // 2 seconds

  /** Maximum retries for failed dispense operations */
  DISPENSE_MAX_RETRIES: 3,
} as const;

/**
 * Payment configuration
 */
export const PAYMENT = {
  /** Available payment methods */
  METHODS: {
    RAZORPAY: 'razorpay',
    SWISH: 'swish',
    CARD: 'card',
  } as const,

  /** Razorpay configuration */
  RAZORPAY: {
    /** Currency for Razorpay transactions */
    CURRENCY: 'INR',

    /** Theme color for Razorpay checkout */
    THEME_COLOR: '#6366F1',

    /** Name displayed in checkout */
    MERCHANT_NAME: 'Vamo Store',
  },

  /** Payment timeout (in milliseconds) */
  TIMEOUT: 300000, // 5 minutes
} as const;

/**
 * Routing configuration
 */
export const ROUTES = {
  HOME: '/',
  AGE_VERIFICATION: '/age-verification',
  CART: '/cart',
  CHECKOUT: '/checkout',
  PAYMENT: '/payment',
  DISPENSING: '/dispensing',
  RECEIPT: '/receipt',
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  CART: 'vamo-cart',
  AGE_VERIFIED: 'age-verified',
  APP_STATE: 'vamo-app-state',
  STORE_ID: 'vamo-store-id',
  LANGUAGE: 'vamo-language',
  THEME: 'theme',
} as const;

/**
 * Animation and timing configuration
 */
export const ANIMATION = {
  /** Default transition duration (in milliseconds) */
  TRANSITION_DURATION: 200,

  /** Page transition duration (in milliseconds) */
  PAGE_TRANSITION: 300,

  /** Debounce delay for search inputs (in milliseconds) */
  SEARCH_DEBOUNCE: 300,
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  /** Product name length constraints */
  PRODUCT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },

  /** Price constraints (in smallest currency unit) */
  PRICE: {
    MIN: 0,
    MAX: 1000000, // 10,000 SEK in öre
  },
} as const;

/**
 * Feature flags for conditional features
 */
export const FEATURES = {
  /** Enable real-time VM status updates via WebSocket */
  ENABLE_REALTIME_VM_STATUS: false,

  /** Enable user authentication and accounts */
  ENABLE_USER_AUTH: false,

  /** Enable loyalty/rewards program */
  ENABLE_LOYALTY: false,

  /** Enable PWA features */
  ENABLE_PWA: false,

  /** Enable analytics tracking */
  ENABLE_ANALYTICS: false,
} as const;

/**
 * Error messages (will be internationalized)
 */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VM_OFFLINE: 'VM_OFFLINE',
  VM_DISCONNECTED: 'VM_DISCONNECTED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  DISPENSE_FAILED: 'DISPENSE_FAILED',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  CART_EMPTY: 'CART_EMPTY',
  AGE_VERIFICATION_REQUIRED: 'AGE_VERIFICATION_REQUIRED',
  INVALID_ORDER: 'INVALID_ORDER',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

/**
 * Type exports for better type safety
 */
export type SupportedLocale = typeof APP_METADATA.SUPPORTED_LOCALES[number];
export type SupportedCurrency = typeof CURRENCY.SUPPORTED_CURRENCIES[number];
export type PaymentMethod = typeof PAYMENT.METHODS[keyof typeof PAYMENT.METHODS];
export type Route = typeof ROUTES[keyof typeof ROUTES];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
