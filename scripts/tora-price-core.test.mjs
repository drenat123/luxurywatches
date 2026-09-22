import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { money, identify, productUrl, validateEvidence, extractDocument, buildReport, generateSql, saleBadge, serverClock, reusableEvidence, CLOCK_SOURCE } from './tora-price-core.mjs';

test('audit timestamps follow server UTC even when Windows time is an hour ahead or changes',()=>{
  let elapsed = 100;
  const clock = serverClock('Thu, 17 Sep 2026 15:01:44 GMT',()=>elapsed);
  const epoch = Date.parse('2026-09-17T15:01:44Z');
  const original = Date.now;
  try {
    Date.now = () => epoch + 3600000;
    assert.equal(clock.now(),epoch);
    elapsed += 30000;
    Date.now = () => epoch - 86400000;
    assert.equal(clock.now(),epoch + 30000);
  } finally { Date.now = original; }
  assert.throws(()=>serverClock(null));
  assert.throws(()=>serverClock('invalid'));
});

test('resume rejects legacy computer-clock, future and expired evidence',()=>{
  const now=Date.parse('2026-09-17T15:10:00Z');
  const result={status:'verified',clock_source:CLOCK_SOURCE,checked_at:'2026-09-17T15:05:00Z'};
  assert.equal(reusableEvidence(result,now),true);
  for (const change of [{clock_source:undefined},{checked_at:'2026-09-17T16:05:00Z'},{checked_at:'2026-09-17T08:00:00Z'},{checked_at:'invalid'},{status:'unresolved'}]) {
    assert.equal(reusableEvidence({...result,...change},now),false);
  }
});

const row = {id:'00000000-0000-4000-8000-000000000001',name:'Orë dore për meshkuj BIGOTTI BG.1.10536-4',brand:'BIGOTTI',category:'watches',is_active:true,supplier_sku:'BG.1.10536-4',source_url:'https://www.tora-ks.com/product/BG.1.10536-4',price:55,old_price:null,badge:null};
const target=identify(row);
const evidence={titles:[row.name],brands:['BIGOTTI'],models:[target.model],current:['44 €'],old:['55 €'],allStruck:['55 €'],variants:0};

