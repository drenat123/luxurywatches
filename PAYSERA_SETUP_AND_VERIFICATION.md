## Live setup update — reported by user on 2026-09-21 11:22:14 +01:00

The user reports that Supabase setup is done, both Paysera functions are enabled, and they tested a payment on Paysera. Live dashboard state, callback receipt, and database status were not independently checked in this session. Treat those steps as done per user's report; verify only the end-to-end site-to-Paysera callback and Make email delivery when continuing.
# Paysera integration — local implementation and live setup

The source is implemented and locally tested. Supabase deployment and a Paysera test payment are reported complete by the user (September 21); not independently verified in this session. Make edits, end-to-end callback/email verification, and Hostinger upload remain pending.
The supplied ZIP had environment-variable references, but no actual Paysera project ID/signing password. Browser control failed to initialize.
The original source is preserved in backup-before-paysera-20260921.

## Customer and admin flow
1. Customer selects Paysera and submits an unpaid order. Shipping is €3 below €50 and €0 from €50.
2. Admin confirms stock. The authenticated server creates a signed link from the stored total.
3. Paysera orders enter supplier_status=awaiting_payment, payment_status=awaiting_payment. COD confirmation remains confirmed.
4. Make sends the Paysera link, using the route below.
5. A signed, amount-checked callback records real payment once and moves the order to paid_awaiting_arrival.
6. Admin marks ready_to_ship, then shipped. Paid Paysera emails never request cash.
7. Cancelling an unpaid order does NOT invalidate a signed link already sent to Paysera. A late payment is recorded as paid_review without reopening shipment; the admin must resolve it/refund through Paysera.
8. Test payment is test_paid, with no paid_at and no shipment transition. Use a new order when changing between test and production.
9. Payment-result redirect is informational, never proof of payment.

## Apply to Supabase
After the existing base/order/admin migrations, apply the CONTENTS of these files in order:
- supabase/migrations/20260919160000_validate_checkout_prices.sql (if not already applied)
- supabase/migrations/20260919173000_enable_paysera_after_stock.sql
- supabase/migrations/20260921120000_secure_paysera_payments.sql

Deploy both functions with the included supabase/config.toml:
- supabase functions deploy paysera-payment --no-verify-jwt
- supabase functions deploy paysera-callback --no-verify-jwt
paysera-payment independently verifies the administrator's Supabase token. The callback instead verifies Paysera's signature.
Both include supabase/functions/_shared/paysera.ts. Hostinger cannot run these server functions.

Set the server secrets listed in supabase/.env.paysera.example.
PAYSERA_TEST_MODE must explicitly be 1 for test or 0 for live. Never put the signing password or service-role key in VITE variables or public_html.
Use the approved Paysera Checkout project ID/password, and verify that card acceptance is activated on that project. An open business account alone does not prove card acceptance is enabled.

## Make: do not activate from the screenshot alone
The screenshot does not show actual filters, email mappings, or the database webhook payload. The lower route also contains a blank module placeholder; verify that it is fully connected and saved.
Export the scenario blueprint for inspection. Keep the working COD branch, but require payment_method = cod on its confirmed/dispatch email.

All conditions below must be combined with AND:
- COD confirmation: supplier_status = confirmed AND payment_method = cod.
- Paysera payment request: supplier_status = awaiting_payment AND payment_method = paysera AND payment_status = awaiting_payment AND paysera_test_mode = false AND paysera_payment_url exists.
- Paysera payment received: supplier_status = paid_awaiting_arrival AND payment_method = paysera AND payment_status = paid AND paysera_test_mode = false.
- Paysera dispatched: supplier_status = shipped AND payment_method = paysera AND payment_status = paid AND paysera_test_mode = false.
- No stock/cancelled: do not send a no-payment-taken email when payment_status = paid_review or paid.
- Tests: never route test orders to customer fulfilment emails. If testing emails, use a separate test-only route addressed to the owner.

Prepared email HTML:
- emails/paysera-awaiting-payment.html
- emails/paysera-payment-received.html
- emails/paysera-shipped.html

From: Luxury Watches <orders@luxurywatchesks.com>
To: map the order email field.
Templates use the existing direct webhook fields, e.g. {{1.customer_name}}. If your webhook sends a Supabase record object, remap ALL fields to record.* instead.
The database webhook must include:
id, order_number, customer_name, email, payment_method, supplier_status, payment_status, subtotal, shipping, total, paysera_payment_url, paysera_test_mode.
It must fire on supplier-status changes, not notes edits or duplicate callbacks. Inspect the existing SQL trigger before changing it; no unknown live trigger was replaced here.
The email total must be the stored total, not total plus shipping.
Make execution success / Resend delivery must be checked separately. The admin does not falsely claim an email was sent.

## Launch switch and release
VITE_PAYSERA_ENABLED is false unless explicitly set to true at BUILD time.
The refreshed HOSTINGER_UPLOAD.zip keeps COD available and Paysera checkout hidden until the live connections are verified.
For isolated local testing:
PowerShell: $env:VITE_PAYSERA_ENABLED='true'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5186 --strictPort

After live verification, build with VITE_PAYSERA_ENABLED=true and refresh the Hostinger upload from dist. Upload dist contents only, not source, .env, migrations or server secrets.

## Required live verification
Use an owner-controlled test email and Paysera test mode.
- €45 watch -> €48 including post; €50 -> €50.
- Confirming stock delivers exactly the Paysera request email with the correct link/amount.
- Test success appears as test_paid and does not queue shipment.
- Cancellation, failed/abandoned payment, duplicate callbacks and late payment are handled correctly.
- A forged redirect never marks an order paid.
After switching to production and creating a NEW order, complete an owner-approved real low-value payment and verify the Paysera dashboard, callback, database and customer email all agree before exposing checkout to customers.

## Verified locally on September 21
- 50 Paysera cryptographic-validation, handler, database, permissions, retry and shipping checks passed (scripts/qa-paysera.mjs).
- 7 mocked Paysera browser scenarios passed (scripts/qa-paysera-browser.mjs).
- 18 existing checkout/admin browser scenarios passed (scripts/qa-checkout-admin.mjs).
- Frontend TypeScript, targeted ESLint and production build passed.
- Test requests never reached live Supabase, Paysera or Make, and sent no emails.
- HOSTINGER_UPLOAD.zip and HOSTINGER_UPLOAD were refreshed from the final dist build; prior uploads are in backup-before-paysera-20260921.
- The Paysera Edge handlers were executed through a TypeScript-transpiled Node test harness with fake transports. Supabase's deployed Deno runtime still needs live validation.

## Live verification update — 2026-09-21
The connected Supabase project was independently inspected and updated:
- Secure Paysera state-machine migration applied.
- paysera_test_mode and payment_review_reason are present.
- public order SELECT policy removed; admin-only order SELECT remains intended.
- existing Make status webhook preserved and extended with customer_email, payment_status, paysera_payment_url, paysera_test_mode, supplier_status and existing totals/items.
- trigger helper RPC execute privileges revoked from anon/authenticated.
- hardened paysera-payment and paysera-callback deployed as version 4.
- security advisor now reports only account-level leaked-password protection disabled; the prior SECURITY DEFINER RPC warnings were resolved.

Make.com still requires the owner-authorized browser session to import/save/test the prepared blueprint. Do not switch Paysera live until the full owner-only test passes.
