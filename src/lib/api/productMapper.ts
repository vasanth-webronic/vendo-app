/**
 * Mapper to convert Spring data from vm-service to Product format
 */
import { Spring } from './vmService';
import { Product } from '../types';

/**
 * Convert Spring to Product
 * Returns null if spring doesn't have linked_product
 */
export function springToProduct(spring: Spring): Product | null {
  // Filter out springs without linked_product
  if (!spring.linked_product) {
    return null;
  }

  // Parse linked_product
  let productData: any = {};
  try {
    productData = typeof spring.linked_product === 'string'
      ? JSON.parse(spring.linked_product)
      : spring.linked_product;
  } catch (e) {
    console.warn('Failed to parse linked_product:', e);
    return null; // Return null if parsing fails
  }

  // Use linked_product.title for product name (fallback to name or title)
  const name = productData.title || productData.name || `Product ${spring.selection_number}`;
  const price = productData.price || 0;
  const image = productData.image || productData.image_url || '/placeholder.svg';
  const category = productData.category || 'General';
  const isAgeRestricted = productData.is_age_restricted || productData.isAgeRestricted || false;
  const taxRate = productData.tax_rate || productData.taxRate || 0;
  const depositAmount = productData.deposit_amount || productData.depositAmount;

  return {
    id: spring.id,
    name,
    price,
    image,
    category,
    isAgeRestricted,
    taxRate,
    depositAmount,
    // Store additional spring data for dispense
    selectionNumber: parseInt(spring.selection_number, 10),
    inventory: spring.inventory,
    capacity: spring.capacity,
    springStatus: spring.spring_status,
    stripeCode: spring.stripe_code,
    vmId: spring.vm_id,
    storeId: spring.store_id,
  } as Product;
}

/**
 * Filter out springs with no inventory, invalid status, or no linked_product
 */
export function filterAvailableSprings(springs: Spring[]): Spring[] {
  return springs.filter(
    (spring) =>
      spring.linked_product != null && // Must have linked_product
      spring.inventory > 0 &&
      spring.spring_status !== 'broken' &&
      spring.spring_status !== 'maintenance'
  );
}

/**
 * Map springs to products and filter out null values (springs without linked_product)
 */
export function mapSpringsToProducts(springs: Spring[]): Product[] {
  return springs
    .map(springToProduct)
    .filter((product): product is Product => product !== null);
}
