import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { identify, productUrl, extractDocument, validateEvidence, buildReport, generateSql, serverClock, reusableEvidence } from './tora-price-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({ options: {
  inventory: { type: 'string' }, resume: { type: 'string' }, verify: { type: 'string' },
  limit: { type: 'string' }, 'allow-partial': { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
} });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const hash = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const fields = 'id,name,brand,category,supplier,supplier_sku,source_url,price,old_price,badge,is_active';
let interrupted = false;
process.once('SIGINT', () => { interrupted = true; console.log('\nStopping after in-flight requests; saving report.'); });

async function request(url, headers = {}, supplier = false) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      let current = url;
      let response;
      for (let hop = 0; hop < 4; hop++) {
        if (supplier) productUrl(current);
        response = await fetch(current, { headers, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(25000) });
        if (![301,302,303,307,308].includes(response.status)) break;
        if (!supplier) throw new Error('Unexpected database redirect');
        const next = new URL(response.headers.get('location'), current).href;
        if (productUrl(next).model !== productUrl(url).model) throw new Error('Redirect to another model');
        current = next;
      }
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.retryable = response.status === 429 || response.status >= 500;
        const retryHeader = response.headers.get('retry-after');
        error.retryMs = Math.min(60000, Math.max(0, /^\d+$/.test(retryHeader || '') ? Number(retryHeader) * 1000 : Date.parse(retryHeader) - Date.now())) || 0;
        throw error;
      }
      return { text: await response.text(), url: current, type: response.headers.get('content-type'), serverDate: response.headers.get('date') };
    } catch (error) {
      const retryable = error.retryable || ['TimeoutError','AbortError','TypeError'].includes(error.name);
      if (!retryable || attempt === 3 || interrupted) throw error;
      console.log(`  Retry ${attempt + 1}/3: ${error.message}`);
      await sleep(Math.max(error.retryMs || 0, 1200 * 2 ** attempt));
    }
  }
}

