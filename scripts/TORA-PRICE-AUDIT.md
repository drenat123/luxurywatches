# TORA retail-price audit

This tool reads your **active watches in Supabase**, then requests each exact model's public TORA product page. It does not crawl sunglasses, accessories, other brands, or category pagination. It never writes to Supabase itself.

## Run in Windows Command Prompt

```bat
cd /d "C:\Users\Berdyna Tech\Desktop\PROJECT LUXURYWATCHES FINAL WEBSITE\project"
node scripts\scrape_tora_dynamic.mjs
```

Use the existing project dependencies and installed Google Chrome. If dependencies are missing, run `npm ci` first. The project `.env` supplies the public Supabase URL and anonymous/publishable key; no service-role secret is needed. Run from the project that belongs to the correct database.

For a quick test: `node scripts\scrape_tora_dynamic.mjs --limit 10`. An incomplete test intentionally produces **blocked SQL**, not a full-store update.

The old Python command delegates to this implementation as well.

## What it checks

- Exact brand and complete model code, including color/variant suffix. No fuzzy matching.
- Product name, SKU and source URL must agree. Older records without SKUs can match through an unambiguous model in their name.
- The source must be a watch on the expected HTTPS TORA product URL, with the correct brand/model.
- Only the main purchase section supplies the current price and actual crossed-out price. Recommendations, old analytics values and unrelated euro amounts are ignored.
- Genuine discounts require `old_price > price`. Discount badges are recalculated; stale discount badges are removed. Other badges remain when there is no discount.
- Every matching active duplicate row is included by **product ID**, so an older row cannot keep overriding the displayed price after applying the update.
- Missing pages, wrong identities, variants and ambiguous prices are reported without guessing.
- Two concurrent requests, timeouts, bounded retries for temporary failures, incremental checkpoints and visible progress.
- Audit timestamps use Supabase's HTTPS server date and monotonic elapsed time, so an incorrect Windows clock or timezone cannot future-date the evidence. Missing server time stops the audit; expiry checks are never disabled.

## Read the output before applying

Every run gets its own `tora-price-export\audit-<timestamp>` folder. Existing exports are not overwritten. **Do not use the old `update-tora-retail-prices*.sql` files at the export folder root.**

- `summary.json`: counts of verified models, verified rows, unresolved rows and changes. Models and database rows differ because of legacy duplicates.
- `changes.csv`: old and proposed prices, old prices and badges.
- `unresolved.csv`: every active watch row that could not be verified, with its reason.
- `verified-prices.csv`: verified prices and source URLs/timestamps.
- `report.json` and `checkpoint.jsonl`: detailed matching/evidence for review and resume.
- `inventory-before.json`: original price/identity snapshot for recovery. Keep this folder.
- `apply-prices.sql`: transaction guarded by exact IDs and original values. **Blocked if any watch is unresolved.**
- `rollback.sql`: restore original prices/badges, provided the applied values are still unchanged.
- `verify-prices.sql`: read-only report that labels every active watch MATCH, MISMATCH, UNVERIFIED or MISSING_OR_INACTIVE.

If every watch is verified, review `changes.csv`, then paste the new run's `apply-prices.sql` into Supabase SQL Editor and run it. The SQL aborts entirely if the inventory has changed or the evidence is over 24 hours old. No products are inserted/deleted and no identity/specification fields are changed.

If there are unresolved watches, fix the model/source information or confirm missing listings with TORA, then run again. A 404 does **not** prove a product was discontinued. Never substitute another color/model or wholesale price.

To deliberately prepare an update for just the verified rows:

```bat
node scripts\scrape_tora_dynamic.mjs --resume "tora-price-export\audit-<timestamp>" --allow-partial
```

This generates `apply-verified-only.sql` and a rollback file, while explicitly leaving unresolved products unchanged. It is **not** a complete price synchronization. Exit code 2 still indicates unresolved rows.

## Resume and verify

```bat
node scripts\scrape_tora_dynamic.mjs --resume "tora-price-export\audit-<timestamp>"
node scripts\scrape_tora_dynamic.mjs --verify "tora-price-export\audit-<timestamp>"
```

Resume reuses validated evidence younger than six hours and retries failures. It rejects a changed inventory snapshot. After applying SQL, use `--verify`, not `--resume`: verify fetches fresh Supabase records and creates `verification-results.csv`. It does not recheck today's TORA prices; start a new audit for that.

Old version-2 checkpoints used the computer clock and cannot be resumed by version 3. Start a new run with `node scripts\scrape_tora_dynamic.mjs --allow-partial`. Use the new folder printed by that run; do not reuse its predecessor's SQL. A transaction rejected by the timestamp guard has not applied its price changes.

All active rows must report MATCH and there must be no unresolved watches before calling the synchronization complete. A supplier can change prices or remove pages at any time; no scraper can guarantee permanently correct prices or invent prices for absent listings.

Exit codes: 0 = complete audit/matching verification; 2 = unresolved/mismatched/interrupted; 1 = setup/runtime failure.

For an explicit offline inventory input, use `--inventory <json-file>` containing the same fields as `inventory-before.json`. SQL still checks the saved original values against live records before applying.

## Regression tests

```bat
node --test scripts\tora-price-core.test.mjs
```

Tests cover identity conflicts, variant suffixes, non-watch sources, ambiguous money values, the Q&Q entity encoding, unrelated page prices, legacy duplicates, SQL blocking and recovery guards. No live database writes are involved.
