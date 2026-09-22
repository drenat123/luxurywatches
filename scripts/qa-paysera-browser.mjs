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
async function setup({ price = 45, actualPrice = price, inStock = true, auth, width = 390, mode = 'success', corruptCart = false, orderOverrides = {} } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const calls = { inserts: [], updates: [], functions: [], reads: 0 };
  let row = { ...structuredClone(order), ...orderOverrides };
  // Every Supabase operation is mocked, including failures. No real orders/emails are created.
  await page.route(`${url}/**`, async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith('/functions/v1/paysera-payment')) {
      calls.functions.push(req.postDataJSON());
      await new Promise(resolve => setTimeout(resolve, 300));
      if (mode === 'failure') return route.fulfill({status:503,json:{error:'QA: Paysera settings missing'}});
      row={...row,supplier_status:'awaiting_payment',status:'awaiting_payment',payment_status:'awaiting_payment',paysera_test_mode:false,paysera_payment_url:'https://www.paysera.com/pay/?data=qa&sign=qa'};
      return route.fulfill({json:{order:row,payment_url:row.paysera_payment_url}});
    }
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
 const {page,calls,errors}=await setup();
 await page.goto(base+'#/checkout');await fill(page);await noOverflow(page);
 await page.getByRole('button',{name:/Paysera/}).click();
 await page.getByRole('button',{name:'Porosit tani'}).click();
 await page.getByRole('heading',{name:'E morëm porosinë tuaj!'}).waitFor();
 assert.equal(calls.inserts[0].payment_method,'paysera');assert.equal(calls.inserts[0].total,48);
 await page.getByText('Nuk ju është marrë asnjë pagesë.',{exact:false}).waitFor();
 assert.equal(calls.functions.length,0);assert.deepEqual(errors,[]);checks++;await page.close();
 for(const mode of ['success','failure']){
  const {page,calls,errors}=await setup({auth:'dreninallbani@gmail.com',mode,width:320,orderOverrides:{payment_method:'paysera',payment_status:'unpaid'}});
  await page.goto(base+'#/admin');await page.getByRole('button').filter({hasText:'LW-QA1234'}).click();
  const dialog=page.getByRole('dialog');await noOverflow(page);
  await dialog.getByRole('button',{name:'Ka stok · Konfirmo',exact:true}).click();
  await dialog.getByRole('button',{name:'Duke ruajtur…'}).waitFor();
  if(mode==='failure'){await dialog.getByRole('alert').filter({hasText:'QA: Paysera settings missing'}).waitFor();}
  else{await dialog.getByRole('status').filter({hasText:'linku Paysera u krijua'}).waitFor();await dialog.getByRole('button',{name:'Kopjo linkun e pagesës'}).waitFor();await page.screenshot({path:'audit-evidence/paysera-admin-320.png',fullPage:true});}
  assert.equal(calls.functions.length,1);assert.equal(calls.updates.length,0);assert.deepEqual(errors,[]);checks++;await page.close();
 }
 for(const [payment_status,supplier_status] of [['test_paid','confirmed'],['paid_review','cancelled'],['paid','paid_awaiting_arrival']]){
  const {page,errors}=await setup({auth:'dreninallbani@gmail.com',orderOverrides:{payment_method:'paysera',payment_status,supplier_status,paysera_payment_url:'https://www.paysera.com/pay/?data=qa'}});
  await page.goto(base+'#/admin');await page.getByRole('button').filter({hasText:'LW-QA1234'}).click();const dialog=page.getByRole('dialog');
  if(payment_status==='test_paid'){await dialog.getByText('TEST i suksesshëm',{exact:false}).waitFor();assert.equal(await dialog.getByRole('button',{name:/Gati për dërgesë/}).count(),0);}
  if(payment_status==='paid_review'){await dialog.getByRole('alert').filter({hasText:'Pagesa u pranua pas anulimit'}).waitFor();assert.equal(await dialog.getByRole('button',{name:/Konfirmo/}).count(),0);}
  if(payment_status==='paid') await dialog.getByText('Pagesa Paysera u konfirmua:',{exact:false}).waitFor();
  assert.deepEqual(errors,[]);checks++;await page.close();
 }
 {
  const {page,calls}=await setup({auth:'dreninallbani@gmail.com',orderOverrides:{payment_method:'paysera',payment_status:'awaiting_payment',supplier_status:'confirmed',paysera_payment_url:'https://www.paysera.com/pay/?data=qa'}});
  await page.goto(base+'#/admin');await page.getByRole('button').filter({hasText:'LW-QA1234'}).click();const dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:/Anulo/}).click();await dialog.getByRole('status').waitFor();
  assert.equal(calls.updates[0].supplier_status,'cancelled');assert.equal(await dialog.getByRole('button',{name:'Kopjo linkun e pagesës'}).count(),0);checks++;await page.close();
 }
 console.log('PASS: '+checks+' Paysera browser scenarios. All Supabase requests mocked; no live payment or emails.');
}finally{await browser.close();}