function credentials() {
  const env = { ...process.env };
  for (const file of ['.env', '.env.local']) {
    if (!fs.existsSync(path.join(root, file))) continue;
    for (const line of fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) throw new Error('Missing public Supabase URL/key in .env. No service-role key needed.');
  const url = new URL(env.VITE_SUPABASE_URL);
  if (url.protocol !== 'https:') throw new Error('Supabase URL must use HTTPS');
  return { url: url.origin, key: env.VITE_SUPABASE_ANON_KEY };
}

async function loadInventory() {
  if (args.inventory) return readJson(path.resolve(args.inventory));
  const { url, key } = credentials();
  const rows = [];
  let lastId;
  while (true) {
    const query = new URLSearchParams({ select: fields, order: 'id.asc', limit: '500', is_active: 'eq.true', category: 'eq.watches' });
    if (lastId) query.set('id', `gt.${lastId}`);
    const response = await request(`${url}/rest/v1/products?${query}`, { apikey: key, Authorization: `Bearer ${key}` });
    const batch = JSON.parse(response.text);
    if (!Array.isArray(batch)) throw new Error('Unexpected Supabase response');
    if (!batch.length) break;
    rows.push(...batch);
    lastId = batch.at(-1).id;
  }
  return rows;
}

async function loadServerClock() {
  const { url, key } = credentials();
  const response = await request(`${url}/rest/v1/products?select=id&limit=1`, {
    apikey: key, Authorization: `Bearer ${key}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache',
  });
  const clock = serverClock(response.serverDate);
  console.log(`Supabase server UTC: ${new Date(clock.now()).toISOString()} (computer difference: ${Math.round((Date.now()-clock.now())/60000)} minutes).`);
  return clock;
}

function validateInventory(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Inventory is empty. Refusing to report success.');
  const ids = new Set();
  for (const row of rows) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id) || ids.has(row.id)) throw new Error('Invalid/duplicate product ID');
    ids.add(row.id);
    if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price <= 0
        || !(row.old_price === null || (typeof row.old_price === 'number' && Number.isFinite(row.old_price)))
        || !('is_active' in row) || !('badge' in row) || !('supplier_sku' in row) || !('source_url' in row)) throw new Error(`Incomplete inventory record ${row.id}`);
  }
}

function csv(file, rows, columns) {
  const escape = v => `"${String(v ?? '').replaceAll('"','""')}"`;
  fs.writeFileSync(file, '\uFEFF' + [columns.join(','), ...rows.map(r => columns.map(k => escape(r[k])).join(','))].join('\n') + '\n');
}

async function main() {
  if (args.help) {
    console.log('Read-only TORA price audit; never writes to Supabase.\nnode scripts/scrape_tora_dynamic.mjs\n  --limit 10               Quick check; incomplete SQL is blocked\n  --resume <run-folder>     Reuse checks under 6 hours old; retry failures\n  --verify <run-folder>     Compare live Supabase against completed audit\n  --inventory <json-file>  Explicit inventory snapshot (default: live Supabase)\n  --allow-partial           Generate apply-verified-only.sql despite unresolved rows');
    return;
  }
  if (args.verify && (args.inventory || args.resume || args.limit || args['allow-partial'])) throw new Error('--verify must be used alone with live Supabase');
  const limit = args.limit === undefined ? Infinity : Number(args.limit);
  if (!(limit > 0) || (limit !== Infinity && !Number.isInteger(limit))) throw new Error('--limit must be a positive integer');
  console.log('Reading existing watch inventory (no database writes)...');
  const inventory = await loadInventory();
  validateInventory(inventory);
  if (args.verify) {
    const report = readJson(path.join(path.resolve(args.verify), 'report.json'));
    const verified = new Map(report.filter(r => r.status === 'verified').map(r => [r.id,r]));
    const current = new Map(inventory.map(r => [r.id,r]));
    const checks = inventory.filter(r => r.is_active && r.category === 'watches').map(row => {
      const expected = verified.get(row.id);
      const wanted = expected ? { ...expected.before, ...expected.after } : null;
      return { id: row.id, name: row.name, status: !wanted ? 'UNVERIFIED' : Object.entries(wanted).every(([k,v]) => row[k] === v) ? 'MATCH' : 'MISMATCH', price: row.price, expected_price: expected?.after.price };
    });
    for (const row of verified.values()) if (!current.get(row.id)?.is_active) checks.push({ id:row.id,status:'MISSING_OR_INACTIVE' });
    csv(path.join(path.resolve(args.verify),'verification-results.csv'),checks,['id','name','status','price','expected_price']);
    console.log(JSON.stringify(checks.reduce((acc,r) => ({ ...acc, [r.status]: (acc[r.status] || 0)+1 }), {}),null,2));
    if (checks.some(r=>r.status!=='MATCH')) process.exitCode=2;
    return;
  }
  const clock = await loadServerClock();
  const timestamp = () => new Date(clock.now()).toISOString();
  const runDir = args.resume ? path.resolve(args.resume) : path.join(root,'tora-price-export',`audit-${timestamp().replace(/[:.]/g,'-')}`);
  fs.mkdirSync(runDir, { recursive: true });
  const manifestFile = path.join(runDir,'manifest.json');
  const fingerprint = hash([...inventory].sort((a,b)=>a.id.localeCompare(b.id)));
  if (args.resume) {
    const manifest = readJson(manifestFile);
    if (manifest.version !== 3 || manifest.clock_source !== clock.source) throw new Error('This checkpoint uses the old computer clock. Start a new audit without --resume.');
    if (manifest.inventory_hash !== fingerprint) throw new Error('Inventory changed since checkpoint. Run again without --resume.');
  } else {
    writeJson(manifestFile,{ version:3,clock_source:clock.source,started_at:timestamp(),local_started_at:new Date().toISOString(),inventory_hash:fingerprint,inventory_source:args.inventory ? 'file' : 'live Supabase', no_database_writes:true });
    writeJson(path.join(runDir,'inventory-before.json'),inventory);
  }
  const targets = new Map();
  for (const row of inventory.filter(r=>r.is_active === true && r.category==='watches')) {
    try { const target=identify(row); targets.set(target.key,target); } catch { /* reported per row below */ }
  }
  const checkpoint = path.join(runDir,'checkpoint.jsonl');
  const results = new Map();
  if (args.resume && fs.existsSync(checkpoint)) {
    for (const line of fs.readFileSync(checkpoint,'utf8').split('\n').filter(Boolean)) {
      try {
        const result=JSON.parse(line);
        // A newer failed check invalidates an older successful observation.
        results.delete(result.key);
        if (reusableEvidence(result,clock.now()) && targets.has(result.key)) {
          const validated=validateEvidence(result.evidence,targets.get(result.key),result.source_url);
          results.set(result.key,{...result,...validated});
        }
      } catch { /* incomplete/invalid checkpoint entries are fetched again */ }
    }
    fs.appendFileSync(checkpoint,'\n');
  }
  const pending=[...targets.values()].filter(t=>!results.has(t.key)).slice(0,limit);
  console.log(`${inventory.length} inventory rows; ${targets.size} exact watch models; ${results.size} reusable checks.\nOutput: ${runDir}\nChecking ${pending.length} models directly; unrelated categories are not scraped.`);
  let browser;
  let finished=0;
  const started=performance.now();
  const heartbeat=setInterval(()=>console.log(`Progress: ${finished}/${pending.length} requests finished (${Math.round((performance.now()-started)/1000)} seconds).`),30000);
  try {
    browser=await chromium.launch({headless:true,channel:'chrome'});
    const context=await browser.newContext({javaScriptEnabled:false});
    await context.route('**/*',route=>route.abort());
    let index=0;
    async function worker() {
      const page=await context.newPage();
      while (!interrupted && index<pending.length) {
        const target=pending[index++];
        let result;
        let evidence;
        try {
          const response=await request(target.url, {'User-Agent':'LuxuryWatchesKosove-PriceAudit/2.0','Accept':'text/html','Cache-Control':'no-cache','Pragma':'no-cache'},true);
          if (!response.type?.includes('text/html') || response.text.length>5_000_000) throw new Error('Unexpected product response');
          await page.setContent(response.text,{waitUntil:'domcontentloaded',timeout:10000});
          evidence=await page.evaluate(extractDocument);
          const prices=validateEvidence(evidence,target,response.url);
          result={...target,status:'verified',...prices,source_url:response.url,checked_at:timestamp(),clock_source:clock.source,html_sha256:hash(response.text),evidence};
        } catch(error) { result={...target,status:'unresolved',reason:error.message.split('\n')[0],evidence,checked_at:timestamp(),clock_source:clock.source}; }
        results.set(target.key,result);
        fs.appendFileSync(checkpoint,`${JSON.stringify(result)}\n`);
        finished++;
        console.log(`[${finished}/${pending.length}] ${target.model}: ${result.status==='verified' ? `EUR ${result.price} / old ${result.old_price ?? 'none'}` : `REVIEW: ${result.reason}`}`);
        await sleep(400);
      }
      await page.close();
    }
    await Promise.all([worker(),worker()]);
  } finally {
    clearInterval(heartbeat);
    if (browser) await browser.close();
    const report=buildReport(inventory,[...results.values()]);
    writeJson(path.join(runDir,'report.json'),report);
    const unresolved=report.filter(r=>r.status!=='verified');
    const verified=report.filter(r=>r.status==='verified');
    const changes=verified.filter(r=>r.changed);
    csv(path.join(runDir,'unresolved.csv'),unresolved,['id','name','brand','model','url','reason']);
    csv(path.join(runDir,'verified-prices.csv'),verified.map(r=>({id:r.id,brand:r.brand,model:r.model,source_url:r.url,checked_at:r.checked_at,...r.after})),['id','brand','model','price','old_price','badge','source_url','checked_at']);
    csv(path.join(runDir,'changes.csv'),changes.map(r=>({id:r.id,model:r.model,previous_price:r.before.price,new_price:r.after.price,previous_old_price:r.before.old_price,new_old_price:r.after.old_price,previous_badge:r.before.badge,new_badge:r.after.badge})),['id','model','previous_price','new_price','previous_old_price','new_old_price','previous_badge','new_badge']);
    const sql=generateSql(report,{allowPartial:args['allow-partial']});
    for (const filename of ['apply-prices.sql','apply-verified-only.sql','rollback.sql','verify-prices.sql']) {
      if (fs.existsSync(path.join(runDir,filename))) fs.writeFileSync(path.join(runDir,filename),"do $$ begin raise exception 'Superseded: use this run latest report and SQL'; end $$;\n");
    }
    fs.writeFileSync(path.join(runDir,args['allow-partial']?'apply-verified-only.sql':'apply-prices.sql'),sql.apply);
    fs.writeFileSync(path.join(runDir,'rollback.sql'),sql.rollback);
    fs.writeFileSync(path.join(runDir,'verify-prices.sql'),sql.verify);
    const summary={completed_at:timestamp(),clock_source:clock.source,active_watch_rows:report.length,unique_identified_models:targets.size,verified_models:[...results.values()].filter(r=>r.status==='verified').length,verified_rows:verified.length,unresolved_rows:unresolved.length,changed_rows:changes.length,complete:report.length>0 && unresolved.length===0,partial_sql:args['allow-partial'],database_updated:false};
    writeJson(path.join(runDir,'summary.json'),summary);
    console.log('\n'+JSON.stringify(summary,null,2));
    console.log(`Reports saved: ${runDir}\nSupabase has NOT been modified.`);
    if (unresolved.length || !report.length || interrupted) process.exitCode=2;
  }
}
main().catch(error=>{ console.error(`Audit stopped: ${error.message}`);process.exitCode=1; });
