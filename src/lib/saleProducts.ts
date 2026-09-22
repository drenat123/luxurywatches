import type { Product } from '@/types';

export function isDiscountedProduct(product: Pick<Product, 'is_active' | 'price' | 'old_price'>): boolean {
  return product.is_active === true && product.old_price != null && product.old_price > product.price;
}
