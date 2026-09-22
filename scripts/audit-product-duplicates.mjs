import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/lib/productIdentity.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { canonicalizeProducts, productModelKey } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const rows = JSON.parse(fs.readFileSync(new URL('../audit/products-snapshot.json', import.meta.url), 'utf8'));
assert.equal(new Set(rows.map(p => p.id)).size, rows.length, 'Snapshot must not repeat row IDs');
const groups = new Map();
for (const p of rows) {
  const key = productModelKey(p);
  groups.set(key, [...(groups.get(key) || []), p]);
}
{
  const { products, byId } = canonicalizeProducts(rows);
  assert.equal(new Set(products.map(productModelKey)).size, products.length);
  assert.equal(byId.size, rows.filter(p => p.is_active).length);
  assert.deepEqual(products, canonicalizeProducts([...rows].reverse()).products, 'Independent of database response order');
  assert.equal(new Set(products.map(p => p.name.trim().toUpperCase())).size, products.length, 'No repeated names remain');
  assert.equal(new Set(products.map(productModelKey)).size, products.length, 'No repeated model keys remain');
  for (const [key, members] of groups) {
    if (members.every(p => !p.is_active)) continue;
    const canonical = byId.get(members[0].id);
    assert.equal(productModelKey(canonical), key);
    assert(members.some(p => p.id === canonical.id), 'Keep a real database ID');
    assert(members.every(p => byId.get(p.id).id === canonical.id), 'Old links resolve consistently');
  }
}
const sample = rows[0];
const fixtures = [
  { ...sample, id: '1', supplier_sku: 'DK.1.12345-1', name: 'DK.1.12345-1 Orë për femra', gender: 'men', price: 50, old_price: null },
  { ...sample, id: '2', supplier_sku: null, name: 'Orë për femra DK.1.12345-1', gender: 'women', price: 40, old_price: 50 },
  { ...sample, id: '3', supplier_sku: 'DK.1.12345-2', name: 'DK.1.12345-2', price: 50 },
  { ...sample, id: '4', supplier_sku: 'DK.1.12345-1', brand: 'OTHER BRAND', price: 50 },
  { ...sample, id: '5', is_active: false, supplier_sku: 'INACTIVE-1' },
];
assert.equal(canonicalizeProducts(fixtures).products.length, 3, 'Preserve color variants and separate brands; exclude inactive products');
assert.equal(canonicalizeProducts(fixtures).byId.get('2').price, 40);
assert.equal(canonicalizeProducts(fixtures).byId.get('1').old_price, 50);
assert.equal(canonicalizeProducts(fixtures).byId.get('1').gender, 'women');
const duplicates = [...groups].filter(([, members]) => members.length > 1);
const summary = {
  auditedAt: new Date().toISOString(),
  totalRows: rows.length,
  activeRows: rows.filter(p => p.is_active).length,
  uniqueModels: canonicalizeProducts(rows).products.length,
  duplicateGroups: duplicates.length,
  extraRows: duplicates.reduce((sum, [, members]) => sum + members.length - 1, 0),
  priceConflicts: duplicates.filter(([, members]) => new Set(members.map(p => p.price)).size > 1).length,
  genderFieldMismatches: rows.filter(p => (/\bfemra\b/i.test(p.name) && p.gender !== 'women') || (/\bmeshkuj\b/i.test(p.name) && p.gender !== 'men')).length,
  remainingDuplicateModels: 0,
  remainingDuplicateNames: 0,
  remainingDuplicateImageUrls: [...new Set(canonicalizeProducts(rows).products.map(p => p.image))].length === canonicalizeProducts(rows).products.length ? 0 : 'shared images can belong to distinct models',
  databaseModified: false,
};
fs.writeFileSync(new URL('../audit/duplicate-report.json', import.meta.url), JSON.stringify({ summary, duplicates: duplicates.map(([model, members]) => ({ model, records: members.map(({ id, name, gender, price, old_price, supplier_sku, updated_at }) => ({ id, name, gender, price, old_price, supplier_sku, updated_at })) })) }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('PASS: full-catalog identity, stable ordering, alias links, variants, pricing policies, gender, and inactive-product checks.');
