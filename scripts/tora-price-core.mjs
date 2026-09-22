// Strict identity and price validation, shared with regression tests.
export const CLOCK_SOURCE = 'supabase-http-date-v1';

// Anchor UTC to the trusted HTTPS server response, then advance by monotonic
// elapsed time. A wrong Windows clock or DST change cannot future-date evidence.
export function serverClock(dateHeader, monotonicNow = () => performance.now()) {
  const epoch = Date.parse(dateHeader);
  if (!dateHeader || !Number.isFinite(epoch)) throw new Error('Missing/invalid Supabase server date. Refusing to timestamp price evidence.');
  const anchor = monotonicNow();
  return { source: CLOCK_SOURCE, now: () => epoch + monotonicNow() - anchor };
}

export function reusableEvidence(result, now) {
  const age = now - Date.parse(result.checked_at);
  return result.clock_source === CLOCK_SOURCE && result.status === 'verified' && Number.isFinite(age) && age >= 0 && age < 6 * 3600000;
}

export const BRANDS = ['BIGOTTI', 'DANIEL KLEIN', 'SERGIO TACCHINI', 'FREELOOK', 'CASIO', 'Q&Q', 'POLO EXCHANGE'];
export const normalize = value => String(value ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
export function normalizeBrand(value) {
  let brand = normalize(value);
  // TORA currently double/triple-encodes Q&Q in its brand label.
  for (let i=0;i<4;i++) brand=brand.replaceAll('&AMP;', '&');
  return brand.replace(/^Q\s*&\s*Q$/, 'Q&Q');
}
export const modelsIn = text => [...new Set((normalize(text).match(/[A-Z0-9]+(?:[.\/-][A-Z0-9]+)*/g) || [])
  .filter(token => /[A-Z]/.test(token) && /\d/.test(token)))];

export function productUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['tora-ks.com', 'www.tora-ks.com'].includes(url.hostname)
      || url.username || url.password || url.port || url.search || url.hash
      || !/^\/product\/[^/]+\/?$/.test(url.pathname)) throw new Error('Untrusted/non-product source URL');
  return { url: url.href, model: normalize(decodeURIComponent(url.pathname.replace(/\/$/, '').split('/').pop())) };
}

export function identify(row) {
  if (!BRANDS.includes(normalizeBrand(row.brand))) throw new Error('Unsupported brand');
  if (row.category !== 'watches') throw new Error('Not a watch');
  const titleModels = modelsIn(row.name);
  const sku = normalize(row.supplier_sku);
  const source = row.source_url ? productUrl(row.source_url) : null;
  const model = sku || source?.model || (titleModels.length === 1 ? titleModels[0] : '');
  if (!model || !/^[A-Z0-9]+(?:[.\/-][A-Z0-9]+)*$/.test(model) || !/\d/.test(model)) throw new Error('Missing/ambiguous model');
  if (source && source.model !== model) throw new Error('SKU and source URL disagree');
  if (titleModels.length !== 1 || titleModels[0] !== model) throw new Error('Model and product title disagree');
  const brand = normalizeBrand(row.brand);
  return { key: `${brand}|${model}`, brand, model, url: source?.url || `https://www.tora-ks.com/product/${encodeURIComponent(model)}` };
}