test('EUR decimal parsing rejects ambiguous or multiple prices',()=>{
  for(const text of ['44 €','44,00 €','44.00 EUR']) assert.equal(money(text),44);
  for(const text of ['0 €','-5 €','1,234 €','45 € 55 €','USD 45','', 'NaN €']) assert.throws(()=>money(text));
});
test('identity preserves model suffixes and checks title, SKU and source',()=>{
  assert.equal(identify({...row,supplier_sku:null,source_url:null}).key,target.key);
  assert.throws(()=>identify({...row,supplier_sku:'BG.1.10536-5'}));
  assert.throws(()=>identify({...row,name:'Glasses XX99'}));
  assert.throws(()=>identify({...row,category:'accessories'}));
  assert.throws(()=>identify({...row,brand:'OTHER'}));
  assert.notEqual(identify({...row,name:row.name.replace('-4','-5'),supplier_sku:null,source_url:null}).key,target.key);
});
test('source whitelist excludes credential leaks, other hosts and other routes',()=>{
  for(const url of ['http://www.tora-ks.com/product/X1','https://evil.com/product/X1','https://www.tora-ks.com.evil.com/product/X1','https://user:pass@www.tora-ks.com/product/X1','https://www.tora-ks.com/category/X1']) assert.throws(()=>productUrl(url));
});
test('missing, contradictory, variant and wrong-product evidence never becomes an update',()=>{
  assert.deepEqual(validateEvidence(evidence,target,target.url),{price:44,old_price:55});
  for(const change of [{current:[]},{current:['44 €','55 €']},{old:['30 €'],allStruck:['30 €']},{brands:['CASIO']},{models:['BG.1.10536-5']},{variants:2},{old:[],allStruck:['55 €']},{titles:['BG.1.10536-4 Syze BIGOTTI']}]) assert.throws(()=>validateEvidence({...evidence,...change},target,target.url));
  assert.throws(()=>validateEvidence(evidence,target,target.url.replace('-4','-5')));
});
test('Q&Q malformed HTML brand entities are normalized without fuzzy model matching',()=>{
  const q=identify({...row,name:'QZ81J202Y Orë dore Q&Q',brand:'Q&Q',supplier_sku:'QZ81J202Y',source_url:null});
  assert.equal(validateEvidence({...evidence,titles:['QZ81J202Y Orë dore Q&Q'],models:['QZ81J202Y'],brands:['Q&amp;amp;Q']},q,q.url).price,44);
});
test('all exact legacy duplicate rows receive the same verified prices and refreshed badges',()=>{
  const result={...target,status:'verified',price:44,old_price:55,checked_at:new Date().toISOString()};
  const report=buildReport([row,{...row,id:'00000000-0000-4000-8000-000000000002',supplier_sku:null,source_url:null,price:33,old_price:60}], [result]);
  assert.equal(report.length,2);
  for(const entry of report) assert.deepEqual(entry.after,{price:44,old_price:55,badge:'-20%'});
  assert.equal(saleBadge({badge:'-40%'},55,null),null);
  assert.equal(saleBadge({badge:'NEW'},55,null),'NEW');
});
test('SQL blocks incomplete coverage; partial updates require explicit opt-in and retain guards',()=>{
  const report=buildReport([row], [{...target,status:'verified',price:44,old_price:55,checked_at:new Date().toISOString()}]);
  const full=generateSql(report);
  assert.match(full.apply,/for update of p/);
  assert.match(full.apply,/interval '24 hours'/);
  assert.match(full.apply,/New active watches/);
  assert.match(full.apply,/where p.id=x.id and x.changed/);
  assert.match(full.rollback,/x.before \|\| x.after/);
  assert.match(full.verify,/UNVERIFIED/);
  assert.match(full.verify,/MISSING_OR_INACTIVE/);
  assert.doesNotMatch(generateSql([...report,{status:'unresolved'}]).apply,/update public.products/);
  assert.match(generateSql([...report,{status:'unresolved'}],{allowPartial:true}).apply,/PARTIAL UPDATE/);
  assert.doesNotMatch(generateSql([],{allowPartial:true}).apply,/update public.products/);
});
test('SQL quotes product text and keeps recovery snapshot',()=>{
  const report=buildReport([{...row,name:row.name+" l'ora"}],[{...target,status:'verified',price:44,old_price:55,checked_at:new Date().toISOString()}]);
  assert.match(generateSql(report).apply,/l''ora/);
  assert.match(generateSql(report).rollback,/x\.before->>'price'/);
});
test('DOM parser ignores recommendations, hidden tracking price and separate specs section',async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context=await browser.newContext({javaScriptEnabled:false});
    await context.route('**/*',route=>route.abort());
    const page=await context.newPage();
    const html=`<script>window.product_price=999;document.body.innerHTML='bad';</script>
      <div>Special recommendation 999 €</div>
      <div class="product-page card"><h1>${row.name}</h1><p>Brendi: BIGOTTI</p>
        <div class="cart-buttons"><div class="discount"><del>55 €</del></div><span class="per-kfp-price">44 €</span></div>
      </div>
      <div class="product-page"><table><tr><th>Model No.</th><td>BG.1.10536-4</td></tr></table></div>
      <div class="recommendations"><span class="per-kfp-price">120 €</span><del>150 €</del></div>`;
    await page.setContent(html);
    assert.deepEqual(validateEvidence(await page.evaluate(extractDocument),target,target.url),{price:44,old_price:55});
    await page.setContent(html.replace('<div class="discount"><del>55 €</del></div>',''));
    assert.deepEqual(validateEvidence(await page.evaluate(extractDocument),target,target.url),{price:44,old_price:null});
    await page.setContent('<h1>Access denied</h1>');
    await assert.rejects(()=>page.evaluate(extractDocument));
  } finally {await browser.close();}
});
