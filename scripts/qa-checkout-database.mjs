// Local PostgreSQL only. Install isolated runtime with:
// npm install --prefix audit-qa-runtime --no-save --no-package-lock @electric-sql/pglite
import { PGlite } from '../audit-qa-runtime/node_modules/@electric-sql/pglite/dist/index.js';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
let checked = 0;
const productId = '11111111-1111-4111-8111-111111111111';
const migration = readFileSync('supabase/migrations/20260919160000_validate_checkout_prices.sql', 'utf8');
const original = {
  order_number: 'LW-TEST1234', customer_name: 'QA Customer', email: 'qa@example.invalid', phone: '+38344123456', address: 'QA Street 1', city: 'Pejë',
  payment_method: 'cod', status: 'pending_supplier_check', supplier_status: 'pending_supplier_check',
  items: [{ id: productId, name: 'Spoofed browser name', brand: 'Spoofed brand', image: 'https://invalid.example', price: 1, quantity: 1 }], subtotal: 45, shipping: 3, total: 48,
};
async function insert(changes = {}) {
  const payload = { ...original, id: crypto.randomUUID(), order_number: `LW-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`, ...changes };
  const fields = Object.keys(payload);
  await db.query(`INSERT INTO orders (${fields.join(',')}) VALUES (${fields.map((_, i) => `$${i + 1}`).join(',')})`, fields.map(key => key === 'items' ? JSON.stringify(payload[key]) : payload[key]));
  return payload;
}
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;`);
  for (const file of ['20260908111249_create_ecommerce_schema.sql', '20260910120000_add_supplier_catalog_fields.sql', '20260910130000_harden_orders_checkout.sql', '20260918180000_supplier_order_workflow.sql', '20260918183000_admin_order_access.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  }
  await db.exec(`GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    GRANT SELECT ON products TO anon, authenticated; GRANT SELECT, UPDATE ON orders TO authenticated;
    CREATE TABLE qa_receipts (payload jsonb);
    CREATE FUNCTION qa_receipt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO qa_receipts VALUES (to_jsonb(NEW)); RETURN NEW; END $$;
    CREATE TRIGGER qa_receipt AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION qa_receipt();`);
  await db.query('INSERT INTO products (id, name, brand, image, price) VALUES ($1, $2, $3, $4, $5)', [productId, 'Actual watch', 'Actual brand', '/watch.jpg', 45]);
  const old = await insert({ shipping: 0, total: 45 });
  await db.exec(migration); await db.exec(migration);
  const historical = (await db.query('SELECT total, shipping FROM orders WHERE id = $1', [old.id])).rows[0];
  assert.equal(Number(historical.total), 45); assert.equal(Number(historical.shipping), 0); checked++;
  for (const [price, shipping, total] of [[45, 3, 48], [49.99, 3, 52.99], [50, 0, 50], [75, 0, 75]]) {
    await db.query('UPDATE products SET price = $1 WHERE id = $2', [price, productId]);
    await db.exec('SET ROLE anon');
    const sent = await insert({ subtotal: price, shipping, total });
    await db.exec('RESET ROLE');
    const row = (await db.query('SELECT * FROM orders WHERE id = $1', [sent.id])).rows[0];
    assert.equal(Number(row.total), total); assert.equal(row.items[0].name, 'Actual watch'); assert.equal(row.items[0].price, price);
    const receipt = (await db.query("SELECT payload FROM qa_receipts WHERE payload->>'id' = $1", [sent.id])).rows[0].payload;
    assert.equal(Number(receipt.total), total); assert.equal(Number(receipt.shipping), shipping);
    await db.exec('SET ROLE anon');
    await assert.rejects(() => insert(sent), error => error.code === '23505');
    await db.exec('RESET ROLE');
    assert.equal((await db.query("SELECT count(*) FROM qa_receipts WHERE payload->>'id' = $1", [sent.id])).rows[0].count, 1);
    checked++;
  }
  await db.query('UPDATE products SET price = 45 WHERE id = $1', [productId]);
  const badCases = [
    { subtotal: 1, total: 4 }, { shipping: 0, total: 45 }, { total: 47 }, { items: [] }, { items: {} },
    { items: [{ ...original.items[0], quantity: -1 }] }, { items: [{ ...original.items[0], quantity: 1.5 }] },
    { items: [{ ...original.items[0], quantity: 100 }] }, { items: [original.items[0], original.items[0]] },
    { items: [{ ...original.items[0], id: crypto.randomUUID() }] }, { customer_name: '  ' }, { customer_name: '<b>FAKE</b>' },
    { email: 'invalid' }, { phone: '123' }, { supplier_status: 'confirmed' }, { status: 'paid' },
    { paid_at: new Date().toISOString() }, { supplier_notes: 'spoofed admin note' }, { payment_method: 'paysera' },
  ];
  await db.exec('SET ROLE anon');
  for (const bad of badCases) { await assert.rejects(() => insert(bad), error => error.code === 'P0001'); checked++; }
  await assert.rejects(() => db.query('SELECT * FROM orders'), /permission denied/);
  await assert.rejects(() => db.query("UPDATE orders SET supplier_status = 'confirmed'"), /permission denied/);
  await db.exec('RESET ROLE; SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({ email: 'other@example.invalid' })]);
  assert.equal((await db.query('SELECT * FROM orders')).rows.length, 0);
  assert.equal((await db.query("UPDATE orders SET supplier_status = 'confirmed' RETURNING id")).rows.length, 0); checked++;
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({ email: 'dreninallbani@gmail.com' })]);
  assert.ok((await db.query('SELECT * FROM orders')).rows.length > 0);
  assert.equal((await db.query("UPDATE orders SET supplier_status = 'unavailable' WHERE id = $1 AND supplier_status = 'pending_supplier_check' RETURNING id", [old.id])).rows.length, 1);
  assert.equal((await db.query("UPDATE orders SET supplier_status = 'confirmed' WHERE id = $1 AND supplier_status = 'pending_supplier_check' RETURNING id", [old.id])).rows.length, 0); checked++;
  console.log(`PASS: ${checked} local PostgreSQL checks including canonical pricing, shipping, webhook totals, retries, malformed orders, and access policies. Live Supabase was not accessed.`);
} finally { await db.close(); }