export function money(text) {
  const raw = String(text).replace(/\u00a0/g, ' ').trim();
  const match = raw.match(/^(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|EUR)$/i);
  if (!match) throw new Error(`Ambiguous/missing EUR price: ${raw.slice(0,80)}`);
  const cents = Math.round(Number(match[1].replace(',', '.')) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Price must be positive');
  return cents / 100;
}

// Runs in an offline document; external requests and page scripts are disabled.
export function extractDocument() {
  const sections = [...document.querySelectorAll('.product-page')];
  const roots = sections.filter(el => el.querySelector('h1') && el.querySelector('.cart-buttons'));
  if (roots.length !== 1) throw new Error('Expected exactly one main product section');
  const root = roots[0];
  const texts = (selector, parent = root) => [...parent.querySelectorAll(selector)].map(el => el.textContent.trim());
  const carts = root.querySelectorAll('.cart-buttons');
  if (carts.length !== 1) throw new Error('Expected exactly one main purchase section');
  const cart = carts[0];
  return {
    titles: texts('h1'),
    brands: texts('p').filter(t => /^Brendi\s*:/i.test(t)).map(t => t.replace(/^Brendi\s*:\s*/i, '')),
    models: sections.flatMap(section => [...section.querySelectorAll('tr')]).filter(tr => /^Model No\.?$/i.test(tr.querySelector('th')?.textContent.trim() || '')).map(tr => tr.querySelector('td')?.textContent.trim()),
    current: texts('.per-kfp-price', cart), old: texts('.discount del', cart), allStruck: texts('del, s', cart),
    variants: root.querySelectorAll('.variants .variant').length + [...cart.querySelectorAll('select')].filter(el => el.options.length > 1).length,
  };
}

export function validateEvidence(e, target, finalUrl) {
  if (productUrl(finalUrl).model !== target.model) throw new Error('Redirected to a different model');
  if (e.titles.length !== 1 || e.brands.length !== 1 || e.current.length !== 1) throw new Error('Missing/ambiguous title, brand or main price');
  if (normalizeBrand(e.brands[0]) !== target.brand) throw new Error('Source brand does not match inventory');
  const models = modelsIn(e.titles[0]);
  if (models.length !== 1 || models[0] !== target.model) throw new Error('Source title does not match exact model');
  if (!/(?:^|\s)(?:or[eëa]|watch)(?:\s|$)/i.test(e.titles[0])) throw new Error('Source product is not clearly a watch');
  if (e.models.length > 1 || (e.models.length === 1 && normalize(e.models[0]) !== target.model)) throw new Error('Source specification model disagrees');
  if (e.variants) throw new Error('Variant-dependent pricing needs review');
  if (e.old.length > 1 || e.allStruck.length !== e.old.length) throw new Error('Ambiguous crossed-out price');
  const price = money(e.current[0]);
  const old_price = e.old.length ? money(e.old[0]) : null;
  if (old_price !== null && old_price <= price) throw new Error('Crossed-out price is not higher than sale price');
  return { price, old_price };
}

export function saleBadge(row, price, oldPrice) {
  if (oldPrice !== null) return `-${Math.round((oldPrice - price) / oldPrice * 100)}%`;
  return row.badge && /(?:%|zbrit|sale|discount|ofert)/i.test(row.badge) ? null : (row.badge ?? null);
}

export function buildReport(inventory, results) {
  const byKey = new Map(results.filter(r => r.status === 'verified').map(r => [r.key, r]));
  return inventory.filter(r => r.is_active === true && r.category === 'watches').map(row => {
    try {
      const target = identify(row);
      const result = byKey.get(target.key);
      if (!result) return { id: row.id, name: row.name, ...target, status: 'unresolved', reason: results.find(r => r.key === target.key)?.reason || 'Not checked' };
      const before = Object.fromEntries(['name','brand','category','supplier_sku','source_url','is_active','price','old_price','badge'].map(k => [k, row[k] ?? null]));
      const after = { price: result.price, old_price: result.old_price, badge: saleBadge(row, result.price, result.old_price) };
      return { id: row.id, ...target, status: 'verified', checked_at: result.checked_at, before, after, changed: Object.keys(after).some(k => before[k] !== after[k]) };
    } catch (error) { return { id: row.id, name: row.name, status: 'unresolved', reason: error.message }; }
  });
}

const quote = value => `'${String(value).replaceAll("'", "''")}'`;
export function generateSql(report, { allowPartial = false } = {}) {
  const unresolved = report.filter(r => r.status !== 'verified');
  const verified = report.filter(r => r.status === 'verified');
  const changed = verified.filter(r => r.changed);
  const blocked = !verified.length || (unresolved.length && !allowPartial);
  const data = verified.map(r => ({ id: r.id, before: r.before, after: r.after, checked_at: r.checked_at, changed: r.changed }));
  const setup = `create temporary table tora_price_plan on commit drop as\nselect * from jsonb_to_recordset(${quote(JSON.stringify(data))}::jsonb)\nas x(id uuid, before jsonb, after jsonb, checked_at timestamptz, changed boolean);`;
  const guard = (rollback = false) => `do $tora$\nbegin\n  perform p.id from public.products p join tora_price_plan x on p.id=x.id for update of p;\n  if exists (select 1 from tora_price_plan x left join public.products p on p.id=x.id\n    where p.id is null or not (to_jsonb(p) @> ${rollback ? '(x.before || x.after)' : 'x.before'})) then\n    raise exception 'Products changed since this report. Nothing updated. Run a fresh audit.';\n  end if;\n${rollback ? '' : "  if exists (select 1 from tora_price_plan where checked_at < now() - interval '24 hours' or checked_at > now() + interval '5 minutes') then\n    raise exception 'Price evidence expired. Run a fresh audit.';\n  end if;\n"}${!rollback && !allowPartial ? "  if exists (select 1 from public.products p where p.is_active=true and p.category='watches' and not exists (select 1 from tora_price_plan x where x.id=p.id)) then\n    raise exception 'New active watches were added. Run a fresh audit.';\n  end if;\n" : ''}end $tora$;`;
  const update = (rollback = false) => `update public.products p set\n  price=(x.${rollback ? 'before' : 'after'}->>'price')::numeric,\n  old_price=(x.${rollback ? 'before' : 'after'}->>'old_price')::numeric,\n  badge=x.${rollback ? 'before' : 'after'}->>'badge'\nfrom tora_price_plan x where p.id=x.id and x.changed\nreturning p.id, p.name, p.price, p.old_price, p.badge;`;
  const header = `-- ${verified.length} verified rows; ${unresolved.length} unresolved; ${changed.length} changes.\n-- Point-in-time public retail prices. Exact IDs; no products inserted/deleted.\n`;
  const apply = blocked ? `${header}do $$ begin raise exception 'BLOCKED: incomplete or empty price audit. Review unresolved.csv. No prices changed.'; end $$;\n`
    : `${header}${allowPartial ? '-- PARTIAL UPDATE: unresolved products retain their existing prices.\n' : ''}begin;\nset local standard_conforming_strings=on;\nlock table public.products in share row exclusive mode;\n${setup}\n${guard()}\n${update()}\ncommit;\n`;
  const rollback = blocked ? '-- No executable update generated. Nothing to roll back.\n'
    : `${header}-- Restores original values ONLY if the applied values remain unchanged.\nbegin;\nset local standard_conforming_strings=on;\nlock table public.products in share row exclusive mode;\n${setup}\n${guard(true)}\n${update(true)}\ncommit;\n`;
  const verify = `${header}begin;\n${setup}\nselect p.id,p.name,p.supplier_sku,p.price,p.old_price,p.badge,x.after as expected,\n case when x.id is null then 'UNVERIFIED' when to_jsonb(p) @> (x.before || x.after) then 'MATCH' else 'MISMATCH' end as result\nfrom public.products p left join tora_price_plan x on x.id=p.id\nwhere p.is_active=true and p.category='watches'\nunion all\nselect x.id,x.before->>'name',x.before->>'supplier_sku',null,null,null,x.after,'MISSING_OR_INACTIVE'\nfrom tora_price_plan x where not exists (select 1 from public.products p where p.id=x.id and p.is_active=true and p.category='watches')\norder by result,name;\ncommit;\n`;
  return { apply, rollback, verify };
}
