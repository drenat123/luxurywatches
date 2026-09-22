import { generateOrderNumber } from '@/lib/format';
import type { CartItem } from '@/types';

export type CustomerForm = { customer_name: string; email: string; phone: string; address: string; city: string; zip: string; notes: string };
export function cleanCustomer(form: CustomerForm): CustomerForm {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, key === 'email' ? value.trim().toLowerCase() : value.trim()])) as CustomerForm;
}
export function customerError(form: CustomerForm) {
  if (Object.entries(form).some(([key, value]) => key !== 'notes' && /[<>]/.test(value))) return 'Përdorni tekst të zakonshëm në të dhënat e kontaktit.';
  if (form.customer_name.length > 120 || form.email.length > 254 || form.phone.length > 30 || form.address.length > 250 || form.city.length > 100 || form.zip.length > 20 || form.notes.length > 1000) return 'Një nga fushat përmban shumë tekst. Ju lutemi shkurtojeni.';
  if (form.customer_name.length < 2) return 'Shkruani emrin dhe mbiemrin.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Shkruani një adresë emaili të vlefshme.';
  if (!/^[+\d\s().-]+$/.test(form.phone) || form.phone.replace(/\D/g, '').length < 8 || form.phone.replace(/\D/g, '').length > 15) return 'Shkruani një numër telefoni të vlefshëm.';
  if (form.address.length < 5) return 'Shkruani adresën e plotë të dorëzimit.';
  if (form.city.length < 2) return 'Shkruani qytetin e dorëzimit.';
  return '';
}

type Attempt = { fingerprint: string; id: string; order_number: string };
let memoryAttempt: Attempt | null = null;
// A timeout may happen after the database committed. Reuse the same ID on retry.
export async function checkoutAttempt(payload: unknown): Promise<Attempt> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  let previous = memoryAttempt;
  try { previous = JSON.parse(sessionStorage.getItem('lw-checkout-attempt') || 'null') || previous; } catch { /* optional storage */ }
  if (previous?.fingerprint === fingerprint && /^[0-9a-f-]{36}$/.test(previous.id)) return previous;
  const next = { fingerprint, id: crypto.randomUUID(), order_number: generateOrderNumber() };
  memoryAttempt = next;
  try { sessionStorage.setItem('lw-checkout-attempt', JSON.stringify(next)); } catch { /* memory fallback */ }
  return next;
}
export type PaymentMethod = 'cod' | 'paysera';
export type Receipt = { order_number: string; subtotal: number; shipping: number; total: number; payment_method: PaymentMethod };
let lastReceipt: Receipt | null = null;
export function rememberReceipt(receipt: Receipt) {
  lastReceipt = receipt;
  try { sessionStorage.setItem('lw-last-receipt', JSON.stringify(receipt)); } catch { /* memory fallback */ }
}
export function finishCheckoutAttempt() {
  memoryAttempt = null;
  try { sessionStorage.removeItem('lw-checkout-attempt'); } catch { /* memory fallback */ }
}
export function findReceipt(number?: string): Receipt | null {
  try {
    const receipt = JSON.parse(sessionStorage.getItem('lw-last-receipt') || 'null') || lastReceipt;
    return receipt?.order_number === number ? receipt : null;
  } catch { return lastReceipt?.order_number === number ? lastReceipt : null; }
}
export function cartChanged(before: CartItem[], after: CartItem[]) {
  return before.some((item, index) => Math.round(item.price * 100) !== Math.round(after[index]?.price * 100));
}
