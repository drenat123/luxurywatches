import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'msedge',headless:true,timeout:15000});
try {
for (const width of [1440,390]) {
 const page = await browser.newPage({viewport:{width,height:850}});
 let catalogueRequests=0;
 const rows=Array.from({length:120},(_,i)=>({id:`watch-${i}`,name:`Watch ${i}`,supplier_sku:`QA-${i}`,brand:'Test',gender:'men',price:100+i,image:'',in_stock:true,is_active:true,created_at:'2026-01-01',gallery:[]}));
 await page.route('**/rest/v1/products*',async route=>{
  const url=new URL(route.request().url());
  const id=url.searchParams.get('id');
  if(url.searchParams.get('select')==='*' && !id && !url.searchParams.has('limit')) catalogueRequests++;
  const data=id?.startsWith('eq.') ? rows.find(p=>p.id===id.slice(3)) : rows;
  await new Promise(r=>setTimeout(r,250));
  await route.fulfill({json:data,headers:{'content-range':'0-119/120'}});
 });
 await page.goto('http://127.0.0.1:5175/#/shop?gender=men');
 await page.locator('article').first().waitFor();
 await page.getByRole('combobox',{name:'Rendit orët'}).selectOption('price-desc');
 await page.waitForTimeout(650);
 for (let batch=1;batch<=5;batch++) {
  if(batch>1) { await page.getByRole('button',{name:'Shfaq më shumë orë',exact:true}).click(); }
  const card=page.locator('article').nth(batch*24-5).locator('a').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const before=await page.evaluate(()=>scrollY);
  await card.click();
  const back=page.getByRole('button',{name:'Kthehu në dyqan',exact:true});
  await back.waitFor();
  const requestsBeforeReturn=catalogueRequests;
  const returnStarted=Date.now();
  if(batch%2===0) await page.goBack(); else await back.click();
  await page.locator('article').nth(batch*24-1).waitFor();
  const returnMs=Date.now()-returnStarted;
  await page.waitForTimeout(400);
  assert.equal(catalogueRequests,requestsBeforeReturn,'Returning must not refetch the catalogue');
  console.log('Cached return in',returnMs,'ms');
  const after=await page.evaluate(()=>scrollY);
  assert.ok(Math.abs(before-after)<=1,`${width} batch ${batch}: ${before} != ${after}`);
  assert.equal(await page.locator('article').count(),batch*24);
  assert.equal(await page.getByRole('combobox').inputValue(),'price-desc');
  console.log(`PASS ${width}px batch ${batch}: exact position ${after}, count ${batch*24}, sort retained`);
 }
 await page.close();
}
} finally {await browser.close();}



