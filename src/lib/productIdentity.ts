import type { Product } from '@/types';

export function productModelKey(product: Product): string {
  const model = product.supplier_sku?.trim().toUpperCase()
    || product.name.toUpperCase().match(/\b[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)*\b/g)?.find(token => /\d/.test(token));
  // Keep the complete model, including color suffixes and punctuation.
  // Products without a reliable model identifier must not be merged by looks.
  return model ? `${product.brand.trim().toUpperCase()}|${model}` : `id:${product.id}`;
}

function normalizeGender(product: Product): Product {
  const women = /\bfemra\b/i.test(product.name);
  const men = /\bmeshkuj\b/i.test(product.name);
  return women !== men ? { ...product, gender: women ? 'women' : 'men' } : product;
}

export function canonicalizeProducts(rows: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of rows) {
    if (product.is_active !== true) continue;
    const key = productModelKey(product);
    groups.set(key, [...(groups.get(key) || []), product]);
  }
  const products: Product[] = [];
  const byId = new Map<string, Product>();
  for (const group of groups.values()) {
    group.sort((a, b) => Number(Boolean(b.supplier_sku)) - Number(Boolean(a.supplier_sku))
      || (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '')
      || a.id.localeCompare(b.id));
    const preferred = group[0];
    // Keep an existing genuine discount when consolidating older listings.
    // If several rows are discounted, the preferred/newest row wins.
    const priceRecord = group.find(product => product.old_price != null && product.old_price > product.price) || preferred;
    const canonical = normalizeGender({
      ...preferred,
      price: priceRecord.price,
      old_price: priceRecord.old_price,
      badge: priceRecord.badge,
    });
    products.push(canonical);
    for (const product of group) byId.set(product.id, canonical);
  }
  products.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '') || a.id.localeCompare(b.id));
  return { products, byId };
}
