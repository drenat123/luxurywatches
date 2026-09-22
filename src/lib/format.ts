export function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

export function generateOrderNumber(): string {
  return `LW-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}
