## Live setup update — reported by user on 2026-09-21 11:22:14 +01:00

The user reports that Supabase setup is done, both Paysera functions are enabled, and they tested a payment on Paysera. Live dashboard state, callback receipt, and database status were not independently checked in this session. Treat those steps as done per user's report; verify only the end-to-end site-to-Paysera callback and Make email delivery when continuing.
# NEXT SESSION — Luxury Watches Kosovo — 21 Sep 2026

## Current working folder
C:\Users\Berdyna Tech\Downloads\LUXURYWATCHES_MAIN_PROJECT\project
This is the Paysera-updated project. Your current site preview runs at http://127.0.0.1:5175/.

## Saved so far
- The previous source snapshot is in backup-before-paysera-20260921.
- The imported Paysera project ID is 259022. The user reports Supabase setup complete, both Paysera functions enabled, and a Paysera test payment performed. The signing password is not in source.
- Signed Paysera links, authenticated link creation, callback verification, atomic/duplicate-safe payment recording, separate test status and late-payment review handling are implemented locally.
- COD stock-confirmed status stays separate from Paysera awaiting_payment.
- Prepared customer emails are in emails/.
- Make export from the user is preserved in make/ORIGINAL-status-emails.blueprint.json and also at the original Downloads file.
- The original Make export is incomplete for Paysera: its Paysera Resend module has no connection or email mapping; an empty placeholder is present; its filter checks confirmed instead of awaiting_payment; its webhook fields lack payment_status, paysera_payment_url, and paysera_test_mode. Do not import/activate this original expecting Paysera emails to work.
- Detailed deployment notes are in PAYSERA_SETUP_AND_VERIFICATION.md.
- Latest Hostinger build is in HOSTINGER_UPLOAD.zip and HOSTINGER_UPLOAD. Paysera checkout stays disabled until live testing passes.
- Root-level `START_HERE_HANDOVER.md` describes the status. If it does not exist, use this note; the last attempt to create it was interrupted before the command started.

## Local checks already completed
- `npm run typecheck` passed.
- Targeted ESLint passed.
- `npm run build` passed.
- `node scripts/qa-paysera.mjs`: 50 mocked security/database/handler checks passed.
- `node scripts/qa-paysera-browser.mjs`: 7 mocked Paysera UI scenarios passed.
- `node scripts/qa-checkout-admin.mjs`: 18 existing mocked browser scenarios passed.
- Tests used mocks/local PostgreSQL. No real transaction, live Supabase, Make run or email was sent.

## Resume the remaining work
1. Finish a corrected Make blueprint based on the saved original, wiring the existing Resend account and proper Paysera email HTML. Use webhook recipient `customer_email` and `status`; the webhook export has direct fields, not `record.*`.
2. Paysera route must filter Paysera + `awaiting_payment`; include payment link and full total. Add paid/shipped routes, exclude test and review payments from customer fulfilment emails, remove placeholder. The COD confirmed route already filters `payment_method=cod`.
3. Inspect the actual Supabase status webhook SQL and make its payload include `payment_status`, `paysera_payment_url`, and `paysera_test_mode` before making the new email filters depend on them.
4. User reports migrations/secrets and both function deployments are done; verify the callback recorded the test payment correctly and confirm Paysera project 259022 has the intended card payment methods enabled.
5. Finish an owner-only test-mode site-to-Paysera-to-callback-to-admin test, and make sure Make never sends test orders to customers. Then complete a separately approved low-value live test using a new order. Do not enable customer Paysera checkout until callback + email + admin agree.
6. Build with `VITE_PAYSERA_ENABLED=true` only after verification; refresh Hostinger upload. Until then use the current COD-capable build.

Never put Paysera signing password or Supabase service-role key in Vite variables or Hostinger public_html. Project ID `259022` was provided by the user. Obtain/configure signing password through Supabase Edge Function secrets rather than chat.