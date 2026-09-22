# Checkout and admin audit — 19 September 2026

## Fixed in the preview and next Hostinger build

- COD's red unavailable button was rejected by a validator that omitted `unavailable`. Both stock decisions now work.
- COD now has the requested two decisions on pending orders: confirm stock / unavailable. Completed decisions are displayed persistently from the database, with no duplicate status dropdown or repeated notification clicks.
- Admin saves now require the database to return the updated order. A zero-row response, expired access, or conflicting edit no longer produces a false success.
- Conditional updates prevent a stale tab from overwriting another tab's status or notes. Buttons lock immediately during a save and unlock on failure.
- Error and success feedback appears inside the open order panel, where it is visible.
- Removed the unsupported claim that an email was triggered/sent. The panel shows the actual saved decision and intended recipient; delivery acknowledgement is not yet connected.
- Authentication changes are subscribed to. Logout clears orders and closes details; restored non-admin sessions do not load orders.
- Internal notes save explicitly, avoiding competing blur/status requests. Customer delivery notes are now visible.
- Admin orders refresh periodically while the page is visible; retrieval handles more than the default API page of orders.
- Mobile order cards replace the overflowing desktop table. The details dialog supports Escape, focus trapping, and background-scroll locking.
- Cart, cart drawer, checkout and order receipt use cent-based totals: €3 shipping below €50; €0 from €50. A €45 watch totals €48; €50 totals €50.
- Removed outdated courier-pricing text and made the shipping information and threshold consistent.
- Success page displays the submitted totals from a session receipt. Opening an arbitrary success URL no longer falsely claims that an order was accepted.
- Cart storage loads safely without initially overwriting the saved cart. Malformed cart data and invalid quantities cannot crash checkout.
- Checkout trims and validates customer details, checks current product availability/prices, and asks the buyer to review changed prices before submitting.
- Immediate submission locking prevents double clicks. Retries of the same uncertain request reuse an opaque UUID and order number; a deliberate new purchase receives a new ID after success.
- Saved orders explicitly start in `pending_supplier_check` for both status fields.
- Paysera is not available for new checkout orders until its real integration is implemented. Its old scaffold accepted client prices, used an unsupported digest, and pointed at a nonexistent callback. The local endpoint now fails closed rather than generating an unsafe payment link.
- Fixed header spacing so the announcement bar does not cover checkout/cart content or catalogue controls.

## Database protection prepared — APPLY BEFORE LAUNCH

Open `supabase/migrations/20260919160000_validate_checkout_prices.sql` and run its contents in the Supabase SQL Editor once. Do not paste its filename into the SQL editor.

This preserves existing orders and notification webhooks. New orders are checked against catalogue prices and shipping rules in the database; product details are canonicalized, invalid quantities and forged initial statuses are rejected, and unpaid orders cannot insert themselves as paid/confirmed. Browser checks alone are not a security boundary.

The migration was executed twice successfully in an isolated local PostgreSQL runtime with the project's schema and policies. It has NOT been applied to hosted Supabase: only the storefront preview was available in the connected browser, and no Supabase management connection is configured.

## Email and payment boundaries

- The live Make/Resend templates and webhook SQL were not available locally or through a connected dashboard. They were not edited, and no live emails were sent during this audit.
- Existing order-created emails should map the saved `record.total`, `record.shipping`, and `record.subtotal`. Status emails use the fields actually delivered by their status webhook; those remote field mappings still need verification in Make.
- A successful order update proves a saved status. Real “email sent/delivered” confirmation requires Make/Resend to record its result back to Supabase, including which order/status it belongs to. This callback is not configured by the website upload.
- The stock-confirmed email and the owner's two-action COD workflow remain separate from payment processing. Existing historical Paysera orders remain visible, with guarded manual progression and an explicit payment-verification note.
- The local Paysera function change is not deployed by uploading Hostinger files. Deploy its safe disabled version if an older payment function is currently deployed; complete server pricing and verified callbacks before enabling online payments.

## Verification

- TypeScript app checks and targeted ESLint for changed checkout/admin logic.
- `node scripts/qa-checkout-admin.mjs`: 18 isolated browser scenarios, plus pricing/state unit checks. Exercises shipping boundaries, duplicate clicks, retry after an uncertain response, deliberate reorder, price changes, unavailable items, malformed storage, both COD buttons, zero-row/error handling, note saves, logout, non-admin access, and 320/390/1440px layouts.
- `node scripts/qa-checkout-database.mjs`: 26 local PostgreSQL checks, including RLS, price tampering, malformed requests, correct webhook totals, duplicate retries, and preservation of historical orders. Requires the isolated `audit-qa-runtime` package installed during this audit.
- `node scripts/qa-catalogue-return.mjs`: 10 catalogue round trips across desktop/mobile with exact restored scroll positions and no catalogue refetch.
- Screenshots: `audit-evidence/`. Source backup: `audit-backup-20260919/`.
- Tests intercept all database requests in fresh browser contexts; they do not create real orders or send customer emails.

## Upload

Use the rebuilt `HOSTINGER_UPLOAD.zip` (contents directly in Hostinger `public_html`). The zip contains only `dist` assets, not SQL, source, tests, backups, or environment files. The live Hostinger site is not updated until those files are uploaded.
