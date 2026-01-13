/**
 * Format price in SEK
 */
export const formatPrice = (amount: number): string => {
  return `${amount} SEK`;
};

/**
 * Format price with comma for decimal
 */
export const formatPriceDecimal = (amount: number): string => {
  return `${amount.toFixed(2).replace('.', ',')} SEK`;
};

/**
 * Format date
 */
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format time
 */
export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Generate reference number
 */
export const generateReferenceNumber = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate order ID
 */
export const generateOrderId = (): string => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
