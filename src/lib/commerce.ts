import type { CartItem } from '@/types';

export const FREE_SHIPPING_CENTS = 5000;
export const SHIPPING_CENTS = 300;
export const MAX_QUANTITY = 99;

export function orderTotals(items: Pick<CartItem, 'price' | 'quantity'>[]) {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const shippingCents = subtotalCents > 0 && subtotalCents < FREE_SHIPPING_CENTS ? SHIPPING_CENTS : 0;
  return { subtotal: subtotalCents / 100, shipping: shippingCents / 100, total: (subtotalCents + shippingCents) / 100 };
}

// Storage is untrusted: a malformed old cart must not crash checkout or produce invalid orders.
export function validCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item): item is CartItem => {
    if (!item || typeof item !== 'object') return false;
    const valid = typeof item.id === 'string' && item.id.length > 0 && !seen.has(item.id)
      && typeof item.name === 'string' && typeof item.brand === 'string' && typeof item.image === 'string'
      && Number.isFinite(item.price) && item.price > 0
      && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_QUANTITY;
    if (valid) seen.add(item.id);
    return valid;
  });
}

export const STATUS_LABELS: Record<string, string> = {
  pending_supplier_check: 'Në pritje të stokut', confirmed: 'Stoku u konfirmua',
  supplier_confirmed: 'Stoku u konfirmua', awaiting_payment: 'Në pritje të pagesës',
  paid_awaiting_arrival: 'Pagesa u konfirmua', ready_to_ship: 'Gati për dërgesë',
  shipped: 'Dërguar', unavailable: 'Nuk ka stok', cancelled: 'Anuluar',
};

export function allowedStatusChanges(payment: string, current = 'pending_supplier_check'): string[] {
  if (current === 'pending_supplier_check') return ['confirmed', 'unavailable'];
  // COD uses the owner's two-action workflow. A finished decision is not a resend button.
  if (payment === 'cod') return [];
  if (payment !== 'paysera') return [];
  // Paysera payment links are created automatically when stock is confirmed,
  // and successful payments are advanced by the verified Paysera callback.
  const next: Record<string, string[]> = {
    confirmed: ['confirmed', 'cancelled'], supplier_confirmed: ['confirmed', 'cancelled'], awaiting_payment: ['confirmed', 'cancelled'],
    paid_awaiting_arrival: ['ready_to_ship'], ready_to_ship: ['shipped'],
  };
  return next[current] || [];
}
