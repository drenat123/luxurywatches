import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { transform } from 'esbuild';

const { code } = await transform(readFileSync('src/lib/commerce.ts', 'utf8'), { loader: 'ts', format: 'esm' });
const { orderTotals, validCart, allowedStatusChanges } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
for (const [subtotal, shipping, total] of [[0, 0, 0], [45, 3, 48], [49.99, 3, 52.99], [50, 0, 50], [51, 0, 51]]) {
  assert.deepEqual(orderTotals(subtotal ? [{ price: subtotal, quantity: 1 }] : []), { subtotal, shipping, total });
}
assert.equal(orderTotals([{ price: 16.67, quantity: 3 }]).total, 50.01);
assert.deepEqual(allowedStatusChanges('cod', 'pending_supplier_check'), ['confirmed', 'unavailable']);
assert.deepEqual(allowedStatusChanges('cod', 'confirmed'), []);
assert.ok(!allowedStatusChanges('paysera', 'confirmed').includes('shipped'));
assert.deepEqual(validCart({ bad: true }), []);

const url = readFileSync('.env', 'utf8').match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
assert.ok(url, 'Configured Supabase URL required to intercept all requests');
const project = new URL(url).hostname.split('.')[0];
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5175/';
const productId = '11111111-1111-4111-8111-111111111111';
const product = { id: productId, name: 'Test watch', brand: 'TEST', image: '/luxury-watches-header-logo.png', price: 45, is_active: true, in_stock: true, quantity: 1 };
const order = { id: '22222222-2222-4222-8222-222222222222', order_number: 'LW-QA1234', customer_name: 'QA Customer', email: 'qa@example.invalid', phone: '+38344123456', city: 'Pejë', address: 'Rruga QA 1', items: [product], subtotal: 45, shipping: 3, total: 48, payment_method: 'cod', status: 'pending_supplier_check', supplier_status: 'pending_supplier_check', supplier_notes: null, notes: 'Call before arrival', created_at: '2026-09-19T09:00:00Z' };
function session(email) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = ['header', Buffer.from(JSON.stringify({ sub: 'qa-user', email, exp })).toString('base64url'), 'signature'].join('.');
  return { access_token: jwt, refresh_token: 'qa-refresh', expires_at: exp, expires_in: 3600, token_type: 'bearer', user: { id: 'qa-user', email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } };
}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
mkdirSync('audit-evidence', { recursive: true });
let checks = 0;
async function setup({ price = 45, actualPrice = price, inStock = true, auth, width = 390, mode = 'success', corruptCart = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const calls = { inserts: [], updates: [], reads: 0 };
  let row = structuredClone(order);
  // Every Supabase operation is mocked, including failures. No real orders/emails are created.
  await page.route(`${url}/**`, async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith('/products')) return route.fulfill({ json: [{ ...product, price: actualPrice, in_stock: inStock }] });
    if (path.endsWith('/orders')) {
      if (req.method() === 'GET') { calls.reads++; return route.fulfill({ json: [row] }); }
      if (req.method() === 'POST') {
        calls.inserts.push(req.postDataJSON());
        await new Promise(resolve => setTimeout(resolve, 200));
        if (mode === 'retry' && calls.inserts.length === 1) return route.fulfill({ status: 502, json: { message: 'uncertain connection' } });
        if (mode === 'retry') return route.fulfill({ status: 409, json: { code: '23505', message: 'duplicate key value violates unique constraint "orders_pkey"' } });
        return route.fulfill({ status: 201, body: '' });
      }
      if (req.method() === 'PATCH') {
        calls.updates.push(req.postDataJSON());
        assert.ok(new URL(req.url()).searchParams.has('supplier_status') || new URL(req.url()).searchParams.has('supplier_notes'), 'Conditional update required');
        await new Promise(resolve => setTimeout(resolve, 300));
        if (mode === 'zero-row') return route.fulfill({ status: 406, json: { code: 'PGRST116', message: '0 rows' } });
        if (mode === 'failure') return route.fulfill({ status: 500, json: { message: 'QA network failure' } });
        row = { ...row, ...req.postDataJSON() };
        return route.fulfill({ json: row });
      }
    }
    if (path.endsWith('/logout')) return route.fulfill({ status: 204, body: '' });
    if (path.endsWith('/user')) return route.fulfill({ json: session(auth).user });
    return route.fulfill({ status: 400, json: { message: `Unexpected mocked request: ${path}` } });
  });
  await page.addInitScript(({ authKey, authValue, cart }) => {
    localStorage.setItem('lw_cart', JSON.stringify(cart));
    if (authValue) localStorage.setItem(authKey, JSON.stringify(authValue));
  }, { authKey: `sb-${project}-auth-token`, authValue: auth ? session(auth) : null, cart: corruptCart ? { bad: true } : [{ ...product, price }] });
  return { page, calls, errors };
}
async function fill(page) {
  for (const [id, value] of Object.entries({ customer_name: ' QA Customer ', email: 'qa@example.invalid', phone: '+38344123456', address: 'Rruga QA 1', city: 'Pejë' })) {
    await page.locator(`#checkout-${id}`).fill(value);
  }
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile page must not overflow');
}
try {
  for (const price of [45, 49.99, 50, 65]) {
    const { page, calls, errors } = await setup({ price });
    await page.goto(`${base}#/checkout`); await fill(page); await noOverflow(page);
    await page.evaluate(() => { const form = document.querySelector('form'); form.requestSubmit(); form.requestSubmit(); });
    await page.getByRole('heading', { name: 'E morëm porosinë tuaj!' }).waitFor();
    assert.equal(calls.inserts.length, 1); assert.equal(calls.inserts[0].customer_name, 'QA Customer');
    assert.equal(calls.inserts[0].total, price < 50 ? price + 3 : price);
    assert.equal(calls.inserts[0].supplier_status, 'pending_supplier_check');
    assert.equal(await page.evaluate(() => localStorage.getItem('lw_cart')), '[]');
    if (price === 45) {
      await page.goto(`${base}#/checkout`); await page.reload(); await fill(page);
      await page.getByRole('button', { name: 'Porosit tani' }).click();
      await page.getByRole('heading', { name: 'E morëm porosinë tuaj!' }).waitFor();
      assert.equal(calls.inserts.length, 2); assert.notEqual(calls.inserts[0].id, calls.inserts[1].id, 'A new deliberate purchase needs a new ID');
      checks++;
    }
    assert.deepEqual(errors, []); checks++; await page.close();
  }
  {
    const { page, calls } = await setup({ actualPrice: 49 }); await page.goto(`${base}#/checkout`); await fill(page);
    await page.getByRole('button', { name: 'Porosit tani' }).click();
    await page.getByRole('alert').filter({ hasText: 'Çmimet u përditësuan' }).waitFor(); assert.equal(calls.inserts.length, 0);
    await page.getByRole('button', { name: 'Porosit tani' }).click();
    await page.getByRole('heading', { name: 'E morëm porosinë tuaj!' }).waitFor(); assert.equal(calls.inserts[0].total, 52);
    checks++; await page.close();
  }
  {
    const { page, calls } = await setup({ mode: 'retry' }); await page.goto(`${base}#/checkout`); await fill(page);
    await page.getByRole('button', { name: 'Porosit tani' }).click(); await page.getByRole('alert').waitFor();
    await page.getByRole('button', { name: 'Porosit tani' }).click(); await page.getByRole('heading', { name: 'E morëm porosinë tuaj!' }).waitFor();
    assert.equal(calls.inserts.length, 2); assert.equal(calls.inserts[0].id, calls.inserts[1].id); assert.equal(calls.inserts[0].order_number, calls.inserts[1].order_number);
    checks++; await page.close();
  }
  for (const setting of [{ inStock: false }, { corruptCart: true }]) {
    const { page, calls, errors } = await setup(setting); await page.goto(`${base}#/checkout`);
    if (setting.corruptCart) await page.getByRole('heading', { name: 'Shporta është bosh' }).waitFor();
    else { await fill(page); await page.getByRole('button', { name: 'Porosit tani' }).click(); await page.getByRole('alert').waitFor(); }
    assert.equal(calls.inserts.length, 0); assert.deepEqual(errors, []); checks++; await page.close();
  }
  for (const target of ['confirmed', 'unavailable']) {
    const { page, calls, errors } = await setup({ auth: 'dreninallbani@gmail.com' }); await page.goto(`${base}#/admin`);
    await page.getByRole('button').filter({ hasText: 'LW-QA1234' }).click();
    const dialog = page.getByRole('dialog'); await noOverflow(page);
    if (target === 'confirmed') await page.screenshot({ path: 'audit-evidence/admin-before.png', fullPage: true });
    assert.equal(await dialog.getByRole('combobox').count(), 0);
    await dialog.getByRole('button', { name: target === 'confirmed' ? 'Ka stok · Konfirmo' : 'Nuk ka stok', exact: true }).click();
    await dialog.getByRole('button', { name: 'Duke ruajtur…' }).waitFor();
    await dialog.getByRole('status').filter({ hasText: 'Ndryshimi u ruajt me sukses' }).waitFor();
    if (target === 'confirmed') await page.screenshot({ path: 'audit-evidence/admin-confirmed.png', fullPage: true });
    assert.equal(calls.updates.length, 1); assert.equal(calls.updates[0].supplier_status, target); assert.equal(calls.updates[0].status, target);
    assert.equal(await dialog.getByRole('button', { name: 'Ka stok · Konfirmo', exact: true }).count(), 0);
    await dialog.getByText('Call before arrival', { exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'Mbyll detajet' }).click(); await page.getByRole('button', { name: 'Dil', exact: true }).click();
    await page.getByRole('heading', { name: 'Hyr në panelin e dyqanit' }).waitFor();
    assert.deepEqual(errors, []); checks++; await page.close();
  }
  for (const mode of ['zero-row', 'failure']) {
    const { page } = await setup({ auth: 'dreninallbani@gmail.com', mode }); await page.goto(`${base}#/admin`);
    await page.getByRole('button').filter({ hasText: 'LW-QA1234' }).click();
    const dialog = page.getByRole('dialog'); await dialog.getByRole('button', { name: 'Ka stok · Konfirmo', exact: true }).click();
    await dialog.getByRole('alert').waitFor(); assert.equal(await dialog.getByRole('status').count(), 0);
    assert.equal(await dialog.getByRole('button', { name: 'Ka stok · Konfirmo', exact: true }).isEnabled(), true);
    checks++; await page.close();
  }
  {
    const { page, calls } = await setup({ auth: 'dreninallbani@gmail.com' }); await page.goto(`${base}#/admin`);
    await page.getByRole('button').filter({ hasText: 'LW-QA1234' }).click(); const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Shënime të brendshme').fill('Supplier checked by phone');
    await dialog.getByRole('heading', { name: 'Artikujt' }).click(); assert.equal(calls.updates.length, 0, 'Blur must not secretly save');
    await dialog.getByRole('button', { name: 'Ruaj shënimet' }).click(); await dialog.getByRole('status').filter({ hasText: 'Shënimet u ruajtën.' }).waitFor();
    assert.deepEqual(calls.updates[0], { supplier_notes: 'Supplier checked by phone' }); checks++; await page.close();
  }
  {
    const { page, calls } = await setup({ auth: 'other@example.invalid' }); await page.goto(`${base}#/admin`);
    await page.getByRole('heading', { name: 'Nuk keni qasje në panelin e administratorit.' }).waitFor(); assert.equal(calls.reads, 0);
    checks++; await page.close();
  }
  for (const width of [320, 390, 1440]) {
    const { page, errors } = await setup({ width }); await page.goto(`${base}#/checkout`); await fill(page); await noOverflow(page);
    await page.screenshot({ path: `audit-evidence/checkout-${width}.png`, fullPage: true });
    await page.goto(`${base}#/cart`); await noOverflow(page); assert.deepEqual(errors, []); checks++; await page.close();
  }
  console.log(`PASS: pricing/state unit checks and ${checks} mocked browser scenarios. No live orders, status changes, or emails were sent.`);
} finally { await browser.close(); }
